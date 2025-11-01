/**
 * Configuración de cookies segura según el entorno
 */

export interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  maxAge: number;
  path: string;
  domain?: string;
}

/**
 * Obtiene las opciones de cookie para autenticación con seguridad avanzada
 * @returns Opciones de cookie configuradas según el entorno
 */
export function getAuthCookieOptions(): CookieOptions {
  const isProduction = process.env.NODE_ENV === 'production';
  const domain = process.env.COOKIE_DOMAIN || 'api.yposteriormente.com';

  return {
    httpOnly: true,
    secure: isProduction, // Habilitar secure en producción para HTTPS
    sameSite: isProduction ? 'strict' : 'lax', // Strict en prod para mayor seguridad
    maxAge: 100 * 365 * 24 * 60 * 60 * 1000, // 100 años (permanente)
    path: '/',
    domain: isProduction ? domain : undefined
  };
}

/**
 * Obtiene las opciones de cookie para refresh token (más persistente)
 * @returns Opciones de cookie configuradas según el entorno
 */
export function getRefreshTokenCookieOptions(): CookieOptions {
  const isProduction = process.env.NODE_ENV === 'production';
  const domain = process.env.COOKIE_DOMAIN || 'api.yposteriormente.com';

  return {
    httpOnly: true,
    secure: isProduction, // Habilitar secure en producción para HTTPS
    sameSite: isProduction ? 'strict' : 'lax', // Strict en prod para mayor seguridad
    maxAge: 100 * 365 * 24 * 60 * 60 * 1000, // 100 años (permanente)
    path: '/',
    domain: isProduction ? domain : undefined
  };
}

/**
 * Obtiene las opciones de cookie para CSRF
 * @returns Opciones de cookie configuradas según el entorno
 */
export function getCsrfCookieOptions(): CookieOptions {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    httpOnly: false, // Debe ser accesible desde el cliente para CSRF
    secure: isProduction, // Habilitar secure en producción para HTTPS
    sameSite: 'lax', // Lax es suficiente para CSRF
    maxAge: 3600000, // 1 hora en milisegundos
    path: '/'
  };
}

/**
 * Obtiene las opciones de cookie para sesiones con sliding (extensión automática)
 * @param extendSession - Si debe extender la sesión automáticamente
 * @returns Opciones de cookie configuradas según el entorno
 */
export function getSlidingSessionCookieOptions(extendSession: boolean = false): CookieOptions {
  const isProduction = process.env.NODE_ENV === 'production';
  const domain = process.env.COOKIE_DOMAIN || 'api.yposteriormente.com';

  // Si se extiende la sesión, aumentar el tiempo de vida
  const maxAge = extendSession
    ? 100 * 365 * 24 * 60 * 60 * 1000 // 100 años si se extiende
    : 100 * 365 * 24 * 60 * 60 * 1000; // 100 años por defecto (permanente)

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge,
    path: '/',
    domain: isProduction ? domain : undefined
  };
}

/**
 * Obtiene las opciones de cookie para refresh token con rotación
 * @param rotationEnabled - Si la rotación está habilitada
 * @returns Opciones de cookie configuradas según el entorno
 */
export function getRefreshTokenRotationOptions(rotationEnabled: boolean = true): CookieOptions {
  const isProduction = process.env.NODE_ENV === 'production';
  const domain = process.env.COOKIE_DOMAIN || 'api.yposteriormente.com';

  // Si hay rotación, reducir ligeramente el tiempo de vida para forzar rotación más frecuente
  const maxAge = rotationEnabled
    ? 100 * 365 * 24 * 60 * 60 * 1000 // 100 años (permanente) para rotación
    : 100 * 365 * 24 * 60 * 60 * 1000; // 100 años (permanente)

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge,
    path: '/',
    domain: isProduction ? domain : undefined
  };
}

/**
 * Limpia todas las cookies de autenticación
 * @param res - Response object de Express
 */
export function clearAuthCookies(res: any): void {
  const cookieOptions = getAuthCookieOptions();
  const refreshOptions = getRefreshTokenCookieOptions();

  res.clearCookie("token", { ...cookieOptions, maxAge: 0 });
  res.clearCookie("refreshToken", { ...refreshOptions, maxAge: 0 });
  res.clearCookie("sessionExtended", { path: '/', maxAge: 0 });
}