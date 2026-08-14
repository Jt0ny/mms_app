CREATE OR REPLACE FUNCTION rpc_sincronizar_pedidos(payload_pedidos JSONB, payload_detalles JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;
