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
  // Evitar que la página sea embebida en frames (más permisivo para desarrollo)
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // Evitar MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Habilitar protección XSS del navegador
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer Policy para controlar información enviada en referrers (más permisivo para desarrollo)
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy para controlar APIs del navegador (más permisivo para desarrollo)
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');

  // Cross-Origin-Opener-Policy (más permisivo para desarrollo)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  }

  // Cross-Origin-Resource-Policy (más permisivo para desarrollo)
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

  next();
}

/**
 * Middleware para detectar y bloquear bots maliciosos
 */
export function botProtection(req: any, res: any, next: any): void {
  const userAgent = req.get('User-Agent') || '';

  console.log('=== BOT PROTECTION DEBUG ===', {
    userAgent,
    url: req.originalUrl,
    ip: req.ip,
    context: 'bot-protection'
  });

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
      context: 'bot-protection'
    });

    return res.status(403).json({
      success: false,
      error: 'Acceso denegado',
      code: 'BOT_BLOCKED'
    });
  }

  console.log('=== BOT PROTECTION PASSED ===', {
    userAgent,
    url: req.originalUrl,
    context: 'bot-protection'
  });

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
 * Middleware para logging detallado de headers CORS
 */
export function corsHeaderLogger(req: any, res: any, next: any): void {
  console.log('=== CORS HEADERS DEBUG ===', {
    url: req.originalUrl,
    method: req.method,
    origin: req.get('Origin'),
    requestHeaders: req.headers,
    context: 'cors-headers-debug',
    timestamp: new Date().toISOString()
  });

  // Log específico para detectar problemas con header 'expires'
  if (req.headers['expires'] || req.headers['Expires']) {
    console.warn('🚨 HEADER EXPIRES DETECTADO EN REQUEST 🚨', {
      url: req.originalUrl,
      method: req.method,
      expiresHeader: req.headers['expires'] || req.headers['Expires'],
      allHeaders: req.headers,
      context: 'expires-header-debug',
      timestamp: new Date().toISOString()
    });
  }

  // Interceptar respuesta para ver headers de respuesta
  const originalSetHeader = res.setHeader;
  res.setHeader = function(name: string, value: string) {
    if (name.toLowerCase() === 'expires') {
      console.warn('🚨 HEADER EXPIRES ESTABLECIDO EN RESPUESTA 🚨', {
        url: req.originalUrl,
        method: req.method,
        headerName: name,
        headerValue: value,
        context: 'expires-response-debug',
        timestamp: new Date().toISOString()
      });
    }
    return originalSetHeader.call(this, name, value);
  };

  next();
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
      'http://127.0.0.1:5173', // Vite dev server (127.0.0.1)
      'http://localhost:5174', // Vite dev server (actual port)
      'http://127.0.0.1:5174', // Vite dev server (127.0.0.1, actual port)
      'http://127.0.0.1:5500', // Live Server
      'http://localhost:5500', // Live Server
      'http://10.0.2.2:3000', // Emulador Android
      ...(process.env.ALLOWED_ORIGINS?.split(',') || [])
    ];

    console.log('=== CORS ORIGIN DEBUG ===', {
      origin,
      allowedOrigins,
      context: 'cors-origin-debug',
      timestamp: new Date().toISOString()
    });

    // Permitir requests sin origin (como Postman)
    if (!origin) {
      console.log('CORS: Permitiendo request sin origin');
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      console.log(`CORS: Origin permitido: ${origin}`);
      return callback(null, true);
    }

    console.warn(`🚨 CORS blocked origin: ${origin} 🚨`);
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
    'X-API-Key',
    'x-csrf-token',
    'expires',
    'Expires',
    'cache-control',
    'Cache-Control'
  ]
};

/**
 * Función para validar diagnóstico CORS con logging detallado
 */
export function corsDiagnosticLogger(req: any, res: any, next: any): void {
  console.log('=== CORS DIAGNOSTIC DEBUG ===', {
    url: req.originalUrl,
    method: req.method,
    origin: req.get('Origin'),
    requestHeaders: req.headers,
    context: 'cors-diagnostic',
    timestamp: new Date().toISOString()
  });

  // Log específico para detectar si el header 'expires' está siendo bloqueado
  const expiresHeader = req.headers['expires'] || req.headers['Expires'];
  if (expiresHeader) {
    console.error('🚨 HEADER EXPIRES ENCONTRADO - POSIBLE PROBLEMA CORS 🚨', {
      url: req.originalUrl,
      method: req.method,
      expiresHeader,
      allowedHeaders: corsOptions.allowedHeaders,
      context: 'cors-expires-problem',
      timestamp: new Date().toISOString()
    });
  }

  next();
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