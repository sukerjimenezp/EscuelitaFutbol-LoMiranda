-- Solución al error de RLS al guardar movimientos financieros
-- Esto reemplaza la política defectuosa que buscaba el rol en el JWT,
-- y ahora correctamente busca el rol del usuario en la tabla profiles.

DROP POLICY IF EXISTS "Contadores y Admin ven todo" ON public.payments;

CREATE POLICY "Contadores y Admin ven todo" 
ON public.payments FOR ALL 
USING ( 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('superadmin', 'contador') 
)
WITH CHECK ( 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('superadmin', 'contador') 
);
