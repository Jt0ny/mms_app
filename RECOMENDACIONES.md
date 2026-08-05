# Plan de Trabajo Oficial — MMS App

> **Auditor:** Arquitecto de Software Senior
> **Fecha original:** 2026-07-22
> **Última auditoría:** 2026-08-03
> **Alcance:** Todo el proyecto Vue 3 + Vite + Supabase

---

## Tabla de Contenidos

- [Fase 1: Verificación de RECOMENDACIONES.md](#fase-1-verificación-de-recomendacionesmd)
- [Fase 2: Auditoría Completa](#fase-2-auditoría-completa)
  - [Prioridad Máxima: Bugs Detectados](#prioridad-máxima-bugs-detectados)
  - [1. Arquitectura](#1-arquitectura)
  - [2. Consistencia Options API / Composition API](#2-consistencia-options-api--composition-api)
  - [3. Revisión de Composables](#3-revisión-de-composables)
  - [4. Manejo de Errores](#4-manejo-de-errores)
  - [5. Consistencia del Código](#5-consistencia-del-código)
  - [6. Refactorización](#6-refactorización)
  - [7. Estilos](#7-estilos)
  - [Nuevas Recomendaciones](#nuevas-recomendaciones)
- [Hoja de Ruta Priorizada](#hoja-de-ruta-priorizada)

---

## Fase 1: Verificación de RECOMENDACIONES.md

He verificado cada punto del documento contra el código actual. A continuación, el estado real de cada recomendación:

### Sección 0 — Prioridad Crítica (Bugs de Pedidos)

| # | Recomendación | Estado Marcado | Estado Real | Evidencia |
|---|---|---|---|---|
| **0.1** | Conteo incorrecto de pedidos en Dashboard | ❌ Pendiente | ✅ **Completado** | `DashboardClient.js`: La query ahora usa `.or(...)`, que trae todos los pendientes sin filtro de fecha + completados hoy. |
| **0.2** | `autoCompletarPedidos` sobreescribe `fecha_pedido` | ❌ Pendiente | ✅ **Completado** | `DashboardClient.js`: El update ahora es `.update({ estado: 'Completado', fecha_completado: fecha })` — ya no toca `fecha_pedido`. |
| **0.3** | Pedidos no cambian a "Completado" tras producción | ❌ Pendiente | ✅ **Completado** | `ProduccionPage.vue`: `await DashboardClient.autoCompletarPedidos(...)` se invoca al final de `guardarProduccion()`. |

---

### Sección 1 — Prioridad Alta

| # | Recomendación | Estado Marcado | Estado Real | Evidencia |
|---|---|---|---|---|
| **1.1** | Eliminar botón "Eliminar" de Materiales | ❌ Pendiente | ❌ **Pendiente** | `MaterialesPage.vue`: El botón 🗑️ sigue presente. `MaterialClient.js`: `eliminarMaterial()` sigue existiendo. |
| **1.2** | Estandarizar frontend a camelCase | ✅ ~90% | ✅ **~90% Completado** | Grep de snake_case en archivos `.vue` devuelve **0 resultados**. El snake_case solo vive dentro de los `*Client.js`. Correcto. |
| **1.3** | Centralizar mapeo snake↔camel | ❌ Pendiente | ❌ **Pendiente** | No existe `src/utils/mapper.js`. Cada client sigue haciendo mapeo manual en sus `.map()`. |

---

### Sección 2 — Prioridad Media

| # | Recomendación | Estado Marcado | Estado Real | Evidencia |
|---|---|---|---|---|
| **2.1** | Centralización de código | ❌ Pendiente | 🟡 **Parcialmente implementado** | **2.1c** (`useInventario`): ✅ Completado. **2.1b** (`normalizarClaves`): ✅ Completado. **2.1d** (`formatearFecha`): ✅ Completado. **2.1a** (`useAsyncAction`): ❌ Pendiente. **2.1e** (`mostrarMensajeInline`): ✅ Completado. |
| **2.2** | Centralización de estilos CSS | 🟡 Parcial | 🟡 **Parcial** | Las clases `.badge-*`, `.stat-*`, `.section-header` ya están en `style.css` global. Algunos componentes aún tienen estilos scoped duplicados. |
| **2.3** | Refactorización de componentes grandes | ❌ Pendiente | 🟡 **Parcial** | **ProduccionPage**: ✅ Se extrajo `usePlanificacionOperador` y `useContadorRecetas`. **PlanificacionPage**: Sigue en 414 líneas pero bien descompuesto. **MermasPage**: ✅ Se extrajo `useFiltroRecursos`. |
| **2.4.1** | Errores silenciosos en MermaClient | ❌ Pendiente | ✅ **Completado** | `MermaClient.js`: Los bloques catch ahora logean el error Y ajustan el `mensajeExito`. |
| **2.4.2** | Falta de transaccionalidad en pedidos | ❌ Pendiente | ❌ **Pendiente** | La sincronización en PedidoClient sigue haciendo DELETE + INSERT sin transacción. Aceptable como limitación de la tesis. |
| **2.5** | Refactorizar DashboardClient monolítico | ❌ Pendiente | ✅ **Completado** | `DashboardClient.js`: La función monolítica fue dividida en funciones privadas limpias. |
| **2.6** | Extraer lógica planificación de ProduccionPage | ❌ Pendiente | ✅ **Completado** | Existe `usePlanificacionOperador.js` que encapsula la lógica. |
| **2.7** | Extraer lógica filtrado de MermasPage | ❌ Pendiente | ✅ **Completado** | Existe `useFiltroRecursos.js` que encapsula el filtrado. |

---

### Sección 3 — Prioridad Baja

| # | Recomendación | Estado Marcado | Estado Real | Evidencia |
|---|---|---|---|---|
| **3.1** | Archivos sueltos en la raíz | ❌ Pendiente | ❌ **Pendiente** | `db.json`, `database_powerdesigner.sql`, `database_supabase_uuid.sql`, `generarExcelEjemplo.js` siguen en la raíz. |
| **3.2** | Consolidar resolución de clientes faltantes | ❌ Pendiente | ✅ **Completado** | `ClientesClient.js`: `resolverClientesDePedidos()` centraliza la lógica. |
| **3.3** | Queries duplicadas en PlanificacionClient | ❌ Pendiente | ✅ **Completado** | Existe `_queryPlanificaciones` reutilizada por las otras funciones. |
| **3.4** | Timeout en llamadas a APIs externas | ❌ Pendiente | ❌ **Pendiente** | `axios.get()` se usa sin timeout en las sincronizaciones externas. |

---

### Sección 4 — Documentación

| # | Recomendación | Estado Marcado | Estado Real |
|---|---|---|---|
| **4.1** | Contraseñas SHA-256 sin salt | 🟢 doc | 🟢 **Mantener como documentación** |
| **4.2** | Options API vs Composition API | 🟢 doc | 🟢 **Documentado en** ARCHITECTURE.md |

---

### Resumen de Verificación

| Estado | Cantidad |
|---|---|
| ✅ Completado (código verificado) | **12** (0.1, 0.2, 0.3, 2.1bde, 2.4.1, 2.5, 2.6, 2.7, 3.2, 3.3) |
| 🟡 Parcialmente implementado | **3** (1.2, 2.1, 2.2, 2.3) |
| ❌ Pendiente | **5** (1.1, 1.3, 2.4.2, 3.1, 3.4) |
| 🚫 Ya no aplica | Los 4 del historial siguen correctos |

---

## Fase 2: Auditoría Completa

---

## Prioridad Máxima: Bugs Detectados

### 🔴 Problema 1 — Botones "Actualizar" de MaterialesPage y MateriaPrimaPage no refrescan datos

El flujo del botón "↻ Actualizar" emite el evento `'actualizar'` sin argumentos. En `MaterialesPage.vue` y `MateriaPrimaPage.vue`, el binding es `@actualizar="cargarInventario"`. 

Al hacer clic en "Actualizar", se llama `cargarInventario()` **sin argumentos**. Vue pasa el evento nativo (un `MouseEvent`) como primer argumento. El `obtenerDatos` recibe `forceRefresh` (el MouseEvent que es truthy) y lo pasa a `catalogos.obtenerMateriales(force)`. Esto técnicamente funciona, pero de forma accidental y muy frágil. 

**Solución:** Cambiar el binding a `@actualizar="cargarInventario(true)"` para pasar explícitamente `forceRefresh = true` y no depender de la coincidencia del `MouseEvent`.

---

### 🔴 Problema 2 — Otros botones/acciones con flujos similares

Hay **4 lugares** donde el botón "Actualizar" pasa un `MouseEvent` en lugar de `true` como `forceRefresh`. Funciona por coincidencia, pero es un patrón frágil que podría romperse si se añadiera lógica tipo `forceRefresh === true`.

- `MaterialesPage.vue` L25
- `MateriaPrimaPage.vue` L25
- `RecetasPage.vue` L26
- `RecetasPage.vue` L31

---

## 1. Arquitectura

### Evaluación General: 🟢 Buena

**Puntos positivos:**
- ✅ **Separación clara de capas**: `client/`, `composables/`, `pages/`, `components/`, `utils/`
- ✅ **Los componentes `.vue` nunca hacen queries directas a Supabase**
- ✅ **Composables actúan como store ligero** con estado compartido declarado fuera de la función
- ✅ **Organización de componentes por feature**
- ✅ **Lazy loading** de todas las páginas en el router
- ✅ **Guard de rutas** con roles bien implementado

**Puntos a mejorar:**
- Lógica de algoritmos complejos en `client/` puede afectar la legibilidad (`PlanificacionAlgoritmo.js`).
- `utils/` muy escasa.
- URLs de APIs externas (`localhost:8060`, `8070`, `8090`) están hardcoded en cada client.

---

## 2. Consistencia Options API / Composition API

### Evaluación: ✅ Consistente

El proyecto sigue un patrón **híbrido deliberado y bien documentado**:
- **Componentes `.vue`** → Options API con bloque `setup()` para inyectar composables
- **Composables** → Composition API pura

**Recomendación:** No migrar a `<script setup>`. El patrón actual es consistente, funcional y el esfuerzo de migración no aporta valor real para el alcance de una tesis.

---

## 3. Revisión de Composables

### Evaluación General: 🟢 Buenos

- **No hay lógica duplicada entre composables** — cada uno tiene una responsabilidad clara.
- **`useProduccionForm`** tiene una responsabilidad múltiple pero está fuertemente acoplada al flujo del formulario. Dividirlo introduciría complejidad sin beneficio real.
- **`useMensajes` es un singleton global**. Esto significa que si dos páginas muestran mensajes simultáneamente, se pisan. Para el uso actual (una sola vista activa) no es problema.

---

## 4. Manejo de Errores

### Evaluación: 🟡 Funcional pero con exceso de try/catch

- **try/catch necesarios:** Todos los de `client/*.js` (frontera con Supabase/Axios).
- **try/catch redundantes:** Todas las páginas repiten el patrón idéntico de `this.cargando = true`, `try { await Client.hacerAlgo() }`, `catch (e) { mostrarMensaje('error') }`, `finally`. Se repite ~15 veces.

**Propuesta:** Crear un composable `useAsyncAction()` para envolver el patrón y unificar el manejo de errores. Eliminaría ~100 líneas de código repetido.

---

## 5. Consistencia del Código

### Evaluación: 🟢 Buena con detalles menores

**Convenciones consistentes (100%):** camelCase para variables, funciones, props, etc. PascalCase para componentes. kebab-case para eventos y CSS.

**Inconsistencias menores detectadas:**
- `UsuariosPage.vue` no usa clase `.page-container` ni `.page-content-wrap`. Color hardcoded `#64748b`.
- Import de `MateriaPrimaClient` en minúscula en `MateriaPrimaPage.vue`.

---

## 6. Refactorización

### Oportunidades identificadas (priorizadas):

1. **R1:** Patrón CRUD try/catch repetido (→ `useAsyncAction`).
2. **R2:** Eliminar botón 🗑️ y código muerto de eliminar materiales (§1.1).
3. **R3:** URLs de API externas hardcoded → `.env` o `config.js`.
4. **R4:** Import inconsistente de `materiaPrimaClient`.
5. **R5:** `UsuariosPage` no sigue el patrón de layout global.

---

## 7. Estilos

### Evaluación: 🟡 Buena base pero con duplicación residual

**Puntos positivos:** Sistema de design tokens bien definido, soporte dark mode, clases globales organizadas, responsive con breakpoints consistentes.

**Duplicación residual detectada:**
- `.badge-cargando` scoped en ProduccionPage.
- Estilos vacíos `<style scoped></style>` en MermasPage.
- Color hardcoded en UsuariosPage.

**Recomendación firme: Mantener Vanilla CSS.** El proyecto ya tiene un sistema de design tokens maduro (`style.css`, 584 líneas), soporte dark mode, responsive, y clases reutilizables. Migrar a Tailwind CSS o Bootstrap requeriría reescribir todos los templates para un beneficio marginal. Para el alcance de una tesis, el costo no se justifica.

---

## Nuevas Recomendaciones

### 🔴 Alta prioridad

| # | Recomendación | Estado | Justificación |
|---|---|---|---|
| **N1** | **Fix: Pasar `forceRefresh=true` explícitamente en botones Actualizar** | ❌ Pendiente | 4 handlers pasan `MouseEvent` por coincidencia en vez de `true`. Frágil y confuso. |
| **N2** | **Eliminar botón 🗑️ y método `eliminarMaterial` (§1.1)** | ✅ Completado | Riesgo de borrar materiales con referencias colgantes. |

### 🟡 Media prioridad

| # | Recomendación | Estado | Justificación |
|---|---|---|---|
| **N3** | **Crear `useAsyncAction` composable (§2.1a)** | ✅ Completado | Centralizar el patrón try/catch repetido ~15 veces. Mejora DRY y mantenibilidad. |
| **N4** | **Agregar timeout a llamadas Axios (§3.4)** | ✅ Completado | 3 llamadas a APIs externas sin timeout. Si la API está caída, la UI se bloquea indefinidamente. |
| **N5** | **Centralizar URLs de APIs externas** | ❌ Pendiente | Mover a `.env` o `config.js`. |
| **N6** | **Crear `utils/mapper.js` (§1.3)** | ✅ Completado | Centralizar conversión snake_case ↔ camelCase. |

### 🟢 Baja prioridad

| # | Recomendación | Estado | Justificación |
|---|---|---|---|
| **N7** | **Normalizar UsuariosPage al patrón de layout global** | ✅ Completado | Es la única página que no usa `.page-container` y tiene color hardcoded. |
| **N8** | **Corregir import de `materiaPrimaClient` en MateriaPrimaPage** | ❌ Pendiente | Import en minúscula rompe la convención visual. |
| **N9** | **Reorganizar archivos sueltos de la raíz (§3.1)** | ✅ Completado | `db.json`, archivos SQL, `generarExcelEjemplo.js`. |
| **N10** | **Eliminar `<style scoped></style>` vacío en MermasPage** | ❌ Pendiente | Limpieza menor. |
| **N11** | **Mover `.badge-cargando` a estilos globales** | ✅ Completado | Evitar CSS scoped duplicado. |
| **N12** | **Documentar limitación de transaccionalidad (§2.4.2)** | ✅ Completado | Mantener como limitación documentada de la tesis. |

---

## Hoja de Ruta Priorizada

### Fase 1 — Fixes inmediatos
1. **N1** — Fix botones "Actualizar" 
2. **N2** — Eliminar botón 🗑️ de Materiales 
3. **N4** — Agregar timeout a Axios 
4. **N8** — Corregir import de MateriaPrimaClient 
5. **N10** — Eliminar style vacío 

### Fase 2 — Mejoras de mantenibilidad
6. **N5** — Centralizar URLs de APIs
7. **N3** — Crear `useAsyncAction` composable
8. **N6** — Crear `utils/mapper.js`

### Fase 3 — Limpieza y consistencia
9. **N7** — Normalizar UsuariosPage
10. **N9** — Reorganizar archivos raíz
11. **N11** — Mover `.badge-cargando` a global

### Fase 4 — Documentación
12. **N12** — Documentar limitación de transaccionalidad
