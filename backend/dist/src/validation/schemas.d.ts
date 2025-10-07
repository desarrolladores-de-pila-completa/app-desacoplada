export declare const registerSchema: any;
export declare const loginSchema: any;
export declare const updateUserSchema: any;
export declare const createPageSchema: any;
export declare const updatePageSchema: any;
export declare const createCommentSchema: any;
export declare const updateCommentSchema: any;
export declare const paginationSchema: any;
export declare const searchSchema: any;
export declare const imageUploadSchema: any;
export declare const avatarUploadSchema: any;
export declare const idSchema: any;
export declare const userIdSchema: any;
export declare const usernameSchema: any;
/**
 * Middleware para validar request body
 */
export declare function validateBody(schema: any): (req: any, res: any, next: any) => any;
/**
 * Middleware para validar query parameters
 */
export declare function validateQuery(schema: any): (req: any, res: any, next: any) => any;
/**
 * Middleware para validar parámetros de ruta
 */
export declare function validateParams(schema: any): (req: any, res: any, next: any) => any;
/**
 * Validar archivos subidos
 */
export declare function validateFile(schema: any): (req: any, res: any, next: any) => any;
//# sourceMappingURL=schemas.d.ts.map