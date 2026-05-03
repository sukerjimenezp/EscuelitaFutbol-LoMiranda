-- ============================================================================
-- AUDIT REMEDIATION PATCH — Escuelita Lo Miranda FC
-- Ejecutar completo en el SQL Editor de Supabase (Dashboard → SQL Editor)
-- Fecha: 2026-05-03
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- SEC-01: Tabla de administradores (reemplaza emails hardcodeados en el cliente)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_users (
  email TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insertar los superadmins actuales
INSERT INTO public.admin_users (email) VALUES
  ('escuelafclomiranda@gmail.com'),
  ('suker.sms@gmail.com'),
  ('testdt@lomiranda.cl')
ON CONFLICT (email) DO NOTHING;

-- RLS: Solo los propios superadmins pueden leer esta tabla
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Política: Permitir lectura solo a usuarios autenticados (el cliente solo verifica su propio email)
CREATE POLICY "Authenticated users can check admin status"
  ON public.admin_users FOR SELECT
  TO authenticated
  USING (email = auth.jwt() ->> 'email');

-- Función RPC segura: verifica si el usuario actual es superadmin
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE email = auth.jwt() ->> 'email'
  );
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- SEC-02: Compra atómica de skins (previene race condition TOCTOU)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.purchase_skin(p_skin_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_cost INT;
  v_points INT;
  v_already_owned BOOLEAN;
BEGIN
  -- Obtener el usuario autenticado
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'No autenticado');
  END IF;

  -- Obtener el costo de la skin
  SELECT cost INTO v_cost FROM public.skins WHERE id = p_skin_id;
  IF v_cost IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Skin no encontrada');
  END IF;

  -- Verificar si ya la tiene
  SELECT EXISTS (
    SELECT 1 FROM public.user_skins WHERE user_id = v_user_id AND skin_id = p_skin_id
  ) INTO v_already_owned;

  IF v_already_owned THEN
    RETURN json_build_object('success', false, 'error', 'Ya posees esta skin');
  END IF;

  -- Obtener puntos actuales CON LOCK (previene race condition)
  SELECT points INTO v_points FROM public.profiles WHERE id = v_user_id FOR UPDATE;

  IF v_points IS NULL OR v_points < v_cost THEN
    RETURN json_build_object('success', false, 'error', 'Puntos insuficientes');
  END IF;

  -- Transacción atómica: descontar + insertar
  UPDATE public.profiles SET points = points - v_cost WHERE id = v_user_id;
  INSERT INTO public.user_skins (user_id, skin_id) VALUES (v_user_id, p_skin_id);

  RETURN json_build_object('success', true, 'remaining_points', v_points - v_cost);
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- FUNC-03: Tabla para persistir formaciones tácticas
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tactics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id TEXT NOT NULL,
  formation TEXT NOT NULL DEFAULT '4-3-3',
  deployed_players JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Constraint único: una táctica por categoría por creador
ALTER TABLE public.tactics
  ADD CONSTRAINT unique_tactic_per_category_per_user
  UNIQUE (category_id, created_by);

-- RLS
ALTER TABLE public.tactics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage tactics"
  ON public.tactics FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('superadmin', 'dt')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('superadmin', 'dt')
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- Tabla events (si no existe — bloqueaba el Dashboard)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'training',
  title TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT,
  location TEXT,
  category_id TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view events"
  ON public.events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can manage events"
  ON public.events FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('superadmin', 'dt')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('superadmin', 'dt')
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- FIN DEL PATCH
-- ─────────────────────────────────────────────────────────────────────────────
-- Para verificar:
--   SELECT is_superadmin();
--   SELECT * FROM public.admin_users;
--   SELECT * FROM public.tactics LIMIT 5;
--   SELECT * FROM public.events LIMIT 5;
