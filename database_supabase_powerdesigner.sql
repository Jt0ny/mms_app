-- ===========================================================================
-- PROTOTIPO DE BASE DE DATOS - SISTEMA MMS_APP (PostgreSQL / Supabase)
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
-- ---------------------------------------------------------------------------
CREATE TABLE clientes (
    id VARCHAR(50) NOT NULL,
    nombre_facturacion VARCHAR(255) NOT NULL, -- BILL CUSTOMER
    nombre_envio VARCHAR(255) NULL,         -- SHIP CUSTOMER
    direccion_facturacion VARCHAR(500) NULL,
    direccion_envio VARCHAR(500) NULL,
    email VARCHAR(255) NULL,
    telefono VARCHAR(50) NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_clientes PRIMARY KEY (id)
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
    categoria VARCHAR(120) NULL, -- Categoría a la que pertenece la receta (ej. Bouquets, Roses)
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


-- ===========================================================================
-- OPCIÓN B: DISEÑO RELACIONAL NORMALIZADO (RECOMENDADO PARA LA TESIS)
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 8. TABLA: pedidos (Cabecera / Maestro)
-- ---------------------------------------------------------------------------
CREATE TABLE pedidos (
    id VARCHAR(50) NOT NULL,
    cliente_id VARCHAR(50) NOT NULL,
    fecha_pedido DATE NOT NULL DEFAULT CURRENT_DATE,
    estado VARCHAR(50) NOT NULL DEFAULT 'Pendiente',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_pedidos PRIMARY KEY (id),
    CONSTRAINT fk_pedidos_cliente FOREIGN KEY (cliente_id) REFERENCES clientes (id) ON DELETE RESTRICT
);

-- ---------------------------------------------------------------------------
-- 9. TABLA: pedido_detalles (Detalle / Relación Recetas con Pedidos)
-- ---------------------------------------------------------------------------
CREATE TABLE pedido_detalles (
    pedido_id VARCHAR(50) NOT NULL,
    receta_id VARCHAR(50) NOT NULL,
    stems INT NOT NULL,               -- Cantidad de tallos individuales ordenados para esta receta
    cantidad INT NOT NULL DEFAULT 1,  -- Número de ramos de esta receta ordenados
    CONSTRAINT pk_pedido_detalles PRIMARY KEY (pedido_id, receta_id),
    CONSTRAINT fk_pedido_detalles_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos (id) ON DELETE CASCADE,
    CONSTRAINT fk_pedido_detalles_receta FOREIGN KEY (receta_id) REFERENCES recetas (id) ON DELETE RESTRICT
);


-- ===========================================================================
-- OPCIÓN A: DISEÑO PLANO (SI DESEAS MANTENER LA ESTRUCTURA ORIGINAL EN UNA SOLA TABLA)
-- ===========================================================================
/*
CREATE TABLE pedidos (
    id VARCHAR(50) NOT NULL,
    cliente_id VARCHAR(50) NOT NULL,
    receta_id VARCHAR(50) NULL,      -- Relación opcional/directa con Recetas
    categoria VARCHAR(120) NOT NULL,  -- Categoría de flor / bouquet
    stems INT NOT NULL,               -- Cantidad de tallos
    fecha_pedido DATE NOT NULL DEFAULT CURRENT_DATE,
    estado VARCHAR(50) NOT NULL DEFAULT 'Pendiente',
    CONSTRAINT pk_pedidos PRIMARY KEY (id),
    CONSTRAINT fk_pedidos_cliente FOREIGN KEY (cliente_id) REFERENCES clientes (id) ON DELETE RESTRICT,
    CONSTRAINT fk_pedidos_receta FOREIGN KEY (receta_id) REFERENCES recetas (id) ON DELETE SET NULL
);
*/


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
