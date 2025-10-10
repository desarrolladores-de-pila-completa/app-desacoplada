"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = exports.UpdateUsernameSchema = exports.CreateCommentSchema = exports.UpdatePageSchema = exports.CreatePageSchema = exports.LoginSchema = exports.RegisterSchema = void 0;
const zod_1 = require("zod");
// Esquemas de validación para autenticación
exports.RegisterSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Email inválido'),
        password: zod_1.z.string()
            .min(8, 'La contraseña debe tener al menos 8 caracteres')
            .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'La contraseña debe contener al menos una letra minúscula, una mayúscula y un número')
    })
});
exports.LoginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Email inválido'),
        password: zod_1.z.string().min(1, 'La contraseña es requerida')
    })
});
// Esquemas para páginas
exports.CreatePageSchema = zod_1.z.object({
    body: zod_1.z.object({
        titulo: zod_1.z.string().min(1, 'El título es requerido').max(100, 'El título es demasiado largo'),
        contenido: zod_1.z.string().min(1, 'El contenido es requerido'),
        descripcion: zod_1.z.string().optional()
    })
});
exports.UpdatePageSchema = zod_1.z.object({
    body: zod_1.z.object({
        titulo: zod_1.z.string().min(1, 'El título es requerido').max(100, 'El título es demasiado largo').optional(),
        contenido: zod_1.z.string().min(1, 'El contenido es requerido').optional(),
        descripcion: zod_1.z.string().optional()
    })
});
// Esquemas para comentarios
exports.CreateCommentSchema = zod_1.z.object({
    body: zod_1.z.object({
        comentario: zod_1.z.string().min(1, 'El comentario no puede estar vacío').max(500, 'El comentario es demasiado largo')
    }),
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/, 'ID de página inválido')
    })
});
// Esquemas para usuarios
exports.UpdateUsernameSchema = zod_1.z.object({
    body: zod_1.z.object({
        username: zod_1.z.string()
            .min(3, 'El username debe tener al menos 3 caracteres')
            .max(20, 'El username es demasiado largo')
            .regex(/^[a-zA-Z0-9_]+$/, 'El username solo puede contener letras, números y guiones bajos')
    })
});
// Middleware de validación
const validateRequest = (schema) => {
    return (req, res, next) => {
        try {
            schema.parse({ body: req.body });
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                const errors = error.issues.map(err => ({
                    field: err.path.join('.'),
                    message: err.message
                }));
                return res.status(400).json({
                    status: 'error',
                    message: 'Datos de entrada inválidos',
                    errors
                });
            }
            next(error);
        }
    };
};
exports.validateRequest = validateRequest;
//# sourceMappingURL=schemas.js.map