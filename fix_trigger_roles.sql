-- =========================================================================
-- FIX: Actualizar el trigger de seguridad para reconocer a todos los superadmins
-- =========================================================================

CREATE OR REPLACE FUNCTION public.prevent_profile_tampering()
RETURNS TRIGGER AS $$
DECLARE
    v_caller_role TEXT;
    v_is_superadmin BOOLEAN;
BEGIN
    -- Obtenemos el rol de quien hace la petición en la base
    SELECT role INTO v_caller_role FROM public.profiles WHERE id = auth.uid();
    
    -- Verificamos si es superadmin usando la función global (que revisa admin_users)
    v_is_superadmin := public.is_superadmin();
    
    -- Si es superadmin oficial, puede hacer lo que quiera
    IF v_is_superadmin THEN
        RETURN NEW;
    END IF;

    -- Si quien llama no es superadmin, no puede alterar el rol ni los puntos de forma libre
    IF COALESCE(v_caller_role, 'player') != 'superadmin' THEN
        -- Si intentó cambiar su rol
        IF NEW.role IS DISTINCT FROM OLD.role THEN
            RAISE EXCEPTION 'VULNERABILIDAD BLOQUEADA: No tienes permiso para alterar jerarquías de roles.';
        END IF;

        -- Si intentó inyectarse puntos a sí mismo
        IF NEW.points IS DISTINCT FROM OLD.points THEN
            IF v_caller_role NOT IN ('dt') THEN
                RAISE EXCEPTION 'FRAUDE DETECTADO: Los puntos de gamificación no son editables de forma directa.';
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
