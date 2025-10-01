
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
    // ...existing code...
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

    // Cambiar el campo 'descripcion' a TEXT si es VARCHAR(32)
    try {
      const [descCol]: any = await pool.query("SHOW COLUMNS FROM paginas LIKE 'descripcion'");
      if (descCol && descCol.length > 0 && descCol[0].Type.startsWith('varchar')) {
        await pool.query("ALTER TABLE paginas MODIFY COLUMN descripcion TEXT");
        console.log("Columna 'descripcion' modificada a TEXT en la tabla 'paginas'.");
      }
    } catch (migrErr) {
      console.error("Error al migrar la columna 'descripcion':", migrErr);
    }

    // Crear las tablas necesarias si no existen
    try {
      await pool.query(`CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        username VARCHAR(255) NOT NULL
      )`);
      console.log("Tabla 'users' verificada/creada correctamente.");
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
      // Mostrar estructura de la tabla 'paginas' al iniciar
      const [descPaginas]: any = await pool.query("DESCRIBE paginas");
      console.log("Estructura actual de la tabla 'paginas':");
      console.table(descPaginas);
      await pool.query(`CREATE TABLE IF NOT EXISTS comentarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        pagina_id INT NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        comentario TEXT NOT NULL,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pagina_id) REFERENCES paginas(id) ON DELETE CASCADE
      )`);
      console.log("Tabla 'comentarios' verificada/creada correctamente.");
    } catch (tableErr) {
      console.error("Error al crear/verificar tablas:", tableErr);
      throw tableErr;
    }

    // Verificar y agregar columnas de visibilidad por campo si faltan (ahora pool está inicializado)
    const camposVisibilidad = [
      { nombre: 'visible_titulo', def: "ALTER TABLE paginas ADD COLUMN visible_titulo TINYINT(1) DEFAULT 1" },
      { nombre: 'visible_contenido', def: "ALTER TABLE paginas ADD COLUMN visible_contenido TINYINT(1) DEFAULT 1" },
      { nombre: 'visible_descripcion', def: "ALTER TABLE paginas ADD COLUMN visible_descripcion TINYINT(1) DEFAULT 1" },
      { nombre: 'visible_usuario', def: "ALTER TABLE paginas ADD COLUMN visible_usuario TINYINT(1) DEFAULT 1" },
      { nombre: 'visible_comentarios', def: "ALTER TABLE paginas ADD COLUMN visible_comentarios TINYINT(1) DEFAULT 1" }
    ];
    for (const campo of camposVisibilidad) {
      const [col]: any = await pool.query(`SHOW COLUMNS FROM paginas LIKE '${campo.nombre}'`);
      if (!col || col.length === 0) {
        await pool.query(campo.def);
        console.log(`Columna '${campo.nombre}' agregada a la tabla 'paginas'.`);
      }
    }

    // Verificar y agregar columna 'oculto' si falta (ahora pool está inicializado)
    const [columnsOculto]: any = await pool.query("SHOW COLUMNS FROM paginas LIKE 'oculto'");
    if (!columnsOculto || columnsOculto.length === 0) {
      await pool.query("ALTER TABLE paginas ADD COLUMN oculto TINYINT(1) DEFAULT 0");
      console.log("Columna 'oculto' agregada a la tabla 'paginas'.");
    }
  } catch (err) {
    console.error("Error al inicializar la base de datos y tablas:", err);
  }
}

export { pool, initDatabase };
