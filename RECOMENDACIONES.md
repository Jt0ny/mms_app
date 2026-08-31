# Plan de Trabajo Oficial — MMS App (Auditoría #6)

> **Auditor:** Antigravity (AI Architect)
> **Fecha de auditoría:** 2026-08-31
> **Alcance:** Auditoría completa de verificación: cumplimiento de Auditoría #5, revisión de estilos componente a componente, revisión de try/catch en todos los archivos, estandarización de `<div>`, consistencia vertical de tablas, y nuevas oportunidades.

---

## Tabla de Contenidos

- [Estado de Recomendaciones Anteriores (Auditorías 1–5)](#estado-de-recomendaciones-anteriores-auditorías-15)
- [1. Auditoría de Estilos — Verificación de Cumplimiento](#1-auditoría-de-estilos--verificación-de-cumplimiento)
- [2. Alertas en Materiales y Materia Prima — Estado](#2-alertas-en-materiales-y-materia-prima--estado)
- [3. Reporte de Tiempos de Alertas — Estado](#3-reporte-de-tiempos-de-alertas--estado)
- [4. Validación del Registro de Producciones — Estado](#4-validación-del-registro-de-producciones--estado)
- [5. Sincronización de Pedidos — Estado](#5-sincronización-de-pedidos--estado)
- [6. Títulos de Secciones / Pages — Estado](#6-títulos-de-secciones--pages--estado)
- [7. Oportunidades de Mejora — Verificación y Nuevas](#7-oportunidades-de-mejora--verificación-y-nuevas)
- [8. Revisión de try/catch y Manejo de Errores](#8-revisión-de-trycatch-y-manejo-de-errores)
- [9. Estandarización de Contenedores (Div vs Semánticos)](#9-estandarización-de-contenedores-div-vs-semánticos)
- [10. Consistencia Vertical de Tablas](#10-consistencia-vertical-de-tablas)
- [Hoja de Ruta de Implementación](#hoja-de-ruta-de-implementación)

---

## Estado de Recomendaciones Anteriores (Auditorías 1–5)

### Auditorías 1–4

| Recomendación | Estado (Auditoría #5) | Estado verificado (Auditoría #6) |
|---|---|---|
| Refactorizar `useMensajes.js` — Eliminar singleton | ✅ Corregido | ✅ **Verificado** — estado dentro de función (`useMensajes.js` L3-4: `const mensaje = reactive(...)`) |
| Soporte `warning` en `Alertas.vue` | ✅ Corregido | ✅ **Verificado** — `status-warning` existe en `Alertas.vue` |
| Deep clone en `RecetasPage.vue` al editar | ✅ Corregido | ✅ **Verificado** — `RecetasPage.vue` L124-125: `.map(m => ({...m}))` |
| Duplicación de `autoCompletarPedidos` | ⏸️ Descartada | ⏸️ **Mantenido** — sigue en `DashboardPage.vue` L96 y `ProduccionPage.vue` L174 |
| Balance global/local CSS | ✅ Mantenido | ✅ **Verificado** — sin cambios significativos |

### Auditoría #5 — Fase 15 (Crítica)

| Tarea | Estado en #5 | Estado verificado en #6 |
|---|---|---|
| Refactorizar `useInventario()` para recibir `mostrarMensaje` como parámetro | 🔴 Pendiente | ✅ **COMPLETADO** — `useInventario.js` L4 ahora recibe `mostrarMensaje` como parámetro: `export function useInventario({ obtenerDatos, sincronizar, nombreModulo, mostrarMensaje })` |
| Actualizar Pages para pasar `mostrarMensaje` a `useInventario` | 🔴 Pendiente | ✅ **COMPLETADO** — `MaterialesPage.vue` L101-106 pasa `mostrarMensaje`. `MateriaPrimaPage.vue` L90-95 pasa `mostrarMensaje`. |
| Agregar `return { success: true }` en `MateriaPrimaClient.sincronizarConSupabase()` | 🔴 Pendiente | ✅ **COMPLETADO** — `MateriaPrimaClient.js` L16: `return { success: true }` (flujo vacío), L71: `return { success: true }` (flujo con datos) |
| Agregar `return { success: true }` en `PedidoClient.sincronizarConSupabase()` | 🔴 Pendiente | ✅ **COMPLETADO** — `PedidoClient.js` L89: `return { success: true }` (flujo vacío), L147: `return { success: true }` (flujo vacío de datos), L158: `return { success: true }` (flujo exitoso) |

### Auditoría #5 — Fase 16 (Media)

| Tarea | Estado en #5 | Estado verificado en #6 |
|---|---|---|
| Validación de todas las categorías > 0 en producción | 🟠 Pendiente | ✅ **COMPLETADO** — `useProduccionForm.js` L155-165: `categoriasVacias` verifica todas las categorías |
| Mover título de `PlanificacionAsignacion` a `PlanificacionPage` | 🟠 Pendiente | ✅ **COMPLETADO** — `PlanificacionPage.vue` L4-11 contiene `<header class="page-header">` con título. `PlanificacionAsignacion.vue` solo tiene selector de fecha y botones. |
| Envolver `sincronizarAPI()` en `PedidoPage.vue` con try/catch | 🟠 Pendiente | ✅ **COMPLETADO** — `PedidoPage.vue` L136-163: `sincronizarAPI()` está envuelto en try/catch con finally |

### Auditoría #5 — Fase 17 (Limpieza)

| Tarea | Estado en #5 | Estado verificado en #6 |
|---|---|---|
| Eliminar CSS muerto de `ClientesPage.vue` | 🟢 Pendiente | ✅ **COMPLETADO** — CSS de `ClientesPage.vue` (L170-228) ya NO contiene `.active-filter-banner` ni `.btn-clear-filter` |
| Simplificar ternario redundante en `ProduccionForm.vue` L65 | 🟢 Pendiente | ✅ **COMPLETADO** — `ProduccionForm.vue` L65-66: ternario ahora es `guardando ? 'Guardando...' : (edicion ? 'Actualizar producción' : 'Registrar producción')` |
| Remover desestructuración de `cancelar` en `ProduccionForm.vue` | 🟢 Pendiente | ✅ **COMPLETADO** — `useProduccionForm.js` L179-189: retorno no incluye `cancelar` |
| Corregir mutación directa de `mensaje` en `PlanificacionPage.vue` | 🟢 Pendiente | ✅ **COMPLETADO** — `PlanificacionPage.vue` L239: usa `this.mostrarMensaje(null, '')` |

### Auditoría #5 — Fase 18 (Arquitectónicas)

| Tarea | Estado en #5 | Estado verificado en #6 |
|---|---|---|
| Extraer lógica a composable `usePlanificacion()` | 🟠 Pendiente | ✅ **COMPLETADO** — `usePlanificacion.js` existe (247 líneas). `PlanificacionPage.vue` ahora usa `usePlanificacion()` en setup() (L89-122) y delega toda la lógica de dominio. La Page pasó de ~419 líneas a ~279 líneas. |
| Refactorizar `ProduccionRecetasView` para usar `.data-card` global | 🟢 Pendiente | ⚠️ **PARCIALMENTE** — `ProduccionRecetasView.vue` L2 usa `class="data-card"` en el contenedor, pero mantiene `style="padding: 24px; border-radius: 18px;"` inline. El `border-radius` inline sobrescribe el global (12px → 18px). |
| Agregar delay al mensaje de carga en `ProduccionRecetasView.vue` | 🟢 Pendiente | ✅ **COMPLETADO** — `ProduccionRecetasView.vue` L176-178: `setTimeout` de 200ms antes de mostrar "Cargando recetas..." |
| Simplificar doble carga en `MermasPage.vue` post-registro | 🟢 Pendiente | 🟡 **NO IMPLEMENTADO** — `MermasPage.vue` L141-165: sigue actualizando stocks localmente Y llamando `this.cargarDatos()`. Se mantiene como deuda técnica menor aceptada. |
| Refactorizar `PedidoClient.js` para no usar `useCatalogos()` internamente | 🟢 Pendiente | 🟡 **NO IMPLEMENTADO** — `PedidoClient.js` L6, L17, L68, L94, L172: sigue usando `useCatalogos()` directamente. Se mantiene como deuda técnica aceptada. |

---

## 1. Auditoría de Estilos — Verificación de Cumplimiento

### Resumen de Verificación

Se revisó cada `<style scoped>` de los 40+ archivos `.vue` nuevamente. Las conclusiones de la Auditoría #5 siguen siendo válidas:

| Categoría | Estado |
|---|---|
| ✅ Estilos correctamente locales (~95%) | **Mantenido** |
| 🌐 Candidatos menores a centralización (`.no-data`, `.link-contact`) | **Sin cambios** — siguen locales, no generan deuda |
| ⚠️ `ProduccionRecetasView.vue` — inline styles | **Nuevo hallazgo** — ver detalle abajo |

### Hallazgo: Inline styles en `ProduccionRecetasView.vue`

```html
<!-- ProduccionRecetasView.vue L2 -->
<div class="data-card" style="padding: 24px; border-radius: 18px;">
```

El componente usa la clase global `.data-card` correctamente, pero **sobrescribe** `padding` y `border-radius` con estilos inline. Esto:
- ✅ Funciona correctamente
- ⚠️ Impide que los cambios globales de `.data-card` se apliquen
- ⚠️ Rompe la consistencia visual (`.data-card` global tiene `border-radius: 12px`, aquí es 18px)

### Hallazgo: `MaterialesPage.vue` tiene `<style scoped>` vacío

```html
<!-- MaterialesPage.vue L227-228 -->
<style scoped>
</style>
```

No genera problemas, pero es código muerto. Puede eliminarse.

### Recomendación

| # | Acción | Prioridad |
|---|---|---|
| 1.1 | Mover los estilos inline de `ProduccionRecetasView.vue` L2 a una clase scoped local o usar `.data-card` sin override | 🟢 Baja |
| 1.2 | Eliminar el `<style scoped>` vacío de `MaterialesPage.vue` | 🟢 Baja |

---

## 2. Alertas en Materiales y Materia Prima — Estado

### ✅ RESUELTO COMPLETAMENTE

**Causa raíz (instancias separadas de `useMensajes()`):** `useInventario()` ahora recibe `mostrarMensaje` como parámetro desde la Page que lo invoca (L4).

**Verificación directa:**

```javascript
// MaterialesPage.vue L96-106
const { mensaje, mostrarMensaje } = useMensajes()  // ← instancia de la Page
const { inventarioActual, cargandoInventario, cargarInventario, sincronizarAPI } = useInventario({
    obtenerDatos: (force) => catalogos.obtenerMateriales(force),
    sincronizar: () => MaterialClient.sincronizarConSupabase(),
    nombreModulo: 'materiales',
    mostrarMensaje  // ← SE PASA la misma instancia
})
```

**Retornos de sincronización:** `MateriaPrimaClient.sincronizarConSupabase()` ahora retorna `{ success: true }` en L16 y L71.

**No hay acciones pendientes para esta sección.**

---

## 3. Reporte de Tiempos de Alertas — Estado

### Sin cambios funcionales

La configuración de tiempos sigue siendo la misma reportada en Auditoría #5:
- `mostrarMensaje()`: **4000ms** por defecto (`useMensajes.js` L7)
- `mostrarMensajeInline()`: **5000ms** por defecto (`useMensajes.js` L15)
- No se han creado constantes centralizadas `DURACION_EXITO`, `DURACION_ERROR`, etc.

### Hallazgo menor: Mutación directa persistente

Dos Pages siguen mutando `mensaje` directamente en lugar de usar `mostrarMensaje()`:

```javascript
// MaterialesPage.vue L170-171
this.mensaje.tipo = null
this.mensaje.texto = ''

// MateriaPrimaPage.vue L163-164
this.mensaje.tipo = null
this.mensaje.texto = ''
```

Esto funciona porque `mensaje` es un `reactive`, pero rompe la encapsulación del composable.

### Recomendación

| # | Acción | Prioridad |
|---|---|---|
| 3.1 | (Sin cambios) Crear constantes de duración centralizadas | 🟢 Baja |
| 3.2 | Reemplazar mutaciones directas en `MaterialesPage.vue` L170-171 y `MateriaPrimaPage.vue` L163-164 por `this.mostrarMensaje(null, '')` | 🟢 Baja |

---

## 4. Validación del Registro de Producciones — Estado

### ✅ COMPLETADO

**Verificación directa en `useProduccionForm.js` L155-165:**

```javascript
const enviarFormulario = () => {
    const categoriasVacias = categorias.value.filter(
        categoria => obtenerCantidadNumerica(categoria) === 0
    )
    if (categoriasVacias.length > 0) {
        const nombres = categoriasVacias.join(', ')
        notificar('error', `Las siguientes categorías están vacías: ${nombres}`, 0)
        return
    }
    // ... construir payload y emitir
}
```

✅ Exige que **todas** las categorías tengan cantidad > 0.
✅ Los stems (clicks desde `ProduccionRecetasView`) **no** son obligatorios.
✅ El error es persistente (`duracion = 0`) para que el usuario lo lea.

**No se implementó el resaltado visual de categorías vacías (4.2 de Auditoría #5).** Esto permanece como mejora opcional.

### Recomendación

| # | Acción | Prioridad |
|---|---|---|
| 4.1 | (Opcional) Implementar resaltado visual de categorías vacías (borde rojo) | 🟢 Baja |

---

## 5. Sincronización de Pedidos — Estado

### ✅ Retornos corregidos (5.1)

`PedidoClient.sincronizarConSupabase()` ahora retorna `{ success: true }` en **todos** los flujos:
- L89: flujo vacío (`pedidosExternos.length === 0`)
- L147: flujo sin datos a upsert (`pedidosToUpsert.length === 0`)
- L158: flujo exitoso completo

### ✅ Try/catch en Page (5.2)

`PedidoPage.vue` L136-163: `sincronizarAPI()` envuelto en try/catch/finally que garantiza `cargandoPedidos = false`.

### 🟡 `useCatalogos()` dentro de Client (5.3) — Sin cambios

`PedidoClient.js` sigue invocando `useCatalogos()` en L6, L17, L68, L94, L172. Se mantiene como deuda técnica aceptada. Funciona porque `useCatalogos()` usa promesas de módulo (variables globales fuera de la función composable).

### Hallazgo nuevo: `DashboardClient.js` también usa `useCatalogos()`

```javascript
// DashboardClient.js L2
import { useCatalogos } from '../composables/useCatalogos.js'
```

Mismo antipatrón que `PedidoClient.js`. Sin embargo, al examinar el código actual (L1-152), **no se invoca `useCatalogos()`** dentro de ningún método de `DashboardClient`. Es un **import no utilizado**.

### Recomendación

| # | Acción | Prioridad |
|---|---|---|
| 5.1 | Eliminar el import no utilizado de `useCatalogos` en `DashboardClient.js` L2 | 🟢 Baja |
| 5.2 | (Largo plazo) Refactorizar `PedidoClient.js` para recibir catálogos como parámetro | 🟢 Baja |

---

## 6. Títulos de Secciones / Pages — Estado

### ✅ COMPLETADO

El título "Planificación" fue movido a `PlanificacionPage.vue`:

```html
<!-- PlanificacionPage.vue L4-11 -->
<header class="page-header">
    <div>
        <h1 class="page-title">Planificación</h1>
        <p class="page-subtitle">
            Selecciona una fecha y distribuye los pedidos pendientes...
        </p>
    </div>
</header>
```

`PlanificacionAsignacion.vue` ahora solo contiene el selector de fecha y botones de acción (L1-51). ✅ Correcto.

**No hay acciones pendientes para esta sección.**

---

## 7. Oportunidades de Mejora — Verificación y Nuevas

### Verificación de hallazgos previos

| # | Hallazgo (#5) | Estado (#6) |
|---|---|---|
| 7.1 | CSS muerto en `ClientesPage.vue` | ✅ **ELIMINADO** |
| 7.2 | `PlanificacionPage.vue` demasiado grande | ✅ **RESUELTO** — reducido de ~419 a ~279 líneas gracias a `usePlanificacion()` |
| 7.3 | Alerta "Cargando recetas..." innecesaria | ✅ **RESUELTO** — delay de 200ms implementado |
| 7.4 | Mutación directa de `mensaje` en `PlanificacionPage` | ✅ **RESUELTO** — usa `mostrarMensaje(null, '')` |
| 7.5 | Ternario redundante en `ProduccionForm.vue` | ✅ **RESUELTO** |
| 7.6 | `cancelar` no existente desestructurado | ✅ **RESUELTO** |
| 7.7 | Doble carga en `MermasPage.vue` | 🟡 **Sin cambios** — deuda menor aceptada |
| 7.8 | Duplicación de `autoCompletarPedidos` | ⏸️ **Mantenido** — descartada intencionalmente |

### Nuevos hallazgos

#### 🟡 7.9 — `UsuarioClient.logout()` no retorna `{ success }` ni tiene try/catch

```javascript
// UsuarioClient.js L37-39
async logout() {
    const { error } = await supabase.auth.signOut()
    if (error) console.error("Error al cerrar sesión:", error)
}
```

No retorna `{ success }` ni tiene try/catch. Si `signOut()` lanza una excepción (por ejemplo, error de red), se propagará sin manejo. Comparado con el resto de métodos del mismo client que **sí** siguen el patrón `{ success: true/false }`, es una inconsistencia.

#### 🟡 7.10 — `UsuarioClient.obtenerSesion()` no retorna `{ success }` ni tiene try/catch

```javascript
// UsuarioClient.js L43-53
async obtenerSesion() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return null
    const { data: usuario } = await supabase.from('usuarios')...
    return usuario
}
```

Retorna directamente `usuario` o `null`, mientras que todos los demás métodos retornan `{ success, data }`. No tiene try/catch.

#### 🟢 7.11 — `RecetasPage.vue` llama `obtenerRecetas(true)` y `cargarTodasLasRecetas(true)` secuencialmente

```javascript
// RecetasPage.vue L137-138 (borrarReceta)
await this.catalogos.obtenerRecetas(true)  // Force refresh cache
this.cargarTodasLasRecetas(true)           // Calls catalogos.obtenerRecetas again

// RecetasPage.vue L263-264 (guardarReceta)
await this.catalogos.obtenerRecetas(true)  // Force refresh cache
await this.cargarTodasLasRecetas(true)     // Calls catalogos.obtenerRecetas again
```

`cargarTodasLasRecetas(true)` internamente llama a `catalogos.obtenerRecetas(true)`, por lo que la primera llamada explícita es redundante. El caché se refrescará igualmente con la segunda llamada.

---

## 8. Revisión de try/catch y Manejo de Errores

### Metodología

Se revisaron **todos** los archivos que contienen `try {` para verificar:
1. Que el catch retorne un objeto `{ success: false }` consistente
2. Que los errores se registren en consola
3. Que no haya flujos sin try/catch que puedan congelar la UI

### Clients (capa de datos)

| Client | Métodos con try/catch | Patrón consistente | Problemas |
|---|---|---|---|
| `DashboardClient.js` | `obtenerDatosDashboard`, `autoCompletarPedidos` | ✅ Consistente `{ success, error }` | Ninguno |
| `MateriaPrimaClient.js` | `sincronizarConSupabase`, `obtenerMateriaPrima`, `cargarMateriaPrima`, `actualizarStockMateriaPrima` | ✅ Consistente | Ninguno |
| `MaterialClient.js` | Todos los métodos | ✅ Consistente | Ninguno |
| `MermaClient.js` | `obtenerMermas`, `agregarMerma`, `eliminarMerma`, `registrarMermaConDescuento` | ✅ Consistente | Ninguno |
| `PedidoClient.js` | `sincronizarConSupabase`, `agregarPedido`, `obtenerPedidos` | ✅ Consistente | Ninguno |
| `PlanificacionClient.js` | `_queryPlanificaciones`, `eliminarPlanificacionesPorFecha`, `crearPlanificacion` | ✅ Consistente | Ninguno |
| `RecetaClient.js` | `obtenerRecetas`, `agregarReceta`, `editarReceta`, `eliminarReceta` | ✅ Consistente | Ninguno |
| `SyncLogClient.js` | `yaSincronizadoHoy`, `registrarSync` | ✅ Consistente | Ninguno |
| `UsuarioClient.js` | `login`, `agregarUsuario`, `eliminarUsuario` | ✅ Consistente | ⚠️ `logout()` y `obtenerSesion()` NO tienen try/catch (ver 7.9, 7.10) |
| `ClienteClient.js` | Todos los métodos | ✅ Consistente | Ninguno |

### Composables

| Composable | try/catch | Problemas |
|---|---|---|
| `useExcel.js` | ✅ `leerExcel()` tiene try/catch | Ninguno |
| `usePlanificacion.js` | ✅ `distribuirAutomaticamenteBase()`, `confirmarMapeoYPlanificarBase()`, `guardarTodasBase()` | Ninguno |
| `usePedidoExcel.js` | ✅ `sincronizarClientes()` tiene try/catch | Ninguno |
| `useProduccionForm.js` | Sin try/catch interno pero emite errores vía `notificar` | ✅ Correcto — los errores de API se manejan en la Page |
| `useInventario.js` | ⚠️ Sin try/catch externo en `sincronizarAPI()` | Ver análisis abajo |

### Análisis de `useInventario.sincronizarAPI()` sin try/catch externo

```javascript
// useInventario.js L23-49
async function sincronizarAPI() {
    // ...sin try/catch...
    const response = await sincronizar()  // Si lanza excepción no capturada → crash
    // ...
}
```

Si `sincronizar()` (que es `MaterialClient.sincronizarConSupabase()` o `MateriaPrimaClient.sincronizarConSupabase()`) lanza una excepción **no atrapada internamente** (posible si `axios` falla antes del try/catch del Client), `cargandoInventario` quedaría en `true` permanentemente.

Sin embargo, los Clients **sí** tienen try/catch interno, por lo que la probabilidad es baja. El riesgo es si `axios` falla por un error de módulo no capturado (por ejemplo, `axios` no instalado, DNS resolution failure a nivel de import).

### Pages

| Page | try/catch en métodos async | Problemas |
|---|---|---|
| `PedidoPage.vue` | ✅ `sincronizarAPI()` con try/catch/finally | Ninguno |
| `ProduccionPage.vue` | ✅ `autoCompletarPedidos` en try/catch (L173-177) | Ninguno |
| `MaterialesPage.vue` | ✅ `procesarArchivo()` con try/catch | Ninguno |
| `MateriaPrimaPage.vue` | ✅ `procesarArchivo()` con try/catch | Ninguno |
| Otras Pages | No requieren try/catch — usan `response.success` pattern | ✅ Correcto |

### Recomendación

| # | Acción | Prioridad |
|---|---|---|
| 8.1 | Agregar try/catch a `UsuarioClient.logout()` con `return { success: false }` | 🟢 Baja |
| 8.2 | Agregar try/catch a `UsuarioClient.obtenerSesion()` y estandarizar retorno `{ success, data }` | 🟡 Media (podría causar pantalla en blanco si falla la sesión) |
| 8.3 | (Opcional) Agregar try/catch externo a `useInventario.sincronizarAPI()` como defensa adicional | 🟢 Baja |

---

## 9. Estandarización de Contenedores (Div vs Semánticos)

### Metodología

Se analizó el uso de etiquetas HTML semánticas (`<header>`, `<footer>`, `<section>`, `<article>`) vs `<div>` genéricos en toda la aplicación para evaluar consistencia.

### Uso de `<header>`

| Archivo | Uso | Evaluación |
|---|---|---|
| `PlanificacionPage.vue` L4 | `<header class="page-header">` | ✅ Correcto — encabezado principal de Page |
| `ProduccionPage.vue` L4 | `<header class="page-header">` | ✅ Correcto |
| `UsuariosPage.vue` L4 | `<header class="page-header">` | ✅ Correcto |
| `DashboardPage.vue` L5 | `<header class="page-header">` | ✅ Correcto |
| `MermasPage.vue` L5 | `<header class="page-header">` | ✅ Correcto |
| `ClientesPage.vue` L6 | `<div class="page-header">` | ⚠️ Inconsistencia — usa `<div>` en lugar de `<header>` |
| `PedidoPage.vue` | Sin `page-header` explícito, solo `<h1>` directo | ⚠️ Inconsistencia — no usa `<header>` |
| `MaterialesPage.vue` | Sin `page-header` explícito, solo `<h1>` directo | ⚠️ Inconsistencia — no usa `<header>` |
| `MateriaPrimaPage.vue` | Sin `page-header` explícito, solo `<h1>` directo | ⚠️ Inconsistencia — no usa `<header>` |
| `RecetasPage.vue` | Sin `page-header` explícito, solo `<h1>` directo | ⚠️ Inconsistencia — no usa `<header>` |
| `ProduccionForm.vue` L3 | `<header class="header">` | ✅ Correcto — header del componente |
| `PlanificacionOperadorCard.vue` L4 | `<header class="operadores-header">` | ✅ Correcto |
| `PlanificacionMapeoRecetas.vue` L3 | `<header class="mapeo-header">` | ✅ Correcto |

### Uso de `<section>`

Solo 1 uso: `DashboardEstadoPedidos.vue` L2: `<section class="data-card h-full">`. El resto de componentes similares usa `<div class="data-card">`. Inconsistencia menor.

### Uso de `<article>`

Usado en `ProduccionForm.vue` (stat-cards y category-rows) y `DashboardKPIs.vue` (stat-cards). ✅ Uso correcto semánticamente — representan unidades de contenido independientes.

### Uso de `<footer>`

Solo 2 usos: `ProduccionForm.vue` L59 y `PlanificacionMapeoRecetas.vue` L65. ✅ Uso correcto.

### Análisis

La **mayoría de Pages** usan un patrón consistente con `<div class="page-container">` → `<div class="page-content-wrap">` → contenido. Sin embargo, hay una inconsistencia en si el encabezado usa `<header class="page-header">` o simplemente `<h1 class="page-title">` directamente.

Esto es una inconsistencia **cosmética** que no afecta funcionalidad. Según las preferencias del usuario: "No quiero modificar elementos que tienen una función específica. El objetivo es principalmente estandarizar los contenedores."

### Recomendación

| # | Acción | Prioridad |
|---|---|---|
| 9.1 | Estandarizar las 4 Pages que no usan `<header class="page-header">` (`PedidoPage`, `MaterialesPage`, `MateriaPrimaPage`, `RecetasPage`) para que envuelvan su `<h1>` en un `<header class="page-header">` con su `<p class="page-subtitle">` correspondiente | 🟢 Baja |
| 9.2 | Cambiar `<div class="page-header">` a `<header class="page-header">` en `ClientesPage.vue` L6 | 🟢 Baja |
| 9.3 | (Opcional) Cambiar `<section>` a `<div>` en `DashboardEstadoPedidos.vue` L2 para consistencia con los demás `data-card`, o viceversa | 🟢 Baja |

---

## 10. Consistencia Vertical de Tablas

### Metodología

Se compararon las tablas de las Pages de Usuarios, Clientes y Producción para evaluar consistencia en:
- Estructura HTML (uso de `data-card`, `data-card-table`)
- Contenedor de scroll (`data-card-content`)
- Estados vacíos y de carga
- Columna de acciones

### Tablas evaluadas

| Componente | Clase contenedora | Tabla | Scroll | Estado vacío | Estado cargando | Acciones |
|---|---|---|---|---|---|---|
| `UsuarioList.vue` | `.data-card` | `.data-card-table` | `.data-card-content` (sin overflow max-height explícito) | `.table-empty-state` | `.table-loading-state` | `.actions-column` |
| `ClienteList.vue` | `.data-card.h-full` | `.data-card-table` | `.data-card-content.no-pad` | `.empty-state-card.m-5` | `.loading-state` | `.actions-col` |
| `MermaList.vue` | `.data-card.h-full` | `.data-card-table` | `.data-card-content.no-pad` | `.empty-state-card.m-5` | `.loading-state` | `.actions-col` |
| `InventarioTable.vue` | `.data-card` | `.data-card-table` | `.data-card-content` | `.table-empty-state` | `.table-loading-state` | — (delegado a slots) |
| `VistaPreviaTable.vue` | `.data-card` | `.data-card-table` | `.data-card-content.no-pad` | — | — | — |

### Inconsistencias encontradas

#### Estado vacío: 3 variantes

1. **`.table-empty-state`** — `UsuarioList`, `InventarioTable` — padding centrado, solo texto
2. **`.empty-state-card.m-5`** — `ClienteList`, `MermaList` — con icono `InboxIcon`, con borde dashed
3. **`.empty-state-card`** — Varias Pages — gradiente de fondo, borde dashed

Son ligeramente diferentes en presentación pero cumplen la misma función.

#### Estado de carga: 2 variantes

1. **`.table-loading-state`** — `UsuarioList`, `InventarioTable` — solo texto
2. **`.loading-state`** — `ClienteList`, `MermaList` — con spinner + texto

#### Columna de acciones: 2 nombres

1. **`.actions-column`** — `UsuarioList`, `MaterialesPage` (slot de InventarioTable)
2. **`.actions-col`** — `ClienteList`, `MermaList`

Ambos nombres están definidos en `style.css` L1131-1136 con el **mismo estilo**, así que no hay bug visual, solo inconsistencia de naming.

### Análisis

Las inconsistencias son **menores** y no causan bugs visuales porque:
- `actions-col` y `actions-column` comparten la misma regla CSS global
- Los estados vacíos/cargando son variantes que conviven en la app

Sin embargo, para mantenibilidad futura, sería bueno estandarizar.

### Recomendación

| # | Acción | Prioridad |
|---|---|---|
| 10.1 | Estandarizar el nombre de la columna de acciones: elegir `.actions-col` o `.actions-column` y usar uno solo | 🟢 Baja |
| 10.2 | (Opcional) Estandarizar estados vacíos: elegir entre `.table-empty-state` y `.empty-state-card` para contextos de tabla | 🟢 Baja |
| 10.3 | (Opcional) Estandarizar estados de carga: elegir entre `.table-loading-state` y `.loading-state` con spinner | 🟢 Baja |

---

## Hoja de Ruta de Implementación

### Resumen de estado post-auditoría

| Categoría | Total tareas | Completadas | Pendientes |
|---|---|---|---|
| Fase 15 (Crítica) | 4 | ✅ 4 | 0 |
| Fase 16 (Media) | 3 | ✅ 3 | 0 |
| Fase 17 (Limpieza) | 5 | ✅ 5 | 0 |
| Fase 18 (Arquitectónica) | 5 | ✅ 3, 🟡 2 | 2 (deuda aceptada) |
| **Nuevas (Auditoría #6)** | **14** | — | **14** |

### Fase 19 — 🟡 Correcciones Menores de Consistencia

| Tarea | Archivo | Prioridad |
|---|---|---|
| [ ] Agregar try/catch a `UsuarioClient.obtenerSesion()` y estandarizar retorno | `UsuarioClient.js` | 🟡 Media |

### Fase 20 — 🟢 Limpieza y Estandarización

| Tarea | Archivo | Prioridad |
|---|---|---|
| [ ] Reemplazar mutaciones directas de `mensaje` por `mostrarMensaje(null, '')` | `MaterialesPage.vue`, `MateriaPrimaPage.vue` | 🟢 Baja |
| [ ] Eliminar `<style scoped>` vacío | `MaterialesPage.vue` | 🟢 Baja |
| [ ] Mover inline styles a clase scoped en `ProduccionRecetasView.vue` L2 | `ProduccionRecetasView.vue` | 🟢 Baja |
| [ ] Eliminar import no utilizado de `useCatalogos` | `DashboardClient.js` | 🟢 Baja |
| [ ] Eliminar doble llamada redundante a `obtenerRecetas(true)` | `RecetasPage.vue` L137, L263 | 🟢 Baja |
| [ ] Agregar try/catch a `UsuarioClient.logout()` | `UsuarioClient.js` | 🟢 Baja |
| [ ] (Opcional) Agregar try/catch externo a `useInventario.sincronizarAPI()` | `useInventario.js` | 🟢 Baja |

### Fase 21 — 🟢 Estandarización HTML (Opcional)

| Tarea | Archivo | Prioridad |
|---|---|---|
| [ ] Envolver `<h1>` en `<header class="page-header">` | `PedidoPage.vue`, `MaterialesPage.vue`, `MateriaPrimaPage.vue`, `RecetasPage.vue` | 🟢 Baja |
| [ ] Cambiar `<div class="page-header">` a `<header class="page-header">` | `ClientesPage.vue` | 🟢 Baja |
| [ ] Estandarizar nombre de columna de acciones a `.actions-col` | Múltiples componentes | 🟢 Baja |
| [ ] (Opcional) Estandarizar `<section>` vs `<div>` en `DashboardEstadoPedidos.vue` | `DashboardEstadoPedidos.vue` | 🟢 Baja |
| [ ] (Opcional) Resaltar categorías vacías en producción | `ProduccionForm.vue` | 🟢 Baja |

### Deuda Técnica Aceptada (No planificada)

| Deuda | Razón |
|---|---|
| Doble carga en `MermasPage.vue` post-registro | Funciona correctamente, la simplificación es de bajo impacto |
| `useCatalogos()` dentro de `PedidoClient.js` | Funciona por diseño de promesas globales, refactorizar tendría alto costo |
| Duplicación de `autoCompletarPedidos` | Descartada intencionalmente en Auditoría #4 |
| Estandarización de estados vacíos/cargando en tablas | Variantes coexisten sin bugs, unificar requiere testing extensivo |
