-- ============================================================================
-- FIX: RLS POLICIES — Corrige acceso a payments, profiles y categories
-- Ejecutar en SQL Editor de Supabase
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. PAYMENTS: La política original usa auth.jwt()->>'role' que NUNCA funciona
--    Reemplazamos con consulta a la tabla profiles
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Contadores y Admin ven todo" ON public.payments;

CREATE POLICY "Contadores y Admin ven todo" 
ON public.payments FOR ALL 
USING ( 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('superadmin', 'contador') 
)
WITH CHECK ( 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('superadmin', 'contador') 
);

-- Mantener la política de padres que ven pagos de sus hijos
DROP POLICY IF EXISTS "Padres ven pagos de hijos" ON public.payments;
CREATE POLICY "Padres ven pagos de hijos"
ON public.payments FOR SELECT
USING ( player_id IN (SELECT id FROM public.profiles WHERE parent_id = auth.uid()) );

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. PROFILES: Añadir política para que DTs también puedan gestionar perfiles
--    (actualmente solo el dueño y escuelafclomiranda@ pueden hacer ALL)
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins y dueños gestionan perfiles" ON public.profiles;

CREATE POLICY "Admins y dueños gestionan perfiles" 
ON public.profiles FOR ALL
USING (
  auth.uid() = id 
  OR 
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('superadmin', 'dt')
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. CATEGORIES: La política ALL debe incluir DTs además de superadmin
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Solo admins modifican categorias" ON public.categories;

CREATE POLICY "Solo admins modifican categorias" ON public.categories FOR ALL 
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('superadmin', 'dt')
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. ADMIN_USERS: Verificar que la función is_superadmin busque en profiles también
--    como fallback (para el caso de que admin_users esté vacío)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE email = auth.jwt() ->> 'email'
  )
  OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'superadmin'
  );
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- VERIFICACIÓN: Ejecutar después del patch
-- ─────────────────────────────────────────────────────────────────────────────
-- SELECT is_superadmin();
-- SELECT count(*) FROM payments;
-- SELECT count(*) FROM profiles WHERE role = 'player';
-- SELECT count(*) FROM categories;
