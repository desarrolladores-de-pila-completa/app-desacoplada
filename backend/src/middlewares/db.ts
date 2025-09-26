


import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";

const rootPath = path.resolve(__dirname, '../../../');
dotenv.config({ path: path.join(rootPath, 'backend/.env') });


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
