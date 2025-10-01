
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
try {
  pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  // Crear las tablas necesarias si no existen
  (async () => {
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
        titulo VARCHAR(255),
        contenido TEXT,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`);
      console.log("Tabla 'paginas' verificada/creada correctamente.");
      await pool.query(`CREATE TABLE IF NOT EXISTS comentarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        pagina_id INT NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        comentario TEXT NOT NULL,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pagina_id) REFERENCES paginas(id) ON DELETE CASCADE
      )`);
      console.log("Tabla 'comentarios' verificada/creada correctamente.");
    } catch (err) {
      console.error("Error al crear/verificar las tablas:", err);
    }
  })();
} catch (err) {
  console.error("Error al crear el pool de MySQL:", err);
}

export { pool };
