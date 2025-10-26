"use strict";
/**
 * Configuración de cookies segura según el entorno
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthCookieOptions = getAuthCookieOptions;
exports.getRefreshTokenCookieOptions = getRefreshTokenCookieOptions;
exports.getCsrfCookieOptions = getCsrfCookieOptions;
exports.getSlidingSessionCookieOptions = getSlidingSessionCookieOptions;
exports.getRefreshTokenRotationOptions = getRefreshTokenRotationOptions;
exports.clearAuthCookies = clearAuthCookies;
/**
 * Obtiene las opciones de cookie para autenticación con seguridad avanzada
 * @returns Opciones de cookie configuradas según el entorno
 */
function getAuthCookieOptions() {
    const isProduction = process.env.NODE_ENV === 'production';
    const domain = process.env.COOKIE_DOMAIN || undefined;
    return {
        httpOnly: true,
        secure: false, // Deshabilitar secure en desarrollo para evitar problemas con HTTP
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
function getRefreshTokenCookieOptions() {
    const isProduction = process.env.NODE_ENV === 'production';
    const domain = process.env.COOKIE_DOMAIN || undefined;
    return {
        httpOnly: true,
        secure: false, // Deshabilitar secure en desarrollo para evitar problemas con HTTP
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
function getCsrfCookieOptions() {
    const isProduction = process.env.NODE_ENV === 'production';
    return {
        httpOnly: false, // Debe ser accesible desde el cliente para CSRF
        secure: false, // Deshabilitar secure en desarrollo para evitar problemas con HTTP
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
function getSlidingSessionCookieOptions(extendSession = false) {
    const isProduction = process.env.NODE_ENV === 'production';
    const domain = process.env.COOKIE_DOMAIN || undefined;
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
function getRefreshTokenRotationOptions(rotationEnabled = true) {
    const isProduction = process.env.NODE_ENV === 'production';
    const domain = process.env.COOKIE_DOMAIN || undefined;
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
function clearAuthCookies(res) {
    const cookieOptions = getAuthCookieOptions();
    const refreshOptions = getRefreshTokenCookieOptions();
    res.clearCookie("token", { ...cookieOptions, maxAge: 0 });
    res.clearCookie("refreshToken", { ...refreshOptions, maxAge: 0 });
    res.clearCookie("sessionExtended", { path: '/', maxAge: 0 });
}
//# sourceMappingURL=cookieConfig.js.map