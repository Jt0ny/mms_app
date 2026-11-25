-- ==========================================
-- FUNCIONES RPC Y TRIGGERS
-- ==========================================

-- Function: obtener_usuarios_rol
CREATE OR REPLACE FUNCTION public.obtener_usuarios_rol()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT rol FROM public.usuarios WHERE auth_user_id = auth.uid();
$function$


-- Function: obtener_usuarios_id
CREATE OR REPLACE FUNCTION public.obtener_usuarios_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT id FROM public.usuarios WHERE auth_user_id = auth.uid();
$function$


-- Function: rpc_desactivar_usuario
CREATE OR REPLACE FUNCTION public.rpc_desactivar_usuario(usuario_id_a_dar_de_baja uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_auth_id uuid;
BEGIN
    -- 1. Obtener el ID de autenticación del usuario
    SELECT auth_user_id INTO v_auth_id FROM public.usuarios WHERE id = usuario_id_a_dar_de_baja;
    
    -- 2. Marcar al usuario como inactivo en la tabla pública
    UPDATE public.usuarios SET activo = false WHERE id = usuario_id_a_dar_de_baja;
    
    -- 3. Borrar completamente sus credenciales de acceso en Supabase Auth
    IF v_auth_id IS NOT NULL THEN
        DELETE FROM auth.users WHERE id = v_auth_id;
    END IF;
END;
$function$


-- Function: rpc_cambiar_contrasena_usuario
CREATE OR REPLACE FUNCTION public.rpc_cambiar_contrasena_usuario(
    p_usuario_id uuid,
    p_nueva_contrasena text
)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, extensions, pg_temp
AS $function$
DECLARE
    v_auth_id uuid;
BEGIN
    -- 1. Verificar que quien ejecuta la función tenga rol de supervisor
    IF public.obtener_usuarios_rol() IS DISTINCT FROM 'supervisor' THEN
        RAISE EXCEPTION 'No autorizado: Solo supervisores pueden cambiar contraseñas';
    END IF;

    -- 2. Validar longitud mínima de contraseña (estándar de Supabase Auth: 6 caracteres)
    IF p_nueva_contrasena IS NULL OR char_length(trim(p_nueva_contrasena)) < 6 THEN
        RAISE EXCEPTION 'La contraseña debe tener al menos 6 caracteres';
    END IF;

    -- 3. Obtener el auth_user_id del usuario activo
    SELECT auth_user_id INTO v_auth_id
    FROM public.usuarios
    WHERE id = p_usuario_id AND activo = true;

    IF v_auth_id IS NULL THEN
        RAISE EXCEPTION 'El usuario no existe o no tiene cuenta de autenticación activa';
    END IF;

    -- 4. Actualizar la contraseña encriptada en Supabase Auth (bcrypt)
    UPDATE auth.users
    SET encrypted_password = extensions.crypt(p_nueva_contrasena, extensions.gen_salt('bf')),
        updated_at = now()
    WHERE id = v_auth_id;
END;
$function$



-- Function: rpc_registrar_merma
CREATE OR REPLACE FUNCTION public.rpc_registrar_merma(payload_merma jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_merma_id UUID;
    v_tipo TEXT;
    v_ref_id TEXT;
    v_cantidad INTEGER;
    v_receta_id UUID;
    v_rm RECORD;
    v_mat RECORD;
BEGIN
    v_tipo := payload_merma->>'tipo';
    v_ref_id := payload_merma->>'referenciaId';
    v_cantidad := (payload_merma->>'cantidad')::INTEGER;

    -- 1. Insertar la merma directamente
    INSERT INTO mermas (fecha, tipo, material_id, materia_prima_id, receta_id, cantidad, operador_id, motivo)
    VALUES (
        (payload_merma->>'fecha')::DATE,
        v_tipo,
        CASE WHEN v_tipo = 'material' THEN v_ref_id ELSE NULL END,
        CASE WHEN v_tipo = 'materia_prima' THEN v_ref_id ELSE NULL END,
        CASE WHEN v_tipo = 'producto_terminado' THEN v_ref_id::UUID ELSE NULL END,
        v_cantidad,
        NULLIF(payload_merma->>'operadorId', '')::UUID,
        payload_merma->>'motivo'
    ) RETURNING id INTO v_merma_id;

    -- 2. Descontar stock atómicamente
    IF v_tipo = 'materia_prima' THEN
        UPDATE materia_prima 
        SET cantidad_total = GREATEST(0, COALESCE(cantidad_total, 0) - v_cantidad)
        WHERE id = v_ref_id;
        
    ELSIF v_tipo = 'material' THEN
        UPDATE materiales 
        SET cantidad = GREATEST(0, COALESCE(cantidad, 0) - v_cantidad)
        WHERE id = v_ref_id;
        
    ELSIF v_tipo = 'producto_terminado' THEN
        v_receta_id := v_ref_id::UUID;
        
        -- Descontar materia prima
        FOR v_rm IN SELECT materia_prima_id, cantidad FROM receta_materia_prima WHERE receta_id = v_receta_id LOOP
            UPDATE materia_prima 
            SET cantidad_total = GREATEST(0, COALESCE(cantidad_total, 0) - (v_rm.cantidad * v_cantidad))
            WHERE id = v_rm.materia_prima_id::TEXT;
        END LOOP;
        
        -- Descontar materiales
        FOR v_mat IN SELECT material_id, cantidad FROM receta_materiales WHERE receta_id = v_receta_id LOOP
            UPDATE materiales 
            SET cantidad = GREATEST(0, COALESCE(cantidad, 0) - (v_mat.cantidad * v_cantidad))
            WHERE id = v_mat.material_id::TEXT;
        END LOOP;
    END IF;

    RETURN jsonb_build_object('success', true, 'merma_id', v_merma_id);
EXCEPTION WHEN OTHERS THEN
    RAISE;
END;
$function$


-- Function: rpc_sincronizar_pedidos
CREATE OR REPLACE FUNCTION public.rpc_sincronizar_pedidos(payload_pedidos jsonb, payload_detalles jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_pedido JSONB;
    v_detalle JSONB;
BEGIN
    -- 1. Upsert pedidos
    FOR v_pedido IN SELECT * FROM jsonb_array_elements(payload_pedidos)
    LOOP
        INSERT INTO pedidos (id, cliente_facturacion_id, cliente_envio_id, fecha_pedido, estado)
        VALUES (
            v_pedido->>'id',
            (v_pedido->>'cliente_facturacion_id')::UUID,
            NULLIF(v_pedido->>'cliente_envio_id', '')::UUID,
            (v_pedido->>'fecha_pedido')::DATE,
            v_pedido->>'estado'
        )
        ON CONFLICT (id) DO UPDATE SET
            cliente_facturacion_id = EXCLUDED.cliente_facturacion_id,
            cliente_envio_id = EXCLUDED.cliente_envio_id,
            fecha_pedido = EXCLUDED.fecha_pedido,
            estado = EXCLUDED.estado;
    END LOOP;

    -- 2. Eliminar detalles existentes para los pedidos del payload
    DELETE FROM pedido_detalles 
    WHERE pedido_id IN (
        SELECT value->>'id' FROM jsonb_array_elements(payload_pedidos)
    );

    -- 3. Insertar nuevos detalles
    FOR v_detalle IN SELECT * FROM jsonb_array_elements(payload_detalles)
    LOOP
        INSERT INTO pedido_detalles (pedido_id, receta_id, stems, cantidad, precio)
        VALUES (
            v_detalle->>'pedido_id',
            (v_detalle->>'receta_id')::UUID,
            (v_detalle->>'stems')::INTEGER,
            (v_detalle->>'cantidad')::INTEGER,
            (v_detalle->>'precio')::NUMERIC
        );
    END LOOP;

    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RAISE;
END;
$function$


-- Function: rpc_obtener_kpis_dashboard
CREATE OR REPLACE FUNCTION public.rpc_obtener_kpis_dashboard(
    p_fecha date,
    p_umbral_tallos integer DEFAULT 200,
    p_umbral_materiales integer DEFAULT 200
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_total_pedidos_stems INTEGER := 0;
    v_total_mermas_stems INTEGER := 0;
    v_total_procesado_stems INTEGER := 0;
    v_total_planificado_stems INTEGER := 0;
    v_pedidos_count INTEGER := 0;
    
    v_estado_pedidos JSONB;
    v_avance_operadores JSONB;
    v_mermas_motivos JSONB;
    v_top_mermas_insumos JSONB;
    v_alertas_stock JSONB := '[]'::jsonb;
BEGIN
    -- 1. totalPedidosStems & estadoPedidos & pedidos_count
    WITH pedidos_filtrados AS (
        SELECT p.id, p.estado, p.fecha_pedido, c.nombre AS cliente_facturacion,
            COALESCE(SUM(pd.stems), 0)::INTEGER AS total_stems
        FROM pedidos p
        LEFT JOIN clientes c ON c.id = p.cliente_facturacion_id
        LEFT JOIN pedido_detalles pd ON pd.pedido_id = p.id
        WHERE p.estado = 'Pendiente' 
           OR (p.fecha_completado = p_fecha AND p.estado = 'Completado')
           OR (p.fecha_pedido = p_fecha AND p.estado = 'Completado')
        GROUP BY p.id, p.estado, p.fecha_pedido, c.nombre
    )
    SELECT 
        COALESCE(SUM(total_stems), 0)::INTEGER,
        COUNT(*)::INTEGER,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', id,
                    'clienteFacturacion', COALESCE(cliente_facturacion, 'Desconocido'),
                    'estado', CASE WHEN estado = 'Pendiente' AND fecha_pedido < p_fecha THEN 'Atrasado' ELSE estado END,
                    'stems', total_stems
                ) ORDER BY 
                    CASE 
                        WHEN (CASE WHEN estado = 'Pendiente' AND fecha_pedido < p_fecha THEN 'Atrasado' ELSE estado END) = 'Atrasado' THEN 0 
                        WHEN estado = 'Pendiente' THEN 1 
                        ELSE 2 
                    END
            ), 
            '[]'::jsonb
        )
    INTO v_total_pedidos_stems, v_pedidos_count, v_estado_pedidos
    FROM pedidos_filtrados;

    -- 2. totalMermasStems, mermasMotivos, topMermasInsumos
    -- Total mermas stems (tipo = materia_prima)
    SELECT COALESCE(SUM(cantidad), 0)::INTEGER INTO v_total_mermas_stems
    FROM mermas WHERE fecha = p_fecha AND tipo = 'materia_prima';

    -- mermasMotivos
    WITH motivos AS (
        SELECT COALESCE(motivo, 'Otro') as mot, SUM(cantidad) as cant
        FROM mermas WHERE fecha = p_fecha
        GROUP BY COALESCE(motivo, 'Otro')
    ), total_mermas AS (
        SELECT SUM(cant) as total FROM motivos
    )
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'motivo', mot,
                'porcentaje', CASE WHEN t.total > 0 THEN ROUND((cant * 100.0) / t.total) ELSE 0 END
            ) ORDER BY cant DESC
        ),
        '[]'::jsonb
    ) INTO v_mermas_motivos
    FROM motivos CROSS JOIN total_mermas t;

    -- topMermasInsumos
    WITH insumos AS (
        SELECT 
            CASE 
                WHEN m.tipo = 'materia_prima' THEN COALESCE(mp.variedad, 'Flor Desconocida')
                WHEN m.tipo = 'material' THEN COALESCE(mat.nombre, 'Material Desconocido')
                WHEN m.tipo = 'producto_terminado' THEN COALESCE(r.nombre, 'Producto Desconocido')
            END AS nombre_insumo,
            SUM(m.cantidad) AS cant,
            CASE 
                WHEN m.tipo = 'materia_prima' THEN 'tallos'
                WHEN m.tipo = 'material' THEN 'unidades'
                WHEN m.tipo = 'producto_terminado' THEN 'ramos'
            END AS unidad
        FROM mermas m
        LEFT JOIN materia_prima mp ON mp.id = m.materia_prima_id
        LEFT JOIN materiales mat ON mat.id = m.material_id
        LEFT JOIN recetas r ON r.id = m.receta_id
        WHERE m.fecha = p_fecha
        GROUP BY nombre_insumo, unidad
    )
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object('nombre', nombre_insumo, 'cantidad', cant, 'unidad', unidad)
            ORDER BY cant DESC
        ), '[]'::jsonb
    ) INTO v_top_mermas_insumos
    FROM (SELECT * FROM insumos ORDER BY cant DESC LIMIT 5) sub;

    -- 3. avanceOperadores y suma total de produccion y planificacion
    WITH plan_ops AS (
        SELECT p.operador_id, COALESCE(u.nombre, 'Operador') as nombre,
               COALESCE(SUM(pr.cantidad), 0) as planificado
        FROM planificaciones p
        LEFT JOIN usuarios u ON u.id = p.operador_id
        LEFT JOIN planificacion_recetas pr ON pr.planificacion_id = p.id
        WHERE p.fecha = p_fecha
        GROUP BY p.operador_id, u.nombre
    ), prod_ops AS (
        SELECT operador_id, COALESCE(SUM(total), 0) as producido
        FROM producciones
        WHERE fecha = p_fecha
        GROUP BY operador_id
    ), ops_list AS (
        SELECT 
            COALESCE(p.operador_id, pr.operador_id) as op_id,
            COALESCE(p.nombre, 'Operador Extra') as nombre,
            COALESCE(p.planificado, 0) as planificado,
            COALESCE(pr.producido, 0) as producido
        FROM plan_ops p
        FULL OUTER JOIN prod_ops pr ON pr.operador_id = p.operador_id
    )
    SELECT 
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'operadorId', op_id,
                    'nombre', nombre,
                    'planificado', planificado,
                    'producido', producido,
                    'porcentaje', CASE 
                                    WHEN planificado > 0 THEN LEAST(100, ROUND((producido * 100.0) / planificado))
                                    WHEN producido > 0 THEN 100
                                    ELSE 0 
                                  END
                )
            ), '[]'::jsonb
        ),
        COALESCE(SUM(producido), 0)::INTEGER,
        COALESCE(SUM(planificado), 0)::INTEGER
    INTO v_avance_operadores, v_total_procesado_stems, v_total_planificado_stems
    FROM ops_list;

    -- 4. Alertas Stock
    WITH demanda_mp AS (
        SELECT rmp.materia_prima_id as id, SUM(rmp.cantidad * pr.cantidad) as total_req
        FROM planificaciones p
        JOIN planificacion_recetas pr ON pr.planificacion_id = p.id
        JOIN receta_materia_prima rmp ON rmp.receta_id = pr.receta_id
        WHERE p.fecha = p_fecha
        GROUP BY rmp.materia_prima_id
    ), demanda_mat AS (
        SELECT rm.material_id as id, SUM(rm.cantidad * pr.cantidad) as total_req
        FROM planificaciones p
        JOIN planificacion_recetas pr ON pr.planificacion_id = p.id
        JOIN receta_materiales rm ON rm.receta_id = pr.receta_id
        WHERE p.fecha = p_fecha
        GROUP BY rm.material_id
    ), pre_alertas AS (
        SELECT jsonb_build_object(
            'tipo', 'error',
            'texto', 'Inventario Insuficiente: Se requieren ' || d.total_req || ' tallos de flor "' || COALESCE(mp.variedad, 'Desconocida') || '" para cubrir la planificación de hoy, pero solo cuentas con ' || COALESCE(mp.cantidad_total, 0) || ' tallos en stock (Déficit: ' || (d.total_req - COALESCE(mp.cantidad_total, 0)) || ' tallos).'
        ) as alerta
        FROM demanda_mp d
        LEFT JOIN materia_prima mp ON mp.id = d.id
        WHERE COALESCE(mp.cantidad_total, 0) < d.total_req

        UNION ALL

        SELECT jsonb_build_object(
            'tipo', 'error',
            'texto', 'Inventario Insuficiente: Se requieren ' || d.total_req || ' unidades de "' || COALESCE(mat.nombre, 'Desconocido') || '" para la producción de hoy, pero solo tienes ' || COALESCE(mat.cantidad, 0) || ' en inventario (Déficit: ' || (d.total_req - COALESCE(mat.cantidad, 0)) || ' unidades).'
        ) as alerta
        FROM demanda_mat d
        LEFT JOIN materiales mat ON mat.id = d.id
        WHERE COALESCE(mat.cantidad, 0) < d.total_req

        UNION ALL

        SELECT jsonb_build_object(
            'tipo', 'info',
            'texto', 'Alerta de Reabastecimiento: La variedad de rosa "' || variedad || '" cuenta con stock mínimo de ' || cantidad_total || ' tallos.'
        ) as alerta
        FROM materia_prima 
        WHERE cantidad_total < p_umbral_tallos
          AND id NOT IN (SELECT d.id FROM demanda_mp d LEFT JOIN materia_prima mp2 ON mp2.id = d.id WHERE COALESCE(mp2.cantidad_total, 0) < d.total_req)

        UNION ALL

        SELECT jsonb_build_object(
            'tipo', 'info',
            'texto', 'Alerta de Reabastecimiento: El material "' || nombre || '" cuenta con stock bajo de ' || cantidad || ' unidades.'
        ) as alerta
        FROM materiales 
        WHERE cantidad < p_umbral_materiales
          AND id NOT IN (SELECT d.id FROM demanda_mat d LEFT JOIN materiales mat2 ON mat2.id = d.id WHERE COALESCE(mat2.cantidad, 0) < d.total_req)
    )
    SELECT COALESCE(jsonb_agg(alerta), '[]'::jsonb) INTO v_alertas_stock FROM pre_alertas;

    IF v_estado_pedidos IS NULL THEN v_estado_pedidos := '[]'::jsonb; END IF;
    IF v_mermas_motivos IS NULL THEN v_mermas_motivos := '[]'::jsonb; END IF;
    IF v_top_mermas_insumos IS NULL THEN v_top_mermas_insumos := '[]'::jsonb; END IF;
    IF v_avance_operadores IS NULL THEN v_avance_operadores := '[]'::jsonb; END IF;
    IF v_alertas_stock IS NULL THEN v_alertas_stock := '[]'::jsonb; END IF;

    -- Return full payload
    RETURN jsonb_build_object(
        'kpis', jsonb_build_object(
            'totalProcesadoStems', v_total_procesado_stems,
            'totalPlanificadoStems', v_total_planificado_stems,
            'demandaStems', v_total_pedidos_stems,
            'demandaPedidosCount', v_pedidos_count,
            'totalAlertasStock', jsonb_array_length(v_alertas_stock),
            'totalPedidosStems', v_total_pedidos_stems,
            'totalMermasStems', v_total_mermas_stems
        ),
        'avanceOperadores', v_avance_operadores,
        'mermasMotivos', v_mermas_motivos,
        'topMermasInsumos', v_top_mermas_insumos,
        'alertasStock', v_alertas_stock,
        'estadoPedidos', v_estado_pedidos
    );
END;
$function$


-- Function: rpc_registrar_produccion
CREATE OR REPLACE FUNCTION public.rpc_registrar_produccion(payload_produccion jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_produccion_id UUID;
    v_detalle JSONB;
    v_cant_producida INTEGER;
    v_receta_id UUID;
    v_rm RECORD;
    v_mat RECORD;
    
    v_mp_consumo JSONB := '{}'::jsonb;
    v_mat_consumo JSONB := '{}'::jsonb;
    
    v_k TEXT;
    v_v NUMERIC;
    
    v_mp_id TEXT;
    v_mat_id TEXT;
    v_current_stock NUMERIC;
BEGIN
    -- 1. Insertar cabecera de producción
    INSERT INTO producciones (fecha, total, operador_id)
    VALUES (
        (payload_produccion->>'fecha')::DATE,
        (payload_produccion->>'total')::INTEGER,
        NULLIF(payload_produccion->>'operadorId', '')::UUID
    )
    RETURNING id INTO v_produccion_id;

    -- 2. Procesar detalles
    FOR v_detalle IN SELECT * FROM jsonb_array_elements(payload_produccion->'detalle')
    LOOP
        v_cant_producida := (v_detalle->>'cantidad')::INTEGER;
        
        IF v_cant_producida > 0 THEN
            -- Insertar detalle (usando ON CONFLICT para sumar si enviamos varias recetas de la misma categoría)
            INSERT INTO produccion_detalle (produccion_id, categoria, cantidad)
            VALUES (v_produccion_id, v_detalle->>'categoria', v_cant_producida)
            ON CONFLICT (produccion_id, categoria) 
            DO UPDATE SET cantidad = produccion_detalle.cantidad + EXCLUDED.cantidad;

            -- Encontrar la receta elegible. Prioridades:
            -- 1. Si enviaron receta_id, la usamos
            IF v_detalle->>'receta_id' IS NOT NULL THEN
                v_receta_id := (v_detalle->>'receta_id')::UUID;
            ELSE
                -- 2. Planificada
                -- 3. La primera de la categoría
                SELECT r.id INTO v_receta_id
                FROM recetas r
                LEFT JOIN planificacion_recetas pr ON pr.receta_id = r.id AND pr.planificacion_id IN (
                    SELECT id FROM planificaciones WHERE operador_id = NULLIF(payload_produccion->>'operadorId', '')::UUID AND fecha = (payload_produccion->>'fecha')::DATE
                )
                WHERE LOWER(TRIM(r.categoria)) = LOWER(TRIM(v_detalle->>'categoria'))
                ORDER BY 
                    CASE WHEN pr.planificacion_id IS NOT NULL THEN 0 ELSE 1 END,
                    r.fecha_creacion ASC
                LIMIT 1;
            END IF;

            IF v_receta_id IS NOT NULL THEN
                -- Procesar materia prima
                FOR v_rm IN SELECT materia_prima_id, cantidad FROM receta_materia_prima WHERE receta_id = v_receta_id
                LOOP
                    -- acumular en JSON
                    v_mp_consumo := jsonb_set(
                        v_mp_consumo, 
                        ARRAY[v_rm.materia_prima_id::TEXT], 
                        to_jsonb(COALESCE((v_mp_consumo->>v_rm.materia_prima_id::TEXT)::NUMERIC, 0) + (v_rm.cantidad * v_cant_producida))
                    );
                    -- Insertar consumo
                    INSERT INTO produccion_consumos (produccion_id, tipo, materia_prima_id, material_id, cantidad_consumida)
                    VALUES (v_produccion_id, 'materia_prima', v_rm.materia_prima_id, NULL, v_rm.cantidad * v_cant_producida);
                END LOOP;

                -- Procesar materiales
                FOR v_mat IN SELECT material_id, cantidad FROM receta_materiales WHERE receta_id = v_receta_id
                LOOP
                    v_mat_consumo := jsonb_set(
                        v_mat_consumo, 
                        ARRAY[v_mat.material_id::TEXT], 
                        to_jsonb(COALESCE((v_mat_consumo->>v_mat.material_id::TEXT)::NUMERIC, 0) + (v_mat.cantidad * v_cant_producida))
                    );
                    -- Insertar consumo
                    INSERT INTO produccion_consumos (produccion_id, tipo, materia_prima_id, material_id, cantidad_consumida)
                    VALUES (v_produccion_id, 'material', NULL, v_mat.material_id, v_mat.cantidad * v_cant_producida);
                END LOOP;
            END IF;
        END IF;
    END LOOP;

    -- 3. Descontar stock acumulado
    -- Materia prima
    FOR v_k, v_v IN SELECT * FROM jsonb_each_text(v_mp_consumo)
    LOOP
        v_mp_id := v_k;
        
        SELECT cantidad_total INTO v_current_stock FROM materia_prima WHERE id = v_mp_id FOR UPDATE;
        
        UPDATE materia_prima 
        SET cantidad_total = GREATEST(0, v_current_stock - v_v) 
        WHERE id = v_mp_id;
    END LOOP;

    -- Materiales
    FOR v_k, v_v IN SELECT * FROM jsonb_each_text(v_mat_consumo)
    LOOP
        v_mat_id := v_k;
        
        SELECT cantidad INTO v_current_stock FROM materiales WHERE id = v_mat_id FOR UPDATE;
        
        UPDATE materiales 
        SET cantidad = GREATEST(0, v_current_stock - v_v) 
        WHERE id = v_mat_id;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'produccion_id', v_produccion_id);
EXCEPTION WHEN OTHERS THEN
    RAISE;
END;
$function$


