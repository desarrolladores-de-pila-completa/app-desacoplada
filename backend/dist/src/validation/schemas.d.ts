import { z } from 'zod';
export declare const RegisterSchema: z.ZodObject<{
    body: z.ZodObject<{
        email: z.ZodString;
        password: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const LoginSchema: z.ZodObject<{
    body: z.ZodObject<{
        email: z.ZodString;
        password: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const CreatePageSchema: z.ZodObject<{
    body: z.ZodObject<{
        titulo: z.ZodString;
        contenido: z.ZodString;
        descripcion: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const UpdatePageSchema: z.ZodObject<{
    body: z.ZodObject<{
        titulo: z.ZodOptional<z.ZodString>;
        contenido: z.ZodOptional<z.ZodString>;
        descripcion: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const CreateCommentSchema: z.ZodObject<{
    body: z.ZodObject<{
        comentario: z.ZodString;
    }, z.core.$strip>;
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const UpdateUsernameSchema: z.ZodObject<{
    body: z.ZodObject<{
        username: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const validateRequest: (schema: z.ZodSchema) => (req: any, res: any, next: any) => any;
//# sourceMappingURL=schemas.d.ts.map