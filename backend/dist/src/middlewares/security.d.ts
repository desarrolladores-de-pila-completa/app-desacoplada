/**
 * Configuración de Helmet para headers de seguridad
 */
export declare const helmetConfig: any;
/**
 * Rate limiting general para la API
 */
export declare const generalRateLimit: any;
/**
 * Rate limiting estricto para autenticación
 */
export declare const authRateLimit: any;
/**
 * Rate limiting para registro de usuarios
 */
export declare const registerRateLimit: any;
/**
 * Rate limiting para subida de archivos
 */
export declare const uploadRateLimit: any;
/**
 * Rate limiting para comentarios
 */
export declare const commentRateLimit: any;
/**
 * Middleware para validación de entrada adicional
 */
export declare function sanitizeInput(req: any, res: any, next: any): void;
/**
 * Middleware para logging de seguridad
 */
export declare function securityLogger(req: any, res: any, next: any): void;
/**
 * Middleware para validar Content-Type en requests con body
 */
export declare function validateContentType(req: any, res: any, next: any): void;
/**
 * Middleware para agregar headers de seguridad adicionales
 */
export declare function additionalSecurityHeaders(req: any, res: any, next: any): void;
/**
 * Middleware para detectar y bloquear bots maliciosos
 */
export declare function botProtection(req: any, res: any, next: any): void;
/**
 * Middleware para validación de archivos subidos
 */
export declare function validateFileUpload(req: any, res: any, next: any): void;
/**
 * Función para sanitizar datos sensibles en logs
 */
export declare function sanitizeForLogging(data: any): any;
/**
 * Configuración de CORS segura
 */
export declare const corsOptions: {
    origin: (origin: any, callback: any) => any;
    credentials: boolean;
    optionsSuccessStatus: number;
    methods: string[];
    allowedHeaders: string[];
};
//# sourceMappingURL=security.d.ts.map