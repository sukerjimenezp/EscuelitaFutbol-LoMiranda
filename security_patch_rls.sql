-- [MIGRACIÓN] security_patch_rls.sql
-- Auditoría de Seguridad y Performance - Escuelita Lo Miranda FC

-- 1. Optimización mediante Índices (Performance)
CREATE INDEX IF NOT EXISTS idx_profiles_parent_id ON public.profiles(parent_id);
CREATE INDEX IF NOT EXISTS idx_attendance_player_date ON public.attendance(player_id, date);
CREATE INDEX IF NOT EXISTS idx_feedback_player_id ON public.feedback(player_id);
CREATE INDEX IF NOT EXISTS idx_user_skins_user_id ON public.user_skins(user_id);

-- 2. Activar Row Level Security (RLS) en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trivia_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trivia_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- 3. POLÍTICAS: CATEGORIES
DROP POLICY IF EXISTS "Categorias visibles para todos" ON public.categories;
DROP POLICY IF EXISTS "Solo admins modifican categorias" ON public.categories;
CREATE POLICY "Categorias visibles para todos" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Solo admins modifican categorias" ON public.categories FOR ALL 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'));

-- 4. POLÍTICAS: PROFILES
DROP POLICY IF EXISTS "Admins y DTs ven todo" ON public.profiles;
DROP POLICY IF EXISTS "Usuarios ven su propio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Padres ven perfiles de sus hijos" ON public.profiles;
DROP POLICY IF EXISTS "Profiles son visibles para usuarios autenticados" ON public.profiles;
DROP POLICY IF EXISTS "Admins y dueños gestionan perfiles" ON public.profiles;

-- Política Base: Todos los usuarios autenticados pueden ver perfiles (necesario para la UI)
CREATE POLICY "Profiles visibles para autenticados" 
ON public.profiles FOR SELECT 
USING (auth.role() = 'authenticated');

-- Política de Gestión: Admins y Dueños pueden modificar
-- Usamos auth.jwt() para el admin inicial para evitar recursión en la primera carga
CREATE POLICY "Admins y dueños gestionan perfiles" 
ON public.profiles FOR ALL
USING (
  auth.uid() = id 
  OR 
  (auth.jwt() ->> 'email' = 'escuelafclomiranda@gmail.com')
);

-- Nota: Una vez que el primer superadmin está creado, se pueden añadir más 
-- pero esta política de correo es el "fail-safe" inicial.

-- 5. POLÍTICAS: ATTENDANCE
DROP POLICY IF EXISTS "DTs gestionan asistencia" ON public.attendance;
DROP POLICY IF EXISTS "Jugadores ven su asistencia" ON public.attendance;
DROP POLICY IF EXISTS "Padres ven asistencia de sus hijos" ON public.attendance;

CREATE POLICY "DTs gestionan asistencia" ON public.attendance FOR ALL 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('superadmin', 'dt')));

CREATE POLICY "Jugadores ven su asistencia" ON public.attendance FOR SELECT 
USING (player_id = auth.uid());

CREATE POLICY "Padres ven asistencia de sus hijos" ON public.attendance FOR SELECT 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = player_id AND parent_id = auth.uid()));

-- 6. POLÍTICAS: USER_SKINS
CREATE POLICY "Users see their own skins" ON public.user_skins FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admins see all user skins" ON public.user_skins FOR SELECT
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('superadmin', 'dt')));

-- 7. POLÍTICAS: TRIVIA_SESSIONS
CREATE POLICY "Users see their own sessions" ON public.trivia_sessions FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users insert their sessions" ON public.trivia_sessions FOR INSERT
WITH CHECK (user_id = auth.uid());

-- 8. LIVE CONFIG 
DROP POLICY IF EXISTS "Live Config es visible para todos" ON public.live_config;
DROP POLICY IF EXISTS "Solo admins modifican configuracion" ON public.live_config;
CREATE POLICY "Live Config es visible para todos" ON public.live_config FOR SELECT USING (true);
CREATE POLICY "Solo admins modifican configuracion" ON public.live_config FOR UPDATE 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('superadmin', 'dt')));

