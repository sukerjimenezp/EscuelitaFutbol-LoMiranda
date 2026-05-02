-- =========================================================================
-- SQL SCRIPT: Crear Bucket para Avatares de Usuarios
-- =========================================================================

-- 1. Crear el Bucket de Storage para guardar las imágenes (Si no existe)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true) 
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Políticas de Seguridad para Storage
-- Cualquiera puede ver las fotos de perfil (es un bucket público)
DROP POLICY IF EXISTS "Public Avatars Access" ON storage.objects;
CREATE POLICY "Public Avatars Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'avatars' );

-- Solo los usuarios autenticados pueden subir su foto de perfil
DROP POLICY IF EXISTS "Authenticated Upload Avatars" ON storage.objects;
CREATE POLICY "Authenticated Upload Avatars" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK ( bucket_id = 'avatars' );

-- Permitir actualizar/reemplazar imágenes
DROP POLICY IF EXISTS "Authenticated Update Avatars" ON storage.objects;
CREATE POLICY "Authenticated Update Avatars" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING ( bucket_id = 'avatars' );
