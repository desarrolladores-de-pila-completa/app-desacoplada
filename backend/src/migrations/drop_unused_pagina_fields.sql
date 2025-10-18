-- Script de migración para eliminar campos no utilizados de la tabla paginas
-- Fecha: 2025-10-18
-- Descripción: Elimina los campos oculto, propietario, titulo, descripcion y contenido de la tabla paginas

-- Verificar que la tabla existe antes de proceder
SELECT 'Verificando existencia de tabla paginas' AS status;
SHOW TABLES LIKE 'paginas';

-- Verificar estructura actual de la tabla
SELECT 'Estructura actual de la tabla paginas' AS info;
DESCRIBE paginas;

-- Eliminar campos no utilizados (en orden inverso a las dependencias)
-- Nota: Estos campos no tienen dependencias externas conocidas

-- 1. Eliminar campo 'oculto'
SELECT 'Eliminando campo oculto...' AS status;
ALTER TABLE paginas DROP COLUMN IF EXISTS oculto;

-- 2. Eliminar campo 'propietario'
SELECT 'Eliminando campo propietario...' AS status;
ALTER TABLE paginas DROP COLUMN IF EXISTS propietario;

-- 3. Eliminar campo 'titulo'
SELECT 'Eliminando campo titulo...' AS status;
ALTER TABLE paginas DROP COLUMN IF EXISTS titulo;

-- 4. Eliminar campo 'descripcion'
SELECT 'Eliminando campo descripcion...' AS status;
ALTER TABLE paginas DROP COLUMN IF EXISTS descripcion;

-- 5. Eliminar campo 'contenido'
SELECT 'Eliminando campo contenido...' AS status;
ALTER TABLE paginas DROP COLUMN IF EXISTS contenido;

-- Verificar estructura final de la tabla
SELECT 'Estructura final de la tabla paginas' AS info;
DESCRIBE paginas;

-- Confirmar que la operación se completó exitosamente
SELECT 'Migración completada exitosamente' AS status;