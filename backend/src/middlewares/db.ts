

import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

const envPath = path.resolve(process.cwd(), "backend/.env");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

let pool: mysql.Pool;

async function initDatabase() {
  try {
    // Conexión sin base de datos para crearla si no existe
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);
    await connection.end();

    // Ahora sí, crear el pool con la base de datos
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    // Verificar que el pool está inicializado correctamente
    if (!pool) {
      throw new Error("No se pudo inicializar el pool de MySQL. Verifica la configuración de la base de datos.");
    }

    // Migrar columnas de visibilidad y foto_perfil si no existen
    try {
      const [colsPaginas]: any = await pool.query("SHOW COLUMNS FROM paginas");
      const colNamesPaginas = colsPaginas.map((c: any) => c.Field);
      const visCols = [
        "visible_titulo",
        "visible_contenido",
        "visible_descripcion",
        "visible_usuario",
        "visible_comentarios"
      ];
      const missingPaginas = visCols.filter(col => !colNamesPaginas.includes(col));
      if (missingPaginas.length > 0) {
        await pool.query(`ALTER TABLE paginas ${missingPaginas.map(col => `ADD COLUMN ${col} TINYINT(1) DEFAULT 1`).join(", ")}`);
        console.log("Columnas de visibilidad añadidas automáticamente:", missingPaginas);
      }
      // Forzar creación de columna foto_perfil en users
      try {
        await pool.query("ALTER TABLE users ADD COLUMN foto_perfil LONGBLOB NULL");
        console.log("Columna foto_perfil añadida a users (forzado)");
      } catch (err) {
        const error = err as any;
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log("La columna foto_perfil ya existe en users.");
        } else {
          console.error("Error al crear columna foto_perfil en users:", err);
        }
      }
      // Mostrar estructura de la tabla 'users' al iniciar
      const [descUsers]: any = await pool.query("DESCRIBE users");
      console.log("Estructura actual de la tabla 'users':");
      console.table(descUsers);
    } catch (err) {
      console.error("Error al migrar columnas de visibilidad/foto_perfil:", err);
    }

    // Crear tabla 'paginas'
    await pool.query(`CREATE TABLE IF NOT EXISTS paginas (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      propietario TINYINT(1) DEFAULT 0,
      titulo VARCHAR(255),
      contenido TEXT,
      descripcion VARCHAR(32) DEFAULT 'visible',
      usuario VARCHAR(255),
      comentarios TEXT,
      oculto TINYINT(1) DEFAULT 0,
      creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    console.log("Tabla 'paginas' verificada/creada correctamente con campos propietario, descripcion, usuario, comentarios, visible y oculto.");
    // Migrar columnas de visibilidad y oculto si no existen
    try {
      const [cols]: any = await pool.query("SHOW COLUMNS FROM paginas");
      const colNames = cols.map((c: any) => c.Field);
      const visCols = [
        "visible_titulo",
        "visible_contenido",
        "visible_descripcion",
        "visible_usuario",
        "visible_comentarios",
        "oculto"
      ];
      const missing = visCols.filter(col => !colNames.includes(col));
      if (missing.length > 0) {
        await pool.query(`ALTER TABLE paginas ${missing.map(col => `ADD COLUMN ${col} TINYINT(1) DEFAULT 1`).join(", ")}`);
        console.log("Columnas de visibilidad/oculto añadidas automáticamente:", missing);
      }
    } catch (err) {
      console.error("Error al migrar columnas de visibilidad/oculto:", err);
    }
    // Mostrar estructura de la tabla 'paginas' al iniciar
    const [descPaginas]: any = await pool.query("DESCRIBE paginas");
    console.log("Estructura actual de la tabla 'paginas':");
    console.table(descPaginas);
    await pool.query(`CREATE TABLE IF NOT EXISTS comentarios (
      id INT AUTO_INCREMENT PRIMARY KEY,
      pagina_id INT NOT NULL,
      user_id VARCHAR(36) NULL,
      comentario TEXT NOT NULL,
      creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pagina_id) REFERENCES paginas(id) ON DELETE CASCADE
    )`);
    console.log("Tabla 'comentarios' verificada/creada correctamente.");

    // Crear tabla 'imagenes' para la galería de cada página
    await pool.query(`CREATE TABLE IF NOT EXISTS imagenes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      pagina_id INT NOT NULL,
      idx INT NOT NULL,
      imagen LONGBLOB,
      creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pagina_id) REFERENCES paginas(id) ON DELETE CASCADE
    )`);
    console.log("Tabla 'imagenes' verificada/creada correctamente.");
  } catch (err) {
    console.error("Error al crear/verificar las tablas:", err);
  }
}

export { pool, initDatabase };