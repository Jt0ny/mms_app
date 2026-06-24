-- ===========================================================================
-- PROTOTIPO DE BASE DE DATOS (OPCIÓN A: RELACIÓN DIRECTA PLANA)
-- SISTEMA MMS_APP (PostgreSQL / Supabase)
-- Optimizado para Ingeniería Inversa en PowerDesigner
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. TABLA: usuarios
-- ---------------------------------------------------------------------------
CREATE TABLE usuarios (
    id VARCHAR(50) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    contrasena VARCHAR(255) NOT NULL,
    rol VARCHAR(50) NOT NULL,
    CONSTRAINT pk_usuarios PRIMARY KEY (id)
);

-- ---------------------------------------------------------------------------
-- 2. TABLA: clientes
-- Permite estructurar tanto los brokers de facturación como los puntos de envío.
-- Se asocian mediante el campo 'cliente_facturacion_id' en una relación reflexiva.
-- ---------------------------------------------------------------------------
CREATE TABLE clientes (
    id VARCHAR(50) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL,              -- 'Facturación', 'Envío', 'Ambos'
    cliente_facturacion_id VARCHAR(50) NULL, -- Auto-referencia para vincular un envío con su facturador
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
-- ---------------------------------------------------------------------------
CREATE TABLE recetas (
    id VARCHAR(50) NOT NULL,
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
    receta_id VARCHAR(50) NOT NULL,
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
    receta_id VARCHAR(50) NOT NULL,
    materia_prima_id VARCHAR(50) NOT NULL,
    cantidad INT NOT NULL,
    disponible_snapshot INT NULL,
    CONSTRAINT pk_receta_materia_prima PRIMARY KEY (receta_id, materia_prima_id),
    CONSTRAINT fk_receta_materia_prima_receta FOREIGN KEY (receta_id) REFERENCES recetas (id) ON DELETE CASCADE,
    CONSTRAINT fk_receta_materia_prima_materia_prima FOREIGN KEY (materia_prima_id) REFERENCES materia_prima (id) ON DELETE RESTRICT
);

-- ---------------------------------------------------------------------------
-- 8. TABLA: pedidos (Opción A: Estructura Plana)
-- En este modelo, cada registro de pedido representa directamente una categoría
-- o receta y se vincula a su cliente e id de receta correspondiente.
-- ---------------------------------------------------------------------------
CREATE TABLE pedidos (
    id VARCHAR(50) NOT NULL,
    cliente_facturacion_id VARCHAR(50) NOT NULL, -- Broker que paga
    cliente_envio_id VARCHAR(50) NULL,           -- Destinatario (opcional)
    receta_id VARCHAR(50) NULL,                  -- Relación directa con receta
    categoria VARCHAR(120) NOT NULL,             -- Categoría del ramo
    stems INT NOT NULL,                          -- Cantidad de tallos
    fecha_pedido DATE NOT NULL DEFAULT CURRENT_DATE,
    estado VARCHAR(50) NOT NULL DEFAULT 'Pendiente',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_pedidos PRIMARY KEY (id),
    CONSTRAINT fk_pedidos_cliente_facturacion FOREIGN KEY (cliente_facturacion_id) REFERENCES clientes(id) ON DELETE RESTRICT,
    CONSTRAINT fk_pedidos_cliente_envio FOREIGN KEY (cliente_envio_id) REFERENCES clientes(id) ON DELETE RESTRICT,
    CONSTRAINT fk_pedidos_receta FOREIGN KEY (receta_id) REFERENCES recetas(id) ON DELETE SET NULL
);

-- ---------------------------------------------------------------------------
-- 9. TABLA: mermas (Con integridad referencial condicionada)
-- Registra pérdidas de stock para cualquier recurso (material, flor o receta/producto).
-- La restricción CHECK garantiza que solo se registre la referencia correspondiente al tipo.
-- ---------------------------------------------------------------------------
CREATE TABLE mermas (
    id VARCHAR(50) NOT NULL,
    fecha DATE NOT NULL,
    tipo VARCHAR(50) NOT NULL,            -- 'materia_prima', 'material', 'producto_terminado'
    material_id VARCHAR(50) NULL,
    materia_prima_id VARCHAR(50) NULL,
    receta_id VARCHAR(50) NULL,
    cantidad INT NOT NULL,
    motivo VARCHAR(255) NOT NULL,
    operador_id VARCHAR(50) NULL,         -- Relación con usuarios
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
-- 10. TABLA: producciones
-- ---------------------------------------------------------------------------
CREATE TABLE producciones (
    id VARCHAR(50) NOT NULL,
    fecha DATE NOT NULL,
    total INT NOT NULL,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_producciones PRIMARY KEY (id)
);

-- ---------------------------------------------------------------------------
-- 11. TABLA: produccion_detalle
-- ---------------------------------------------------------------------------
CREATE TABLE produccion_detalle (
    produccion_id VARCHAR(50) NOT NULL,
    categoria VARCHAR(120) NOT NULL,
    cantidad INT NOT NULL,
    CONSTRAINT pk_produccion_detalle PRIMARY KEY (produccion_id, categoria),
    CONSTRAINT fk_produccion_detalle_produccion FOREIGN KEY (produccion_id) REFERENCES producciones (id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------------
-- 12. TABLA: planificaciones
-- ---------------------------------------------------------------------------
CREATE TABLE planificaciones (
    id VARCHAR(50) NOT NULL,
    operador_id VARCHAR(50) NOT NULL,
    fecha DATE NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_planificaciones PRIMARY KEY (id),
    CONSTRAINT fk_planificaciones_operador FOREIGN KEY (operador_id) REFERENCES usuarios (id) ON DELETE RESTRICT
);

-- ---------------------------------------------------------------------------
-- 13. TABLA RELACIONAL: planificacion_recetas
-- ---------------------------------------------------------------------------
CREATE TABLE planificacion_recetas (
    planificacion_id VARCHAR(50) NOT NULL,
    receta_id VARCHAR(50) NOT NULL,
    cantidad INT NOT NULL,
    CONSTRAINT pk_planificacion_recetas PRIMARY KEY (planificacion_id, receta_id),
    CONSTRAINT fk_planificacion_recetas_planificacion FOREIGN KEY (planificacion_id) REFERENCES planificaciones (id) ON DELETE CASCADE,
    CONSTRAINT fk_planificacion_recetas_receta FOREIGN KEY (receta_id) REFERENCES recetas (id) ON DELETE RESTRICT
);
