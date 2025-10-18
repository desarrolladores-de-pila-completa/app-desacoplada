
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import logger from "../utils/logger";
import { pool } from "./db";
import { getService } from "../utils/servicesConfig";
import { AuthService } from "../services/AuthService";
import { getAuthCookieOptions, getRefreshTokenCookieOptions } from "../utils/cookieConfig";

const SECRET = process.env.JWT_SECRET || "clave-secreta";
const authService = getService<AuthService>('AuthService');

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const token = req.cookies.token;
    const refreshToken = req.cookies.refreshToken;

    logger.debug('Verificando token de cookie', {
      token: token ? 'presente' : 'ausente',
      refreshToken: refreshToken ? 'presente' : 'ausente',
      context: 'auth'
    });

    if (!token) {
      logger.warn('No se recibió token en la cookie', { headers: req.headers, context: 'auth' });
      return res.status(401).json({ error: "No autenticado (sin token)" });
    }

    try {
      const payload = jwt.verify(token, SECRET) as jwt.JwtPayload;
      logger.debug('Payload JWT verificado', { userId: payload?.userId, context: 'auth' });

      if (payload?.userId) {
        // Buscar el usuario en la base de datos
        const [rows]: any = await pool.query("SELECT id, email, username FROM users WHERE id = ?", [payload.userId]);
        logger.debug('Resultado query usuario', { userId: payload.userId, found: rows && rows.length > 0, context: 'auth' });

        if (rows && rows.length > 0) {
          const user = rows[0];

          // Actualizar última actividad del usuario
          await authService.updateLastActivity(user.id);

          // Verificar si el token está próximo a expirar y extender sesión automáticamente
          if (authService.isTokenNearExpiry(token) && refreshToken) {
            try {
              logger.info('Token próximo a expirar, extendiendo sesión automáticamente', { userId: user.id, context: 'auth' });
              const extendedSession = await authService.extendSession(user.id);

              // Establecer nuevas cookies
              res.cookie("token", extendedSession.accessToken, getAuthCookieOptions());
              res.cookie("refreshToken", extendedSession.refreshToken, getRefreshTokenCookieOptions());

              // Marcar extensión en header para el cliente
              res.setHeader('X-Session-Extended', 'true');
            } catch (extendError) {
              logger.warn('Error al extender sesión automáticamente', { error: extendError, userId: user.id, context: 'auth' });
              // Continuar con el token actual si no se puede extender
            }
          }

          (req as any).user = user;
          (req as any).userId = user.id;
          return next();
        }

        logger.warn('Usuario no encontrado en la base de datos', { userId: payload.userId, context: 'auth' });
        return res.status(401).json({ error: "Usuario no encontrado", userId: payload.userId });
      }

      logger.warn('Token sin userId válido', { payload, context: 'auth' });
      return res.status(401).json({ error: "Token inválido", payload });
    } catch (err) {
      logger.error('Error al verificar token', { error: (err as Error).message, stack: (err as Error).stack, context: 'auth' });

      // Si el token está expirado pero tenemos refresh token, intentar refresh automático
      if (err && typeof err === "object" && "name" in err && refreshToken) {
        const errorObj = err as { name: string; expiredAt?: Date; message?: string };

        if (errorObj.name === "TokenExpiredError") {
          logger.info('Token expirado, intentando refresh automático', { context: 'auth' });

          try {
            const refreshResult = await authService.refreshTokens(refreshToken);

            // Establecer nuevas cookies
            res.cookie("token", refreshResult.accessToken, getAuthCookieOptions());
            res.cookie("refreshToken", refreshResult.refreshToken, getRefreshTokenCookieOptions());

            // Buscar usuario con el nuevo token
            const newPayload = jwt.verify(refreshResult.accessToken, SECRET) as jwt.JwtPayload;
            if (newPayload?.userId) {
              const [rows]: any = await pool.query("SELECT id, email, username FROM users WHERE id = ?", [newPayload.userId]);

              if (rows && rows.length > 0) {
                const user = rows[0];
                (req as any).user = user;
                (req as any).userId = user.id;

                // Marcar refresh automático en header
                res.setHeader('X-Token-Refreshed', 'true');

                logger.info('Token refrescado automáticamente', { userId: user.id, context: 'auth' });
                return next();
              }
            }
          } catch (refreshError) {
            logger.warn('Error en refresh automático de token', { error: refreshError, context: 'auth' });
          }

          return res.status(401).json({ error: "Token expirado y no se pudo refrescar", expiredAt: errorObj.expiredAt });
        }
      }

      return res.status(401).json({ error: "Token inválido", details: String(err) });
    }
}
