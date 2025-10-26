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
export declare function getAuthCookieOptions(): CookieOptions;
/**
 * Obtiene las opciones de cookie para refresh token (más persistente)
 * @returns Opciones de cookie configuradas según el entorno
 */
export declare function getRefreshTokenCookieOptions(): CookieOptions;
/**
 * Obtiene las opciones de cookie para CSRF
 * @returns Opciones de cookie configuradas según el entorno
 */
export declare function getCsrfCookieOptions(): CookieOptions;
/**
 * Obtiene las opciones de cookie para sesiones con sliding (extensión automática)
 * @param extendSession - Si debe extender la sesión automáticamente
 * @returns Opciones de cookie configuradas según el entorno
 */
export declare function getSlidingSessionCookieOptions(extendSession?: boolean): CookieOptions;
/**
 * Obtiene las opciones de cookie para refresh token con rotación
 * @param rotationEnabled - Si la rotación está habilitada
 * @returns Opciones de cookie configuradas según el entorno
 */
export declare function getRefreshTokenRotationOptions(rotationEnabled?: boolean): CookieOptions;
/**
 * Limpia todas las cookies de autenticación
 * @param res - Response object de Express
 */
export declare function clearAuthCookies(res: any): void;
//# sourceMappingURL=cookieConfig.d.ts.map