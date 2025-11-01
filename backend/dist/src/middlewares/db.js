"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.initDatabase = initDatabase;
exports.checkPoolHealth = checkPoolHealth;
const mysql = require("mysql2/promise");
const dotenv = require("dotenv");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const logger_1 = __importDefault(require("../utils/logger"));
const envPath = path_1.default.resolve(process.cwd(), "backend/.env");
if (fs_1.default.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}
else {
    dotenv.config();
}
let pool;
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
exports.pool = pool = mysql.createPool(poolConfig);
// Manejo de eventos para logging y reconexión
pool.on('connection', (connection) => {
    logger_1.default.info('Nueva conexión establecida', { threadId: connection.threadId, context: 'db' });
});
pool.on('acquire', (connection) => {
    logger_1.default.info('Conexión adquirida', { threadId: connection.threadId, context: 'db' });
});
pool.on('release', (connection) => {
    logger_1.default.info('Conexión liberada', { threadId: connection.threadId, context: 'db' });
});
pool.on('enqueue', () => {
    logger_1.default.warn('Esperando por conexión disponible en la cola', { context: 'db' });
});
pool.on('error', (err) => {
    logger_1.default.error('Error en el pool de conexiones', { error: err.message, stack: err.stack, context: 'db' });
    // El pool maneja automáticamente la reconexión en caso de errores
});
// Función para verificar el estado del pool
async function checkPoolHealth() {
    try {
        const connection = await pool.getConnection();
        logger_1.default.info('Pool saludable', { activeConnections: pool._allConnections?.length || 'N/A', context: 'db' });
        connection.release();
        return true;
    }
    catch (err) {
        logger_1.default.error('Error al verificar salud del pool', { error: err.message, stack: err.stack, context: 'db' });
        return false;
    }
}
// Exponer función de verificación de salud
async function initDatabase() {
    try {
        logger_1.default.info('Conectando a MySQL para crear la base de datos si no existe', { context: 'db' });
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
        });
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        logger_1.default.info('Base de datos verificada/creada', { database: process.env.DB_NAME, context: 'db' });
        await connection.end();
        logger_1.default.info('Conexión inicial cerrada. Pool ya inicializado con la base de datos', { context: 'db' });
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
        logger_1.default.info('Tabla verificada/creada correctamente', { table: 'users', context: 'db' });
        // Migrar foto_perfil si no existe
        try {
            // Forzar creación de columna foto_perfil en users
            try {
                await pool.query("ALTER TABLE users ADD COLUMN foto_perfil LONGBLOB NULL");
                logger_1.default.info('Columna foto_perfil añadida a users (forzado)', { context: 'db' });
            }
            catch (err) {
                const error = err;
                if (error.code === 'ER_DUP_FIELDNAME') {
                    logger_1.default.info('La columna foto_perfil ya existe en users', { context: 'db' });
                }
                else {
                    logger_1.default.error('Error al crear columna foto_perfil en users', { error: error.message, stack: error.stack, context: 'db' });
                }
            }
            // Migrar display_name si no existe
            try {
                await pool.query("ALTER TABLE users ADD COLUMN display_name VARCHAR(255) NULL");
                logger_1.default.info('Columna display_name añadida a users', { context: 'db' });
            }
            catch (err) {
                const error = err;
                if (error.code === 'ER_DUP_FIELDNAME') {
                    logger_1.default.info('La columna display_name ya existe en users', { context: 'db' });
                }
                else {
                    logger_1.default.error('Error al crear columna display_name en users', { error: error.message, stack: error.stack, context: 'db' });
                }
            }
            // Mostrar estructura de la tabla 'users' al iniciar
            const [descUsers] = await pool.query("DESCRIBE users");
            logger_1.default.info('Estructura actual de la tabla users', { structure: descUsers, context: 'db' });
        }
        catch (err) {
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
        logger_1.default.info('Tabla verificada/creada correctamente', { table: 'paginas', context: 'db' });
        // Mostrar estructura de la tabla 'paginas' al iniciar
        const [descPaginas] = await pool.query("DESCRIBE paginas");
        logger_1.default.info('Estructura actual de la tabla paginas', { structure: descPaginas, context: 'db' });
        await pool.query(`CREATE TABLE IF NOT EXISTS comentarios (
      id INT AUTO_INCREMENT PRIMARY KEY,
      pagina_id INT NOT NULL,
      user_id VARCHAR(36) NULL,
      comentario TEXT NOT NULL,
      creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pagina_id) REFERENCES paginas(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )`);
        logger_1.default.info('Tabla verificada/creada correctamente', { table: 'comentarios', context: 'db' });
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
        logger_1.default.info('Tabla verificada/creada correctamente', { table: 'imagenes_comentarios', context: 'db' });
        // Crear tabla 'imagenes' para la galería de cada página
        await pool.query(`CREATE TABLE IF NOT EXISTS imagenes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      pagina_id INT NOT NULL,
      idx INT NOT NULL,
      imagen LONGBLOB,
      creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pagina_id) REFERENCES paginas(id) ON DELETE CASCADE
    )`);
        logger_1.default.info('Tabla verificada/creada correctamente', { table: 'imagenes', context: 'db' });
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
        logger_1.default.info('Tabla verificada/creada correctamente', { table: 'publicaciones', context: 'db' });
    }
    catch (err) {
        logger_1.default.error('Error al crear/verificar las tablas', { error: err.message, stack: err.stack, context: 'db' });
    }
}
//# sourceMappingURL=db.js.map