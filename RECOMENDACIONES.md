# Plan de Trabajo Oficial — MMS App

> **Auditor:** Arquitecto de Software Senior
> **Fecha original:** 2026-07-22
> **Última auditoría:** 2026-08-06
> **Alcance:** Auditoría completa pre-cierre — código, estilos, JSDoc, Supabase, RLS, seguridad

---

## Tabla de Contenidos

- [Resumen Ejecutivo](#resumen-ejecutivo)
- [Prioridad Crítica](#prioridad-crítica)
  - [C1 — RLS deshabilitado en las 15 tablas de Supabase](#c1--rls-deshabilitado-en-las-15-tablas-de-supabase)
  - [C2 — Operaciones multi-tabla sin transaccionalidad](#c2--operaciones-multi-tabla-sin-transaccionalidad)
- [Prioridad Alta](#prioridad-alta)
  - [A1 — Gradientes con colores hardcoded en componentes scoped](#a1--gradientes-con-colores-hardcoded-en-componentes-scoped)
  - [A2 — Colores hardcoded dispersos en estilos scoped](#a2--colores-hardcoded-dispersos-en-estilos-scoped)
  - [A3 — Estilos CSS duplicados entre RecetaMaterialesTabla y RecetaMateriaPrimaTabla](#a3--estilos-css-duplicados-entre-recetamaterialestabla-y-recetamateriaprimatabla)
- [Prioridad Media](#prioridad-media)
  - [M1 — JSDoc redundante en clients](#m1--jsdoc-redundante-en-clients)
  - [M2 — Comentarios `// Mapeo snake_case a camelCase` repetidos](#m2--comentarios--mapeo-snake_case-a-camelcase-repetidos)
  - [M3 — `DashboardEstadoPedidos` replica `.data-card-table` global](#m3--dashboardestadopedidos-replica-data-card-table-global)
  - [M4 — `.badge-warning/success/danger` con colores hardcoded en style.css](#m4--badge-warningsuccessdanger-con-colores-hardcoded-en-stylecss)
  - [M5 — Duplicación interna en ProduccionRecetasView](#m5--duplicación-interna-en-produccionrecetasview)
- [Prioridad Baja](#prioridad-baja)
  - [B1 — Espacio faltante en `RecetaMateriaPrimaTabla`](#b1--espacio-faltante-en-recetamateriaprimatabla)
  - [B2 — Gradiente minor en ProduccionForm `.stat-card`](#b2--gradiente-minor-en-produccionform-stat-card)
  - [B3 — Comentario HTML `<!-- LAYOUT -->` residual en RecetasPage](#b3--comentario-html----layout----residual-en-recetaspage)
  - [B4 — RecetaResumen — evaluado, no requiere cambio](#b4--recetaresumen--evaluado-no-requiere-cambio)
- [Supabase — Estructura y Seguridad](#supabase--estructura-y-seguridad)
  - [Esquema de base de datos](#esquema-de-base-de-datos)
  - [Accesos desde frontend](#accesos-desde-frontend)
  - [Propuesta RLS por tabla](#propuesta-rls-por-tabla)
  - [Operaciones candidatas a RPC](#operaciones-candidatas-a-rpc)
- [Impacto en Frontend](#impacto-en-frontend)
- [Recomendaciones Anteriores](#recomendaciones-anteriores)
- [Hoja de Ruta Priorizada](#hoja-de-ruta-priorizada)

---

## Resumen Ejecutivo

La aplicación se encuentra en un estado de madurez alto. La arquitectura es sólida con una separación clara de capas (`client/`, `composables/`, `pages/`, `components/`, `utils/`), convenciones de nomenclatura consistentes (camelCase en frontend, snake_case confinado a la capa `client/`), y un sistema de design tokens bien definido en `style.css`.

La auditoría de 2026-08-06 verificó las 12 recomendaciones anteriores contra el código real: **10 completamente implementadas**, 1 parcial (comentarios decorativos), 1 verificada como correcta (M4 — ambas páginas ya usan mutación directa).

Esta actualización incorpora hallazgos nuevos en **seguridad (RLS/RPC)**, **estilos CSS**, **JSDoc** y **Supabase**.

| Prioridad | Cantidad | Enfoque principal |
|---|---|---|
| Crítica | 2 | RLS deshabilitado, operaciones sin transaccionalidad |
| Alta | 3 | Gradientes hardcoded, colores dispersos, CSS duplicado |
| Media | 5 | JSDoc redundante, comentarios repetidos, badges hardcoded |
| Baja | 4 | Espacio tipográfico, gradiente minor, comentario HTML, RecetaResumen |

### Estado general del código

- **Manejo de errores:** Consistente. Todos los `Client` siguen el patrón `try/catch` → `{ success: false, error }`. Las páginas verifican `response?.success === false` antes de procesar datos.
- **`console.error/warn`:** Se usan correctamente en ~50 lugares. Todos están en contextos de captura de errores reales (`catch` blocks, verificaciones de `success === false`). No hay `console.log` de depuración sueltos. Se recomienda mantener todos — son útiles para diagnóstico en producción.
- **`throw new Error`:** Solo 2 ocurrencias, ambas justificadas: `useExcel.js` (archivo vacío) y `usePedidoExcel.js` (formato inválido). Ambas se capturan correctamente en los llamadores.
- **JSDoc:** ~28 anotaciones. 5 bloques documentan estructuras complejas y deben conservarse. ~18 son redundantes y se recomienda eliminar (ver M1).
- **Código CRUD comentado:** Eliminado completamente en auditorías anteriores.
- **Archivos muertos:** Solo queda `hero.png` en `assets/` que es un asset legítimo.
- **Supabase:** 15 tablas, 22 foreign keys, 0 políticas RLS, 0 funciones RPC, 0 triggers, 0 vistas. Auth propia (no Supabase Auth).

---

## Prioridad Crítica

---

### C1 — RLS deshabilitado en las 15 tablas de Supabase

- **Estado:** 🔴 Pendiente
- **Tablas afectadas:** Todas — `usuarios`, `clientes`, `materia_prima`, `materiales`, `recetas`, `receta_materiales`, `receta_materia_prima`, `pedidos`, `pedido_detalles`, `mermas`, `producciones`, `produccion_detalle`, `planificaciones`, `planificacion_recetas`, `produccion_consumos`
- **Descripción:** La aplicación se conecta a Supabase usando la `anon key` (visible en el frontend) sin ninguna política RLS. Esto significa que cualquier persona con la `anon key` puede leer, escribir, actualizar y eliminar todos los datos de todas las tablas. La tabla `usuarios` expone nombres y hashes de contraseña.
- **Estado actual:** 0 políticas RLS definidas, 0 funciones RPC, 0 triggers, 0 vistas.
- **Motivo:** Riesgo crítico de seguridad. Los datos de producción, inventarios, clientes y credenciales de usuario están completamente expuestos.
- **Propuesta:** Habilitar RLS en las 15 tablas + crear políticas permisivas para `authenticated`. Ver [Propuesta RLS por tabla](#propuesta-rls-por-tabla) para el detalle.
- **Prerequisito:** Definir estrategia de auth (mantener auth propia vs migrar a Supabase Auth).
- **Impacto:** Todas las tablas. Si se implementa incorrectamente puede bloquear el acceso a la app.

---

### C2 — Operaciones multi-tabla sin transaccionalidad

- **Estado:** 🔴 Pendiente (documentado en `ARCHITECTURE.md`, no resuelto)
- **Operaciones afectadas:**

  | Operación | Client | Tablas | Queries |
  |---|---|---|---|
  | `agregarProduccion` | `ProduccionClient` | `producciones`, `produccion_detalle`, `recetas`, `planificaciones`, `planificacion_recetas`, `materia_prima`, `materiales`, `produccion_consumos` | ~10 |
  | `registrarMermaConDescuento` | `MermaClient` | `mermas`, `materiales` o `materia_prima` (1-N updates) | 2-4 |
  | `resolverClientesDePedidos` | `ClientesClient` | `clientes` (múltiples inserts + upserts) | 3-5 |
  | `cargarMateriales` (upsert) | `MaterialClient` | `materiales` (select + upsert) | 2 |
  | `sincronizarConSupabase` | `MaterialClient` | `materiales` (select all + upsert) | 2-3 |

- **Descripción:** `agregarProduccion` es el caso más grave: toca 7 tablas en ~10 queries secuenciales desde el frontend. Si falla a mitad de ejecución, el stock queda descontado sin registro de producción (o viceversa), dejando datos inconsistentes.
- **Motivo:** Supabase no soporta transacciones desde el cliente JS. Las operaciones multi-tabla deben ejecutarse server-side.
- **Propuesta:** Crear funciones RPC (`SECURITY DEFINER`) en Supabase para las operaciones críticas. Ver [Operaciones candidatas a RPC](#operaciones-candidatas-a-rpc).
- **Impacto:** Requiere refactorizar `ProduccionClient.js`, `MermaClient.js`, `ClientesClient.js`. Los consumers (pages/composables) no se afectan si los clients mantienen la interfaz `{ success, data }`.

---

## Prioridad Alta

---

### A1 — Gradientes con colores hardcoded en componentes scoped

- **Estado:** ⏳ Pendiente
- **Archivos afectados:**

  | Archivo | Línea | Color hardcoded | Propuesta |
  |---|---|---|---|
  | `PlanificacionOperadorCard.vue` | L118 | `linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)` | → `linear-gradient(180deg, var(--bg) 0%, var(--bg-secondary) 100%)` |
  | `PlanificacionResumen.vue` | L121 | `linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)` | → `linear-gradient(180deg, var(--bg) 0%, var(--bg-secondary) 100%)` |

- **Descripción:** Dos componentes de planificación usan `#ffffff` y `#f8fafc` directamente en gradientes CSS. En dark mode estos elementos aparecerán como cajas blancas brillantes sobre fondo oscuro.
- **Motivo:** Inconsistencia con el sistema de design tokens. Rompe dark mode.
- **Impacto:** Cambio puramente CSS en 2 archivos, sin riesgo funcional.

---

### A2 — Colores hardcoded dispersos en estilos scoped

- **Estado:** ⏳ Pendiente
- **Archivos afectados:**

  | Archivo | Línea | Color | Propuesta |
  |---|---|---|---|
  | `ProduccionRecetasView.vue` | L253, L258 | `#16a34a` | → `var(--primary)` |
  | `ProduccionRecetasView.vue` | L299 | `#f1f1f1` | → `var(--bg-secondary)` |
  | `PlanificacionVista.vue` | L225-226 | `#e2e8f0`, `#475569` | → `var(--bg-secondary)`, `var(--text)` |
  | `PlanificacionMapeoRecetas.vue` | L310-311 | `#fef3c7`, `#b45309` | Hardcoded amber (status-incomplete) |
  | `PlanificacionMapeoRecetas.vue` | L421 | `#f0fdf4` | → `var(--primary-bg)` |
  | `LoginForm.vue` | L125 | `#f3f4f6` | → `var(--code-bg)` o `var(--bg-secondary)` |
  | `DashboardEstadoPedidos.vue` | L214 | `#1eab55` | → `var(--primary)` |
  | `ClienteList.vue` | L311 | `rgba(22, 163, 74, 0.08)` | `.active-row` — → `var(--primary-bg)` |
  | `ClienteList.vue` | L369-370 | `rgba(14, 165, 233, 0.1)`, `#0ea5e9` | `.badge-billing` — crear variable o usar `var(--alert-info-bg/text)` |
  | `ClienteList.vue` | L373-375 | `rgba(249, 115, 22, 0.1)`, `#f97316` | `.badge-shipping` — crear variable o usar `var(--alert-warning-bg/text)` |
  | `style.css` | L355, L359 | `#dbeafe`, `#fee2e2` | → `var(--alert-info-bg)`, `var(--alert-error-bg)` |

- **Descripción:** ~18 instancias de colores hex dispersas en estilos scoped que deberían usar variables del sistema de design tokens.
- **Motivo:** Inconsistencia visual y problemas en dark mode.
- **Impacto:** Cambio puramente CSS, ~18 líneas. Sin riesgo funcional.

---

### A3 — Estilos CSS duplicados entre RecetaMaterialesTabla y RecetaMateriaPrimaTabla

- **Estado:** ⏳ Pendiente
- **Archivos afectados:**
  - `src/components/recetas/RecetaMaterialesTabla.vue` (L112-185, 73 líneas CSS)
  - `src/components/recetas/RecetaMateriaPrimaTabla.vue` (L118-191, 73 líneas CSS)
- **Descripción:** Ambos componentes tienen CSS scoped **100% idéntico** en las siguientes clases: `.inventory-panel`, `.panel-header`, `.panel-header p`, `.btn-refresh`, `.table-wrap`, `.selection-table`, `.selection-table th/td`, `.selection-table th`, `.row-subtitle`, `.qty-input`, `.empty-state`.
- **Motivo:** Si se modifica el estilo de una tabla de selección, hay que actualizar ambos archivos.
- **Propuesta:** Extraer a clases globales en `style.css`:
  1. `.selection-panel` — reemplaza `.inventory-panel`
  2. `.selection-panel-header` — reemplaza `.panel-header`
  3. `.selection-table` (ya existe la clase, solo mover los estilos)
  4. `.btn-refresh` — botón de actualización
  5. `.qty-input` — input numérico de cantidad
- **Impacto:** Reduce ~73 líneas duplicadas a ~0. Ambos componentes quedan sin bloque `<style>` o con estilos mínimos.

---

## Prioridad Media

---

### M1 — JSDoc redundante en clients

- **Estado:** ⏳ Pendiente
- **Archivos afectados:**

  | Archivo | Líneas | JSDoc redundante |
  |---|---|---|
  | `MaterialClient.js` | L7-10, L71-73, L89-92, L130-132, L152-154, L170-172 | 6 bloques que solo repiten el nombre de la función (`Obtiene la lista de...`, `Agrega un nuevo...`, `Elimina un...`) |
  | `MermaClient.js` | L5-7, L15-17, L80-82, L160-162 | 4 bloques redundantes |
  | `ProduccionClient.js` | L4-6, L251-253, L295-297 | 3 bloques redundantes |
  | `useExcel.js` | L10-12, L33-34 | 2 bloques con tipos evidentes del contexto |

- **JSDoc a CONSERVAR:**

  | Archivo | Líneas | Motivo |
  |---|---|---|
  | `PlanificacionAlgoritmo.js` | L100-102, L165-169, L278-280, L332-335, L554 | Estructuras complejas con tipos de arrays anidados |
  | `PlanificacionClient.js` | L85 | Interfaz de API con estructura exacta del payload |
  | `DashboardClient.js` | L333 | Formato de fecha: `'YYYY-MM-DD'` — restricción no evidente |
  | `useAuth.js` | L1-7 | Contexto de uso: `setup()` vs funciones helper |
  | `useInventario.js` | L5-8 | Contrato de interfaz: 3 funciones requeridas en `opciones` |
  | `MermaClient.js` | L178-181 | `registrarMermaConDescuento` — operación compleja multi-tabla |
  | `ProduccionClient.js` | L43-46 | `agregarProduccion` — operación multi-tabla |

- **Motivo:** Los JSDoc redundantes solo repiten lo que el nombre de la función ya expresa. Los que se conservan documentan estructuras complejas, restricciones o comportamientos no evidentes.
- **Propuesta:** Eliminar ~18 bloques JSDoc que sean puramente descriptivos. Conservar los 7 que documentan contratos, estructuras o restricciones.
- **Impacto:** Reduce ruido documental, ~40 líneas.

---

### M2 — Comentarios `// Mapeo snake_case a camelCase` repetidos

- **Estado:** ⏳ Pendiente
- **Archivos afectados:**
  - `ClientesClient.js` (L33)
  - `MermaClient.js` (L67, L148)
  - `ProduccionClient.js` (L31)
- **Descripción:** El comentario `// Mapeo snake_case a camelCase` aparece en 4 lugares. El patrón es evidente por las asignaciones (`operadorId: item.operador_id`).
- **Propuesta:** Eliminar las 4 instancias.
- **Impacto:** 4 líneas.

---

### M3 — `DashboardEstadoPedidos` replica `.data-card-table` global

- **Estado:** ⏳ Pendiente (observación)
- **Archivos afectados:**
  - `src/components/dashboard/DashboardEstadoPedidos.vue` (L206-237)
- **Descripción:** El componente define `.mms-table` con estilos que replican la estructura de `.data-card-table` definida en `style.css` (font-size, border-collapse, th/td padding, etc.), pero con diferencias menores (color del thead: `#1eab55` vs `var(--primary)`).
- **Propuesta:** Evaluar si puede usar `.data-card-table` global en lugar de `.mms-table` local. Si las diferencias justifican la separación, al menos reemplazar `#1eab55` por `var(--primary)`.
- **Impacto:** Reducción de ~30 líneas CSS si se adopta la clase global.

---

### M4 — `.badge-warning/success/danger` con colores hardcoded en style.css

- **Estado:** ⏳ Pendiente
- **Archivos afectados:**
  - `src/style.css` (L495-511)
- **Descripción:** Las clases `.badge-warning`, `.badge-success` y `.badge-danger` usan colores hex hardcoded (`#FEF3C7`, `#92400E`, `#D1FAE5`, `#065F46`, `#FEE2E2`, `#991B1B`) en lugar de variables CSS. Los tokens de alerta ya existen (`--alert-success-bg`, `--alert-error-bg`) pero no se usan aquí.
- **Propuesta:** Crear variables para warning y unificar:
  ```css
  --alert-warning-bg: #FEF3C7;
  --alert-warning-text: #92400E;
  --alert-warning-border: #FDE68A;
  ```
  Y referenciarlas en `.badge-warning`, `.badge-success`, `.badge-danger`.
- **Impacto:** Consistencia del sistema de tokens. ~10 líneas.

---

### M5 — Duplicación interna en ProduccionRecetasView

- **Estado:** ⏳ Pendiente
- **Archivos afectados:**
  - `src/components/produccion/ProduccionRecetasView.vue` (L319-347)
- **Descripción:** Las clases `.materiales-list` y `.materia-list` dentro del mismo componente tienen CSS idéntico (h4 margin, ul margin/padding, li margin/color). Solo difiere el nombre de la clase.
- **Propuesta:** Unificar a una sola clase (por ejemplo `.ingrediente-list`) usada en ambos `<div>`.
- **Impacto:** Reduce ~15 líneas de CSS duplicado interno.

---

## Prioridad Baja

---

### B1 — Espacio faltante en `RecetaMateriaPrimaTabla`

- **Estado:** ⏳ Pendiente
- **Archivos afectados:**
  - `src/components/recetas/RecetaMateriaPrimaTabla.vue` (L48)
- **Descripción:** El texto dice `Fecha:{{ item.fechaIngreso || '-' }}` — falta un espacio después de `Fecha:`.
- **Propuesta:** Corregir a `Fecha: {{ item.fechaIngreso || '-' }}`.
- **Impacto:** Fix cosmético, 1 carácter.

---

### B2 — Gradiente minor en ProduccionForm `.stat-card`

- **Estado:** ⏳ Pendiente (observación)
- **Archivos afectados:**
  - `src/components/produccion/ProduccionForm.vue` (L253)
- **Descripción:** `.stat-card` usa `linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(243, 250, 244, 0.92))`. En dark mode sería un parche blanco sutil. No es un problema visible severo porque usa alpha alto.
- **Propuesta:** Considerar reemplazar por gradiente con `var(--bg)`, pero prioridad baja por impacto visual mínimo.
- **Impacto:** 1 línea CSS.

---

### B3 — Comentario HTML `<!-- LAYOUT -->` residual en RecetasPage

- **Estado:** ⏳ Pendiente (observación)
- **Archivos afectados:**
  - `src/pages/RecetasPage.vue` (L12)
- **Descripción:** El comentario `<!-- LAYOUT -->` es el único comentario HTML decorativo restante. Otros como `<!-- TÍTULO -->` y `<!-- ALERTAS -->` ya fueron eliminados. Los separadores `/* === */` ya fueron simplificados al patrón `// -- Sección --`.
- **Propuesta:** Eliminar si se desea consistencia total, o conservar como marcador de navegación.
- **Impacto:** 1 línea.

---

### B4 — RecetaResumen — evaluado, no requiere cambio

- **Estado:** ✅ Evaluado — No recomendado reemplazar
- **Archivos analizados:**
  - `src/components/recetas/RecetaResumen.vue`
  - `src/pages/RecetasPage.vue`
- **Evaluación:**
  El componente muestra los materiales y materia prima **seleccionados durante la creación de una receta**. Su propósito es dar feedback visual al usuario mientras arma una receta nueva. Cumple su función específica correctamente. Props: `materiales: Array`, `materiaPrima: Array`. Sin emits, sin servicios. CSS scoped usa design tokens correctamente. No requiere reemplazo.

---

## Supabase — Estructura y Seguridad

### Esquema de base de datos

15 tablas en schema `public`, 22 foreign keys:

| Tabla | PK type | RLS | Rows | Relaciones clave |
|---|---|---|---|---|
| `usuarios` | uuid | ❌ | 2 | → `pedidos`, `mermas`, `producciones`, `planificaciones` |
| `clientes` | uuid | ❌ | 207 | Self-join (`cliente_facturacion_id`) → `pedidos` |
| `materia_prima` | varchar | ❌ | 95 | → `receta_materia_prima`, `mermas`, `produccion_consumos` |
| `materiales` | varchar | ❌ | 13 | → `receta_materiales`, `mermas`, `produccion_consumos` |
| `recetas` | uuid | ❌ | 11 | → `receta_materiales`, `receta_materia_prima`, `pedido_detalles`, `planificacion_recetas`, `mermas` |
| `receta_materiales` | composite | ❌ | 4 | FK: `receta_id`, `material_id` |
| `receta_materia_prima` | composite | ❌ | 4 | FK: `receta_id`, `materia_prima_id` |
| `pedidos` | varchar | ❌ | 208 | FK: `cliente_facturacion_id`, `cliente_envio_id`, `operador_id` |
| `pedido_detalles` | composite | ❌ | 209 | FK: `pedido_id`, `receta_id` |
| `mermas` | uuid | ❌ | 1 | FK: `material_id`, `materia_prima_id`, `receta_id`, `operador_id` |
| `producciones` | uuid | ❌ | 0 | FK: `operador_id` → `produccion_detalle`, `produccion_consumos` |
| `produccion_detalle` | composite | ❌ | 0 | FK: `produccion_id` |
| `produccion_consumos` | uuid | ❌ | 0 | FK: `produccion_id`, `materia_prima_id`, `material_id` |
| `planificaciones` | uuid | ❌ | 1 | FK: `operador_id` → `planificacion_recetas` |
| `planificacion_recetas` | composite | ❌ | 9 | FK: `planificacion_id`, `receta_id` |

**Elementos no encontrados:** 0 funciones RPC, 0 triggers, 0 vistas, 0 políticas RLS.

### Accesos desde frontend

| Client | Tablas | Operaciones |
|---|---|---|
| `UsuarioClient` | `usuarios` | SELECT (login + listar), INSERT, DELETE |
| `MaterialClient` | `materiales` | SELECT, UPSERT, INSERT, UPDATE, DELETE |
| `MateriaPrimaClient` | `materia_prima` | SELECT, UPSERT, UPDATE |
| `RecetaClient` | `recetas`, `receta_materiales`, `receta_materia_prima` | SELECT, INSERT |
| `PedidoClient` | `pedidos`, `pedido_detalles` | SELECT, INSERT, UPDATE, DELETE |
| `ClientesClient` | `clientes` | SELECT, INSERT, UPDATE, DELETE, UPSERT |
| `MermaClient` | `mermas`, `materiales`, `materia_prima` | SELECT, INSERT, DELETE + UPDATE (stock) |
| `ProduccionClient` | 8 tablas | SELECT, INSERT, UPDATE, DELETE |
| `PlanificacionClient` | `planificaciones`, `planificacion_recetas` | SELECT, INSERT, DELETE |
| `DashboardClient` | 9 tablas | SELECT (solo lectura) |

### Propuesta RLS por tabla

| Tabla | SELECT | INSERT | UPDATE | DELETE | Notas |
|---|---|---|---|---|---|
| `usuarios` | `authenticated` — excluir `contrasena` | supervisor | ❌ | supervisor | **Prioridad máxima** — expone contraseñas |
| `clientes` | `authenticated` | `authenticated` | `authenticated` | `authenticated` | Estándar |
| `materiales` | `authenticated` | `authenticated` | `authenticated` | `authenticated` | Stock sensible |
| `materia_prima` | `authenticated` | `authenticated` | `authenticated` | ❌ | Solo upsert, no delete |
| `recetas` | `authenticated` | supervisor | ❌ | ❌ | Solo supervisor crea |
| `receta_materiales` | `authenticated` | supervisor | ❌ | ❌ | Junction table |
| `receta_materia_prima` | `authenticated` | supervisor | ❌ | ❌ | Junction table |
| `pedidos` | `authenticated` | `authenticated` | `authenticated` | `authenticated` | Todos leen |
| `pedido_detalles` | `authenticated` | `authenticated` | ❌ | `authenticated` | Junction |
| `mermas` | `authenticated` | `authenticated` | ❌ | supervisor | Solo supervisor elimina |
| `producciones` | `authenticated` | `authenticated` | `authenticated` | `authenticated` | Operadores registran |
| `produccion_detalle` | `authenticated` | `authenticated` | ❌ | `authenticated` | Cascada |
| `produccion_consumos` | `authenticated` | `authenticated` | ❌ | ❌ | Histórico, no borrar |
| `planificaciones` | `authenticated` | supervisor | ❌ | supervisor | Solo supervisor |
| `planificacion_recetas` | `authenticated` | supervisor | ❌ | supervisor | Junction |

**Prerequisito:** Definir cómo diferenciar `supervisor` de `operador` a nivel de base de datos. Opciones: (a) migrar a Supabase Auth con custom claims en JWT, (b) usar funciones RPC que consulten la tabla `usuarios` internamente.

### Operaciones candidatas a RPC

| Operación | Client actual | Riesgo | Propuesta RPC |
|---|---|---|---|
| `agregarProduccion` | `ProduccionClient` | 🔴 7 tablas, ~10 queries. Stock inconsistente si falla | `rpc_registrar_produccion(fecha, total, operador_id, detalle[])` |
| `registrarMermaConDescuento` | `MermaClient` | 🟠 2-4 queries. Merma sin descuento si falla | `rpc_registrar_merma(tipo, referenciaId, cantidad, ...)` |
| `resolverClientesDePedidos` | `ClientesClient` | 🟡 3-5 queries. Estado parcial | `rpc_resolver_clientes_pedidos(pedidos[])` |
| `cargarMateriales` (upsert) | `MaterialClient` | 🟡 Select + upsert | `rpc_upsert_materiales(data[])` |
| `sincronizarConSupabase` | `MaterialClient` | 🟡 Race condition | `rpc_sincronizar_materiales(externos[])` |

---

## Impacto en Frontend

### Mapa de impacto al implementar RLS/RPC

| Capa | Archivos | Tipo de cambio |
|---|---|---|
| **Clients** | `ProduccionClient.js`, `MermaClient.js`, `ClientesClient.js` | 🔴 Refactorizar a llamadas RPC |
| **Clients** | `UsuarioClient.js` | 🟠 Adaptar login si se migra a Supabase Auth |
| **Clients** | `MaterialClient.js`, `MateriaPrimaClient.js` | 🟡 Posible RPC para sincronización |
| **Composables** | `useAuth.js` | 🟠 Adaptar si se migra a Supabase Auth |
| **Composables** | `useProduccionForm.js` | 🟡 Cambios mínimos si el RPC devuelve el mismo formato |
| **Pages** | Todas | 🟢 Sin cambios si los clients mantienen la interfaz `{ success, data }` |
| **supabase.js** | Config | 🟡 Posible cambio si se implementa auth con JWT |

**Principio:** Los pages y composables no deberían afectarse si los clients refactorizados mantienen la misma interfaz de retorno `{ success: boolean, data?: any, error?: any }`.

---

## Recomendaciones Anteriores

### Completadas (verificadas contra el código actual — auditoría 2026-08-06)

| ID | Recomendación | Verificación |
|---|---|---|
| A2 (prev) | `background: white`/`#f8faf8` en recetas | ✅ `RecetaResumen`, `RecetaForm`, `RecetaCategoria` usan `var(--bg)`. Ya no existe `background: white` ni `background: #f8faf8` en ningún `.vue` |
| A3 (prev) | Separadores decorativos `/* === */` | ✅ Eliminados de RecetasPage y PedidoPage. Patrón limpio `// -- Sección --` adoptado. Solo queda `<!-- LAYOUT -->` en RecetasPage (nueva B3) |
| M1 (prev) | Bloque `else` vacío en MaterialClient | ✅ Eliminado. L63-64 contienen `return { success: true }` |
| M2 (prev) | `sincronizarConSupabase` sin return en éxito | ✅ L18: `return { success: true }` y L64: `return { success: true }` |
| M3 (prev) | Import `PlanificacionClient` muerto en MermasPage | ✅ Eliminado. L40 importa solo `MermaClient` |
| M4 (prev) | `limpiarDatos` asigna reactive con `=` | ✅ Ambas páginas ahora usan `this.mensaje.tipo = null; this.mensaje.texto = ''` (mutación directa) |
| M5 (prev) | `.forEach` sobre objeto en `resolverClientesDePedidos` | ✅ L282-286 ahora usan `if (insertadosFact.success && insertadosFact.data)` |
| M7 (prev) | Evaluación de RecetaResumen | ✅ Evaluado — no requiere reemplazo |
| B1 (prev) | Eventos kebab-case en RecetaForm | ✅ Observación — convención correcta |
| B2 (prev) | Espacio faltante en RecetaResumen | ✅ L25: `{{ item.cantidad }} unidad(es)` con espacio correcto |
| B3 (prev) | Espacio faltante en RecetaMaterialesTabla | ✅ L7: texto correcto con espacio |
| B4 (prev) | Comentario obsoleto en RecetasPage | ✅ Eliminado |

### Descartadas (por decisión del usuario)

| ID | Recomendación | Motivo |
|---|---|---|
| M6 (prev) | Funciones de selección duplicadas en RecetasPage | Descartado — se mantiene para referencia. 4 funciones (`alternarMaterial`, `alternarMateriaPrima`, `actualizarCantidadMaterial`, `actualizarCantidadMateriaPrima`) con lógica similar pero contextos distintos. |

### Historial de auditorías anteriores (completado)

| Grupo | Estado |
|---|---|
| A2-A8 (prev) | ✅ Todos completados |
| M1-M8 (prev) | ✅ Todos completados |
| B1-B6 (prev) | ✅ Todos completados |
| Sección 0 (0.1-0.3) | ✅ Eliminada (bugs de pedidos) |
| 1.2, 2.1b-e, 2.4.1, 2.5-2.7, 3.1-3.3 | ✅ Todos completados |
| N1-N12 | ✅ Todos completados |

---

## Hoja de Ruta Priorizada

### Fase 1 — Seguridad: RLS y RPC (variable)

| # | Tarea | Esfuerzo | Dependencia |
|---|---|---|---|
| C1 | Habilitar RLS + crear políticas para 15 tablas | ~30 min | Definir estrategia de auth |
| C2 | Crear RPCs para `agregarProduccion`, `registrarMermaConDescuento` | ~60 min | C1 |
| C2b | Refactorizar clients para usar RPCs | ~30 min | C2 |

### Fase 2 — Consistencia visual CSS (~15 min)

| # | Tarea | Esfuerzo | Líneas |
|---|---|---|---|
| A1 | Reemplazar gradientes hardcoded en PlanificacionOperadorCard y PlanificacionResumen | 2 min | 2 |
| A2 | Reemplazar ~15 colores hardcoded por variables CSS | 5 min | ~15 |
| A3 | Extraer CSS duplicado de RecetaMaterialesTabla/RecetaMateriaPrimaTabla a style.css | 8 min | ~73 (reducción neta) |

### Fase 3 — Limpieza de código (~10 min)

| # | Tarea | Esfuerzo | Líneas |
|---|---|---|---|
| M1 | Eliminar ~18 bloques JSDoc redundantes | 5 min | ~40 |
| M2 | Eliminar 4 comentarios `// Mapeo snake_case a camelCase` | 1 min | 4 |
| M4 | Crear variables CSS para badges warning y unificar | 2 min | ~10 |
| M5 | Unificar `.materiales-list`/`.materia-list` en ProduccionRecetasView | 2 min | ~15 |

### Fase 4 — Fixes menores (~5 min)

| # | Tarea | Esfuerzo | Líneas |
|---|---|---|---|
| B1 | Fix espacio `Fecha:` en RecetaMateriaPrimaTabla | 1 min | 1 |
| B2 | Gradiente minor en ProduccionForm | 1 min | 1 |
| B3 | Eliminar `<!-- LAYOUT -->` residual | 1 min | 1 |

### Estimación total

- **Fase 1 (Seguridad):** ~2 horas (depende de decisiones de arquitectura)
- **Fases 2-4 (Limpieza):** ~30 minutos
- **Total limpieza:** ~30 min, ~160 líneas de mejoras
- **Total seguridad:** ~2h, refactorización de 3 clients + SQL para 15 tablas

**Resultado esperado:** Un código base más limpio con CSS consistente y compatible con dark mode, sin JSDoc redundante, con seguridad RLS en Supabase, y operaciones críticas ejecutadas server-side mediante RPC.
