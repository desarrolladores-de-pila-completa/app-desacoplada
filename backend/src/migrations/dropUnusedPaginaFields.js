/**
 * Script de migración para eliminar campos no utilizados de la tabla paginas
 * Ejecutar con: npm run migrate:drop-unused-fields
 */

const mysql = require("mysql2/promise");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const logger = require("../utils/logger");

// Cargar variables de entorno
const envPath = path.resolve(process.cwd(), "backend/.env");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

// Configuración de conexión
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: 'utf8mb4',
};

async function runMigration() {
  let connection;

  try {
    console.log('🚀 Iniciando migración: Eliminación de campos no utilizados de tabla paginas');

    // Conectar a la base de datos
    connection = await mysql.createConnection(dbConfig);

    // Verificar que la tabla existe
    console.log('📋 Verificando existencia de tabla paginas...');
    const [tables] = await connection.execute("SHOW TABLES LIKE 'paginas'");

    if (tables.length === 0) {
      console.log('❌ La tabla paginas no existe. No hay nada que migrar.');
      return;
    }

    // Verificar estructura actual
    console.log('📊 Estructura actual de la tabla paginas:');
    const [describeResult] = await connection.execute("DESCRIBE paginas");
    console.table(describeResult.map(col => ({
      Field: col.Field,
      Type: col.Type,
      Null: col.Null,
      Key: col.Key,
      Default: col.Default,
      Extra: col.Extra
    })));

    // Verificar si los campos existen antes de eliminarlos
    const camposAEliminar = ['oculto', 'propietario', 'titulo', 'descripcion', 'contenido'];
    const camposExistentes = describeResult.map(col => col.Field);

    console.log('\n🔍 Verificando campos a eliminar...');

    for (const campo of camposAEliminar) {
      if (camposExistentes.includes(campo)) {
        console.log(`🗑️  Eliminando campo: ${campo}`);
        try {
          await connection.execute(`ALTER TABLE paginas DROP COLUMN ${campo}`);
          console.log(`✅ Campo ${campo} eliminado exitosamente`);
        } catch (error) {
          console.error(`❌ Error al eliminar campo ${campo}:`, error.message);
          throw error;
        }
      } else {
        console.log(`⚠️  Campo ${campo} no existe en la tabla (ya fue eliminado)`);
      }
    }

    // Verificar estructura final
    console.log('\n📊 Estructura final de la tabla paginas:');
    const [finalDescribe] = await connection.execute("DESCRIBE paginas");
    console.table(finalDescribe.map(col => ({
      Field: col.Field,
      Type: col.Type,
      Null: col.Null,
      Key: col.Key,
      Default: col.Default,
      Extra: col.Extra
    })));

    console.log('\n✅ Migración completada exitosamente');
    console.log('📝 Campos eliminados: oculto, propietario, titulo, descripcion, contenido');

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada');
    }
  }
}

// Ejecutar migración si se llama directamente
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('🎉 Proceso de migración finalizado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error fatal durante la migración:', error);
      process.exit(1);
    });
}

module.exports = { runMigration };