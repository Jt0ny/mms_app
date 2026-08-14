-- ===========================================================================
-- ESQUEMA DE BASE DE DATOS DE ALTA NORMALIZACIÓN (CON UUIDs Y CLAVES DE TEXTO)
-- SISTEMA MMS_APP (PostgreSQL / Supabase)
-- Optimizado para integración con APIs externas (puertos 8060, 8070, 8090)
-- y consistencia de tipos en claves foráneas.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. TABLA: usuarios
-- En Supabase, si usas Supabase Auth, los usuarios se crean en el esquema 'auth'.
-- Esta tabla 'usuarios' (o 'perfiles') del esquema 'public' se enlaza mediante UUID.
-- ---------------------------------------------------------------------------
CREATE TABLE usuarios (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    nombre VARCHAR(120) NOT NULL,
    rol VARCHAR(50) NOT NULL,
    auth_user_id UUID UNIQUE,
    email VARCHAR(255) UNIQUE,
    CONSTRAINT pk_usuarios PRIMARY KEY (id),
    CONSTRAINT usuarios_auth_user_id_fkey FOREIGN KEY (auth_user_id) REFERENCES auth.users(id)
);

-- ---------------------------------------------------------------------------
-- 2. TABLA: clientes
-- Utiliza UUIDs nativos auto-generados. Relación reflexiva para vincular envíos a brokers.
-- ---------------------------------------------------------------------------
CREATE TABLE clientes (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL,              -- 'Facturación', 'Envío', 'Ambos'
    cliente_facturacion_id UUID NULL,       -- Auto-referencia usando UUID
    email VARCHAR(255) NULL,
    telefono VARCHAR(50) NULL,
    direccion VARCHAR(500) NULL,
    notas TEXT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_clientes PRIMARY KEY (id),
    CONSTRAINT fk_clientes_parent FOREIGN KEY (cliente_facturacion_id) REFERENCES clientes(id) ON DELETE SET NULL,
    CONSTRAINT uq_clientes_nombre UNIQUE (nombre),
    CONSTRAINT chk_clientes_tipo CHECK (tipo IN ('Facturación', 'Envío', 'Ambos'))
);

-- ---------------------------------------------------------------------------
-- 3. TABLA: materia_prima
-- El ID es VARCHAR(50) para ser consistente con los identificadores que
-- provienen de la API externa de producción en el puerto 8070.
-- ---------------------------------------------------------------------------
CREATE TABLE materia_prima (
    id VARCHAR(50) NOT NULL,
    variedad VARCHAR(120) NOT NULL,
    cantidad_total INT NOT NULL,
    fecha_ingreso DATE NOT NULL,
    CONSTRAINT pk_materia_prima PRIMARY KEY (id),
    CONSTRAINT uq_materia_prima_variedad UNIQUE (variedad)
);

-- ---------------------------------------------------------------------------
-- 4. TABLA: materiales
-- El ID es VARCHAR(50) para soportar los identificadores provenientes de la
-- API externa del puerto 8090.
-- ---------------------------------------------------------------------------
CREATE TABLE materiales (
    id VARCHAR(50) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    cantidad INT NOT NULL,
    descripcion VARCHAR(500) NULL,
    CONSTRAINT pk_materiales PRIMARY KEY (id),
    CONSTRAINT uq_materiales_nombre UNIQUE (nombre)
);

-- ---------------------------------------------------------------------------
-- 5. TABLA: recetas
-- Utiliza UUIDs nativos auto-generados.
-- ---------------------------------------------------------------------------
CREATE TABLE recetas (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    nombre VARCHAR(120) NOT NULL,
    categoria VARCHAR(120) NULL,
    instrucciones VARCHAR(2000) NULL,
    total_items INT NOT NULL DEFAULT 0,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_recetas PRIMARY KEY (id)
);

-- ---------------------------------------------------------------------------
-- 6. TABLA RELACIONAL: receta_materiales
-- ---------------------------------------------------------------------------
CREATE TABLE receta_materiales (
    receta_id UUID NOT NULL,
    material_id VARCHAR(50) NOT NULL,
    cantidad INT NOT NULL,
    disponible_snapshot INT NULL,
    CONSTRAINT pk_receta_materiales PRIMARY KEY (receta_id, material_id),
    CONSTRAINT fk_receta_materiales_receta FOREIGN KEY (receta_id) REFERENCES recetas (id) ON DELETE CASCADE,
    CONSTRAINT fk_receta_materiales_material FOREIGN KEY (material_id) REFERENCES materiales (id) ON DELETE RESTRICT
);

-- ---------------------------------------------------------------------------
-- 7. TABLA RELACIONAL: receta_materia_prima
-- ---------------------------------------------------------------------------
CREATE TABLE receta_materia_prima (
    receta_id UUID NOT NULL,
    materia_prima_id VARCHAR(50) NOT NULL,
    cantidad INT NOT NULL,
    disponible_snapshot INT NULL,
    CONSTRAINT pk_receta_materia_prima PRIMARY KEY (receta_id, materia_prima_id),
    CONSTRAINT fk_receta_materia_prima_receta FOREIGN KEY (receta_id) REFERENCES recetas (id) ON DELETE CASCADE,
    CONSTRAINT fk_receta_materia_prima_materia_prima FOREIGN KEY (materia_prima_id) REFERENCES materia_prima (id) ON DELETE RESTRICT
);

-- ---------------------------------------------------------------------------
-- 8. TABLA MAESTRO: pedidos
-- El ID es VARCHAR(50) debido a que provienen de la API de ventas del puerto 8060.
-- Contiene una referencia a usuarios (operador_id) para asociar el pedido.
-- ---------------------------------------------------------------------------
CREATE TABLE pedidos (
    id VARCHAR(50) NOT NULL,
    cliente_facturacion_id UUID NOT NULL, -- Relación N:1 con clientes (Broker)
    cliente_envio_id UUID NULL,           -- Relación N:1 con clientes (Destino)
    fecha_pedido DATE NOT NULL DEFAULT CURRENT_DATE,
    estado VARCHAR(50) NOT NULL DEFAULT 'Pendiente',
    operador_id UUID NULL,                -- Relación N:1 con usuarios (Operador asignado)
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_completado DATE NULL,
    CONSTRAINT pk_pedidos PRIMARY KEY (id),
    CONSTRAINT fk_pedidos_cliente_facturacion FOREIGN KEY (cliente_facturacion_id) REFERENCES clientes(id) ON DELETE RESTRICT,
    CONSTRAINT fk_pedidos_cliente_envio FOREIGN KEY (cliente_envio_id) REFERENCES clientes(id) ON DELETE RESTRICT,
    CONSTRAINT fk_pedidos_operador FOREIGN KEY (operador_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- ---------------------------------------------------------------------------
-- 9. TABLA DETALLE: pedido_detalles
-- ---------------------------------------------------------------------------
CREATE TABLE pedido_detalles (
    pedido_id VARCHAR(50) NOT NULL,
    receta_id UUID NOT NULL,
    stems INT NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    precio DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    CONSTRAINT pk_pedido_detalles PRIMARY KEY (pedido_id, receta_id),
    CONSTRAINT fk_pedido_detalles_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos (id) ON DELETE CASCADE,
    CONSTRAINT fk_pedido_detalles_receta FOREIGN KEY (receta_id) REFERENCES recetas (id) ON DELETE RESTRICT
);

-- ---------------------------------------------------------------------------
-- 10. TABLA: mermas (Con integridad referencial condicionada)
-- ---------------------------------------------------------------------------
CREATE TABLE mermas (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    fecha DATE NOT NULL,
    tipo VARCHAR(50) NOT NULL,            -- 'materia_prima', 'material', 'producto_terminado'
    material_id VARCHAR(50) NULL,
    materia_prima_id VARCHAR(50) NULL,
    receta_id UUID NULL,
    cantidad INT NOT NULL,
    motivo VARCHAR(255) NOT NULL,
    operador_id UUID NULL,                -- Relación con usuarios
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_mermas PRIMARY KEY (id),
    CONSTRAINT fk_mermas_material FOREIGN KEY (material_id) REFERENCES materiales (id) ON DELETE SET NULL,
    CONSTRAINT fk_mermas_materia_prima FOREIGN KEY (materia_prima_id) REFERENCES materia_prima (id) ON DELETE SET NULL,
    CONSTRAINT fk_mermas_receta FOREIGN KEY (receta_id) REFERENCES recetas (id) ON DELETE SET NULL,
    CONSTRAINT fk_mermas_operador FOREIGN KEY (operador_id) REFERENCES usuarios (id) ON DELETE SET NULL,
    CONSTRAINT chk_mermas_tipo CHECK (tipo IN ('materia_prima', 'material', 'producto_terminado')),
    CONSTRAINT chk_mermas_referencia_coherente CHECK (
        (tipo = 'material' AND material_id IS NOT NULL AND materia_prima_id IS NULL AND receta_id IS NULL) OR
        (tipo = 'materia_prima' AND materia_prima_id IS NOT NULL AND material_id IS NULL AND receta_id IS NULL) OR
        (tipo = 'producto_terminado' AND receta_id IS NOT NULL AND material_id IS NULL AND materia_prima_id IS NULL)
    )
);

-- ---------------------------------------------------------------------------
-- 11. TABLA: producciones
-- ---------------------------------------------------------------------------
CREATE TABLE producciones (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    fecha DATE NOT NULL,
    total INT NOT NULL,
    operador_id UUID NULL,                -- Relación con usuarios (Operador que registra)
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_producciones PRIMARY KEY (id),
    CONSTRAINT fk_producciones_operador FOREIGN KEY (operador_id) REFERENCES usuarios (id) ON DELETE SET NULL
);

-- ---------------------------------------------------------------------------
-- 12. TABLA: produccion_detalle
-- ---------------------------------------------------------------------------
CREATE TABLE produccion_detalle (
    produccion_id UUID NOT NULL,
    categoria VARCHAR(120) NOT NULL,
    cantidad INT NOT NULL,
    CONSTRAINT pk_produccion_detalle PRIMARY KEY (produccion_id, categoria),
    CONSTRAINT fk_produccion_detalle_produccion FOREIGN KEY (produccion_id) REFERENCES producciones (id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------------
-- 12b. TABLA: produccion_consumos (Consumo real descontado de materia prima y materiales)
-- ---------------------------------------------------------------------------
CREATE TABLE produccion_consumos (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    produccion_id UUID NOT NULL REFERENCES producciones(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('materia_prima', 'material')),
    materia_prima_id VARCHAR(50) REFERENCES materia_prima(id) ON DELETE SET NULL,
    material_id VARCHAR(50) REFERENCES materiales(id) ON DELETE SET NULL,
    cantidad_consumida INT NOT NULL,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_produccion_consumos PRIMARY KEY (id),
    CONSTRAINT chk_consumos_coherencia CHECK (
        (tipo = 'materia_prima' AND materia_prima_id IS NOT NULL AND material_id IS NULL) OR
        (tipo = 'material' AND material_id IS NOT NULL AND materia_prima_id IS NULL)
    )
);

-- ---------------------------------------------------------------------------
-- 13. TABLA: planificaciones
-- ---------------------------------------------------------------------------
CREATE TABLE planificaciones (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    operador_id UUID NOT NULL,
    fecha DATE NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_planificaciones PRIMARY KEY (id),
    CONSTRAINT fk_planificaciones_operador FOREIGN KEY (operador_id) REFERENCES usuarios (id) ON DELETE RESTRICT
);

-- ---------------------------------------------------------------------------
-- 14. TABLA RELACIONAL: planificacion_recetas
-- ---------------------------------------------------------------------------
CREATE TABLE planificacion_recetas (
    planificacion_id UUID NOT NULL,
    receta_id UUID NOT NULL,
    cantidad INT NOT NULL,
    CONSTRAINT pk_planificacion_recetas PRIMARY KEY (planificacion_id, receta_id),
    CONSTRAINT fk_planificacion_recetas_planificacion FOREIGN KEY (planificacion_id) REFERENCES planificaciones (id) ON DELETE CASCADE,
    CONSTRAINT fk_planificacion_recetas_receta FOREIGN KEY (receta_id) REFERENCES recetas (id) ON DELETE RESTRICT
);

-- ---------------------------------------------------------------------------
-- 15. TABLA: sync_log (Registro de sincronización)
-- ---------------------------------------------------------------------------
CREATE TABLE sync_log (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    modulo TEXT NOT NULL,
    fecha_sync DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT pk_sync_log PRIMARY KEY (id)
);

-- ===========================================================================
-- FUNCIONES RPC DE ALTO RENDIMIENTO (Añadidas durante la migración a Supabase)
-- ===========================================================================

-- Funciones migradas de: migration_rpc_produccion.sql
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
            -- Insertar detalle
            INSERT INTO produccion_detalle (produccion_id, categoria, cantidad)
            VALUES (v_produccion_id, v_detalle->>'categoria', v_cant_producida);

            -- Encontrar la receta elegible. Prioridades:
            -- 1. Planificada
            -- 2. La primera de la categoría
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


-- Funciones migradas de: migration_rpc_merma.sql
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


-- Funciones migradas de: migration_rpc_pedidos.sql
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


-- Funciones migradas de: migration_rpc_dashboard.sql
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


