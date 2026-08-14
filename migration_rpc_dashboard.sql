CREATE OR REPLACE FUNCTION rpc_obtener_kpis_dashboard(p_fecha DATE)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_pedidos_stems INTEGER := 0;
    v_total_mermas_stems INTEGER := 0;
    
    v_estado_pedidos JSONB;
    v_avance_operadores JSONB;
    v_mermas_motivos JSONB;
    v_top_mermas_insumos JSONB;
    v_alertas_stock JSONB := '[]'::jsonb;
BEGIN
    -- 1. totalPedidosStems & estadoPedidos
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
    INTO v_total_pedidos_stems, v_estado_pedidos
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

    -- 3. avanceOperadores
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
    SELECT COALESCE(
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
    ) INTO v_avance_operadores
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
        WHERE cantidad_total < 200 
          AND id NOT IN (SELECT d.id FROM demanda_mp d LEFT JOIN materia_prima mp2 ON mp2.id = d.id WHERE COALESCE(mp2.cantidad_total, 0) < d.total_req)

        UNION ALL

        SELECT jsonb_build_object(
            'tipo', 'info',
            'texto', 'Alerta de Reabastecimiento: El material "' || nombre || '" cuenta con stock bajo de ' || cantidad || ' unidades.'
        ) as alerta
        FROM materiales 
        WHERE cantidad < 200
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
$$;
