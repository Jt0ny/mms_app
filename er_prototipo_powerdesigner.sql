-- Primer prototipo ER basado en db.json
-- Pensado para reverse engineering en PowerDesigner

CREATE TABLE materia_prima (
    id VARCHAR(20) NOT NULL,
    variedad VARCHAR(120) NOT NULL,
    cantidad_total INT NOT NULL,
    fecha_ingreso DATE NOT NULL,
    CONSTRAINT pk_materia_prima PRIMARY KEY (id),
    CONSTRAINT uq_materia_prima_variedad UNIQUE (variedad)
);

CREATE TABLE materiales (
    id VARCHAR(20) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    cantidad INT NOT NULL,
    descripcion VARCHAR(500) NULL,
    CONSTRAINT pk_materiales PRIMARY KEY (id),
    CONSTRAINT uq_materiales_nombre UNIQUE (nombre)
);

CREATE TABLE recetas (
    id VARCHAR(20) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    instrucciones VARCHAR(2000) NULL,
    total_items INT NOT NULL,
    fecha_creacion DATETIME NOT NULL,
    CONSTRAINT pk_recetas PRIMARY KEY (id)
);

CREATE TABLE receta_materiales (
    receta_id VARCHAR(20) NOT NULL,
    material_id VARCHAR(20) NOT NULL,
    cantidad INT NOT NULL,
    disponible_snapshot INT NULL,
    CONSTRAINT pk_receta_materiales PRIMARY KEY (receta_id, material_id),
    CONSTRAINT fk_receta_materiales_receta FOREIGN KEY (receta_id) REFERENCES recetas (id),
    CONSTRAINT fk_receta_materiales_material FOREIGN KEY (material_id) REFERENCES materiales (id)
);

CREATE TABLE receta_materia_prima (
    receta_id VARCHAR(20) NOT NULL,
    materia_prima_id VARCHAR(20) NOT NULL,
    cantidad INT NOT NULL,
    disponible_snapshot INT NULL,
    CONSTRAINT pk_receta_materia_prima PRIMARY KEY (receta_id, materia_prima_id),
    CONSTRAINT fk_receta_materia_prima_receta FOREIGN KEY (receta_id) REFERENCES recetas (id),
    CONSTRAINT fk_receta_materia_prima_materia_prima FOREIGN KEY (materia_prima_id) REFERENCES materia_prima (id)
);

CREATE TABLE pedidos (
    id VARCHAR(20) NOT NULL,
    cliente_facturacion VARCHAR(255) NOT NULL,
    cliente_envio VARCHAR(255) NOT NULL,
    categoria VARCHAR(120) NOT NULL,
    stems INT NOT NULL,
    CONSTRAINT pk_pedidos PRIMARY KEY (id)
);

CREATE TABLE producciones (
    id VARCHAR(20) NOT NULL,
    fecha DATE NOT NULL,
    total INT NOT NULL,
    creado_en DATETIME NOT NULL,
    CONSTRAINT pk_producciones PRIMARY KEY (id)
);

CREATE TABLE produccion_detalle (
    produccion_id VARCHAR(20) NOT NULL,
    categoria VARCHAR(120) NOT NULL,
    cantidad INT NOT NULL,
    CONSTRAINT pk_produccion_detalle PRIMARY KEY (produccion_id, categoria),
    CONSTRAINT fk_produccion_detalle_produccion FOREIGN KEY (produccion_id) REFERENCES producciones (id)
);

CREATE TABLE usuarios (
    id VARCHAR(20) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    contrasena VARCHAR(255) NOT NULL,
    rol VARCHAR(50) NOT NULL,
    CONSTRAINT pk_usuarios PRIMARY KEY (id)
);
