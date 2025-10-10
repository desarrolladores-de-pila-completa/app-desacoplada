/**
 * Configuración de cookies segura según el entorno
 */
export interface CookieOptions {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'strict' | 'lax' | 'none';
    maxAge: number;
    path: string;
}
/**
 * Obtiene las opciones de cookie para autenticación
 * @returns Opciones de cookie configuradas según el entorno
 */
export declare function getAuthCookieOptions(): CookieOptions;
/**
 * Obtiene las opciones de cookie para CSRF
 * @returns Opciones de cookie configuradas según el entorno
 */
export declare function getCsrfCookieOptions(): CookieOptions;
//# sourceMappingURL=cookieConfig.d.ts.map