-- 1. Categorías
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    label TEXT,
    age_range TEXT,
    color TEXT
);

-- 2. Perfiles de Usuario (DT, Asistentes, Alumnos, Padres)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT auth.uid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'player', -- 'superadmin', 'dt', 'contador', 'parent', 'player'
    category_id TEXT REFERENCES public.categories(id),
    dorsal SMALLINT,
    position TEXT,
    avatar_url TEXT,
    overall SMALLINT DEFAULT 50,
    pace SMALLINT DEFAULT 50,
    shooting SMALLINT DEFAULT 50,
    passing SMALLINT DEFAULT 50,
    dribbling SMALLINT DEFAULT 50,
    defense SMALLINT DEFAULT 50,
    physical SMALLINT DEFAULT 50,
    points INTEGER DEFAULT 50, -- GAMIFICATION: Puntos acumulados de inicio
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Asistencia Diaria (Entrenamientos y Partidos)
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'match')), -- 'match' otorga +50 pts
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Motivación / El Profe Dice
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    coach_id UUID REFERENCES public.profiles(id),
    title TEXT DEFAULT '¡BUEN TRABAJO!',
    message TEXT,
    points JSONB DEFAULT '[]',
    footer TEXT DEFAULT '¡A seguir divirtiéndonos!',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Configuración del Streaming en Vivo
CREATE TABLE IF NOT EXISTS public.live_config (
    id TEXT PRIMARY KEY DEFAULT 'current',
    video_id TEXT,
    is_live BOOLEAN DEFAULT false,
    channel_id TEXT DEFAULT 'UCPKY87Gjxxyw1LiCYcxgs3w',
    is_auto_mode BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Tienda de Stickers / Skins
CREATE TABLE IF NOT EXISTS public.skins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    rarity TEXT CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    cost INTEGER DEFAULT 100,
    image_url TEXT,
    unlocked_by TEXT, -- Descripción de cómo obtenerlo (opcional)
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Inventario de Jugadores (Skins Compradas)
CREATE TABLE IF NOT EXISTS public.user_skins (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    skin_id UUID REFERENCES public.skins(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, skin_id)
);

-- 8. Banco de Preguntas Trivia
CREATE TABLE IF NOT EXISTS public.trivia_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    options JSONB NOT NULL, -- Array de strings: ["Opción A", "Opción B", ...]
    correct_index INTEGER NOT NULL,
    min_age INTEGER DEFAULT 0,
    max_age INTEGER DEFAULT 100,
    reward_points INTEGER DEFAULT 20,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Historial de Sesiones Trivia (Regla: 2 veces por semana)
CREATE TABLE IF NOT EXISTS public.trivia_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    played_at TIMESTAMPTZ DEFAULT now(),
    week_start DATE DEFAULT date_trunc('week', now())::date
);

-- Insertar Configuración Inicial de Streaming
INSERT INTO public.live_config (id, video_id, is_live) 
VALUES ('current', '', false)
ON CONFLICT (id) DO NOTHING;

-- Insertar Categorías Iniciales
INSERT INTO public.categories (id, name, label, age_range, color) VALUES
('sub6', 'Sub-6', 'Mini', '4-6 años', '#22c55e'),
('sub8', 'Sub-8', 'Pre-Infantil', '7-8 años', '#3b82f6'),
('sub10', 'Sub-10', 'Infantil', '9-10 años', '#38bdf8'),
('sub12', 'Sub-12', 'Pre-Juvenil', '11-12 años', '#f59e0b'),
('sub14', 'Sub-14', 'Juvenil', '13-14 años', '#ef4444'),
('sub16', 'Sub-16', 'Cadetes', '15-16 años', '#a855f7'),
('adultos', 'Adultos', 'Honor', '17+ años', '#f5c542')
ON CONFLICT (id) DO NOTHING;

-- Habilitar Realtime para las tablas críticas
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_config;
ALTER PUBLICATION supabase_realtime ADD TABLE public.feedback;
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
