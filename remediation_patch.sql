-- =========================================================================
-- FASE 1: REMEDIACIÓN ESTRUCTURAL DE BASE DE DATOS
-- "Forjando Leyendas"
-- =========================================================================

-- 1. CORRECCIÓN DE RACE CONDITIONS EN ASISTENCIA (Idempotencia y Triggers)
-- Añadir Constraint de unicidad para evitar que guarden múltiples veces el mismo día
ALTER TABLE public.attendance 
ADD CONSTRAINT unique_attendance_per_day UNIQUE (player_id, date);

-- Remover la inyección de puntos desde UI, crear Trigger seguro:
CREATE OR REPLACE FUNCTION assign_gamification_points()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'match' THEN
        UPDATE public.profiles SET points = points + 50 WHERE id = NEW.player_id;
    ELSIF NEW.status = 'present' THEN
        UPDATE public.profiles SET points = points + 10 WHERE id = NEW.player_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_attendance_insert
AFTER INSERT ON public.attendance
FOR EACH ROW EXECUTE FUNCTION assign_gamification_points();

-- 2. CORRECCIÓN EDADES, SOFT DELETES y RELACIÓN PADRES (Perfiles)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 3. ALTA COHESIÓN: MÓDULO FINANCIERO REAL
-- Eliminar mockData en el futuro, esto registrará transacciones reales
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
    amount NUMERIC NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS en pagos (Solo admin, contadores, y dueños pueden ver)
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Contadores y Admin ven todo" 
ON public.payments FOR ALL 
USING ( auth.jwt() ->> 'role' IN ('superadmin', 'contador') );

CREATE POLICY "Padres ven pagos de hijos"
ON public.payments FOR SELECT
USING ( player_id IN (SELECT id FROM public.profiles WHERE parent_id = auth.uid()) );

-- 4. VINCULACIÓN DE ALUMNOS (Anti duplicados y Zombies)
-- Los apoderados usarán un PIN para enlazarse a un alumno en vez de crear uno paralelo.
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS link_pin TEXT UNIQUE;
