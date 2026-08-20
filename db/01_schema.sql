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

