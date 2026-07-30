# Plan de Trabajo Oficial — MMS App

> Auditoría integral del proyecto Vue 3 + Vite + Supabase para gestión de producción florícola.
> Fecha original: 2026-07-22
> Última auditoría: **2026-07-29**
>
> Este documento es el **plan de trabajo oficial**. Cada recomendación incluye: prioridad, archivos afectados,
> descripción del problema, propuesta de solución, impacto esperado y estado.
> Las recomendaciones ya implementadas se movieron al [Historial de Cambios](#historial-de-cambios-completados).

---

## Cómo leer este documento

**Estados:** ✅ Completado · 🟡 Parcial · ❌ Pendiente · 🚫 Ya no aplica

**Orden de implementación recomendado:** el documento está ordenado para atacar primero lo que afecta
**integridad de datos y arquitectura/mantenibilidad**, y solo después agregar nuevas funcionalidades:

1. 🔴🔴 **Crítica** — Bugs activos que afectan la operación diaria (conteo de pedidos, estados)
2. 🔴 **Alta** — Bugs de datos + estandarización de naming/mapeo (base sobre la que se apoya todo lo demás)
3. 🟠 **Media** — Centralización de código y estilos, refactor de componentes, arquitectura
4. 🟢 **Baja** — Limpieza de código muerto, imports, legibilidad
5. 📚 **Documentación** para la tesis

---

## Tabla de Contenidos

- [0. Prioridad Crítica 🔴🔴 — Bugs de Pedidos](#0-prioridad-crítica--bugs-de-pedidos)
  - [0.1 Conteo incorrecto de pedidos pendientes en Dashboard](#01--conteo-incorrecto-de-pedidos-pendientes-en-dashboard)
  - [0.2 `autoCompletarPedidos` sobreescribe `fecha_pedido`](#02--autocompletarpedidos-sobreescribe-fecha_pedido)
  - [0.3 Pedidos no cambian a "Completado" tras producción](#03--pedidos-no-cambian-a-completado-tras-producción)
- [1. Prioridad Alta 🔴](#1-prioridad-alta-)
  - [1.1 Eliminar el botón "Eliminar" del módulo de Materiales](#11--eliminar-el-botón-eliminar-del-módulo-de-materiales)
  - [1.2 Estandarizar todo el frontend a camelCase](#12--estandarizar-todo-el-frontend-a-camelcase)
  - [1.3 Centralizar el mapeo de datos (snake_case ↔ camelCase)](#13--centralizar-el-mapeo-de-datos-snake_case--camelcase)
- [2. Prioridad Media 🟠](#2-prioridad-media-)
  - [2.1 Centralización de código (composables/servicios/utils)](#21--centralización-de-código-composablesserviciosutils)
  - [2.2 Centralización de estilos CSS](#22--centralización-de-estilos-css)
  - [2.3 Refactorización de componentes grandes](#23--refactorización-de-componentes-grandes)
  - [2.4 Robustez: errores silenciosos y transaccionalidad](#24--robustez-errores-silenciosos-y-transaccionalidad)
  - [2.5 Refactorizar `DashboardClient.js` monolítico](#25--refactorizar-dashboardclientjs-monolítico)
  - [2.6 Extraer lógica de planificación en ProduccionPage](#26--extraer-lógica-de-planificación-en-produccionpage)
  - [2.7 Extraer lógica de filtrado de recursos en MermasPage](#27--extraer-lógica-de-filtrado-de-recursos-en-mermaspage)
- [3. Prioridad Baja 🟢](#3-prioridad-baja-)
  - [3.1 Archivos sueltos en la raíz](#31--archivos-sueltos-en-la-raíz)
  - [3.2 Consolidar resolución de clientes faltantes](#32--consolidar-resolución-de-clientes-faltantes)
  - [3.3 Queries duplicadas en PlanificacionClient](#33--queries-duplicadas-en-planificacionclient)
  - [3.4 Sin timeout en llamadas a APIs externas](#34--sin-timeout-en-llamadas-a-apis-externas)
- [4. Documentación para la Tesis 📚](#4-documentación-para-la-tesis-)
- [5. Historial de Cambios Completados](#historial-de-cambios-completados)
- [6. Tabla Resumen de Prioridades](#tabla-resumen-de-prioridades)

---

## 0. Prioridad Crítica 🔴🔴 — Bugs de Pedidos

> **Contexto:** Existen 208 pedidos registrados en la base de datos, pero el Dashboard solo muestra 161 pedidos pendientes. Además, los pedidos finalizados no cambian automáticamente al estado "Completado". Esta sección documenta las tres causas raíz encontradas durante la auditoría del 2026-07-29.

### 0.1 — Conteo incorrecto de pedidos pendientes en Dashboard

- **Prioridad:** 🔴🔴 Crítica
- **Estado:** ❌ Pendiente
- **Archivos afectados:**
  - [`DashboardClient.js` L12-25](src/client/DashboardClient.js#L12-L25) — query de pedidos del dashboard
  - [`DashboardClient.js` L331-342](src/client/DashboardClient.js#L331-L342) — query duplicada en `autoCompletarPedidos`

**Descripción del problema:** La query del Dashboard filtra pedidos con:
```sql
.or(`fecha_pedido.eq.${fecha},and(fecha_pedido.lt.${fecha},estado.eq.Pendiente)`)
```
Esto **solo trae**:
1. Pedidos cuya `fecha_pedido` es **exactamente hoy**, O
2. Pedidos con `fecha_pedido` **anterior a hoy** Y estado `Pendiente`

**Consecuencia:** Se excluyen pedidos con `fecha_pedido` futura (pedidos ingresados hoy pero con fecha de despacho posterior). Los ~47 pedidos faltantes (208 − 161) son probablemente pedidos con fecha futura. Además, los pedidos con estado `Completado` y fecha pasada tampoco aparecen, causando confusión sobre el total real.

**Contraste:** La tabla "Pedidos Pendientes" en `PedidoPage.vue` usa un filtro diferente que **sí** muestra todos los no-completados sin filtro de fecha:
```javascript
// PedidoPage.vue L106-108
pedidosPendientes() {
    return this.pedidosActual.filter(p => p.estado !== 'Completado');
}
```

**Propuesta de solución:**
1. Dividir las queries del dashboard en dos consultas separadas:
   - **KPI "Pedidos de Hoy"**: Solo pedidos con `fecha_pedido = hoy` (mantener para indicador de stems del día).
   - **Tabla "Estado de Pedidos"**: Todos los pendientes (`estado.eq.Pendiente`) sin filtro de fecha + los completados de hoy.
2. Opción de query corregida:
   ```javascript
   .or(`estado.eq.Pendiente,fecha_pedido.eq.${fecha}`)
   ```

**Impacto esperado:** El conteo de pedidos pendientes reflejará la realidad de la base de datos. Se cierra la discrepancia de 208 vs 161.

---

### 0.2 — `autoCompletarPedidos` sobreescribe `fecha_pedido`

- **Prioridad:** 🔴🔴 Crítica
- **Estado:** ❌ Pendiente
- **Archivos afectados:**
  - [`DashboardClient.js` L423](src/client/DashboardClient.js#L423) — update que sobreescribe la fecha

**Descripción del problema:** Al completar un pedido, la query hace:
```javascript
await supabase
    .from('pedidos')
    .update({ estado: 'Completado', fecha_pedido: fecha })
    .in('id', idsParaCompletar);
```
Esto **sobreescribe la `fecha_pedido` original** del pedido con la fecha de hoy, perdiendo la fecha real de despacho/ingreso. Si un pedido fue creado para el 2026-08-05 y se completa hoy (2026-07-29), su fecha cambia a 2026-07-29, corrompiendo el historial.

**Propuesta de solución:** Cambiar a solo actualizar el estado:
```javascript
await supabase
    .from('pedidos')
    .update({ estado: 'Completado' })
    .in('id', idsParaCompletar);
```

**Impacto esperado:** Se preserva la fecha original del pedido para reportes e historial. **Esfuerzo: 1 línea.**

---

### 0.3 — Pedidos no cambian a "Completado" tras producción

- **Prioridad:** 🔴🔴 Crítica
- **Estado:** ❌ Pendiente
- **Archivos afectados:**
  - [`ProduccionPage.vue` L228-250](src/pages/ProduccionPage.vue#L228-L250) — `guardarProduccion()` no evalúa pedidos
  - [`DashboardClient.js` L329](src/client/DashboardClient.js#L329) — `autoCompletarPedidos()` solo se invoca desde el Dashboard

**Descripción del problema:** La función `autoCompletarPedidos()` solo se invoca en [`DashboardPage.vue` L87](src/pages/DashboardPage.vue#L87) cuando alguien abre o actualiza el Dashboard. **No existe ningún trigger automático al registrar producción.** Si un operador registra producción en `ProduccionPage`, los pedidos quedan en estado `Pendiente` hasta que alguien visite el Dashboard.

**Flujo actual:**
```
Operador registra producción → Stock se descuenta ✅ → Pedidos siguen en "Pendiente" ❌
... (horas después) ...
Supervisor abre Dashboard → autoCompletarPedidos evalúa → Pedidos se marcan "Completado" ✅
```

**Propuesta de solución:** Invocar `DashboardClient.autoCompletarPedidos(obtenerFechaHoy())` al final de `ProduccionPage.guardarProduccion()` después del `await ProduccionClient.agregarProduccion(payload)`:
```javascript
// ProduccionPage.vue — dentro de guardarProduccion(), después de la línea 238
await DashboardClient.autoCompletarPedidos(obtenerFechaHoy())
```

**Impacto esperado:** Los pedidos se marcan como completados en tiempo real al registrar producción. Añade ~200ms de latencia al guardado.

---

## 1. Prioridad Alta 🔴

### 1.1 — Eliminar el botón "Eliminar" del módulo de Materiales

- **Prioridad:** 🔴 Alta
- **Estado:** ❌ Pendiente
- **Archivos afectados:**
  - [`MaterialesPage.vue` L37-38](src/pages/MaterialesPage.vue#L37-L38) — botón `🗑️` en la tabla de inventario
  - [`MaterialesPage.vue` L227-235](src/pages/MaterialesPage.vue#L227-L235) — método `eliminarMaterial(id)`
  - [`MaterialClient.js` L177-189](src/client/MaterialClient.js#L177-L189) — método `eliminarMaterial(id)`

**Descripción del problema:** El módulo de Materiales expone un botón de borrado que no se desea en el flujo actual. Eliminar un material podría dejar recetas y producciones con referencias colgantes.

**Propuesta de solución:**
1. Quitar el `<button ... @click="eliminarMaterial(item.id)">🗑️</button>` de la tabla (L37-38) y dejar solo el botón de editar `✏️`.
2. Eliminar el método `eliminarMaterial(id)` de la página (L227-235).
3. Eliminar el método `MaterialClient.eliminarMaterial(id)` (L177-189): al quitar el botón, queda **sin ninguna referencia** en el proyecto (verificado por búsqueda global), por lo que es seguro borrarlo.
4. Revisar el `<style scoped>` `.actions-column` — puede conservarse (el botón editar sigue usándolo).

**Verificación de impacto:** `eliminarMaterial` solo se referencia en esos 3 lugares. Ningún otro módulo (Recetas, Producción, Mermas) lo invoca. **No afecta otras funcionalidades.**

**Impacto esperado:** Se evita el borrado accidental de materiales y las referencias colgantes; se elimina código muerto asociado.

---

### 1.2 — Estandarizar todo el frontend a camelCase

- **Prioridad:** 🔴 Alta
- **Estado:** ✅ ~90% Completado *(actualizado 2026-07-29)*
- **Estándar único adoptado:** **camelCase** en todo el frontend (variables, propiedades, objetos, props, composables, stores, servicios, parámetros y respuestas de API ya mapeadas). El `snake_case` **solo puede existir dentro de los `*Client.js`** al leer/escribir columnas crudas de Supabase, nunca "hacia afuera".

**Estado verificado en la auditoría del 2026-07-29:**
- ✅ **Todos los archivos `.vue`** están limpios: no hay `cliente_facturacion`, `cliente_envio`, `fecha_creacion`, `operador_id`, `materia_prima_id`, `material_id` en ningún `.vue` (verificado con `grep` global).
- ✅ **Todos los `*Client.js`** mapean `snake_case → camelCase` en sus funciones de lectura.
- ✅ `usePedidoExcel.js` usa `clienteFacturacion` y `clienteEnvio` (camelCase).
- ✅ `RecetaClient.js` ya no tiene campos duplicados (`receta_materia_prima` / `receta_materiales` eliminados); solo devuelve `materiaPrima` / `materiales` en camelCase.

**Lo que queda (aceptable, contenido dentro de los Clients):**
- `creado_en` se usa en las **queries SQL** de `PlanificacionClient`, `MermaClient`, `ProduccionClient`, `ClientesClient` — correcto porque son nombres de columnas de Supabase y se mapean a `creadoEn` en el retorno.
- `cantidad_total` se usa en `ProduccionClient.js` y `DashboardClient.js` en queries directas a Supabase — correcto, son nombres de columnas DB.

**Para llegar al 100%:** Implementar §1.3 (`utils/mapper.js`) para eliminar el mapeo manual por-client.

**Impacto esperado:** Un único criterio de nombres elimina la confusión sobre "cuál campo usar" y reduce el mantenimiento de dobles versiones.

---

### 1.3 — Centralizar el mapeo de datos (snake_case ↔ camelCase)

- **Prioridad:** 🔴 Alta
- **Estado:** ❌ Pendiente
- **Archivos afectados:** todos los `src/client/*.js` (especialmente [`RecetaClient.js`](src/client/RecetaClient.js), [`ClientesClient.js`](src/client/ClientesClient.js), [`PlanificacionClient.js`](src/client/PlanificacionClient.js), [`MermaClient.js`](src/client/MermaClient.js), [`ProduccionClient.js`](src/client/ProduccionClient.js)) y un nuevo `src/utils/mapper.js`.

**Descripción del problema:** No existe ningún conversor centralizado. La conversión se hace a mano dentro de cada `.map()` de cada client. Aunque actualmente funciona de forma consistente (verificado en auditoría), el riesgo de drift por-client persiste.

**Propuesta de solución:**
1. Crear `src/utils/mapper.js` con helpers `keysToCamel(obj)` y `keysToSnake(obj)` (recursivos, respetando arrays anidados).
2. Aplicarlos en cada client: lectura → `keysToCamel`, escritura → `keysToSnake`. Así se elimina el drift por-client.

**Impacto esperado:** Fuente única de conversión, se previenen fugas futuras de snake_case y se simplifican los consumidores.

---

## 2. Prioridad Media 🟠

### 2.1 — Centralización de código (composables/servicios/utils)

- **Prioridad:** 🟠 Media
- **Estado:** ❌ Pendiente (incluye la antigua §5.4 `useErrorHandler`)

| # | Lógica repetida | Archivos | Propuesta |
|---|---|---|---|
| a | try/catch + `cargando` + `mostrarMensaje('exito'/'error')` + recarga (patrón CRUD casi idéntico en todas las páginas) | [`MaterialesPage.vue` L195-235](src/pages/MaterialesPage.vue#L195-L235), [`MateriaPrimaPage.vue` L114-220](src/pages/MateriaPrimaPage.vue#L114-L220), [`ProduccionPage.vue` L228-289](src/pages/ProduccionPage.vue), [`PlanificacionPage.vue` L144-173](src/pages/PlanificacionPage.vue), [`MermasPage.vue` L129-165](src/pages/MermasPage.vue) | Crear composable `useAsyncAction(fn, { loading, exito, error })` (equivale al antiguo `useErrorHandler`) que envuelva el patrón y unifique el manejo de errores |
| b | Normalización de claves de Excel (`key.toLowerCase().replace(/\s+/g,'')`) | [`MaterialesPage.vue` L171-174](src/pages/MaterialesPage.vue#L171-L174), [`MateriaPrimaPage.vue` L167-170](src/pages/MateriaPrimaPage.vue#L167-L170) | Mover `normalizarClaves(row)` a [`useExcel.js`](src/composables/useExcel.js) o a `utils` |
| c | `cargarInventario` + `sincronizarAPI` casi idénticos (solo cambia el client) | [`MaterialesPage.vue` L120-146](src/pages/MaterialesPage.vue#L120-L146), [`MateriaPrimaPage.vue` L114-140](src/pages/MateriaPrimaPage.vue#L114-L140) | Composable `useInventario(client, catalogosGetter)` |
| d | Formateo de fecha con implementación local en MateriaPrimaPage | [`MateriaPrimaPage.vue` L105-112](src/pages/MateriaPrimaPage.vue#L105-L112) — `formatearFecha()` como método local. [`utils/date.js`](src/utils/date.js) solo exporta `obtenerFechaHoy` | Consolidar `formatearFecha` en `utils/date.js` |
| e | `mostrarMensajeInline` reimplementando `useMensajes` | [`PlanificacionPage.vue` L139-142](src/pages/PlanificacionPage.vue#L139-L142) | Extender [`useMensajes.js`](src/composables/useMensajes.js) con soporte para mensajes inline, o reutilizar directamente |

**Impacto esperado:** Menos duplicación (~100 líneas eliminadas), un solo punto de mantenimiento para errores/mensajes/fechas/Excel.

---

### 2.2 — Centralización de estilos CSS

- **Prioridad:** 🟠 Media
- **Estado:** 🟡 Parcial (mucho ya está en [`style.css`](src/style.css); quedan duplicados y valores hardcoded)

| # | Problema | Archivos | Propuesta |
|---|---|---|---|
| a | `.btn` redefinido scoped (padding, font-size) | [`ButtonActions.vue` L66](src/components/ButtonActions.vue#L66), [`NavBar.vue` L190, L227](src/components/layout/NavBar.vue#L190), [`MermaForm.vue` L241](src/components/mermas/MermaForm.vue#L241) | Eliminar las copias scoped y usar la global de `style.css:238` |
| b | `.stats-grid` / `.stat-card` / `.stat-icon` / `.stat-info` **idénticos** (~70 líneas) | [`MermasPage.vue` L257-327](src/pages/MermasPage.vue#L257-L327), [`DashboardKPIs.vue` L50-122](src/components/dashboard/DashboardKPIs.vue#L50-L122) | Promover a `style.css` como clases globales o crear componente `StatCard.vue` reutilizable |
| c | `.badge` / `.badge-warning` / `.badge-success` / `.badge-danger` (29 líneas scoped) | [`DashboardEstadoPedidos.vue` L264-290](src/components/dashboard/DashboardEstadoPedidos.vue#L264-L290) | Mover a `style.css` junto a las globales `.badge-ok` / `.badge-error` existentes |
| d | `.badge` / `.badge-warning` (18 líneas scoped) | [`ProduccionPage.vue` L344-362](src/pages/ProduccionPage.vue#L344-L362) | Usar las clases globales de (c) |
| e | Hex hardcoded que duplican variables `--alert-*` ya definidas en `:root` | [`ProduccionPage.vue` L353-361](src/pages/ProduccionPage.vue#L353-L361) usa `#f1f5f9`, `#fef9c3`, `#a16207` | Reemplazar por `var(--alert-*)` |
| f | `.section-header` / `.section-title` / `.section-subtitle` duplicados | [`DashboardEstadoPedidos.vue`](src/components/dashboard/DashboardEstadoPedidos.vue), [`DashboardAvanceOperador.vue`](src/components/dashboard/DashboardAvanceOperador.vue) | Considerar moverlas a global (mismo patrón que `.page-header`) |

**Impacto esperado:** Diseño consistente, un único origen de verdad para botones/cabeceras/colores; cambios de tema en un solo lugar. ~140 líneas de CSS duplicado eliminadas.

---

### 2.3 — Refactorización de componentes grandes

- **Prioridad:** 🟠 Media
- **Estado:** ❌ Pendiente

**Páginas > 300 líneas con múltiples responsabilidades:**

| Líneas | Archivo | Qué mezcla / acción |
|---|---|---|
| 421 | [`PlanificacionPage.vue`](src/pages/PlanificacionPage.vue) | Template + gestión de estado del wizard + exclusión de operadores + edición manual + guardado masivo → extraer `usePlanificacionEditor()` composable |
| 389 | [`ProduccionPage.vue`](src/pages/ProduccionPage.vue) | Planificación del operador (90 líneas L127-224) + contadores de recetas + sincronización form⟷cards + CRUD producción → extraer `usePlanificacionOperador()` + `useContadorRecetas()` |
| 329 | [`MermasPage.vue`](src/pages/MermasPage.vue) | Filtrado por planificación (70 líneas L168-237) + CRUD mermas + gestión de catálogos → extraer `useFiltroRecursos()` |

**Clients > 300 líneas:**

| Líneas | Archivo | Problema |
|---|---|---|
| 429 | [`DashboardClient.js`](src/client/DashboardClient.js) | `obtenerDatosDashboard()` tiene ~310 líneas en una sola función con queries duplicadas respecto a `autoCompletarPedidos()` → ver [§2.5](#25--refactorizar-dashboardclientjs-monolítico) |
| 311 | [`ProduccionClient.js`](src/client/ProduccionClient.js) | `agregarProduccion()` tiene ~200 líneas con descuento de stock inline — funcional pero largo |

**Impacto esperado:** Componentes más pequeños y testeables; la lógica de negocio queda en la capa de servicios.

---

### 2.4 — Robustez: errores silenciosos y transaccionalidad

#### 2.4.1 Errores silenciosos en MermaClient
- **Prioridad:** 🟠 Media · **Estado:** ❌ Pendiente
- **Archivo:** [`MermaClient.js` L205-207, L221, L233](src/client/MermaClient.js#L205-L233)
- **Problema:** los `catch (e) { /* silencioso */ }` hacen que, si falla un descuento de inventario, la merma se registra pero el stock no se actualiza y el usuario no se entera.
- **Solución:** loguear el error y ajustar el mensaje de retorno: `mensajeExito = '⚠️ Merma registrada pero hubo un error al descontar inventario. Verifica el stock manualmente.'`
- **Impacto esperado:** El usuario detecta descuentos parciales.

#### 2.4.2 Falta de transaccionalidad en sincronización de pedidos
- **Prioridad:** 🟠 Media · **Estado:** ❌ Pendiente *(se mantiene Pendiente de forma explícita)*
- **Archivo:** [`PedidoClient.js` L227-232](src/client/PedidoClient.js#L227-L232)
- **Problema:** la sincronización hace `DELETE ... .in('pedido_id', pedidoIds)` seguido de `upsert`. Si el delete tiene éxito pero el upsert falla (red/timeout), los pedidos quedan sin detalles.
- **Solución:** para producción, envolver en una función RPC de Supabase (transacción). En el entorno de tesis es aceptable como **limitación documentada**.
- **Impacto esperado:** Integridad garantizada de cabecera + detalles de pedido.

---

### 2.5 — Refactorizar `DashboardClient.js` monolítico

- **Prioridad:** 🟠 Media
- **Estado:** ❌ Pendiente *(nueva, detectada 2026-07-29)*
- **Archivo:** [`DashboardClient.js`](src/client/DashboardClient.js) — 429 líneas, 17KB

**Descripción del problema:** `obtenerDatosDashboard()` es una función monolítica de ~310 líneas que:
1. Obtiene pedidos del día y atrasados (query 1)
2. Obtiene planificaciones del día (query 2)
3. Obtiene producción del día (query 3)
4. Calcula avance de operadores
5. Obtiene mermas del día (query 4)
6. Calcula motivos y top insumos
7. Carga stocks y calcula demanda
8. Genera alertas de stock

Además, `autoCompletarPedidos()` ejecuta **queries casi idénticas** a las de `obtenerDatosDashboard()` para pedidos (L331-342) y producción (L345-351).

**Propuesta de solución:**
1. Dividir en funciones privadas: `_obtenerEstadoPedidos()`, `_calcularAvanceOperadores()`, `_obtenerMermasDia()`, `_generarAlertasStock()`.
2. Compartir la obtención de pedidos/producción entre `obtenerDatosDashboard` y `autoCompletarPedidos` mediante una función común `_queryPedidosYProduccion(fecha)`.

**Impacto esperado:** Mantenibilidad, testeabilidad y eliminación de ~60 líneas de queries duplicadas.

---

### 2.6 — Extraer lógica de planificación en ProduccionPage

- **Prioridad:** 🟠 Media
- **Estado:** ❌ Pendiente *(nueva, detectada 2026-07-29)*
- **Archivo:** [`ProduccionPage.vue` L127-224](src/pages/ProduccionPage.vue#L127-L224)

**Descripción del problema:** El método `cargarPlanificacion()` tiene 90 líneas en un solo bloque que: obtiene planificaciones, filtra por hoy, calcula producción existente, inicializa contadores, carga recetas, calcula categorías, asigna progreso. Tiene 3 niveles de `try/catch` anidados.

**Propuesta de solución:** Extraer a un composable `usePlanificacionOperador()` que retorne `{ recetasPlanificadasIds, contadorRecetaPorId, categoriasRecetasAsignadas, recetaCategoriaMap, sinPlanificacion, cargarPlanificacion }`.

**Impacto esperado:** `ProduccionPage` bajaría de 389 a ~200 líneas. La lógica de planificación es reutilizable.

---

### 2.7 — Extraer lógica de filtrado de recursos en MermasPage

- **Prioridad:** 🟠 Media
- **Estado:** ❌ Pendiente *(nueva, detectada 2026-07-29)*
- **Archivo:** [`MermasPage.vue` L168-237](src/pages/MermasPage.vue#L168-L237)

**Descripción del problema:** `filtrarRecursos()` tiene 70 líneas de lógica de negocio que consulta planificaciones, resuelve recetas, extrae IDs de materias primas y materiales, y filtra listas locales. Es lógica de negocio que no debería estar en la vista.

**Propuesta de solución:** Extraer a un composable `useFiltroRecursosPorPlanificacion()` o mover a `PlanificacionClient`.

**Impacto esperado:** `MermasPage` más delgada y la lógica de filtrado reutilizable.

---

## 3. Prioridad Baja 🟢

### 3.1 — Archivos sueltos en la raíz

- **Prioridad:** 🟢 Baja · **Estado:** ❌ Pendiente
- Ninguno está referenciado en `package.json` ni por `import`:

| Archivo | Acción sugerida |
|---|---|
| `db.json` (68 KB) | **Eliminar** — base de json-server huérfana tras migrar a Supabase |
| `database_powerdesigner.sql` (9.6 KB) | Mover a `db/` |
| `database_supabase_uuid.sql` (12 KB) | Mover a `db/` |
| `generarExcelEjemplo.js` (1.5 KB) | Mover a `scripts/` |

- **Impacto esperado:** Raíz más limpia; se elimina un artefacto obsoleto.

---

### 3.2 — Consolidar resolución de clientes faltantes

- **Prioridad:** 🟢 Baja
- **Estado:** ❌ Pendiente *(nueva, detectada 2026-07-29)*
- **Archivos afectados:**
  - [`usePedidoExcel.js` L103-248](src/composables/usePedidoExcel.js#L103-L248) — `sincronizarClientes()`
  - [`PedidoClient.js` L37-117](src/client/PedidoClient.js#L37-L117) — `_resolverClientesFaltantes()`

**Descripción del problema:** Ambas funciones resuelven clientes faltantes creándolos en Supabase. La lógica es conceptualmente idéntica pero con implementaciones distintas (una usa `ClientesClient.agregarClientesMasivos`, la otra inserta directo). Esto puede llevar a inconsistencias y son ~140 líneas duplicadas.

**Propuesta de solución:** Consolidar en una sola función en `ClientesClient` o en un composable compartido.

**Impacto esperado:** Eliminación de ~140 líneas duplicadas y un único punto de mantenimiento para la resolución de clientes.

---

### 3.3 — Queries duplicadas en PlanificacionClient

- **Prioridad:** 🟢 Baja
- **Estado:** ❌ Pendiente *(nueva, detectada 2026-07-29)*
- **Archivo:** [`PlanificacionClient.js`](src/client/PlanificacionClient.js)

**Descripción del problema:** `obtenerPlanificacionesPorFecha()` (L53-94), `obtenerPlanificacionesPorOperador()` (L118-159) y el comentado `obtenerPlanificaciones()` (L6-47) comparten la misma estructura de query y mapeo. La diferencia es solo el filtro (`.eq('fecha', ...)` vs `.eq('operador_id', ...)`). Cada función tiene ~50 líneas de mapeo idéntico.

**Propuesta de solución:** Crear función privada `_queryPlanificaciones(filtros)` y reutilizar en ambas funciones públicas.

**Impacto esperado:** Eliminación de ~50 líneas de mapeo duplicado.

---

### 3.4 — Sin timeout en llamadas a APIs externas

- **Prioridad:** 🟢 Baja
- **Estado:** ❌ Pendiente *(nueva, detectada 2026-07-29)*
- **Archivos afectados:**
  - [`MaterialClient.js` L14](src/client/MaterialClient.js#L14) — `axios.get(API_URL)` sin timeout
  - [`PedidoClient.js` L162](src/client/PedidoClient.js#L162) — `axios.get(API_URL)` sin timeout

**Descripción del problema:** Las funciones de sincronización con APIs externas (puertos 8060, 8090) usan `axios.get()` sin timeout ni retry. Si la API externa está caída, la UI se queda esperando indefinidamente mostrando "⚡ Sincronizando...".

**Propuesta de solución:** Configurar `axios` con timeout de 10s:
```javascript
const response = await axios.get(API_URL, { timeout: 10000 });
```

**Impacto esperado:** Mejor UX cuando las APIs externas no están disponibles. **Esfuerzo: 2 líneas.**

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

> Recomendaciones implementadas y verificadas. Se retiran de la lista activa.

### Verificados en auditoría 2026-07-24

| # Original | Recomendación | Evidencia (verificada) |
|---|---|---|
| §1.1 (antigua) | Igualar sincronizaciones al patrón PedidoClient | `forceOverwrite` eliminado (0 coincidencias). `MaterialClient` y `MateriaPrimaClient` usan upsert seguro (Map de existentes + solo actualizar cantidad). Páginas llaman `sincronizarConSupabase()` sin argumento |
| §2.1/§2.2 (antigua) | Unificar `cantidad_total`/`fecha_ingreso` en el mapeo | `MateriaPrimaClient.obtenerMateriaPrima()` devuelve solo `cantidadTotal` y `fechaIngreso`; `MermaForm.vue` usa `cantidadTotal` |
| §3.1 (antigua) | Eliminar redefinición `.page-content-wrap` en PlanificacionPage | Redefinición scoped eliminada; usa la clase global |
| §3.2 (antigua) | Eliminar clases de feedback hardcoded | `.msg-feedback/.msg-exito/.msg-error/.msg-info` scoped eliminadas; solo quedan estilos de transición |
| §3.4 (antigua) | Centralizar `.page-grid` | `.page-grid` definido en `style.css:332`; `ProduccionPage` usa modificador `.page-grid-produccion` |
| §4.1 (antigua) | Eliminar `obtenerClientesFacturacion()` muerto | Método inexistente (0 referencias) |
| §4.2 (antigua) | Limpiar `<style scoped>` vacíos | 0 tags vacíos en todo `src/` |

### Verificados en auditoría 2026-07-29

| # | Recomendación | Evidencia (verificada) |
|---|---|---|
| §1.3 (antigua) Bugs camelCase | **Bug A** — stock merma: `MermaClient.registrarMermaConDescuento()` L200 usa `mp.cantidadTotal` ✅, L217 usa `mpItem.cantidadTotal` ✅. **Bug B** — fecha ingreso: `MateriaPrimaPage.vue` L34 usa `formatearFecha(item.fechaIngreso)` ✅ | Ambos bugs corregidos |
| §2.4 (antigua) Arquitectura | `useCatalogos.invalidar()` se invoca desde `useAuth.logout()` en L46-47 ✅. Estructura de capas `client/`, `components/`, `composables/`, `pages/`, `router/`, `utils/` definida ✅ | Completado |
| §3.1 (antigua) Código muerto | Métodos muertos comentados con `// ─── RESERVADO PARA FUTURO CRUD ───`: `RecetaClient` (actualizarReceta, eliminarReceta), `PlanificacionClient` (obtenerPlanificaciones, eliminarPlanificacion), `PedidoClient` (actualizarOperadorPedido). `useCatalogos.invalidar()` ya no es código muerto (se usa en logout) ✅ | Completado |
| §3.2 (antigua) Variables sin uso | `cargandoExcel` ya no se desestructura en ninguna página. Solo existe internamente en `useExcel.js` ✅ | Completado |
| §3.4 (antigua) Console.log y breakpoints | Búsqueda global de `console.log` en `src/` devuelve **0 resultados** ✅. Solo persisten `console.error` en bloques `catch` (correcto) y `console.warn` en validaciones (correcto) | Completado |
| §1.2 (antigua) camelCase en .vue | Grep global de `cliente_facturacion`, `cliente_envio`, `fecha_creacion`, `operador_id`, `materia_prima_id`, `material_id` en archivos `.vue` devuelve **0 resultados** ✅ | ~90% completado |

### Recomendaciones que ya no aplican

| # Original | Razón |
|---|---|
| §3.3 (PlanificacionPage 1100px) | Ese caso puntual quedó en 768px. El 1100px persiste en OTROS archivos → reclasificado como limpieza en la antigua §3.4 (ahora completado) |
| §5.3 (crear `invalidar()`) | La función **ya fue creada** en `useCatalogos.js` y **conectada al logout** ✅ |
| §5.4 (crear `useErrorHandler`) | Reformulado como `useAsyncAction` dentro de la centralización de código ([§2.1](#21--centralización-de-código-composablesserviciosutils)) |
| §1.3 (antigua — bugs camelCase) | **Completado** — ambos bugs corregidos (verificado 2026-07-29) → movido al historial |

---

## Tabla Resumen de Prioridades

| # | Cambio | Prioridad | Impacto | Esfuerzo | Estado |
|---|---|---|---|---|---|
| **0.1** | **Corregir conteo de pedidos en Dashboard** | 🔴🔴 Crítica | **Integridad datos** | 🟢 30 min | ❌ |
| **0.2** | **No sobreescribir `fecha_pedido` al completar** | 🔴🔴 Crítica | **Integridad datos** | 🟢 1 línea | ❌ |
| **0.3** | **Auto-completar pedidos tras producción** | 🔴🔴 Crítica | **Operación diaria** | 🟢 15 min | ❌ |
| 1.1 | Eliminar botón "Eliminar" de Materiales | 🔴 Alta | Integridad / UX | 🟢 15 min | ❌ |
| 1.2 | Estandarizar frontend a camelCase | 🔴 Alta | Mantenibilidad | — | ✅ ~90% |
| 1.3 | Centralizar mapeo snake↔camel (`utils/mapper.js`) | 🔴 Alta | Mantenibilidad | 🟡 2-3 hrs | ❌ |
| 2.1 | Centralizar código (`useAsyncAction`, Excel, fechas, mensajes) | 🟠 Media | Mantenibilidad | 🟡 2-3 hrs | ❌ |
| 2.2 | Centralizar estilos (botones, stats, badges, `--alert-*`) | 🟠 Media | Consistencia diseño | 🟡 2 hrs | 🟡 |
| 2.3 | Refactorizar componentes >300 líneas | 🟠 Media | Mantenibilidad | 🔴 4-6 hrs | ❌ |
| 2.4.1 | Errores silenciosos en MermaClient | 🟠 Media | Robustez | 🟢 15 min | ❌ |
| 2.4.2 | Transaccionalidad en pedidos | 🟠 Media | Integridad | 🟢 doc | ❌ |
| 2.5 | Refactorizar `DashboardClient.js` monolítico | 🟠 Media | Mantenibilidad | 🟡 2 hrs | ❌ |
| 2.6 | Extraer lógica planificación de ProduccionPage | 🟠 Media | Mantenibilidad | 🟡 1-2 hrs | ❌ |
| 2.7 | Extraer lógica filtrado de MermasPage | 🟠 Media | Mantenibilidad | 🟡 1 hr | ❌ |
| 3.1 | Reubicar/eliminar archivos de la raíz | 🟢 Baja | Orden | 🟢 10 min | ❌ |
| 3.2 | Consolidar resolución de clientes | 🟢 Baja | Mantenibilidad | 🟡 1-2 hrs | ❌ |
| 3.3 | Queries duplicadas en PlanificacionClient | 🟢 Baja | Mantenibilidad | 🟢 30 min | ❌ |
| 3.4 | Timeout en llamadas a APIs externas | 🟢 Baja | Robustez/UX | 🟢 5 min | ❌ |
| 4.x | Documentación tesis (SHA-256, Options API) | 📚 | Tesis | 🟢 doc | 🟢 |

---

> **Orden sugerido de ejecución:** 0.2 → 0.1 → 0.3 → 1.1 → 1.3 → 2.x → 3.x.
> Se recomienda **corregir primero los bugs críticos de pedidos (0.x)** ya que afectan directamente la operación diaria.
> El §0.2 es un cambio de 1 línea con impacto inmediato.
> El §0.1 requiere ajustar la query del Dashboard.
> El §0.3 requiere invocar `autoCompletarPedidos` desde ProduccionPage.
> Los cambios 🔴 Alta afectan integridad de datos y arquitectura; los 🟠 Media mejoran mantenibilidad; los 🟢 Baja son limpieza.
