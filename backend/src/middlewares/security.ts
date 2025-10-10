const rateLimit = require('express-rate-limit');
const { RateLimitError } = require('../errors/AppErrors');


/**
 * Rate limiting general para la API
 */
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por ventana por IP
  message: {
    success: false,
    error: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: any, res: any) => {
    throw new RateLimitError();
  }
});

/**
 * Rate limiting estricto para autenticación
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos de login por ventana por IP
  message: {
    success: false,
    error: 'Demasiados intentos de login, intenta de nuevo en 15 minutos',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // No contar requests exitosos
  handler: (req: any, res: any) => {
    throw new RateLimitError('Demasiados intentos de login, intenta de nuevo en 15 minutos');
  }
});

/**
 * Rate limiting para registro de usuarios
 */
export const registerRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // máximo 3 registros por hora por IP
  message: {
    success: false,
    error: 'Demasiados intentos de registro, intenta de nuevo en 1 hora',
    code: 'REGISTER_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: any, res: any) => {
    throw new RateLimitError('Demasiados intentos de registro, intenta de nuevo en 1 hora');
  }
});

/**
 * Rate limiting para subida de archivos
 */
export const uploadRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // máximo 10 uploads por minuto por IP
  message: {
    success: false,
    error: 'Demasiadas subidas de archivos, intenta de nuevo más tarde',
    code: 'UPLOAD_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: any, res: any) => {
    throw new RateLimitError('Demasiadas subidas de archivos, intenta de nuevo más tarde');
  }
});

/**
 * Rate limiting para comentarios
 */
export const commentRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 20, // máximo 20 comentarios por 10 minutos por IP
  message: {
    success: false,
    error: 'Demasiados comentarios, intenta de nuevo más tarde',
    code: 'COMMENT_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: any, res: any) => {
    throw new RateLimitError('Demasiados comentarios, intenta de nuevo más tarde');
  }
});

/**
 * Middleware para validación de entrada adicional
 */
export function sanitizeInput(req: any, res: any, next: any): void {
  // Función recursiva para limpiar objetos
  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      // Remover caracteres peligrosos básicos
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Scripts
        .replace(/javascript:/gi, '') // JavaScript URLs
        .replace(/on\w+\s*=/gi, '') // Event handlers
        .trim();
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }
    
    return obj;
  };

  // Sanitizar body, query y params
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
}

/**
 * Middleware para logging de seguridad
 */
export function securityLogger(req: any, res: any, next: any): void {
  const timestamp = new Date().toISOString();
  const ip = req.ip || (req as any).connection?.remoteAddress;
  const userAgent = req.get('User-Agent');
  const method = req.method;
  const url = req.originalUrl;

  // Log de actividad sospechosa
  const suspiciousPatterns = [
    /\.\.\//, // Path traversal
    /<script/i, // XSS attempts
    /union\s+select/i, // SQL injection
    /eval\(/i, // Code injection
    /document\.cookie/i, // Cookie stealing
    /\bor\s+1\s*=\s*1\b/i, // SQL injection
  ];

  const isSuspicious = suspiciousPatterns.some(pattern => {
    return pattern.test(url) || 
           pattern.test(JSON.stringify(req.body || {})) ||
           pattern.test(JSON.stringify(req.query || {}));
  });

  if (isSuspicious) {
    console.warn(`[${timestamp}] SUSPICIOUS ACTIVITY:`, {
      ip,
      userAgent,
      method,
      url,
      body: req.body,
      query: req.query,
    });
  }

  // Log de intentos de acceso a rutas administrativas
  if (url.includes('/admin') || url.includes('/config')) {
    console.warn(`[${timestamp}] ADMIN ACCESS ATTEMPT:`, {
      ip,
      userAgent,
      method,
      url,
    });
  }

  next();
}

/**
 * Middleware para validar Content-Type en requests con body
 */
export function validateContentType(req: any, res: any, next: any): void {
  const contentType = req.get('Content-Type');
  
  // Solo aplicar a métodos que pueden tener body
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    // Si hay body pero no Content-Type apropiado
    if (req.body && Object.keys(req.body).length > 0) {
      if (!contentType || 
          (!contentType.includes('application/json') && 
           !contentType.includes('multipart/form-data') && 
           !contentType.includes('application/x-www-form-urlencoded'))) {
        return res.status(400).json({
          success: false,
          error: 'Content-Type inválido',
          code: 'INVALID_CONTENT_TYPE'
        });
      }
    }
  }

  next();
}

/**
 * Middleware para agregar headers de seguridad adicionales
 */
export function additionalSecurityHeaders(req: any, res: any, next: any): void {
  // Evitar que la página sea embebida en frames
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Evitar MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Habilitar protección XSS del navegador
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer Policy para controlar información enviada en referrers
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy para controlar APIs del navegador
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Cross-Origin-Opener-Policy
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  
  // Cross-Origin-Resource-Policy
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

  next();
}

/**
 * Middleware para detectar y bloquear bots maliciosos
 */
export function botProtection(req: any, res: any, next: any): void {
  const userAgent = req.get('User-Agent') || '';
  
  // Lista de user agents sospechosos
  const maliciousBots = [
    /sqlmap/i,
    /nmap/i,
    /nikto/i,
    /w3af/i,
    /acunetix/i,
    /netsparker/i,
    /burp/i,
    /zap/i,
  ];

  if (maliciousBots.some(bot => bot.test(userAgent))) {
    console.warn(`[${new Date().toISOString()}] BLOCKED MALICIOUS BOT:`, {
      ip: req.ip,
      userAgent,
      url: req.originalUrl,
    });

    return res.status(403).json({
      success: false,
      error: 'Acceso denegado',
      code: 'BOT_BLOCKED'
    });
  }

  next();
}

/**
 * Middleware para validación de archivos subidos
 */
export function validateFileUpload(req: any, res: any, next: any): void {
  const file = req.file;

  if (!file) {
    return next(); // No hay archivo, continuar
  }

  // Tipos MIME permitidos
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ];

  // Tamaño máximo (5MB)
  const maxSize = 5 * 1024 * 1024;

  // Validar tipo MIME
  if (!allowedTypes.includes(file.mimetype)) {
    return res.status(400).json({
      success: false,
      error: 'Tipo de archivo no permitido. Solo se permiten imágenes JPEG, PNG, GIF y WebP.',
      code: 'INVALID_FILE_TYPE'
    });
  }

  // Validar tamaño
  if (file.size > maxSize) {
    return res.status(400).json({
      success: false,
      error: 'El archivo es demasiado grande. Máximo 5MB.',
      code: 'FILE_TOO_LARGE'
    });
  }

  // Validar que sea realmente una imagen (magic bytes)
  const buffer = file.buffer;
  if (buffer) {
    const magicBytes = buffer.slice(0, 4);
    const isValidImage = validateImageMagicBytes(magicBytes, file.mimetype);

    if (!isValidImage) {
      return res.status(400).json({
        success: false,
        error: 'El archivo no es una imagen válida.',
        code: 'INVALID_IMAGE_FILE'
      });
    }
  }

  next();
}

/**
 * Validar magic bytes de imágenes
 */
function validateImageMagicBytes(magicBytes: Buffer, mimetype: string): boolean {
  const signatures: { [key: string]: number[][] } = {
    'image/jpeg': [[0xFF, 0xD8, 0xFF]],
    'image/png': [[0x89, 0x50, 0x4E, 0x47]],
    'image/gif': [[0x47, 0x49, 0x46, 0x38]],
    'image/webp': [[0x52, 0x49, 0x46, 0x46], [0x57, 0x45, 0x42, 0x50]]
  };

  const expectedSignatures = signatures[mimetype];
  if (!expectedSignatures) return false;

  return expectedSignatures.some(signature => {
    return signature.every((byte, index) => magicBytes[index] === byte);
  });
}

/**
 * Función para sanitizar datos sensibles en logs
 */
export function sanitizeForLogging(data: any): any {
  const sensitive = ['password', 'token', 'secret', 'authorization', 'cookie'];

  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      // Ocultar datos que parecen tokens o contraseñas
      if (obj.length > 10 && /^[a-zA-Z0-9+/=.-]+$/.test(obj)) {
        return '[REDACTED]';
      }
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }

    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (sensitive.some(s => key.toLowerCase().includes(s))) {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = sanitizeObject(value);
        }
      }
      return sanitized;
    }

    return obj;
  };

  return sanitizeObject(data);
}

/**
 * Configuración de CORS segura
 */
export const corsOptions = {
  origin: (origin: any, callback: any) => {
    // Lista de dominios permitidos
    const allowedOrigins = [
      'https://yposteriormente.com',
      'http://localhost:3000',
      'http://localhost:5173', // Vite dev server
      ...(process.env.ALLOWED_ORIGINS?.split(',') || [])
    ];

    // Permitir requests sin origin (como Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.warn(`CORS blocked origin: ${origin}`);
    callback(new Error('No permitido por CORS'));
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-API-Key'
  ]
};

module.exports = {
  generalRateLimit,
  authRateLimit,
  registerRateLimit,
  uploadRateLimit,
  commentRateLimit,
  sanitizeInput,
  securityLogger,
  validateContentType,
  additionalSecurityHeaders,
  botProtection,
  corsOptions,
  validateFileUpload,
  sanitizeForLogging
};