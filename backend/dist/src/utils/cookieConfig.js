"use strict";
/**
 * Configuración de cookies segura según el entorno
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthCookieOptions = getAuthCookieOptions;
exports.getCsrfCookieOptions = getCsrfCookieOptions;
/**
 * Obtiene las opciones de cookie para autenticación
 * @returns Opciones de cookie configuradas según el entorno
 */
function getAuthCookieOptions() {
    const isProduction = process.env.NODE_ENV === 'production';
    return {
        httpOnly: true,
        secure: isProduction, // Solo HTTPS en producción
        sameSite: isProduction ? 'strict' : 'lax', // Strict en prod para mayor seguridad
        maxAge: 3600000, // 1 hora en milisegundos
        path: '/'
    };
}
/**
 * Obtiene las opciones de cookie para CSRF
 * @returns Opciones de cookie configuradas según el entorno
 */
function getCsrfCookieOptions() {
    const isProduction = process.env.NODE_ENV === 'production';
    return {
        httpOnly: false, // Debe ser accesible desde el cliente para CSRF
        secure: isProduction, // Solo HTTPS en producción
        sameSite: 'lax', // Lax es suficiente para CSRF
        maxAge: 3600000, // 1 hora en milisegundos
        path: '/'
    };
}
//# sourceMappingURL=cookieConfig.js.map