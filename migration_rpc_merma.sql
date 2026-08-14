CREATE OR REPLACE FUNCTION rpc_registrar_merma(payload_merma JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;
