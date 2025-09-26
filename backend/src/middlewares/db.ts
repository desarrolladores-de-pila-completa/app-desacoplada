


import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";

// Carga .env desde la ruta absoluta de backend/.env, funciona en src y dist
// Carga dotenv usando ruta relativa a la raíz del proyecto
import fs from "fs";
const envPath = path.resolve(process.cwd(), "backend/.env");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config(); // fallback: busca .env en el cwd
}


let pool: mysql.Pool;
try {
  pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
} catch (err) {
  console.error("Error al crear el pool de MySQL:", err);
}

export { pool };
