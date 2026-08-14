-- Migración para crear la tabla sync_log

CREATE TABLE IF NOT EXISTS public.sync_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    modulo TEXT NOT NULL,
    fecha_sync DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Asegurarse de que no haya duplicados (un mismo módulo sincronizado múltiples veces el mismo día)
CREATE UNIQUE INDEX IF NOT EXISTS idx_sync_log_modulo_fecha ON public.sync_log(modulo, fecha_sync);

-- RLS (Row Level Security) - Permitir lectura y escritura a usuarios autenticados
ALTER TABLE public.sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura a autenticados" 
ON public.sync_log FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Permitir inserción a autenticados" 
ON public.sync_log FOR INSERT 
TO authenticated 
WITH CHECK (true);
