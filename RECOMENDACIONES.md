# Plan de Trabajo Oficial — MMS App

> Auditoría integral del proyecto Vue 3 + Vite + Supabase para gestión de producción florícola.
> Fecha original: 2026-07-22
> Última auditoría: 2026-07-24
>
> Este documento es el **plan de trabajo oficial**. Cada recomendación incluye: prioridad, archivos afectados,
> descripción del problema, propuesta de solución, impacto esperado y estado.
> Las recomendaciones ya implementadas se movieron al [Historial de Cambios](#historial-de-cambios-completados).

---

## Cómo leer este documento

**Estados:** ✅ Completado · 🟡 Parcial · ❌ Pendiente · 🚫 Ya no aplica

**Orden de implementación recomendado:** el documento está ordenado para atacar primero lo que afecta
**integridad de datos y arquitectura/mantenibilidad**, y solo después agregar nuevas funcionalidades:

1. 🔴 **Alta** — Bugs de datos + estandarización de naming/mapeo (base sobre la que se apoya todo lo demás)
2. 🟠 **Media** — Centralización de código y estilos, refactor de componentes, arquitectura
3. 🟢 **Baja** — Limpieza de código muerto, imports, legibilidad
4. 📚 **Documentación** para la tesis

---

## Tabla de Contenidos

- [1. Prioridad Alta 🔴](#1-prioridad-alta-)
  - [1.1 Eliminar el botón "Eliminar" del módulo de Materiales](#11--eliminar-el-botón-eliminar-del-módulo-de-materiales)
  - [1.2 Estandarizar todo el frontend a camelCase](#12--estandarizar-todo-el-frontend-a-camelcase)
  - [1.3 Bugs activos por migración camelCase incompleta](#13--bugs-activos-por-la-migración-camelcase-incompleta)
  - [1.4 Centralizar el mapeo de datos (snake_case ↔ camelCase)](#14--centralizar-el-mapeo-de-datos-snake_case--camelcase)
- [2. Prioridad Media 🟠](#2-prioridad-media-)
  - [2.1 Centralización de código (composables/servicios/utils)](#21--centralización-de-código-composablesserviciosutils)
  - [2.2 Centralización de estilos CSS](#22--centralización-de-estilos-css)
  - [2.3 Refactorización de componentes grandes](#23--refactorización-de-componentes-grandes)
  - [2.4 Arquitectura y separación de capas](#24--arquitectura-y-separación-de-capas)
  - [2.5 Robustez: errores silenciosos y transaccionalidad](#25--robustez-errores-silenciosos-y-transaccionalidad)
- [3. Prioridad Baja 🟢](#3-prioridad-baja-)
  - [3.1 Código muerto (métodos exportados sin uso)](#31--código-muerto-métodos-exportados-sin-uso)
  - [3.2 Variables e imports sin utilizar](#32--variables-e-imports-sin-utilizar)
  - [3.3 Archivos sueltos en la raíz](#33--archivos-sueltos-en-la-raíz)
  - [3.4 Limpieza menor (logs, breakpoints, legibilidad)](#34--limpieza-menor-logs-breakpoints-legibilidad)
- [4. Documentación para la Tesis 📚](#4-documentación-para-la-tesis-)
- [5. Historial de Cambios Completados](#historial-de-cambios-completados)
- [6. Tabla Resumen de Prioridades](#tabla-resumen-de-prioridades)

---

## 1. Prioridad Alta 🔴

### 1.1 — Eliminar el botón "Eliminar" del módulo de Materiales

- **Prioridad:** 🔴 Alta
- **Estado:** ❌ Pendiente
- **Archivos afectados:**
  - [`MaterialesPage.vue` L38](src/pages/MaterialesPage.vue#L38) — botón `🗑️` en la tabla de inventario
  - [`MaterialesPage.vue` L253-262](src/pages/MaterialesPage.vue#L253-L262) — método `eliminarMaterial(id)`
  - [`MaterialClient.js` L177-189](src/client/MaterialClient.js#L177-L189) — método `eliminarMaterial(id)`

**Descripción del problema:** El módulo de Materiales expone un botón de borrado que no se desea en el flujo actual. Eliminar un material podría dejar recetas y producciones con referencias colgantes.

**Propuesta de solución:**
1. Quitar el `<button ... @click="eliminarMaterial(item.id)">🗑️</button>` de la tabla (L38) y dejar solo el botón de editar `✏️`.
2. Eliminar el método `eliminarMaterial(id)` de la página (L253-262).
3. Eliminar el método `MaterialClient.eliminarMaterial(id)` (L177-189): al quitar el botón, queda **sin ninguna referencia** en el proyecto (verificado por búsqueda global), por lo que es seguro borrarlo.
4. Revisar el `<style scoped>` `.actions-column` — puede conservarse (el botón editar sigue usándolo).

**Verificación de impacto:** `eliminarMaterial` solo se referencia en esos 3 lugares. Ningún otro módulo (Recetas, Producción, Mermas) lo invoca. **No afecta otras funcionalidades.**

**Impacto esperado:** Se evita el borrado accidental de materiales y las referencias colgantes; se elimina código muerto asociado.

---

### 1.2 — Estandarizar todo el frontend a camelCase

- **Prioridad:** 🔴 Alta
- **Estado:** 🟡 Parcial (algunos clients ya convierten; la mezcla persiste en varios puntos)
- **Estándar único adoptado:** **camelCase** en todo el frontend (variables, propiedades, objetos, props, composables, stores, servicios, parámetros y respuestas de API ya mapeadas). El `snake_case` **solo puede existir dentro de los `*Client.js`** al leer/escribir columnas crudas de Supabase, nunca "hacia afuera".
- **Archivos afectados (fugas de snake_case a la capa de vista):**

| Archivo | Línea(s) | Identificador snake_case a corregir |
|---|---|---|
| [`RecetaClient.js`](src/client/RecetaClient.js#L45-L61) | 45-46, 49, 55, 60-61 | `total_items`, `fecha_creacion`, `material_id`, `materia_prima_id` + arrays crudos duplicados |
| [`ClientesClient.js`](src/client/ClientesClient.js#L33-L40) | 33, 40 | `cliente_facturacion_id`, `creado_en` |
| [`PlanificacionClient.js`](src/client/PlanificacionClient.js#L36) | 36, 81, 146 | `creado_en` sin mapear |
| [`MermaClient.js`](src/client/MermaClient.js#L66) | 66, 144, 201, 218 | `creado_en`, `cantidad_total` en el payload de retorno |
| [`ProduccionClient.js`](src/client/ProduccionClient.js#L31) | 31, 33 | `operador_id`, `creado_en` sin mapear |
| [`usePedidoExcel.js`](src/composables/usePedidoExcel.js#L89-L93) | 89-93, 114-115, 182+ | `cliente_facturacion`, `cliente_envio`, `fecha_ingreso`, `cliente_facturacion_id` |
| [`PedidoPage.vue`](src/pages/PedidoPage.vue#L53-L56) | 53-56 | `item.cliente_facturacion`, `item.cliente_envio` (preview) vs camelCase en tabla guardada |
| [`ProduccionPage.vue`](src/pages/ProduccionPage.vue#L157) | 157, 166, 232 | `creado_en`, `operador_id` |
| [`RecetasPage.vue`](src/pages/RecetasPage.vue#L212) | 212 | payload con `fecha_creacion` |
| [`MermasPage.vue`](src/pages/MermasPage.vue#L154) | 154, 209-217 | `cantidad_total`, `materia_prima_id`, `receta_materia_prima`, `material_id` |
| [`ClienteForm.vue`](src/components/clientes/ClienteForm.vue#L107) | 107, 147, 161 | `creado_en` como propiedad del form |
| [`MermaForm.vue`](src/components/mermas/MermaForm.vue#L193) | 193 | `creado_en` en payload emitido |
| [`MermaList.vue`](src/components/mermas/MermaList.vue#L109) | 109 | `creado_en` |
| [`ProduccionForm.vue`](src/components/produccion/ProduccionForm.vue#L253) | 253-254, 312 | `creado_en` |
| [`ProduccionResumen.vue`](src/components/produccion/ProduccionResumen.vue#L96) | 96, 102, 106-107 | `creado_en` |

> **Nota:** los literales `'materia_prima'`, `'producto_terminado'`, `'material'` son **valores de enum** de la columna `tipo` (y se usan para derivar clases CSS). NO deben cambiarse.

**Propuesta de solución:**
1. Centralizar la conversión `snake_case → camelCase` en la capa de servicios (ver [§1.4](#14--centralizar-el-mapeo-de-datos-snake_case--camelcase)) para que **cada `*Client.js` devuelva siempre camelCase** y el resto del frontend nunca vea snake_case.
2. Renombrar en los `.vue`/composables las lecturas restantes: `creado_en → creadoEn`, `cliente_facturacion → clienteFacturacion`, `cliente_envio → clienteEnvio`, `fecha_creacion → fechaCreacion`, `total_items → totalItems`, `operador_id → operadorId`, `materia_prima_id → materiaPrimaId`, `material_id → materialId`, `cantidad_total → cantidadTotal`.
3. Al construir payloads de escritura, la conversión camelCase → snake_case debe hacerse **dentro del client**, no en el componente.

**Impacto esperado:** Un único criterio de nombres elimina la confusión sobre "cuál campo usar", previene los bugs de [§1.3](#13--bugs-activos-por-la-migración-camelcase-incompleta) y reduce el mantenimiento de dobles versiones.

---

### 1.3 — Bugs activos por la migración camelCase incompleta

- **Prioridad:** 🔴 Alta (afectan **integridad de datos** y datos visibles)
- **Estado:** ❌ Pendiente
- **Origen:** `MateriaPrimaClient.obtenerMateriaPrima()` ya devuelve **solo** `cantidadTotal` y `fechaIngreso` (camelCase), pero quedaron consumidores que aún leen los nombres viejos.

**Bug A — El descuento de stock de materia prima en Mermas siempre parte de 0**
- **Archivos:** [`MermaClient.js` L198](src/client/MermaClient.js#L198) y [L215](src/client/MermaClient.js#L215)
- **Problema:** `mp.cantidad_total` / `mpItem.cantidad_total` son `undefined` porque los objetos provienen de `catalogos.obtenerMateriaPrima()`, que ahora entrega `cantidadTotal`. `Number(undefined) || 0` ⇒ el stock actual se trata como **0**, por lo que `Math.max(0, 0 - consumo)` deja el inventario en 0 en vez de descontar sobre el valor real.
- **Solución:** cambiar `mp.cantidad_total` → `mp.cantidadTotal` (y `mpItem.cantidad_total` → `mpItem.cantidadTotal`). Encaja con [§1.2](#12--estandarizar-todo-el-frontend-a-camelcase).

**Bug B — La columna "Fecha Ingreso" del inventario de Materia Prima muestra "-"**
- **Archivo:** [`MateriaPrimaPage.vue` L34](src/pages/MateriaPrimaPage.vue#L34)
- **Problema:** `formatearFecha(item.fecha)` recibe `undefined`: el client ahora devuelve `fechaIngreso`, no `fecha`.
- **Solución:** `formatearFecha(item.fecha)` → `formatearFecha(item.fechaIngreso)`.

**Impacto esperado:** Se corrige el cálculo de inventario tras registrar mermas (integridad de datos) y se restaura la fecha de ingreso visible.

---

### 1.4 — Centralizar el mapeo de datos (snake_case ↔ camelCase)

- **Prioridad:** 🔴 Alta
- **Estado:** ❌ Pendiente
- **Archivos afectados:** todos los `src/client/*.js` (especialmente [`RecetaClient.js`](src/client/RecetaClient.js), [`ClientesClient.js`](src/client/ClientesClient.js), [`PlanificacionClient.js`](src/client/PlanificacionClient.js), [`MermaClient.js`](src/client/MermaClient.js), [`ProduccionClient.js`](src/client/ProduccionClient.js)) y un nuevo `src/utils/mapper.js`.

**Descripción del problema:** No existe ningún conversor centralizado. La conversión se hace a mano dentro de cada `.map()` de cada client, con resultados inconsistentes:
- Conversión limpia: `MateriaPrimaClient`, `UsuarioClient`, `DashboardClient`, `PedidoClient` (lectura).
- Conversión parcial (olvidan `creado_en` u otros): `PlanificacionClient`, `MermaClient`, `ClientesClient`, `ProduccionClient`.
- **Duplicación grave** en [`RecetaClient.js` L47-61](src/client/RecetaClient.js#L47-L61): devuelve el arreglo `materiaPrima` (camelCase) **y además** los crudos `receta_materia_prima` / `receta_materiales`. La misma relación viaja dos veces con dos formatos, y `MermasPage.vue` consume ambas versiones con fallbacks (`material_id || materialId || id`).

**Propuesta de solución:**
1. Crear `src/utils/mapper.js` con helpers `keysToCamel(obj)` y `keysToSnake(obj)` (recursivos, respetando arrays anidados).
2. Aplicarlos en cada client: lectura → `keysToCamel`, escritura → `keysToSnake`. Así se elimina el drift por-client.
3. En `RecetaClient` eliminar los campos crudos duplicados `receta_materia_prima` / `receta_materiales` y dejar únicamente `materiaPrima` / `materiales` en camelCase; ajustar `MermasPage.filtrarRecursos` para usar solo esas propiedades.

**Impacto esperado:** Fuente única de conversión, se elimina la duplicación de RecetaClient, se previenen fugas futuras de snake_case y se simplifican los consumidores.

---

## 2. Prioridad Media 🟠

### 2.1 — Centralización de código (composables/servicios/utils)

- **Prioridad:** 🟠 Media
- **Estado:** ❌ Pendiente (incluye la antigua §5.4 `useErrorHandler`)

| # | Lógica repetida | Archivos | Propuesta |
|---|---|---|---|
| a | try/catch + `cargando` + `mostrarMensaje('exito'/'error')` + recarga (patrón CRUD casi idéntico en todas las páginas) | [`MaterialesPage.vue` L198-262](src/pages/MaterialesPage.vue#L198-L262), [`MateriaPrimaPage.vue` L114-220](src/pages/MateriaPrimaPage.vue#L114-L220), [`ProduccionPage.vue` L228-289](src/pages/ProduccionPage.vue), [`PlanificacionPage.vue` L144-173](src/pages/PlanificacionPage.vue), [`MermasPage.vue` L129-165](src/pages/MermasPage.vue) | Crear composable `useAsyncAction(fn, { loading, exito, error })` (equivale al antiguo `useErrorHandler`) que envuelva el patrón y unifique el manejo de errores |
| b | Normalización de claves de Excel (`key.toLowerCase().replace(/\s+/g,'')`) | [`MaterialesPage.vue` L171-189](src/pages/MaterialesPage.vue#L171-L189), [`MateriaPrimaPage.vue` L163-189](src/pages/MateriaPrimaPage.vue#L163-L189) | Mover `normalizarClaves(row)` a [`useExcel.js`](src/composables/useExcel.js) o a `utils` |
| c | `cargarInventario` + `sincronizarAPI` casi idénticos (solo cambia el client) | [`MaterialesPage.vue` L123-149](src/pages/MaterialesPage.vue#L123-L149), [`MateriaPrimaPage.vue` L114-140](src/pages/MateriaPrimaPage.vue#L114-L140) | Composable `useInventario(client, catalogosGetter)` |
| d | Formateo de fecha con 4 implementaciones divergentes | [`utils/date.js`](src/utils/date.js), [`MateriaPrimaPage.vue` L105](src/pages/MateriaPrimaPage.vue#L105), [`MermaList.vue` L121](src/components/mermas/MermaList.vue#L121), [`ProduccionResumen.vue` L48-54](src/components/produccion/ProduccionResumen.vue#L48-L54) | Consolidar `formatearFecha` / `formatearFechaLarga` en `utils/date.js` |
| e | "Notificar + emitir + timeout" reimplementando `useMensajes` | [`ProduccionForm.vue` L207-217](src/components/produccion/ProduccionForm.vue#L207-L217), [`PlanificacionPage.vue` L139-142](src/pages/PlanificacionPage.vue#L139-L142) | Reutilizar [`useMensajes.js`](src/composables/useMensajes.js#L7) en vez de reimplementar el timeout |

**Impacto esperado:** Menos duplicación, un solo punto de mantenimiento para errores/mensajes/fechas/Excel.

---

### 2.2 — Centralización de estilos CSS

- **Prioridad:** 🟠 Media
- **Estado:** 🟡 Parcial (mucho ya está en [`style.css`](src/style.css); quedan duplicados y valores hardcoded)

| # | Problema | Archivos | Propuesta |
|---|---|---|---|
| a | Familia `.btn/.btn-primary/.btn-secondary/.btn:disabled` **redefinida 5×** aunque ya existe global en `style.css:235-283` | [`ButtonActions.vue` L57-88](src/components/ButtonActions.vue#L57-L88), [`MaterialForm.vue` L116-147](src/components/materiales/MaterialForm.vue#L116-L147), [`ClienteForm.vue` L210-243](src/components/clientes/ClienteForm.vue#L210-L243), [`MermaForm.vue` L241-265](src/components/mermas/MermaForm.vue#L241-L265), colisión en [`NavBar.vue` L159](src/components/layout/NavBar.vue#L159) | Borrar las copias scoped; si hay 2 variantes de `.btn-secondary` (sólida vs outline) promover un modificador global |
| b | Familia de cabecera `.page-header/.page-title/.page-subtitle/.header-actions` redefinida | [`PlanificacionAsignacion.vue` L59-85](src/components/planificacion/PlanificacionAsignacion.vue#L59-L85), `.header-actions` también en [`PlanificacionOperadorCard.vue` L133](src/components/planificacion/PlanificacionOperadorCard.vue#L133) e [`InventoryTable.vue` L83](src/components/shared/InventoryTable.vue#L83) | Usar la versión global; si se requiere otro tamaño, un modificador |
| c | `.btn-action` con look distinto (colisión) | [`ClienteList.vue` L389](src/components/clientes/ClienteList.vue#L389), [`UsuarioTablaActual.vue` L210](src/components/usuarios/UsuarioTablaActual.vue#L210) | Unificar con la global o crear modificador `.btn-action-ghost` |
| d | Hex hardcoded que duplican variables `--alert-*` ya definidas en `:root` | [`ProduccionPage.vue` L358-359](src/pages/ProduccionPage.vue#L358-L359), [`PlanificacionMapeoRecetas.vue` L305-316](src/components/planificacion/PlanificacionMapeoRecetas.vue), [`PlanificacionOperadorCard.vue` L280](src/components/planificacion/PlanificacionOperadorCard.vue), [`PlanificacionVista.vue` L156](src/components/planificacion/PlanificacionVista.vue), [`UsuarioTablaActual.vue` L196](src/components/usuarios/UsuarioTablaActual.vue), [`MermaList.vue` L278](src/components/mermas/MermaList.vue) | Reemplazar `#dcfce7/#15803d/#fee2e2/#dc2626/…` por `var(--alert-*)` |
| e | Tarjeta de estado vacío duplicada (mismo gradiente + shadow) | [`PlanificacionPage.vue` L498-506](src/pages/PlanificacionPage.vue#L498-L506), [`ProduccionPage.vue` L368-379](src/pages/ProduccionPage.vue) | Clase global `.empty-state-card` |
| f | Badges de estado (success/error) repetidos en 5 componentes | ver (d) | Clases globales `.badge-ok` / `.badge-error` usando `--alert-*` |
| g | Override redundante `.page-container { padding:12px }` (ya global en `style.css:400-403`) | [`PlanificacionPage.vue` L531](src/pages/PlanificacionPage.vue#L531) | Eliminar |

**Impacto esperado:** Diseño consistente, un único origen de verdad para botones/cabeceras/colores; cambios de tema en un solo lugar.

---

### 2.3 — Refactorización de componentes grandes

- **Prioridad:** 🟠 Media
- **Estado:** ❌ Pendiente
- **Componentes >300 líneas con múltiples responsabilidades:**

| Líneas | Archivo | Qué mezcla / acción |
|---|---|---|
| 577 | [`ProduccionForm.vue`](src/components/produccion/ProduccionForm.vue) | Template + estado de form + reglas de negocio (topes por categoría, `construirDetalle`, hidratación de edición) + su propio sistema de mensajes → extraer validación/negocio a composable/servicio |
| 535 | [`PlanificacionPage.vue`](src/pages/PlanificacionPage.vue) | Template + **algoritmo FIFO de asignación de tallos** inline (L228-270) + redistribución (L398-426) → mover a [`PlanificacionAlgoritmo.js`](src/client/PlanificacionAlgoritmo.js) |
| 487 | [`PlanificacionMapeoRecetas.vue`](src/components/planificacion/PlanificacionMapeoRecetas.vue) | Wizard grande; separar sub-componentes de tabla/mapeo |
| 446 | [`ClienteList.vue`](src/components/clientes/ClienteList.vue) | Tabla + filtrado/orden + formato inline |
| 402 | [`ProduccionPage.vue`](src/pages/ProduccionPage.vue) | Template + reconciliación planificado vs producido (L164-217) → mover a `ProduccionClient`/servicio |
| 396 | [`PlanificacionOperadorCard.vue`](src/components/planificacion/PlanificacionOperadorCard.vue) | Display + lógica local |
| 358 | [`MermaList.vue`](src/components/mermas/MermaList.vue) | Tabla + orden + formato |
| 347 | [`ProduccionRecetasView.vue`](src/components/produccion/ProduccionRecetasView.vue) | Display + estado local |
| 332 | [`MermasPage.vue`](src/pages/MermasPage.vue) | Descuento ya delegado ✅, pero `filtrarRecursos` (L168-239) con mapeo multi-forma sigue en la página → mover a `RecetaClient`/mapper |

**Impacto esperado:** Componentes más pequeños y testeables; la lógica de negocio queda en la capa de servicios.

---

### 2.4 — Arquitectura y separación de capas

- **Prioridad:** 🟠 Media
- **Estado:** ✅ Completado

**Observaciones:**
- Estructura actual: `client/` (capa de servicios, 11 `*Client.js` + `supabase.js` + `PlanificacionAlgoritmo.js`), `components/`, `composables/`, `pages/`, `router/`, `utils/`. **No existe `stores/`**.
- El estado global se maneja de forma ad-hoc: refs a nivel de módulo en [`useCatalogos.js`](src/composables/useCatalogos.js#L9-L14) (caché) y [`useAuth.js`](src/composables/useAuth.js#L12) + `sessionStorage`. `useCatalogos` funciona como un "store" hecho a mano.
- Lógica de negocio que aún vive en páginas y debería estar en `client/` (ver [§2.3](#23--refactorización-de-componentes-grandes)).

**Propuesta de solución:**
1. Decidir explícitamente: mantener `useCatalogos`/`useAuth` como stores ligeros (documentarlo) **o** introducir Pinia si el estado crece. Para el alcance de tesis, mantener el patrón actual y documentarlo es aceptable.
2. **Conectar `useCatalogos.invalidar()` al logout** (hoy la función existe pero nunca se llama → ver [§3.1](#31--código-muerto-métodos-exportados-sin-uso)). En [`useAuth.logout()`](src/composables/useAuth.js#L35) invalidar el caché para evitar datos stale del usuario anterior.
3. Renombrar conceptualmente `client/` → capa de "servicios" en la documentación (o alias) para que el rol quede claro.

**Impacto esperado:** Capas con responsabilidades claras y estado global sin fugas entre sesiones.

---

### 2.5 — Robustez: errores silenciosos y transaccionalidad

#### 2.5.1 Errores silenciosos en MermaClient
- **Prioridad:** 🟠 Media · **Estado:** ❌ Pendiente
- **Archivo:** [`MermaClient.js` L203-231](src/client/MermaClient.js#L203-L231)
- **Problema:** los `catch (e) { /* silencioso */ }` hacen que, si falla un descuento de inventario, la merma se registra pero el stock no se actualiza y el usuario no se entera.
- **Solución:** loguear el error y ajustar el mensaje de retorno: `mensajeExito = '⚠️ Merma registrada pero hubo un error al descontar inventario. Verifica el stock manualmente.'`
- **Impacto esperado:** El usuario detecta descuentos parciales.

#### 2.5.2 Falta de transaccionalidad en sincronización de pedidos
- **Prioridad:** 🟠 Media · **Estado:** ❌ Pendiente *(se mantiene Pendiente de forma explícita)*
- **Archivo:** [`PedidoClient.js` L224-232](src/client/PedidoClient.js#L224-L232)
- **Problema:** la sincronización hace `DELETE ... .in('pedido_id', pedidoIds)` seguido de `upsert`. Si el delete tiene éxito pero el upsert falla (red/timeout), los pedidos quedan sin detalles.
- **Solución:** para producción, envolver en una función RPC de Supabase (transacción). En el entorno de tesis es aceptable como **limitación documentada**.
- **Impacto esperado:** Integridad garantizada de cabecera + detalles de pedido.

---

## 3. Prioridad Baja 🟢

### 3.1 — Código muerto (métodos exportados sin uso)

- **Prioridad:** 🟢 Baja · **Estado:** ✅ Completado
- Métodos definidos y exportados pero **nunca llamados** (verificado por búsqueda global):

| Archivo | Método |
|---|---|
| [`useCatalogos.js` L64](src/composables/useCatalogos.js#L64) | `invalidar()` — dejará de ser muerto al conectarlo al logout ([§2.4](#24--arquitectura-y-separación-de-capas)) |
| [`RecetaClient.js` L142](src/client/RecetaClient.js#L142) | `actualizarReceta()` |
| [`RecetaClient.js` L216](src/client/RecetaClient.js#L216) | `eliminarReceta()` |
| [`UsuarioClient.js` L59](src/client/UsuarioClient.js#L59) | `obtenerUsuario()` |
| [`UsuarioClient.js` L76](src/client/UsuarioClient.js#L76) | `actualizarUsuario()` |
| [`PlanificacionClient.js` L7](src/client/PlanificacionClient.js#L7) | `obtenerPlanificaciones()` |
| [`PlanificacionClient.js` L212](src/client/PlanificacionClient.js#L212) | `eliminarPlanificacion()` |
| [`PlanificacionAlgoritmo.js` L39](src/client/PlanificacionAlgoritmo.js#L39) | `obtenerPedidosPendientesPorFecha()` (el helper privado sí se usa) |
| [`PedidoClient.js` L378](src/client/PedidoClient.js#L378) | `actualizarOperadorPedido()` |

- **Propuesta:** eliminar los que no tengan un uso futuro previsto. **Antes de borrar `actualizar*`/`eliminar*`**, confirmar que no forman parte de una funcionalidad planificada (CRUD futuro de usuarios/recetas). Si se planean, marcar con comentario `// reservado para X`.
- **Impacto esperado:** Menos superficie muerta y menor confusión.

### 3.2 — Variables e imports sin utilizar

- **Prioridad:** 🟢 Baja · **Estado:** ✅ Completado
- `cargandoExcel` se desestructura de `useExcel()` y se retorna en `setup()` pero **nunca se usa** (las páginas usan sus propios `cargando*`):
  - [`MaterialesPage.vue` L96/L98](src/pages/MaterialesPage.vue#L96)
  - [`MateriaPrimaPage.vue` L86/L88](src/pages/MateriaPrimaPage.vue#L86)
  - [`PedidoPage.vue` L91/L93](src/pages/PedidoPage.vue#L91)
  - *(El import de `useExcel` sigue siendo necesario por `leerExcel`; solo sobra el binding `cargandoExcel`.)*
- **Propuesta:** quitar el binding sobrante. No se encontraron imports muertos ni bloques de código comentado en `client/`, `composables/`, `pages/`, `utils/`.
- **Impacto esperado:** Código más limpio y legible.

### 3.3 — Archivos sueltos en la raíz

- **Prioridad:** 🟢 Baja · **Estado:** ❌ Pendiente
- Ninguno está referenciado en `package.json` ni por `import`:

| Archivo | Acción sugerida |
|---|---|
| `db.json` (68 KB) | **Eliminar** — base de json-server huérfana tras migrar a Supabase |
| `database_powerdesigner.sql` (9.6 KB) | Mover a `db/` |
| `database_supabase_uuid.sql` (12 KB) | Mover a `db/` |
| `generarExcelEjemplo.js` (1.5 KB) | Mover a `scripts/` |

- **Impacto esperado:** Raíz más limpia; se elimina un artefacto obsoleto.

### 3.4 — Limpieza menor (logs, breakpoints, legibilidad)

- **Prioridad:** 🟢 Baja · **Estado:** ❌ Pendiente
- **`console.log` de depuración** (20 en total): [`MaterialClient.js`](src/client/MaterialClient.js) (5), [`PedidoClient.js`](src/client/PedidoClient.js) (9), [`MateriaPrimaClient.js`](src/client/MateriaPrimaClient.js) (5), [`ProduccionClient.js`](src/client/ProduccionClient.js) (1). Retirar o envolver en un flag de entorno. *(Los `console.error` en `catch` se conservan.)*
- **Breakpoints no estándar** (el estándar es 1024/768/480): `1100px` en [`PlanificacionResumen.vue` L218](src/components/planificacion/PlanificacionResumen.vue#L218) y [`UsuariosPage.vue` L104](src/pages/UsuariosPage.vue#L104); `1200px` en [`ClientesPage.vue` L264](src/pages/ClientesPage.vue#L264) y [`DashboardEstadoPedidos.vue` L159](src/components/dashboard/DashboardEstadoPedidos.vue#L159); `900px` en [`ProduccionForm.vue` L508](src/components/produccion/ProduccionForm.vue#L508); `700px` en [`ProduccionResumen.vue` L220](src/components/produccion/ProduccionResumen.vue#L220); `600px` en [`PlanificacionMapeoRecetas.vue` L473](src/components/planificacion/PlanificacionMapeoRecetas.vue#L473). Alinear a los tokens `--bp-*` cuando sea posible.
- **Impacto esperado:** Consola de producción limpia y responsividad coherente.

---

## 4. Documentación para la Tesis 📚

Estos puntos **no requieren cambio de código**; se documentan como limitaciones de alcance del prototipo.

### 4.1 Contraseñas con hash SHA-256 sin salt
- **Archivo:** [`UsuarioClient.js` L5-19](src/client/UsuarioClient.js#L5-L19) + [`utils/crypto.js`](src/utils/crypto.js)
- La contraseña se hashea con SHA-256 en el cliente, sin **salt** (vulnerable a rainbow tables), se compara directo con `.eq('contrasena', hash)` y la sesión vive en `sessionStorage` sin verificación de servidor.
- **Acción:** documentar que en producción se usaría **Supabase Auth con JWT**.

### 4.2 Options API vs Composition API
- Todo el proyecto usa **Options API** con `setup()` solo para composables.
- **Acción:** documentar que se eligió Options API por consistencia/comprensión y que la evolución natural sería `<script setup>` (Composition API).

---

## Historial de Cambios Completados

> Recomendaciones implementadas y verificadas en esta auditoría (2026-07-24). Se retiran de la lista activa.

| # Original | Recomendación | Evidencia (verificada) |
|---|---|---|
| §1.1 | Igualar sincronizaciones al patrón PedidoClient | `forceOverwrite` eliminado (0 coincidencias). `MaterialClient` y `MateriaPrimaClient` usan upsert seguro (Map de existentes + solo actualizar cantidad). Páginas llaman `sincronizarConSupabase()` sin argumento |
| §2.1/§2.2 (client) | Unificar `cantidad_total`/`fecha_ingreso` en el mapeo | `MateriaPrimaClient.obtenerMateriaPrima()` devuelve solo `cantidadTotal` y `fechaIngreso`; `MermaForm.vue` usa `cantidadTotal`. **Nota:** quedaron consumidores rotos → ahora en [§1.3](#13--bugs-activos-por-la-migración-camelcase-incompleta) |
| §3.1 | Eliminar redefinición `.page-content-wrap` en PlanificacionPage | Redefinición scoped eliminada; usa la clase global |
| §3.2 | Eliminar clases de feedback hardcoded | `.msg-feedback/.msg-exito/.msg-error/.msg-info` scoped eliminadas; solo quedan estilos de transición |
| §3.4 | Centralizar `.page-grid` | `.page-grid` definido en `style.css:332`; `ProduccionPage` usa modificador `.page-grid-produccion` |
| §4.1 | Eliminar `obtenerClientesFacturacion()` muerto | Método inexistente (0 referencias) |
| §4.2 | Limpiar `<style scoped>` vacíos | 0 tags vacíos en todo `src/` |

### Recomendaciones que ya no aplican

| # Original | Razón |
|---|---|
| §3.3 (PlanificacionPage 1100px) | Ese caso puntual quedó en 768px. El 1100px persiste en OTROS archivos → reclasificado como limpieza en [§3.4](#34--limpieza-menor-logs-breakpoints-legibilidad) |
| §5.3 (crear `invalidar()`) | La función **ya fue creada** en `useCatalogos.js`. Lo pendiente ahora no es crearla sino **conectarla al logout** ([§2.4](#24--arquitectura-y-separación-de-capas)); mientras tanto es código muerto ([§3.1](#31--código-muerto-métodos-exportados-sin-uso)) |
| §5.4 (crear `useErrorHandler`) | Reformulado como `useAsyncAction` dentro de la centralización de código ([§2.1](#21--centralización-de-código-composablesserviciosutils)) |

---

## Tabla Resumen de Prioridades

| # | Cambio | Prioridad | Impacto | Esfuerzo | Estado |
|---|---|---|---|---|---|
| 1.1 | Eliminar botón "Eliminar" de Materiales | 🔴 Alta | Integridad / UX | 🟢 15 min | ❌ |
| 1.2 | Estandarizar frontend a camelCase | 🔴 Alta | Mantenibilidad | 🔴 3-5 hrs | 🟡 |
| 1.3 | Corregir bugs de migración camelCase (stock merma + fecha ingreso) | 🔴 Alta | **Integridad de datos** | 🟢 15 min | ❌ |
| 1.4 | Centralizar mapeo snake↔camel (`utils/mapper.js`) | 🔴 Alta | Mantenibilidad | 🟡 2-3 hrs | ❌ |
| 2.1 | Centralizar código (`useAsyncAction`, Excel, fechas, mensajes) | 🟠 Media | Mantenibilidad | 🟡 2-3 hrs | ❌ |
| 2.2 | Centralizar estilos (botones, cabeceras, `--alert-*`, badges) | 🟠 Media | Consistencia diseño | 🟡 2 hrs | 🟡 |
| 2.3 | Refactorizar componentes >300 líneas | 🟠 Media | Mantenibilidad | 🔴 4-6 hrs | ❌ |
| 2.4 | Arquitectura + conectar `invalidar()` al logout | 🟠 Media | Robustez estado | 🟡 1 hr | ✅ |
| 2.5.1 | Errores silenciosos en MermaClient | 🟠 Media | Robustez | 🟢 15 min | ❌ |
| 2.5.2 | Transaccionalidad en pedidos | 🟠 Media | Integridad | 🟢 doc | ❌ |
| 3.1 | Eliminar métodos exportados sin uso | 🟢 Baja | Limpieza | 🟢 20 min | ✅ |
| 3.2 | Quitar binding `cargandoExcel` sin uso | 🟢 Baja | Limpieza | 🟢 5 min | ✅ |
| 3.3 | Reubicar/eliminar archivos de la raíz | 🟢 Baja | Orden | 🟢 10 min | ❌ |
| 3.4 | Limpiar `console.log` y breakpoints | 🟢 Baja | Limpieza | 🟢 20 min | ❌ |
| 4.x | Documentación tesis (SHA-256, Options API) | 📚 | Tesis | 🟢 doc | 🟢 |

---

> **Nota final:** El orden sugerido de ejecución es 1.3 → 1.1 → 1.4 → 1.2 → 2.x → 3.x. Se recomienda **corregir primero los bugs de integridad (1.3)** y el mapeo centralizado (1.4) antes de la renombrada masiva a camelCase (1.2), porque 1.4 elimina gran parte del trabajo manual de 1.2. Los cambios 🔴 Alta afectan integridad de datos y arquitectura; los 🟠 Media mejoran mantenibilidad; los 🟢 Baja son limpieza.
