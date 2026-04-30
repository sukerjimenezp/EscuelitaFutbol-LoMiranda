-- =========================================================================
-- [HOTFIX CRÍTICO 002] production_hotfix.sql
-- Auditoría de Seguridad (Role Escalation) y Matemáticas de Gamificación
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1. PREVENCIÓN DE PRIVILEGE ESCALATION (INYECCIÓN DE ROL) EN PERFILES
-- -------------------------------------------------------------------------
-- Soluciona la vulnerabilidad donde un usuario podía usar su política UPDATE
-- permitida para cambiar su propio rol a 'superadmin' o modificar sus puntos.

CREATE OR REPLACE FUNCTION public.prevent_profile_tampering()
RETURNS TRIGGER AS $$
DECLARE
    v_caller_role TEXT;
BEGIN
    -- Obtenemos el rol de quien hace la petición en la base
    SELECT role INTO v_caller_role FROM public.profiles WHERE id = auth.uid();
    
    -- El primer admin registrado mediante Auth bypassa esto usando su JWT email.
    IF auth.jwt() ->> 'email' = 'escuelafclomiranda@gmail.com' THEN
        RETURN NEW;
    END IF;

    -- Si quien llama no es superadmin, no puede alterar el rol ni los puntos de forma libre
    IF COALESCE(v_caller_role, 'player') != 'superadmin' THEN
        -- Si intentó cambiar su rol
        IF NEW.role IS DISTINCT FROM OLD.role THEN
            RAISE EXCEPTION 'VULNERABILIDAD BLOQUEADA: No tienes permiso para alterar jerarquías de roles.';
        END IF;

        -- Si intentó inyectarse puntos a sí mismo (solo los triggers los gestionan de forma segura)
        IF NEW.points IS DISTINCT FROM OLD.points THEN
            -- NOTA: Como la asistencia (el trigger de asistenia) se jecuta como SECURITY DEFINER o como postgres,
            -- este update fallaría si el DT está loggeado y el trigger corre como él.
            -- Por lo tanto, permitiremos la suma de puntos solo si el que gatilló el update fue el sistema o un DT.
            IF v_caller_role NOT IN ('superadmin', 'dt') THEN
                RAISE EXCEPTION 'FRAUDE DETECTADO: Los puntos de gamificación no son editables de forma directa.';
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eliminamos el trigger si existe para re-emplazarlo de forma segura
DROP TRIGGER IF EXISTS trigger_prevent_profile_tampering ON public.profiles;

CREATE TRIGGER trigger_prevent_profile_tampering
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_tampering();


-- -------------------------------------------------------------------------
-- 2. GAMIFICACIÓN DE ASISTENCIA: MATEMÁTICAS EXACTAS (INSERT Y UPDATE)
-- -------------------------------------------------------------------------
-- El trigger anterior solo sumaba al hacer INSERT. Al usar UPSERT en React, 
-- cuando un DT corregía "present" a "absent", los puntos quedaban congelados.

CREATE OR REPLACE FUNCTION public.assign_gamification_points()
RETURNS TRIGGER AS $$
BEGIN
    -- Escenario 1: El registro se acaba de crear (INSERT)
    IF TG_OP = 'INSERT' THEN
        IF NEW.status = 'match' THEN
            UPDATE public.profiles SET points = COALESCE(points,0) + 50 WHERE id = NEW.player_id;
        ELSIF NEW.status = 'present' THEN
            UPDATE public.profiles SET points = COALESCE(points,0) + 10 WHERE id = NEW.player_id;
        END IF;
    
    -- Escenario 2: El DT corrió asistencia y ahora corrige su error (UPDATE)
    ELSIF TG_OP = 'UPDATE' THEN
        -- Si el estado NO cambió, no hacer cálculos innecesarios
        IF NEW.status = OLD.status THEN
            RETURN NEW;
        END IF;

        -- 2.1 Reversar los puntos que se le habían dado en el estado anterior
        IF OLD.status = 'match' THEN
            UPDATE public.profiles SET points = GREATEST(COALESCE(points,0) - 50, 0) WHERE id = NEW.player_id;
        ELSIF OLD.status = 'present' THEN
            UPDATE public.profiles SET points = GREATEST(COALESCE(points,0) - 10, 0) WHERE id = NEW.player_id;
        END IF;

        -- 2.2 Aplicar los nuevos puntos correspondientes al estado corregido
        IF NEW.status = 'match' THEN
            UPDATE public.profiles SET points = COALESCE(points,0) + 50 WHERE id = NEW.player_id;
        ELSIF NEW.status = 'present' THEN
            UPDATE public.profiles SET points = COALESCE(points,0) + 10 WHERE id = NEW.player_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reemplazamos el trigger atado al evento posterior (AFTER)
DROP TRIGGER IF EXISTS after_attendance_insert ON public.attendance;
DROP TRIGGER IF EXISTS after_attendance_upsert ON public.attendance;

CREATE TRIGGER after_attendance_upsert
AFTER INSERT OR UPDATE ON public.attendance
FOR EACH ROW EXECUTE FUNCTION public.assign_gamification_points();

-- FIN DEL HOTFIX
