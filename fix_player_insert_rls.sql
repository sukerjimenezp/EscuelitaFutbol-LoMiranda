-- ============================================================
-- fix_player_insert_rls.sql
-- EJECUTAR EN: Supabase > SQL Editor
-- Permite a los admins (superadmin) crear jugadores en profiles
-- sin conflictos de RLS, usando una función SECURITY DEFINER
-- ============================================================

-- 1. Crear función que inserta un jugador bypasseando RLS
--    SECURITY DEFINER = se ejecuta con los permisos del creador (postgres)
--    Solo puede ser llamada por usuarios autenticados
CREATE OR REPLACE FUNCTION public.create_player(
  p_full_name   TEXT,
  p_email       TEXT,
  p_position    TEXT,
  p_dorsal      SMALLINT,
  p_category_id TEXT,
  p_overall     SMALLINT,
  p_pace        SMALLINT,
  p_shooting    SMALLINT,
  p_passing     SMALLINT,
  p_dribbling   SMALLINT,
  p_defense     SMALLINT,
  p_physical    SMALLINT,
  p_avatar_url  TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role TEXT;
  v_new_id      UUID;
BEGIN
  -- Verificar que el que llama es superadmin o dt
  SELECT role INTO v_caller_role
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_caller_role NOT IN ('superadmin', 'dt') AND 
     (auth.jwt() ->> 'email') != 'escuelafclomiranda@gmail.com' THEN
    RAISE EXCEPTION 'No tienes permisos para crear jugadores';
  END IF;

  -- Generar UUID en el servidor
  v_new_id := gen_random_uuid();

  INSERT INTO public.profiles (
    id, full_name, email, role, position, dorsal,
    category_id, overall, pace, shooting, passing,
    dribbling, defense, physical, avatar_url
  ) VALUES (
    v_new_id, p_full_name, p_email, 'player', p_position, p_dorsal,
    p_category_id, p_overall, p_pace, p_shooting, p_passing,
    p_dribbling, p_defense, p_physical, p_avatar_url
  );

  RETURN v_new_id;
END;
$$;

-- 2. Permitir que usuarios autenticados ejecuten esta función
GRANT EXECUTE ON FUNCTION public.create_player TO authenticated;

-- 3. (Opcional) Añadir también política de INSERT directa para superadmin
--    por si en el futuro se quiere hacer insert directo
DROP POLICY IF EXISTS "Admins pueden crear perfiles" ON public.profiles;
CREATE POLICY "Admins pueden crear perfiles"
ON public.profiles FOR INSERT
WITH CHECK (
  (auth.jwt() ->> 'email' = 'escuelafclomiranda@gmail.com')
  OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('superadmin', 'dt')
  )
);
