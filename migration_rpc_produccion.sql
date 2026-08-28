CREATE OR REPLACE FUNCTION rpc_registrar_produccion(payload_produccion JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;
