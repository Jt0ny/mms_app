-- ==========================================
-- POLÍTICAS RLS (Row Level Security)
-- ==========================================

-- Políticas para la tabla: materia_prima
ALTER TABLE public.materia_prima ENABLE ROW LEVEL SECURITY;

CREATE POLICY "materia_prima_select_authenticated"
ON public.materia_prima
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "materia_prima_insert_authenticated"
ON public.materia_prima
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "materia_prima_update_authenticated"
ON public.materia_prima
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);


-- Políticas para la tabla: materiales
ALTER TABLE public.materiales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "materiales_select_authenticated"
ON public.materiales
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "materiales_insert_authenticated"
ON public.materiales
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "materiales_update_authenticated"
ON public.materiales
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "materiales_delete_supervisor"
ON public.materiales
AS PERMISSIVE
FOR DELETE
TO authenticated
USING ((get_user_rol() = 'supervisor'::text));


-- Políticas para la tabla: recetas
ALTER TABLE public.recetas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recetas_select_authenticated"
ON public.recetas
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "recetas_insert_supervisor"
ON public.recetas
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK ((obtener_usuarios_rol() = 'supervisor'::text));

CREATE POLICY "recetas_update_supervisor"
ON public.recetas
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING ((get_user_rol() = 'supervisor'::text))
WITH CHECK ((obtener_usuarios_rol() = 'supervisor'::text));

CREATE POLICY "recetas_delete_supervisor"
ON public.recetas
AS PERMISSIVE
FOR DELETE
TO authenticated
USING ((get_user_rol() = 'supervisor'::text));


-- Políticas para la tabla: receta_materiales
ALTER TABLE public.receta_materiales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "receta_materiales_select_authenticated"
ON public.receta_materiales
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "receta_materiales_insert_supervisor"
ON public.receta_materiales
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK ((obtener_usuarios_rol() = 'supervisor'::text));

CREATE POLICY "receta_materiales_delete_supervisor"
ON public.receta_materiales
AS PERMISSIVE
FOR DELETE
TO authenticated
USING ((get_user_rol() = 'supervisor'::text));


-- Políticas para la tabla: receta_materia_prima
ALTER TABLE public.receta_materia_prima ENABLE ROW LEVEL SECURITY;

CREATE POLICY "receta_materia_prima_select_authenticated"
ON public.receta_materia_prima
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "receta_materia_prima_insert_supervisor"
ON public.receta_materia_prima
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK ((obtener_usuarios_rol() = 'supervisor'::text));

CREATE POLICY "receta_materia_prima_delete_supervisor"
ON public.receta_materia_prima
AS PERMISSIVE
FOR DELETE
TO authenticated
USING ((get_user_rol() = 'supervisor'::text));


-- Políticas para la tabla: clientes
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clientes_select_authenticated"
ON public.clientes
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "clientes_insert_supervisor"
ON public.clientes
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK ((obtener_usuarios_rol() = 'supervisor'::text));

CREATE POLICY "clientes_update_supervisor"
ON public.clientes
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING ((get_user_rol() = 'supervisor'::text))
WITH CHECK ((obtener_usuarios_rol() = 'supervisor'::text));

CREATE POLICY "clientes_delete_supervisor"
ON public.clientes
AS PERMISSIVE
FOR DELETE
TO authenticated
USING ((get_user_rol() = 'supervisor'::text));


-- Políticas para la tabla: pedidos
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pedidos_select_authenticated"
ON public.pedidos
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "pedidos_insert_supervisor"
ON public.pedidos
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK ((obtener_usuarios_rol() = 'supervisor'::text));

CREATE POLICY "pedidos_update_supervisor"
ON public.pedidos
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING ((get_user_rol() = 'supervisor'::text))
WITH CHECK ((obtener_usuarios_rol() = 'supervisor'::text));

CREATE POLICY "pedidos_delete_supervisor"
ON public.pedidos
AS PERMISSIVE
FOR DELETE
TO authenticated
USING ((get_user_rol() = 'supervisor'::text));


-- Políticas para la tabla: pedido_detalles
ALTER TABLE public.pedido_detalles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pedido_detalles_select_authenticated"
ON public.pedido_detalles
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "pedido_detalles_insert_supervisor"
ON public.pedido_detalles
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK ((obtener_usuarios_rol() = 'supervisor'::text));

CREATE POLICY "pedido_detalles_update_supervisor"
ON public.pedido_detalles
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING ((get_user_rol() = 'supervisor'::text))
WITH CHECK ((obtener_usuarios_rol() = 'supervisor'::text));

CREATE POLICY "pedido_detalles_delete_supervisor"
ON public.pedido_detalles
AS PERMISSIVE
FOR DELETE
TO authenticated
USING ((get_user_rol() = 'supervisor'::text));


-- Políticas para la tabla: mermas
ALTER TABLE public.mermas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mermas_select_authenticated"
ON public.mermas
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "mermas_delete_supervisor"
ON public.mermas
AS PERMISSIVE
FOR DELETE
TO authenticated
USING ((get_user_rol() = 'supervisor'::text));

CREATE POLICY "mermas_insert_supervisor"
ON public.mermas
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK ((obtener_usuarios_rol() = 'supervisor'::text));


-- Políticas para la tabla: producciones
ALTER TABLE public.producciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "producciones_select_authenticated"
ON public.producciones
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "producciones_insert_authenticated"
ON public.producciones
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (((operador_id = obtener_usuarios_id()) OR (operador_id IS NULL)));

CREATE POLICY "producciones_update_supervisor"
ON public.producciones
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING ((get_user_rol() = 'supervisor'::text))
WITH CHECK ((obtener_usuarios_rol() = 'supervisor'::text));

CREATE POLICY "producciones_delete_supervisor"
ON public.producciones
AS PERMISSIVE
FOR DELETE
TO authenticated
USING ((get_user_rol() = 'supervisor'::text));


-- Políticas para la tabla: produccion_detalle
ALTER TABLE public.produccion_detalle ENABLE ROW LEVEL SECURITY;

CREATE POLICY "produccion_detalle_select_authenticated"
ON public.produccion_detalle
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "produccion_detalle_insert_authenticated"
ON public.produccion_detalle
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "produccion_detalle_delete_supervisor"
ON public.produccion_detalle
AS PERMISSIVE
FOR DELETE
TO authenticated
USING ((get_user_rol() = 'supervisor'::text));


-- Políticas para la tabla: produccion_consumos
ALTER TABLE public.produccion_consumos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "produccion_consumos_select_authenticated"
ON public.produccion_consumos
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "produccion_consumos_insert_authenticated"
ON public.produccion_consumos
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (true);


-- Políticas para la tabla: planificaciones
ALTER TABLE public.planificaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "planificaciones_select_authenticated"
ON public.planificaciones
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "planificaciones_insert_supervisor"
ON public.planificaciones
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK ((obtener_usuarios_rol() = 'supervisor'::text));

CREATE POLICY "planificaciones_update_supervisor"
ON public.planificaciones
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING ((get_user_rol() = 'supervisor'::text))
WITH CHECK ((obtener_usuarios_rol() = 'supervisor'::text));

CREATE POLICY "planificaciones_delete_supervisor"
ON public.planificaciones
AS PERMISSIVE
FOR DELETE
TO authenticated
USING ((get_user_rol() = 'supervisor'::text));


-- Políticas para la tabla: planificacion_recetas
ALTER TABLE public.planificacion_recetas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "planificacion_recetas_select_authenticated"
ON public.planificacion_recetas
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "planificacion_recetas_insert_supervisor"
ON public.planificacion_recetas
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK ((obtener_usuarios_rol() = 'supervisor'::text));

CREATE POLICY "planificacion_recetas_delete_supervisor"
ON public.planificacion_recetas
AS PERMISSIVE
FOR DELETE
TO authenticated
USING ((get_user_rol() = 'supervisor'::text));


-- Políticas para la tabla: usuarios
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuarios_select_authenticated"
ON public.usuarios
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "usuarios_delete_supervisor"
ON public.usuarios
AS PERMISSIVE
FOR DELETE
TO authenticated
USING ((get_user_rol() = 'supervisor'::text));
USING ((obtener_usuarios_rol() = 'supervisor'::text));


-- Políticas para la tabla: sync_log
ALTER TABLE public.sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sync_log_select_authenticated"
ON public.sync_log
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "sync_log_insert_authenticated"
ON public.sync_log
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (true);


