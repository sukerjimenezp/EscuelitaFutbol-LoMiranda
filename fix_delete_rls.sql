-- Fix para que los administradores y directores técnicos (DT) puedan eliminar jugadores
-- Correr esto en el SQL Editor de Supabase

-- Eliminar la política anterior si existe (para evitar duplicidad)
DROP POLICY IF EXISTS "Admins y dueños gestionan perfiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins y dueños pueden eliminar perfiles" ON public.profiles;

-- Crear una política específica para DELETE
CREATE POLICY "Admins y dueños pueden eliminar perfiles" 
ON public.profiles FOR DELETE 
USING (
  -- Permitir si es el mismo usuario eliminándose (edge case)
  auth.uid() = id 
  OR 
  -- Permitir si el email es el dueño (fail-safe)
  (auth.jwt() ->> 'email' = 'escuelafclomiranda@gmail.com')
  OR
  -- Permitir si el usuario autenticado tiene el rol de superadmin o dt
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('superadmin', 'dt')
  )
);

-- Re-crear la de gestión global (INSERT, UPDATE) por si acaso no estaban cubiertos los DTs
DROP POLICY IF EXISTS "Admins y dueños insertan y actualizan perfiles" ON public.profiles;
CREATE POLICY "Admins y dueños insertan y actualizan perfiles" 
ON public.profiles FOR ALL 
USING (
  auth.uid() = id 
  OR 
  (auth.jwt() ->> 'email' = 'escuelafclomiranda@gmail.com')
  OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('superadmin', 'dt')
  )
);
