import { z } from 'zod';

// Esquemas de validación para autenticación
export const RegisterSchema = z.object({
  body: z.object({
    email: z.string().email('Email inválido'),
    password: z.string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'La contraseña debe contener al menos una letra minúscula, una mayúscula y un número')
  })
});

export const LoginSchema = z.object({
  body: z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(1, 'La contraseña es requerida')
  })
});

// Esquemas para páginas
export const CreatePageSchema = z.object({
  body: z.object({
    titulo: z.string().min(1, 'El título es requerido').max(100, 'El título es demasiado largo'),
    contenido: z.string().min(1, 'El contenido es requerido'),
    descripcion: z.string().optional()
  })
});

export const UpdatePageSchema = z.object({
  body: z.object({
    titulo: z.string().min(1, 'El título es requerido').max(100, 'El título es demasiado largo').optional(),
    contenido: z.string().min(1, 'El contenido es requerido').optional(),
    descripcion: z.string().optional()
  })
});

// Esquemas para comentarios
export const CreateCommentSchema = z.object({
  body: z.object({
    comentario: z.string().min(1, 'El comentario no puede estar vacío').max(500, 'El comentario es demasiado largo')
  }),
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID de página inválido')
  })
});

// Esquemas para usuarios
export const UpdateUsernameSchema = z.object({
  body: z.object({
    username: z.string()
      .min(3, 'El username debe tener al menos 3 caracteres')
      .max(20, 'El username es demasiado largo')
      .regex(/^[a-zA-Z0-9_]+$/, 'El username solo puede contener letras, números y guiones bajos')
  })
});

// Middleware de validación
export const validateRequest = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      schema.parse(req);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
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