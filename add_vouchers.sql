-- =========================================================================
-- SQL SCRIPT: Agregar Vouchers y Edición a Finanzas
-- =========================================================================

-- 1. Agregar columna para almacenar el enlace de la imagen del comprobante
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS voucher_url TEXT;

-- 2. Crear el Bucket de Storage para guardar las imágenes (Si no existe)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('vouchers', 'vouchers', true) 
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. Políticas de Seguridad para Storage (Permite subir imágenes)
-- Cualquiera puede ver los comprobantes (es un bucket público)
DROP POLICY IF EXISTS "Public Vouchers Access" ON storage.objects;
CREATE POLICY "Public Vouchers Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'vouchers' );

-- Solo los autenticados (contadores, admin) pueden subir comprobantes
DROP POLICY IF EXISTS "Authenticated Upload Vouchers" ON storage.objects;
CREATE POLICY "Authenticated Upload Vouchers" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK ( bucket_id = 'vouchers' );

-- Permitir actualizar/reemplazar imágenes
DROP POLICY IF EXISTS "Authenticated Update Vouchers" ON storage.objects;
CREATE POLICY "Authenticated Update Vouchers" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING ( bucket_id = 'vouchers' );
