const { z } = require('zod');

// === USER VALIDATION SCHEMAS ===

export const registerSchema = z.object({
  email: z
    .string()
    .email('Email inválido')
    .min(1, 'Email es requerido')
    .max(255, 'Email muy largo'),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .max(100, 'Contraseña muy larga')
    .regex(
      /^(?=.*[a-zA-Z])(?=.*\d)/,
      'La contraseña debe contener al menos una letra y un número'
    ),
  username: z
    .string()
    .min(3, 'Username debe tener al menos 3 caracteres')
    .max(30, 'Username muy largo')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Username solo puede contener letras, números, guiones y guiones bajos'
    ),
});

export const loginSchema = z.object({
  email: z
    .string()
    .email('Email inválido')
    .min(1, 'Email es requerido'),
  password: z
    .string()
    .min(1, 'Contraseña es requerida'),
});

export const updateUserSchema = z.object({
  username: z
    .string()
    .min(3, 'Username debe tener al menos 3 caracteres')
    .max(30, 'Username muy largo')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Username solo puede contener letras, números, guiones y guiones bajos'
    )
    .optional(),
  email: z
    .string()
    .email('Email inválido')
    .max(255, 'Email muy largo')
    .optional(),
});

// === PAGE VALIDATION SCHEMAS ===

export const createPageSchema = z.object({
  titulo: z
    .string()
    .min(1, 'Título es requerido')
    .max(200, 'Título muy largo')
    .trim(),
  contenido: z
    .string()
    .min(1, 'Contenido es requerido')
    .max(10000, 'Contenido muy largo')
    .trim(),
  descripcion: z
    .enum(['visible', 'oculta'], {
      errorMap: () => ({ message: 'Descripción debe ser "visible" o "oculta"' })
    })
    .default('visible'),
  usuario: z
    .string()
    .min(1, 'Usuario es requerido')
    .max(30, 'Usuario muy largo'),
  comentarios: z
    .string()
    .max(1000, 'Comentarios muy largos')
    .optional()
    .default(''),
});

export const updatePageSchema = z.object({
  titulo: z
    .string()
    .min(1, 'Título no puede estar vacío')
    .max(200, 'Título muy largo')
    .trim()
    .optional(),
  contenido: z
    .string()
    .min(1, 'Contenido no puede estar vacío')
    .max(10000, 'Contenido muy largo')
    .trim()
    .optional(),
  descripcion: z
    .enum(['visible', 'oculta'], {
      errorMap: () => ({ message: 'Descripción debe ser "visible" o "oculta"' })
    })
    .optional(),
  comentarios: z
    .string()
    .max(1000, 'Comentarios muy largos')
    .optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Al menos un campo debe ser proporcionado para actualizar' }
);

// === COMMENT VALIDATION SCHEMAS ===

export const createCommentSchema = z.object({
  pagina_id: z
    .number()
    .int('ID de página debe ser un número entero')
    .positive('ID de página debe ser positivo'),
  comentario: z
    .string()
    .min(1, 'Comentario es requerido')
    .max(1000, 'Comentario muy largo')
    .trim(),
});

export const updateCommentSchema = z.object({
  comentario: z
    .string()
    .min(1, 'Comentario no puede estar vacío')
    .max(1000, 'Comentario muy largo')
    .trim(),
});

// === PAGINATION SCHEMAS ===

export const paginationSchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/, 'Página debe ser un número')
    .transform(Number)
    .refine(val => val >= 1, 'Página debe ser mayor a 0')
    .default('1'),
  limit: z
    .string()
    .regex(/^\d+$/, 'Límite debe ser un número')
    .transform(Number)
    .refine(val => val >= 1 && val <= 100, 'Límite debe estar entre 1 y 100')
    .default('20'),
});

// === SEARCH SCHEMAS ===

export const searchSchema = z.object({
  q: z
    .string()
    .min(1, 'Término de búsqueda es requerido')
    .max(100, 'Término de búsqueda muy largo')
    .trim(),
  page: z
    .string()
    .regex(/^\d+$/, 'Página debe ser un número')
    .transform(Number)
    .refine(val => val >= 1, 'Página debe ser mayor a 0')
    .default('1')
    .optional(),
  limit: z
    .string()
    .regex(/^\d+$/, 'Límite debe ser un número')
    .transform(Number)
    .refine(val => val >= 1 && val <= 50, 'Límite debe estar entre 1 y 50')
    .default('20')
    .optional(),
});

// === FILE UPLOAD SCHEMAS ===

export const imageUploadSchema = z.object({
  mimetype: z
    .string()
    .refine(
      (type) => ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(type),
      'Tipo de archivo no válido. Solo se permiten JPEG, PNG, GIF y WebP'
    ),
  size: z
    .number()
    .max(5 * 1024 * 1024, 'La imagen no puede superar los 5MB'),
});

export const avatarUploadSchema = z.object({
  mimetype: z
    .string()
    .refine(
      (type) => ['image/jpeg', 'image/png'].includes(type),
      'Tipo de archivo no válido para avatar. Solo se permiten JPEG y PNG'
    ),
  size: z
    .number()
    .max(2 * 1024 * 1024, 'El avatar no puede superar los 2MB'),
});

// === ID VALIDATION SCHEMAS ===

export const idSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, 'ID debe ser un número válido')
    .transform(Number)
    .refine(val => val > 0, 'ID debe ser mayor a 0'),
});

export const userIdSchema = z.object({
  userId: z
    .string()
    .uuid('ID de usuario debe ser un UUID válido'),
});

export const usernameSchema = z.object({
  username: z
    .string()
    .min(3, 'Username debe tener al menos 3 caracteres')
    .max(30, 'Username muy largo')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Username solo puede contener letras, números, guiones y guiones bajos'
    ),
});

// === UTILITY FUNCTIONS ===

/**
 * Middleware para validar request body
 */
export function validateBody(schema: any) {
  return (req: any, res: any, next: any) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: 'Datos de entrada inválidos',
          details: error.errors.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
}

/**
 * Middleware para validar query parameters
 */
export function validateQuery(schema: any) {
  return (req: any, res: any, next: any) => {
    try {
      const validated = schema.parse(req.query);
      req.query = validated;
      next();
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: 'Parámetros de consulta inválidos',
          details: error.errors.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
}

/**
 * Middleware para validar parámetros de ruta
 */
export function validateParams(schema: any) {
  return (req: any, res: any, next: any) => {
    try {
      const validated = schema.parse(req.params);
      req.params = validated;
      next();
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: 'Parámetros de ruta inválidos',
          details: error.errors.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
}

/**
 * Validar archivos subidos
 */
export function validateFile(schema: any) {
  return (req: any, res: any, next: any) => {
    if (!req.file) {
      return next();
    }

    try {
      schema.parse({
        mimetype: req.file.mimetype,
        size: req.file.size,
      });
      next();
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: 'Archivo inválido',
          details: error.errors.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
}