# Plan de Trabajo Oficial — MMS App (Auditoría #9)

> **Auditor:** Antigravity (AI Architect)
> **Fecha de última auditoría:** 2026-09-10
> **Alcance acumulado:** Auditorías 1–9. La #9 cubre: auditoría completa de cumplimiento, revisión de `style.css`, fix de bug de sincronización de inventario, y limpieza de edición en `ProduccionPage.vue`.

---

## Tabla de Contenidos

- [✅ Completado — Historial de recomendaciones resueltas](#-completado--historial-de-recomendaciones-resueltas)
- [Pendientes](#pendientes)
  - [3.1 — Constantes de duración centralizadas](#31--constantes-de-duración-centralizadas)
  - [5.2 — Refactorizar `PedidoClient.js` sin `useCatalogos`](#52--refactorizar-pedidoclientjs-sin-usecatalogos)
- [Deuda Técnica Aceptada](#deuda-técnica-aceptada)
- [Hoja de Ruta de Implementación](#hoja-de-ruta-de-implementación)
- [Registro de cambios — Auditoría #9](#registro-de-cambios--auditoría-9)

---

## ✅ Completado — Historial de recomendaciones resueltas

### Auditorías 1–4

| Recomendación | Archivo(s) afectado(s) | Notas |
|---|---|---|
| Refactorizar `useMensajes.js` — Eliminar singleton | `useMensajes.js` | Estado dentro de función (`reactive(...)`) |
| Soporte `warning` en `Alertas.vue` | `Alertas.vue` | `status-warning` existe |
| Deep clone en `RecetasPage.vue` al editar | `RecetasPage.vue` | `.map(m => ({...m}))` |
| Balance global/local CSS | General | Sin cambios significativos |

### Fase 15 (Crítica)

| Recomendación | Archivo(s) afectado(s) | Notas |
|---|---|---|
| Refactorizar `useInventario()` para recibir `mostrarMensaje` como parámetro | `useInventario.js` | L4: recibe `mostrarMensaje` como param |
| Actualizar Pages para pasar `mostrarMensaje` a `useInventario` | `MaterialesPage.vue`, `MateriaPrimaPage.vue` | Ambas pasan `mostrarMensaje` |
| Agregar `return { success: true }` en `MateriaPrimaClient.sincronizarConSupabase()` | `MateriaPrimaClient.js` | L16 y L71 |
| Agregar `return { success: true }` en `PedidoClient.sincronizarConSupabase()` | `PedidoClient.js` | L89, L147, L158 |

### Fase 16 (Media)

| Recomendación | Archivo(s) afectado(s) | Notas |
|---|---|---|
| Validación de todas las categorías > 0 en producción | `useProduccionForm.js` | L155-165: `categoriasVacias` |
| Mover título de `PlanificacionAsignacion` a `PlanificacionPage` | `PlanificacionPage.vue` | L4-11: `<header class="page-header">` |
| Envolver `sincronizarAPI()` en `PedidoPage.vue` con try/catch | `PedidoPage.vue` | L136-163 |

### Fase 17 (Limpieza)

| Recomendación | Archivo(s) afectado(s) | Notas |
|---|---|---|
| Eliminar CSS muerto de `ClientesPage.vue` | `ClientesPage.vue` | Sin `.active-filter-banner` ni `.btn-clear-filter` |
| Simplificar ternario redundante en `ProduccionForm.vue` | `ProduccionForm.vue` | L65-66 |
| Remover desestructuración de `cancelar` en `ProduccionForm.vue` | `useProduccionForm.js` | L179-189 |
| Corregir mutación directa de `mensaje` en `PlanificacionPage.vue` | `PlanificacionPage.vue` | Usa `mostrarMensaje(null, '')` |

### Fase 18 (Arquitectónicas) — Parcialmente completada

| Recomendación | Archivo(s) afectado(s) | Notas |
|---|---|---|
| Extraer lógica a composable `usePlanificacion()` | `usePlanificacion.js`, `PlanificacionPage.vue` | Page reducida de ~419 a ~279 líneas |
| Agregar delay al mensaje de carga en `ProduccionRecetasView.vue` | `ProduccionRecetasView.vue` | `setTimeout` de 200ms |

### Auditoría #6 — Estilos y Alertas

| Recomendación | Archivo(s) afectado(s) | Notas |
|---|---|---|
| 1.1 — Mover inline styles de `ProduccionRecetasView.vue` a clase scoped | `ProduccionRecetasView.vue` | Usa `class="data-card recetas-view-container"` sin inline |
| 1.2 — Eliminar `<style scoped>` vacío de `MaterialesPage.vue` | `MaterialesPage.vue` | Bloque vacío eliminado |
| 3.2 — Reemplazar mutaciones directas por `mostrarMensaje(null, '')` | `MaterialesPage.vue`, `MateriaPrimaPage.vue` | Usan `limpiarDatos()` |
| 5.1 — Eliminar import no utilizado de `useCatalogos` en `DashboardClient.js` | `DashboardClient.js` | Ya no importa `useCatalogos` |
| 7.9 — Try/catch en `UsuarioClient.logout()` | `UsuarioClient.js` | L37-46 |
| 7.10 — Try/catch en `UsuarioClient.obtenerSesion()` | `UsuarioClient.js` | L49-68 |
| 7.11 — Doble llamada a `obtenerRecetas(true)` en `RecetasPage.vue` | `RecetasPage.vue` | Solo llama `cargarTodasLasRecetas(true)` |
| 8.1 — Try/catch en `UsuarioClient.logout()` | `UsuarioClient.js` | Con `return { success: false }` |
| 8.2 — Try/catch en `UsuarioClient.obtenerSesion()` | `UsuarioClient.js` | Estandarizado `{ success, data }` |
| 8.3 — Try/catch externo en `useInventario.sincronizarAPI()` | `useInventario.js` | L24-54 |

### Auditoría #7 mini — CSS Limpieza

| Recomendación | Archivo(s) afectado(s) | Notas |
|---|---|---|
| 11.1 — Eliminar `.msg-feedback`, `.msg-exito`, `.msg-error`, `.msg-info` | `style.css` | 0 usos, eliminadas |
| 11.2 — Eliminar `.btn-action-edit`, `.btn-action-delete` | `style.css` | Migrados a `.btn-action-ghost` |
| 11.3 — Eliminar `.section-header`, `.section-title`, `.section-subtitle` | `style.css` | 0 usos, eliminadas |
| 11.6 — Eliminar `.alert-btn` huérfana en media query | `style.css` | Referencia a clase inexistente |
| 11.7 — Reubicar Selection Panel a scoped | `RecetaMateriaPrimaList.vue`, `RecetaMaterialesList.vue` | Movido a scoped |
| 11.8 — Reubicar `.custom-scrollbar` a scoped | `ProduccionRecetasView.vue` | Movido a scoped |
| 11.9 — Unificar `.badge-ok`/`.badge-success` y `.badge-error`/`.badge-danger` | `style.css`, componentes | Unificados |
| 11.10 — Unificar `.actions-col`/`.actions-column`/`.actions-header` | `style.css` | Solo `.actions-col` queda |
| 11.11 — Definir `--shadow-md` en `:root` | `style.css` | L23: `--shadow-md` definida |

### Auditoría #7 mini — Falsos positivos corregidos

| Recomendación original | Resolución |
|---|---|
| 11.4 — Eliminar `.data-card-header.neutral` | 🗑️ Falso positivo — en uso en `MermaList.vue`, `ClienteList.vue` |
| 11.5 — Eliminar `.stat-card.simple` | 🗑️ Falso positivo — en uso en `ProduccionForm.vue` |

### Fases 19–22

| Recomendación | Archivo(s) afectado(s) | Notas |
|---|---|---|
| Fase 19: Try/catch `UsuarioClient.obtenerSesion()` | `UsuarioClient.js` | ✅ |
| Fase 20: Mutaciones, style vacío, inline styles, import, doble llamada, try/catch | Múltiples | ✅ 7 tareas completadas |
| Fase 21: Estandarización contenedores | — | Descartado por decisión de usuario (se mantiene `<div>`) |
| Fase 22: CSS limpieza completa | `style.css` | ✅ 8 completadas, 2 falsos positivos |

### Fase 23 — Validación de Unicidad de Producción

| Recomendación | Archivo(s) afectado(s) | Notas |
|---|---|---|
| 12.1 — Método `existeProduccion(operadorId, fecha)` | `ProduccionClient.js` | L41-56 |
| 12.1 — Bloquear guardado en frontend | `ProduccionPage.vue` | Validación antes de la RPC |
| 12.1 — Constraint `UNIQUE(operador_id, fecha)` en BD | Migración SQL | Índice creado |
| 12.1 — Manejar error 23505 como fallback | `ProduccionClient.js` | L70-72, L114-116 |

### Auditoría #8 — Sincronización de stems

| Recomendación | Archivo(s) afectado(s) | Notas |
|---|---|---|
| 12.2 — Verificación de sincronización de stems | `MaterialClient.js`, `MateriaPrimaClient.js`, `PedidoClient.js` | Los 3 módulos cumplen correctamente |

### Auditoría #9 — CSS y limpieza

| Recomendación | Archivo(s) afectado(s) | Notas |
|---|---|---|
| `.btn-action` base (código muerto) | `style.css` L404-414 | 0 usos en componentes — eliminado |
| 4.1 — Resaltado visual de categorías vacías | `ProduccionForm.vue` L39 | `.category-error` con borde rojo implementado |
| 10.1 — Unificar nombre columna acciones | `style.css`, componentes | Solo `.actions-col` queda, completado |
| Limpieza de edición en `ProduccionPage.vue` | `ProduccionPage.vue` | Ver [Registro de cambios](#registro-de-cambios--auditoría-9) |
| Fix bug sincronización inventario | `MaterialClient.js`, `MateriaPrimaClient.js` | Ver [Registro de cambios](#registro-de-cambios--auditoría-9) |

---

## Pendientes

### 3.1 — Constantes de duración centralizadas

**Estado:** ❌ Pendiente | **Prioridad:** 🟢 Baja

`useMensajes.js` L7 usa `4000` hardcoded y L15 usa `5000` hardcoded. Sería bueno extraer a constantes como `DURACION_EXITO`, `DURACION_ERROR`, etc.

### 5.2 — Refactorizar `PedidoClient.js` sin `useCatalogos`

**Estado:** ❌ Pendiente (deuda aceptada) | **Prioridad:** 🟢 Baja

`PedidoClient.js` sigue invocando `useCatalogos()` en L6, L17, L68, L94, L172. Funciona por diseño de promesas globales de módulo, pero rompe el patrón de no usar composables dentro de clients.

---

## Deuda Técnica Aceptada (No planificada)

| Deuda | Razón |
|---|---|
| Doble carga en `MermasPage.vue` post-registro (7.7) | Funciona correctamente — `MermasPage.vue` L145-166 actualiza stocks localmente Y llama `cargarDatos()`. La simplificación es de bajo impacto |
| `useCatalogos()` dentro de `PedidoClient.js` (5.2) | Funciona por diseño de promesas globales, refactorizar tendría alto costo |
| Duplicación de `autoCompletarPedidos` (7.8) | Descartada intencionalmente en Auditoría #4 — se usa en `DashboardPage.vue` L96 y `ProduccionPage.vue` L182 |
| Estandarización de estados vacíos/cargando en tablas (10.2, 10.3) | Variantes coexisten sin bugs, unificar requiere testing extensivo |
| Constantes centralizadas de duración (3.1) | Funciona con valores por defecto, bajo impacto |

---

## Hoja de Ruta de Implementación

### Resumen de estado post-auditoría #9

| Categoría | Total tareas | Completadas | Pendientes |
|---|---|---|---|
| Fase 15 (Crítica) | 4 | ✅ 4 | 0 |
| Fase 16 (Media) | 3 | ✅ 3 | 0 |
| Fase 17 (Limpieza) | 5 | ✅ 5 | 0 |
| Fase 18 (Arquitectónica) | 5 | ✅ 3, 🟡 2 | 2 (deuda aceptada) |
| Auditoría #6 | 14 | ✅ 14 | 0 |
| Auditoría #7 mini — CSS | 11 | ✅ 9, 🗑️ 2 | 0 |
| Auditoría #8 | 2 | ✅ 2 | 0 |
| **Auditoría #9 (nueva)** | **5** | ✅ **5** | **0** |

### Fases 15–23 — ✅ TODAS COMPLETADAS

Todas las fases de implementación (15–23) están completadas. No hay tareas pendientes en fases activas.

### Fase 24 — ✅ Auditoría #9 (Actual)

| Tarea | Archivo | Prioridad | Estado |
|---|---|---|---|
| [x] Fix bug sincronización materiales (suma en vez de reemplazo) | `MaterialClient.js` | 🔴 Crítica | ✅ |
| [x] Fix bug sincronización materia prima (suma en vez de reemplazo) | `MateriaPrimaClient.js` | 🔴 Crítica | ✅ |
| [x] Eliminar `.btn-action` código muerto | `style.css` | 🟢 Baja | ✅ |
| [x] Limpieza de edición en `ProduccionPage.vue` | `ProduccionPage.vue` | 🟡 Media | ✅ |
| [x] Auditar y actualizar `RECOMENDACIONES.md` | `RECOMENDACIONES.md` | 🟡 Media | ✅ |

---

## Registro de cambios — Auditoría #9

> **Fecha:** 2026-09-10

### 🔴 Fix: Bug de sincronización de materiales y materia prima

**Problema:** Al sincronizar/actualizar el stock de materiales o materia prima, el sistema **reemplazaba** la cantidad en vez de **sumarla** al stock existente.

**Ejemplo del bug:**
- Día 1: se sincronizan 100 unidades → stock queda en 100
- Día 2: sobraron 30 del día anterior y se sincronizan 100 nuevas → debía quedar en **130**, pero quedaba en **100**

**Archivos modificados:**

| Archivo | Línea | Antes | Después |
|---|---|---|---|
| `MaterialClient.js` | L43 | `cantidad: cantidadExterna` | `cantidad: (actual.cantidad \|\| 0) + cantidadExterna` |
| `MateriaPrimaClient.js` | L46 | `cantidad_total: externaCantidad` | `cantidad_total: (actual.cantidad_total \|\| 0) + externaCantidad` |

**Flujos NO afectados (se mantienen como reemplazo intencional):**
- `cargarMateriales()` / `cargarMateriaPrima()` — Import manual desde Excel
- `actualizarStockMaterial()` / `actualizarStockMateriaPrima()` — Corrección manual de inventario

### 🟡 Limpieza: Edición en `ProduccionPage.vue`

**Lo que se eliminó de la Page:**

| Elemento eliminado | Ubicación original |
|---|---|
| `produccionEnEdicion` en `data()` | L108 |
| `:edicion="produccionEnEdicion"` prop en template | L24 |
| `@cancelar="produccionEnEdicion = null"` en template | L28 |
| `this.produccionEnEdicion = null` en watcher | L121 |
| `this.produccionEnEdicion = null` en `guardarProduccion()` | L177 |
| Branch `if (payload.id)` → `editarProduccion` en `guardarProduccion()` | L157-168 |
| Mensaje condicional `payload.id ? 'actualizada' : 'registrada'` | L174 |
| Método `editarProduccion(p)` completo | L206-214 |
| Método `eliminarProduccion(p)` completo | L216-229 |

**Lo que se conservó intacto en el Client:**
- `ProduccionClient.editarProduccion()` — `ProduccionClient.js` L77-118
- `ProduccionClient.eliminarProduccion()` — `ProduccionClient.js` L121-134
- Prop `edicion` en `ProduccionForm.vue` — componente reutilizable

### 🟢 CSS: Eliminación de código muerto

`.btn-action` y `.btn-action:hover` eliminados de `style.css` (L404-414). Tenían 0 usos en componentes — solo `.btn-action-ghost` se usa en la app.

### 📋 Observaciones de `style.css` (Auditoría #9)

| Categoría | Estado |
|---|---|
| Variables/colores consistentes en `:root` | ✅ Todas usan variables, sin colores hardcoded en clases globales |
| Dark mode | ✅ `prefers-color-scheme: dark` cubre tokens principales |
| Responsive (breakpoints) | ✅ 1024px, 768px, 480px para layouts principales |
| Sin `!important` | ✅ Cero `!important` en `style.css` |
| Nomenclatura consistente | ✅ Patrón BEM-ish: `data-card-header`, `btn-action-ghost`, etc. |
| Sin selectores duplicados | ✅ |
| Sin reglas muertas | ✅ (`.btn-action` era la última — eliminada) |
| Unidades consistentes | ✅ `px` para tamaños fijos, `rem`/`clamp` para tipografía |
