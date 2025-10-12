

const mysql = require("mysql2/promise");
const dotenv = require("dotenv");
import path from "path";
import fs from "fs";
import logger from "../utils/logger";

const envPath = path.resolve(process.cwd(), "backend/.env");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

let pool: any;

// Configuración avanzada del pool para rendimiento y estabilidad
const poolConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // Configuración de pooling avanzado
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10'), // Máximo número de conexiones
  acquireTimeout: parseInt(process.env.DB_ACQUIRE_TIMEOUT || '60000'), // Tiempo máximo para adquirir conexión (ms)
  timeout: parseInt(process.env.DB_TIMEOUT || '60000'), // Timeout para consultas (ms)
  connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT || '10000'), // Timeout para conexión inicial (ms)
  queueLimit: 0, // Cola ilimitada para conexiones pendientes
  reconnect: true, // Reconexión automática
  // Configuración adicional para estabilidad
  multipleStatements: false, // Deshabilitar múltiples statements por seguridad
  dateStrings: true, // Retornar fechas como strings
  charset: 'utf8mb4', // Soporte para emojis y caracteres especiales
};

// Inicializar pool con configuración avanzada
pool = mysql.createPool(poolConfig);

// Manejo de eventos para logging y reconexión
pool.on('connection', (connection: any) => {
  logger.info('Nueva conexión establecida', { threadId: connection.threadId, context: 'db' });
});

pool.on('acquire', (connection: any) => {
  logger.info('Conexión adquirida', { threadId: connection.threadId, context: 'db' });
});

pool.on('release', (connection: any) => {
  logger.info('Conexión liberada', { threadId: connection.threadId, context: 'db' });
});

pool.on('enqueue', () => {
  logger.warn('Esperando por conexión disponible en la cola', { context: 'db' });
});

pool.on('error', (err: any) => {
  logger.error('Error en el pool de conexiones', { error: err.message, stack: err.stack, context: 'db' });
  // El pool maneja automáticamente la reconexión en caso de errores
});

// Función para verificar el estado del pool
async function checkPoolHealth() {
  try {
    const connection = await pool.getConnection();
    logger.info('Pool saludable', { activeConnections: pool._allConnections?.length || 'N/A', context: 'db' });
    connection.release();
    return true;
  } catch (err) {
    logger.error('Error al verificar salud del pool', { error: (err as Error).message, stack: (err as Error).stack, context: 'db' });
    return false;
  }
}

// Exponer función de verificación de salud

async function initDatabase() {
  try {
    logger.info('Conectando a MySQL para crear la base de datos si no existe', { context: 'db' });
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    logger.info('Base de datos verificada/creada', { database: process.env.DB_NAME, context: 'db' });
    await connection.query(`CREATE DATABASE IF NOT EXISTS vvveb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    logger.info('Base de datos vvveb verificada/creada', { database: 'vvveb', context: 'db' });
    await connection.end();
    logger.info('Conexión inicial cerrada. Pool ya inicializado con la base de datos', { context: 'db' });

    // Verificar que el pool está inicializado correctamente
    if (!pool) {
      throw new Error("No se pudo inicializar el pool de MySQL. Verifica la configuración de la base de datos.");
    }


    // Crear tabla 'users' si no existe
    await pool.query(`CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      username VARCHAR(255) NOT NULL UNIQUE,
      display_name VARCHAR(255),
      foto_perfil LONGBLOB,
      creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    logger.info('Tabla verificada/creada correctamente', { table: 'users', context: 'db' });

    // Migrar foto_perfil si no existe
    try {
      // Forzar creación de columna foto_perfil en users
      try {
        await pool.query("ALTER TABLE users ADD COLUMN foto_perfil LONGBLOB NULL");
        logger.info('Columna foto_perfil añadida a users (forzado)', { context: 'db' });
      } catch (err) {
        const error = err as any;
        if (error.code === 'ER_DUP_FIELDNAME') {
          logger.info('La columna foto_perfil ya existe en users', { context: 'db' });
        } else {
          logger.error('Error al crear columna foto_perfil en users', { error: error.message, stack: error.stack, context: 'db' });
        }
      }
      // Migrar display_name si no existe
      try {
        await pool.query("ALTER TABLE users ADD COLUMN display_name VARCHAR(255) NULL");
        logger.info('Columna display_name añadida a users', { context: 'db' });
      } catch (err) {
        const error = err as any;
        if (error.code === 'ER_DUP_FIELDNAME') {
          logger.info('La columna display_name ya existe en users', { context: 'db' });
        } else {
          logger.error('Error al crear columna display_name en users', { error: error.message, stack: error.stack, context: 'db' });
        }
      }
  
      // Mostrar estructura de la tabla 'users' al iniciar
      const [descUsers]: any = await pool.query("DESCRIBE users");
      logger.info('Estructura actual de la tabla users', { structure: descUsers, context: 'db' });
    } catch (err) {
      console.error("Error al migrar columnas de visibilidad/foto_perfil:", err);
    }

    // Crear tabla 'paginas'
    await pool.query(`CREATE TABLE IF NOT EXISTS paginas (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      usuario VARCHAR(255),
      creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);
    logger.info('Tabla verificada/creada correctamente', { table: 'paginas', context: 'db' });


    // Mostrar estructura de la tabla 'paginas' al iniciar
    const [descPaginas]: any = await pool.query("DESCRIBE paginas");
    logger.info('Estructura actual de la tabla paginas', { structure: descPaginas, context: 'db' });

    // Crear tabla 'feed' para entradas de usuarios
    await pool.query(`CREATE TABLE IF NOT EXISTS feed (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      pagina_id INT NULL,
      mensaje TEXT,
      titulo VARCHAR(255),
      contenido TEXT,
      creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (pagina_id) REFERENCES paginas(id) ON DELETE CASCADE
    )`);
    logger.info('Tabla verificada/creada correctamente', { table: 'feed', context: 'db' });

    // Migrar columnas adicionales para feed si no existen
    try {
      await pool.query("ALTER TABLE feed ADD COLUMN pagina_id INT NULL");
      logger.info('Columna pagina_id añadida a feed', { context: 'db' });
    } catch (err) {
      const error = err as any;
      if (error.code === 'ER_DUP_FIELDNAME') {
        logger.info('La columna pagina_id ya existe en feed', { context: 'db' });
      } else {
        logger.error('Error al crear columna pagina_id en feed', { error: error.message, stack: error.stack, context: 'db' });
      }
    }
    try {
      await pool.query("ALTER TABLE feed ADD COLUMN titulo VARCHAR(255) NULL");
      logger.info('Columna titulo añadida a feed', { context: 'db' });
    } catch (err) {
      const error = err as any;
      if (error.code === 'ER_DUP_FIELDNAME') {
        logger.info('La columna titulo ya existe en feed', { context: 'db' });
      } else {
        logger.error('Error al crear columna titulo en feed', { error: error.message, stack: error.stack, context: 'db' });
      }
    }
    try {
      await pool.query("ALTER TABLE feed ADD COLUMN contenido TEXT NULL");
      logger.info('Columna contenido añadida a feed', { context: 'db' });
    } catch (err) {
      const error = err as any;
      if (error.code === 'ER_DUP_FIELDNAME') {
        logger.info('La columna contenido ya existe en feed', { context: 'db' });
      } else {
        logger.error('Error al crear columna contenido en feed', { error: error.message, stack: error.stack, context: 'db' });
      }
    }
    try {
      await pool.query("ALTER TABLE feed ADD COLUMN actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
      logger.info('Columna actualizado_en añadida a feed', { context: 'db' });
    } catch (err) {
      const error = err as any;
      if (error.code === 'ER_DUP_FIELDNAME') {
        logger.info('La columna actualizado_en ya existe en feed', { context: 'db' });
      } else {
        logger.error('Error al crear columna actualizado_en en feed', { error: error.message, stack: error.stack, context: 'db' });
      }
    }
    try {
      await pool.query("ALTER TABLE feed ADD FOREIGN KEY (pagina_id) REFERENCES paginas(id) ON DELETE CASCADE");
      logger.info('Foreign key pagina_id añadida a feed', { context: 'db' });
    } catch (err) {
      const error = err as any;
      if (error.code === 'ER_DUP_KEYNAME' || error.code === 'ER_FK_DUP_NAME') {
        logger.info('La foreign key pagina_id ya existe en feed', { context: 'db' });
      } else {
        logger.error('Error al crear foreign key pagina_id en feed', { error: error.message, stack: error.stack, context: 'db' });
      }
    }

    await pool.query(`CREATE TABLE IF NOT EXISTS comentarios (
      id INT AUTO_INCREMENT PRIMARY KEY,
      pagina_id INT NOT NULL,
      user_id VARCHAR(36) NULL,
      comentario TEXT NOT NULL,
      creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pagina_id) REFERENCES paginas(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )`);
    logger.info('Tabla verificada/creada correctamente', { table: 'comentarios', context: 'db' });

    // Crear tabla 'imagenes_comentarios' para imágenes en comentarios
    await pool.query(`CREATE TABLE IF NOT EXISTS imagenes_comentarios (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      comentario_id INT NULL,
      imagen LONGBLOB,
      filename VARCHAR(255),
      mimetype VARCHAR(100),
      size INT,
      creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);
    logger.info('Tabla verificada/creada correctamente', { table: 'imagenes_comentarios', context: 'db' });

    // Crear tabla 'imagenes' para la galería de cada página
    await pool.query(`CREATE TABLE IF NOT EXISTS imagenes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      pagina_id INT NOT NULL,
      idx INT NOT NULL,
      imagen LONGBLOB,
      creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pagina_id) REFERENCES paginas(id) ON DELETE CASCADE
    )`);
    logger.info('Tabla verificada/creada correctamente', { table: 'imagenes', context: 'db' });

    // Crear tabla 'publicaciones'
    await pool.query(`CREATE TABLE IF NOT EXISTS publicaciones (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      titulo VARCHAR(255) NOT NULL,
      contenido TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);
    logger.info('Tabla verificada/creada correctamente', { table: 'publicaciones', context: 'db' });

    // Crear tabla 'global_chat' para mensajes de chat global
    await pool.query(`CREATE TABLE IF NOT EXISTS global_chat (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);
    logger.info('Tabla verificada/creada correctamente', { table: 'global_chat', context: 'db' });
  } catch (err) {
    logger.error('Error al crear/verificar las tablas', { error: (err as Error).message, stack: (err as Error).stack, context: 'db' });
  }
}

export { pool, initDatabase, checkPoolHealth };