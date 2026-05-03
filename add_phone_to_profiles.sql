-- =========================================================================
-- SQL SCRIPT: Agregar columna de teléfono a la tabla profiles
-- =========================================================================

-- Añadir columna phone a la tabla profiles si no existe
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
