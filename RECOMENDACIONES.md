# Plan de Trabajo Oficial — MMS App (Auditoría #5)

> **Auditor:** Antigravity (AI Architect)
> **Fecha de auditoría:** 2026-08-27
> **Alcance:** Auditoría completa: estilos componente a componente, alertas en Materiales/Materia Prima, tiempos de alertas, validación de producciones, sincronización de pedidos, títulos de Pages, y oportunidades de mejora.

---

## Tabla de Contenidos

- [Estado de Recomendaciones Anteriores (Auditorías 1–4)](#estado-de-recomendaciones-anteriores-auditorías-14)
- [1. Auditoría de Estilos — Componente por Componente](#1-auditoría-de-estilos--componente-por-componente)
- [2. Alertas en Materiales y Materia Prima](#2-alertas-en-materiales-y-materia-prima)
- [3. Reporte de Tiempos de Alertas](#3-reporte-de-tiempos-de-alertas)
- [4. Validación del Registro de Producciones](#4-validación-del-registro-de-producciones)
- [5. Sincronización de Pedidos](#5-sincronización-de-pedidos)
- [6. Títulos de Secciones / Pages](#6-títulos-de-secciones--pages)
- [7. Oportunidades de Mejora Adicionales](#7-oportunidades-de-mejora-adicionales)
- [Hoja de Ruta de Implementación](#hoja-de-ruta-de-implementación)

---

## Estado de Recomendaciones Anteriores (Auditorías 1–4)

| Recomendación | Estado |
|---|---|
| Refactorizar `useMensajes.js` — Eliminar singleton (estado fuera de función) | ✅ Corregido — estado ahora dentro de la función |
| Soporte `warning` en `Alertas.vue` (clase + icono) | ✅ Corregido — `status-warning` y `ExclamationTriangleIcon` implementados |
| Deep clone en `RecetasPage.vue` al editar receta | ✅ Corregido — `.map(m => ({...m}))` aplicado |
| Duplicación de `autoCompletarPedidos` en Dashboard y Producción | ⏸️ Descartada intencionalmente — se mantiene en ambos componentes |
| Balance global/local CSS tras auditorías de estilos | ✅ Mantenido correctamente |

---

## 1. Auditoría de Estilos — Componente por Componente

### Metodología

Se revisó cada `<style scoped>` en los 40+ archivos `.vue` del proyecto para determinar:
- ✅ **Mantener local** — estilo acoplado al HTML/lógica del componente
- 🌐 **Centralizar** — estilo reutilizable o duplicado
- ⚠️ **Refactorizar** — estilo con problemas técnicos

---

### `/src/components/layout/`

#### NavBar.vue (~240 líneas de CSS)
| Clase | Veredicto | Motivo |
|---|---|---|
| `.container-nav`, `.navbar` | ✅ Mantener local | Grid layout único del navbar |
| `.logo`, `.logo-mark`, `.logo-copy` | ✅ Mantener local | Branding específico |
| `.menu`, `.menu li` | ✅ Mantener local | Navegación principal única |
| `.user-profile-block/info/name/role` | ✅ Mantener local | UI del perfil de usuario específica |
| `.logout-icon-btn`, `.login-icon-btn` | ✅ Mantener local | Botones de acción contextuales |
| Media queries (768px, 480px) | ✅ Mantener local | Responsive del navbar |

**Veredicto: ✅ Todo correcto. Estilos justificados y bien organizados.**

#### SideBar.vue (~200 líneas de CSS)
| Clase | Veredicto | Motivo |
|---|---|---|
| `.sidebar`, `.sidebar.collapsed` | ✅ Mantener local | Layout del sidebar con animaciones de colapso |
| `.menu-item`, `.menu-item.active` | ✅ Mantener local | Estilos de navegación lateral únicos |
| `.hidden-text` | ✅ Mantener local | Animación de colapso |
| Media queries | ✅ Mantener local | Responsive del sidebar |

**Veredicto: ✅ Todo correcto.**

#### MainLayout.vue
Sin estilos scoped. ✅ Limpio.

---

### `/src/components/shared/`

#### Alertas.vue (~40 líneas de CSS)
| Clase | Veredicto | Motivo |
|---|---|---|
| `.status`, `.status-text` | ✅ Mantener local | Base del componente de alerta |
| `.status-success/error/info/warning` | ✅ Mantener local | Variantes de color usando variables CSS globales |

**Veredicto: ✅ Correcto. Los estilos usan variables globales (`--alert-*-bg/text/border`) correctamente.**

#### CargaArchivo.vue (~70 líneas de CSS)
| Clase | Veredicto | Motivo |
|---|---|---|
| `.upload-card/zone/icon/label/hint` | ✅ Mantener local | UX de drag-and-drop única |
| `.file-input` | ✅ Mantener local | Input oculto |
| `.helper-text` | ⚠️ Candidato menor a global | Es simplemente `color: var(--text-light); font-size: 13px`. Ya existe `.text-light` global. |

**Veredicto: ✅ Correcto. El `.helper-text` es menor y funciona bien localmente.**

#### AccionesButton.vue (~15 líneas de CSS)
`.actions` — Flexbox de botones de acción. ✅ Mínimo y justificado.

#### InventarioTable.vue (~10 líneas de CSS)
Solo media query para responsive del header. ✅ Correcto.

#### VistaPreviaTable.vue (~70 líneas de CSS)
| Clase | Veredicto | Motivo |
|---|---|---|
| `.preview-wrapper` (fadeIn) | ✅ Mantener local | Animación de aparición del preview |
| `.preview-actions` | ✅ Mantener local | Alineación de botones |
| Mobile card layout (480px) | ✅ Mantener local | Transformación de tabla a cards en mobile |

**Veredicto: ✅ Correcto.**

---

### `/src/components/clientes/`

#### ClienteList.vue (~90 líneas de CSS)
| Clase | Veredicto | Motivo |
|---|---|---|
| `.client-row`, `.clickable-row`, `.active-row` | ✅ Mantener local | Interacción maestro-detalle específica |
| `.client-name` | ✅ Mantener local | Estilo de nombre en tabla |
| `.associated-badge` | ✅ Mantener local | Badge de "Factura a:" muy específico |
| `.no-data` | 🟢 Podría usar `.text-light` global | Duplica `color: var(--text-light); font-style: italic` |
| `.link-contact` | 🟢 Podría ser `.link-primary` global | Pero solo se usa aquí en toda la app |
| `.address-text` | ✅ Mantener local | Truncamiento específico |
| `.badge-billing/shipping/both` | ✅ Mantener local | Badges semánticos de dominio de negocio |

**Veredicto: ✅ Correcto. Las clases `.no-data` y `.link-contact` son candidatas menores a globalización, pero no generan deuda técnica.**

#### ClienteForm.vue
Sin `<style scoped>`. Usa clases globales. ✅ Limpio.

---

### `/src/components/produccion/`

#### ProduccionForm.vue (~180 líneas de CSS)
| Clase | Veredicto | Motivo |
|---|---|---|
| `.produccion-form-card` | ✅ Mantener local | Card contenedora del formulario |
| `.header`, `.eyebrow`, `.subtitle` | ✅ Mantener local | `.eyebrow` se usa solo aquí. `.subtitle` difiere de `.page-subtitle` en `max-width`. |
| `.stats-grid` | ✅ Mantener local | Grid de 3 columnas para stats del form |
| `.category-list/row/info/name/hint/input` | ✅ Mantener local | Layout de categorías con stepper — muy específico |
| `.stepper`, `.stepper-btn` | ✅ Mantener local | Control táctil con media queries `pointer: coarse/fine` |
| `.form-footer`, `.total-text` | ✅ Mantener local | Footer del formulario |
| `.form-actions-inline` | ✅ Mantener local | Alineación de botones inline |

**Veredicto: ✅ Estilos bien justificados. El patrón stepper con `pointer: coarse/fine` es excelente para la UX touch.**

#### ProduccionRecetasView.vue (~75 líneas de CSS)
| Clase | Veredicto | Motivo |
|---|---|---|
| `.recetas-view` | ⚠️ Duplicación parcial | Repite el patrón de card (`background, border, border-radius, padding, box-shadow`) que es idéntico a `.produccion-form-card`. Ambos podrían usar `.data-card` global con padding personalizado. |
| `.filter-input` | ✅ Mantener local | Solo `width: 100%` — trivial |
| `.scroll-recetas-alto` | ✅ Mantener local | Scroll con altura calculada (`calc(100vh - 309px)`) muy específica |
| `.receta-list/head/nombre/categoria/instrucciones` | ✅ Mantener local | Layout interno de cada receta |
| `.ingrediente-list` | ✅ Mantener local | Detalles de ingredientes |

**Veredicto: ⚠️ `.recetas-view` podría usar `.data-card` global + padding override.**

---

### `/src/components/recetas/`

#### RecetaForm.vue (~35 líneas de CSS)
| Clase | Veredicto | Motivo |
|---|---|---|
| `.form-panel` | ✅ Mantener local | Layout vertical del formulario de recetas |
| `.form-panel label`, `.form-panel textarea` | ✅ Mantener local | Estilos de form fields |
| `.resume-box` | ✅ Mantener local | Resumen de selección |
| `.actions` | ✅ Mantener local | Contexto vertical, diferente de AccionesButton |

**Veredicto: ✅ Correcto.**

#### RecetaList.vue, RecetaMaterialesList.vue, RecetaMateriaPrimaList.vue, RecetaCategoria.vue
Sin estilos scoped significativos. Usan clases globales. ✅ Limpio.

---

### `/src/components/materiales/`

#### MaterialForm.vue
Sin `<style scoped>`. Usa clases globales. ✅ Limpio.

---

### `/src/components/mermas/`

#### MermaForm.vue
Sin `<style scoped>`. Usa clases globales. ✅ Limpio.

#### MermaList.vue, MermaTipoSelector.vue, MermaMotivoSelector.vue, MermaOperadorSelector.vue
Usan estilos globales y/o scoped mínimos específicos de dominio (badges de merma). ✅ Correcto.

---

### `/src/components/usuarios/`

#### UsuarioForm.vue (~20 líneas de CSS)
`.form-body`, `.form-body label` — Layout grid del formulario. ✅ Correcto.

#### UsuarioList.vue, UsuarioRol.vue
Estilos scoped mínimos, específicos (`.role-supervisor`, `.role-operador`). ✅ Correctos.

---

### `/src/components/dashboard/`

#### DashboardAvanceOperador.vue, DashboardDistribucionMermas.vue, DashboardEstadoPedidos.vue, DashboardKPIs.vue
Estilos locales justificados — grids de gráficos, dimensiones de canvas, layouts de widgets. ✅ Correctos.

---

### `/src/components/planificacion/`

#### PlanificacionAsignacion.vue (~40 líneas de CSS)
`.fecha-group/label/input` — estilos del selector de fecha. ✅ Mantener local.

#### PlanificacionOperadorCard.vue, PlanificacionMapeoRecetas.vue, PlanificacionResumen.vue, PlanificacionView.vue
Estilos locales altamente específicos (`.operadores-panel`, `.categorias-grid`, `.mapping-table`). ✅ Correctos.

---

### `/src/components/login/`

#### LoginForm.vue (~85 líneas de CSS)
| Clase | Veredicto | Motivo |
|---|---|---|
| `.login-card` | ✅ Mantener local | Card del login con estilos únicos |
| `h1`, `p`, `p::before`, `input` | ✅ Mantener local | Patrón atípico usando `attr(type)` para labels — intencional y creativo |
| `.login-btn` | ✅ Mantener local | Override de `.btn` para el botón de login |

**Veredicto: ✅ Correcto.**

---

### `/src/pages/`

| Page | CSS Lines | Veredicto |
|---|---|---|
| DashboardPage.vue | ~15 | ✅ Correcto (`.alertas-stock-wrap`, `.pedidos-widget`) |
| ProduccionPage.vue | ~20 | ✅ Correcto (`.sin-plan-icon/sub`, `.page-grid-produccion`) |
| ClientesPage.vue | ~100 | ⚠️ Contiene CSS muerto (`.active-filter-banner`) — ver hallazgo 7.1 |
| PlanificacionPage.vue | ~30 | ✅ Correcto (`.vacio-texto`, `.fade-msg-*`) |
| MaterialesPage.vue | 0 | ✅ Limpio (style scoped vacío) |
| MateriaPrimaPage.vue | 0 | ✅ Limpio |
| PedidoPage.vue | 0 | ✅ Limpio |
| RecetasPage.vue | 0 | ✅ Limpio |
| MermasPage.vue | 0 | ✅ Limpio |
| UsuariosPage.vue | 0 | ✅ Limpio |
| PublicHomePage.vue | ~25 | ✅ Correcto (`.public-home`, `.hero`, `.login-overlay`) |

---

### Resumen de Estilos

| Categoría | Cantidad |
|---|---|
| ✅ Estilos correctamente locales | ~95% |
| 🌐 Candidatos a centralización (baja prioridad) | 2 (`.no-data`, `.link-contact`) |
| ⚠️ Duplicación menor | 1 (`.recetas-view` vs `.data-card`) |
| ⚠️ CSS potencialmente muerto | 1 (`ClientesPage` — `.active-filter-banner`) |

> **Conclusión:** El balance global/local de CSS está en excelente estado. No se recomienda una migración masiva. Las oportunidades son menores y opcionales.

---

## 2. Alertas en Materiales y Materia Prima

### Problema Reportado
> Al realizar la acción de sincronizar, en algunas ocasiones no aparece el mensaje de alerta correspondiente.

### Investigación del Flujo Completo

#### Flujo de sincronización (Materiales y Materia Prima):

```
Botón "Sincronizar API" (InventarioTable.vue)
  → emit('sincronizar')
    → Page.sincronizarAPI()  [delegado a useInventario()]
      → useInventario.sincronizarAPI()
        1. SyncLogClient.yaSincronizadoHoy(moduloKey)
        2. mostrarMensaje('info', 'Sincronizando...', 0)         ← mensaje con duración infinita
        3. await sincronizar()                                    ← Client.sincronizarConSupabase()
        4. mostrarMensaje('exito', 'Sincronización exitosa')      ← mensaje de éxito
        5. await cargarInventario(true)                           ← recarga datos
```

### 🔴 Causa Raíz: Instancias separadas de `useMensajes()`

**El problema es que `useInventario()` crea su PROPIA instancia de `useMensajes()`:**

```javascript
// useInventario.js L6
const { mostrarMensaje } = useMensajes()  // ← NUEVA instancia
```

Mientras que las Pages (`MaterialesPage`, `MateriaPrimaPage`) crean OTRA instancia:

```javascript
// MaterialesPage.vue L97
const { mensaje, mostrarMensaje } = useMensajes()  // ← OTRA instancia diferente
```

Y el template renderiza:
```html
<Alertas :mensaje="mensaje" />  <!-- ← usa el 'mensaje' de la Page, NO el de useInventario -->
```

**Resultado:** Cuando `useInventario` llama a `mostrarMensaje()`, modifica su propio objeto `mensaje` reactivo, pero el `<Alertas>` de la Page está vinculado a una instancia diferente. **El mensaje nunca llega al componente visual.**

Esto explica por qué:
- ✅ Las alertas de carga Excel, guardado manual y eliminación **SÍ funcionan** — usan `this.mostrarMensaje` de la Page.
- ❌ Las alertas de sincronización **NO aparecen** — usan el `mostrarMensaje` interno de `useInventario`.
- ❌ Los mensajes de error en `cargarInventario` (como "Error al cargar materiales") **tampoco aparecen**.

### 🔴 Causa Secundaria: `MateriaPrimaClient.sincronizarConSupabase()` no retorna `{ success: true }`

```javascript
// MateriaPrimaClient.js L8-L74
async sincronizarConSupabase() {
    try {
        // ...proceso...
        if (materiasPrimasExternas.length === 0) {
            return;  // ← RETORNA undefined, NO { success: true }
        }
        // ...upsert...
        // ❌ NO HAY return { success: true } al final del try exitoso
    } catch (error) {
        return { success: false, error };
    }
}
```

Si la función no retorna nada (o retorna `undefined`), la verificación en `useInventario.js L41`:
```javascript
if (response?.success === false) { ... }
```
…pasa correctamente (undefined !== false), pero queda en un estado ambiguo.

Comparando con `MaterialClient.sincronizarConSupabase()` (L66): este **SÍ retorna `{ success: true }`** correctamente.

### Archivos Afectados

| Archivo | Problema |
|---|---|
| `useInventario.js` L6 | Crea instancia propia de `useMensajes()` desconectada de la Page |
| `MateriaPrimaClient.js` L8-74 | No retorna `{ success: true }` en el flujo exitoso |
| `MaterialesPage.vue` | Indirectamente afectado — sus alertas de sync no aparecen |
| `MateriaPrimaPage.vue` | Indirectamente afectado — ídem |

### Recomendación

| # | Acción | Prioridad |
|---|---|---|
| 2.1 | Modificar `useInventario()` para que NO cree su propia instancia de `useMensajes()`. En su lugar, recibir `mostrarMensaje` como parámetro desde la Page que lo invoca. | 🔴 Alta |
| 2.2 | Corregir `MateriaPrimaClient.sincronizarConSupabase()` para retornar `{ success: true }` explícitamente al final del bloque try. | 🔴 Alta |

---

## 3. Reporte de Tiempos de Alertas

### Configuración Actual

Los tiempos de duración de alertas están configurados en **`useMensajes.js`** como parámetros por defecto de las funciones:

| Función | Duración por defecto | Línea |
|---|---|---|
| `mostrarMensaje(tipo, texto, duracion)` | **4000ms** (4s) | `useMensajes.js` L7 |
| `mostrarMensajeInline(tipo, texto, duracion)` | **5000ms** (5s) | `useMensajes.js` L15 |

### Tiempos por Tipo de Alerta según uso en la aplicación

| Tipo | Duración usada | Dónde se invoca | Observaciones |
|---|---|---|---|
| **Éxito** (`exito`) | 4000ms (default) | Todas las Pages | Consistente ✅ |
| **Éxito** (con override) | 3000ms | `PlanificacionPage.vue` L363 | Duración reducida para éxito masivo |
| **Éxito** (con override) | 7000ms | `PlanificacionPage.vue` L232 | Mensaje largo de distribución |
| **Error** | 4000ms (default) | Mayoría de Pages | ⚠️ Puede desaparecer rápido si el usuario no lo nota |
| **Error** (persistente) | **0ms** (infinito) | `MaterialesPage` L184, `MateriaPrimaPage` L178, `ProduccionPage` L179, L192, `PedidoPage` L129, L205 | Correcto para errores críticos ✅ |
| **Info** | 4000ms (default) | `PedidoPage` L139 (ya sincronizado) | ✅ |
| **Info** (persistente) | **0ms** (infinito) | `useInventario` L37 ("Sincronizando...") | Correcto — se espera override posterior ✅ |
| **Info** (corta) | 2500ms | `useContadorRecetas` L99 | Notificación de contador completo |
| **Info** (corta) | 3000ms | `useProduccionForm` L29, L31 | Notificaciones de límite de categoría |
| **Warning** | 4000ms (default) | No se invoca explícitamente en el código actual | — |
| **Inline error** | 5000ms (default) | `PlanificacionPage` L342, L381 | ✅ |
| **Inline error** (persistente) | **0ms** (infinito) | `PlanificacionPage` L376 | ✅ |

### Análisis

1. **No hay estandarización explícita.** Los tiempos dependen de cada invocación. No existe una constante central como `ALERT_DURATIONS`.
2. **Los errores persistentes (duración 0) están bien usados** — solo en errores críticos donde el usuario debe leer el mensaje.
3. **Inconsistencia menor:** Un error de carga de excel muestra 4s (default), pero un error de guardado muestra 0ms (infinito). Ambos son errores de operación pero con severidad diferente.

### Recomendación

| # | Acción | Prioridad |
|---|---|---|
| 3.1 | Crear constantes de duración en `useMensajes.js`: `DURACION_EXITO = 4000`, `DURACION_ERROR = 0`, `DURACION_INFO = 4000`, `DURACION_WARNING = 5000`. Los errores deberían ser persistentes por defecto para que el usuario siempre los lea. | 🟢 Baja |
| 3.2 | Evaluar si los errores con duración default (4s) deberían ser persistentes. | 🟢 Baja |

---

## 4. Validación del Registro de Producciones

### Estructura Actual

El registro de producción funciona así:

1. **`ProduccionForm.vue`** renderiza un input por cada categoría (obtenidas de pedidos).
2. **`useProduccionForm.js`** gestiona el estado con `cantidadesPorCategoria` (ref) y la función `enviarFormulario()`.
3. La validación actual en `enviarFormulario()` (L155-160):
   ```javascript
   const detalle = construirDetalle()
   if (!detalle.length) {
       notificar('error', 'Completa al menos una categoría con cantidad mayor a cero', 0)
       return
   }
   ```
4. `construirDetalle()` (L146-153) filtra categorías con cantidad > 0:
   ```javascript
   return categorias.value
       .map(categoria => ({ categoria, cantidad: obtenerCantidadNumerica(categoria) }))
       .filter(item => item.cantidad > 0)
   ```

### Campos Involucrados

| Campo | Tipo | Obligatorio actualmente | Propuesto |
|---|---|---|---|
| `fecha` | Date input | Sí (default: hoy) | Sí ✅ |
| `categorias[]` (inputs numéricos) | Number | Al menos uno > 0 | **Todos obligatorios** |
| `stems` (ProduccionRecetasView clicks) | — | No | **No obligatorio** ✅ |

### Análisis

La validación propuesta es:
> **Todas las categorías deben tener un valor > 0 → permitir registro. Alguna categoría vacía → impedir registro. Los campos de stems NO deben ser obligatorios.**

**¿Dónde implementar?**

La lógica de validación está correctamente centralizada en `useProduccionForm.js`, específicamente en `enviarFormulario()`. La modificación debe hacerse allí.

### Implementación Recomendada

Modificar `enviarFormulario()` en `useProduccionForm.js`:

```javascript
const enviarFormulario = () => {
    // Verificar que TODAS las categorías tengan valor > 0
    const categoriasVacias = categorias.value.filter(
        categoria => obtenerCantidadNumerica(categoria) === 0
    )
    
    if (categoriasVacias.length > 0) {
        const nombres = categoriasVacias.join(', ')
        notificar('error', `Las siguientes categorías están vacías: ${nombres}`, 0)
        return
    }
    
    // El resto del flujo actual...
}
```

**Nota sobre stems:** Los stems se manejan desde `ProduccionRecetasView` como clicks en recetas, que incrementan `cantidadesExternas`. Son un atajo, no un campo obligatorio. El formulario ya permite ingresar cantidades directamente. Los stems NO deben validarse.

### Recomendación

| # | Acción | Prioridad |
|---|---|---|
| 4.1 | Modificar la validación en `useProduccionForm.js` → `enviarFormulario()` para exigir que todas las categorías tengan cantidad > 0. | 🟠 Media |
| 4.2 | Mostrar visualmente las categorías vacías (resaltar en rojo o con borde de error). | 🟢 Baja |

---

## 5. Sincronización de Pedidos

### Flujo Completo Analizado

```
PedidoPage.vue → sincronizarAPI()
  1. SyncLogClient.yaSincronizadoHoy('pedidos')      → Verificar si ya se sincronizó
  2. PedidoClient.sincronizarConSupabase()             → Proceso principal
     a. axios.get(API_URL)                             → Obtener pedidos de API externa
     b. ClienteClient.resolverClientesDePedidos()      → Resolver/crear clientes
     c. _obtenerCatalogos()                            → Obtener mapas de clientes y recetas
     d. _resolverRecetasFaltantes()                    → Crear recetas genéricas faltantes
     e. Procesar cada pedido → pedidosMap + detalles   → Mapeo de datos
     f. supabase.rpc('rpc_sincronizar_pedidos', {...})  → Guardado masivo vía RPC
  3. SyncLogClient.registrarSync('pedidos')            → Registrar en log
  4. cargarPedidos()                                   → Recargar tabla
```

### Problemas Identificados

#### 🔴 5.1 — `sincronizarConSupabase()` no retorna valor en flujos vacíos

```javascript
// PedidoClient.js L87-90
if (pedidosExternos.length === 0) {
    return;  // ← undefined, NO { success: true }
}

// PedidoClient.js L147
if (pedidosToUpsert.length === 0) return;  // ← undefined
```

En `PedidoPage.vue L148`:
```javascript
if (response?.success === false) { ... }
```
Esto no falla con `undefined`, pero **el `SyncLogClient.registrarSync('pedidos')` se ejecuta aunque la respuesta sea `undefined`**, lo que potencialmente registra una sincronización exitosa sin haber procesado datos.

#### 🟠 5.2 — Falta de try/catch en la Page

```javascript
// PedidoPage.vue L146
const response = await PedidoClient.sincronizarConSupabase()
```
No hay `try/catch` envolvente en `sincronizarAPI()` de `PedidoPage`. Si `PedidoClient` lanza una excepción no capturada (por ejemplo, si `axios.get` falla por un error de red antes de que el try/catch interno lo atrape), la UI quedaría en estado `cargandoPedidos = true` permanentemente.

**Comparación:** `useInventario.js` tampoco tiene try/catch externo, lo que significa que este patrón es consistente pero igualmente frágil.

#### 🟠 5.3 — `useCatalogos()` invocado dentro de un Client (fuera de componente Vue)

```javascript
// PedidoClient.js L17, L68, L94, L172
const catalogos = useCatalogos()
```

`useCatalogos()` fue diseñado como composable de Vue (para ser llamado en `setup()`). Al invocarlo dentro de un client module (no reactivo), funciona **solo porque usa promesas de módulo (variables globales fuera de la función)**. No es un error funcional, pero es un antipatrón arquitectónico que mezcla capas.

#### 🟢 5.4 — Pedidos sin detalles se renderizan como líneas vacías

```javascript
// PedidoClient.js L262-274
if (details.length === 0) {
    flatList.push({
        // ...pedido sin categoría, stems: 0, precio: 0
    })
}
```
Pedidos sin `pedido_detalles` se incluyen en la lista con categoría vacía. Esto podría generar ruido en la tabla.

### Recomendación

| # | Acción | Prioridad |
|---|---|---|
| 5.1 | Corregir `PedidoClient.sincronizarConSupabase()` para retornar `{ success: true }` en TODOS los flujos exitosos (vacíos y con datos). | 🔴 Alta |
| 5.2 | Envolver `sincronizarAPI()` en `PedidoPage.vue` con try/catch para evitar UI congelada. | 🟠 Media |
| 5.3 | Refactorizar `PedidoClient` para recibir los catálogos como parámetro en lugar de invocar `useCatalogos()` internamente. | 🟢 Baja (mejora arquitectónica, no bloquea funcionalidad) |
| 5.4 | Evaluar si los pedidos sin detalles deben excluirse de la lista plana en `obtenerPedidos()`. | 🟢 Baja |

---

## 6. Títulos de Secciones / Pages

### Inventario de Títulos

| Título | Ubicación Actual | Ubicación Recomendada | Motivo |
|---|---|---|---|
| **"Panel de Control"** | `DashboardPage.vue` L7 | ✅ Mantener en Page | Correcto — el Page es dueño de su título |
| **"Carga de Pedidos"** | `PedidoPage.vue` L7 | ✅ Mantener en Page | Correcto |
| **"Directorio de Clientes"** | `ClientesPage.vue` L8 | ✅ Mantener en Page | Correcto |
| **"Carga de Materia Prima"** | `MateriaPrimaPage.vue` L6 | ✅ Mantener en Page | Correcto |
| **"Carga de Materiales"** | `MaterialesPage.vue` L6 | ✅ Mantener en Page | Correcto |
| **"Creación de Recetas"** | `RecetasPage.vue` L7 | ✅ Mantener en Page | Correcto |
| **"Producción diaria"** | `ProduccionPage.vue` L6 | ✅ Mantener en Page | Correcto |
| **"Mantenimiento de Usuarios"** | `UsuariosPage.vue` L6 | ✅ Mantener en Page | Correcto |
| **"Mermas de Producción"** | `MermasPage.vue` L7 | ✅ Mantener en Page | Correcto |
| **"Planificación"** | `PlanificacionAsignacion.vue` L4 | 🟠 **Mover a PlanificacionPage** | El título principal está dentro de un componente hijo. Si se oculta el componente, el título desaparece. |
| **"Producción por categoría"** | `ProduccionForm.vue` L6 | ✅ Mantener en componente | Excepción válida — subtítulo del formulario |
| **"Recetas de Producción"** | `ProduccionRecetasView.vue` L3 | ✅ Mantener en componente | Excepción válida — subtítulo del panel lateral |
| **"Registrar Merma"** | `MermaForm.vue` L4 | ✅ Mantener en componente | Excepción válida — subtítulo del formulario |
| **"Datos de la receta"** | `RecetaForm.vue` L5 | ✅ Mantener en componente | Excepción válida — subtítulo |
| **"Agregar Usuario"** | `UsuarioForm.vue` L8 | ✅ Mantener en componente | Excepción válida — header de card |
| **"Bienvenido a Nuestra Aplicación"** | `PublicHomePage.vue` L4 | ✅ Mantener en Page | Correcto |
| **"Gestión de Manufactura"** | `LoginForm.vue` L3 | ✅ Mantener en componente | Excepción válida — título del modal de login |

### Hallazgo

Solo **1 título principal** está fuera de su Page:

> **"Planificación"** en `PlanificacionAsignacion.vue` debería estar en `PlanificacionPage.vue`.

### Recomendación

| # | Acción | Prioridad |
|---|---|---|
| 6.1 | Mover el título "Planificación" y la etiqueta `<header class="page-header">` de `PlanificacionAsignacion.vue` a `PlanificacionPage.vue`. `PlanificacionAsignacion` debería solo contener el selector de fecha y los botones de acción, sin el título de la sección. | 🟠 Media |

---

## 7. Oportunidades de Mejora Adicionales

### 🔴 7.1 — CSS muerto en `ClientesPage.vue`

- **Problema:** Las clases `.active-filter-banner`, `.btn-clear-filter` y su animación `@keyframes slideDown` están definidas en `<style scoped>` pero no se referencian en el `<template>`.
- **Evidencia:** `ClientesPage.vue` L176-219 define estos estilos pero el template no los usa.
- **Causa:** Eliminadas del template en una refactorización anterior sin limpiar los estilos.
- **Recomendación:** Eliminar las clases CSS no utilizadas.
- **Prioridad:** 🟢 Baja

---

### 🟠 7.2 — `PlanificacionPage.vue` es el archivo más grande (419 líneas)

- **Problema:** Contiene la mayor cantidad de lógica de negocio entre todas las Pages.
- **Evidencia:** `PlanificacionPage.vue` — 419 líneas, 10+ métodos, estado complejo.
- **Causa:** La planificación tiene un flujo multi-paso (distribuir → mapear → editar → guardar).
- **Recomendación:** Extraer la lógica de negocio a un composable `usePlanificacion()`, similar a `useProduccionForm()` y `useContadorRecetas()`.
- **Prioridad:** 🟠 Media — funciona correctamente pero dificulta el mantenimiento.

---

### 🟠 7.3 — `ProduccionRecetasView.vue` muestra alerta "Cargando recetas..." innecesariamente

- **Problema:** Al montarse, el componente muestra una alerta de tipo `info` con "Cargando recetas..." que desaparece rápidamente cuando los datos se cargan del caché.
- **Evidencia:** `ProduccionRecetasView.vue` L174: `this.mostrarMensaje('info', 'Cargando recetas...', 0)`
- **Problema UX:** Si los datos están en caché, el mensaje aparece y desaparece en <100ms, generando un parpadeo.
- **Recomendación:** Agregar un delay mínimo antes de mostrar el mensaje de carga, o solo mostrarlo si la carga toma más de 200ms.
- **Prioridad:** 🟢 Baja

---

### 🟢 7.4 — `PlanificacionPage.vue` L330 — mutación directa de `mensaje`

- **Problema:** En `limpiarTodo()`, se muta directamente el objeto reactivo: `this.mensaje = { tipo: null, texto: '' }` en lugar de usar `mostrarMensaje()`.
- **Recomendación:** Usar `this.mostrarMensaje(null, '')` o crear un `limpiarMensaje()` en el composable.
- **Prioridad:** 🟢 Baja

---

### 🟢 7.5 — `ProduccionForm.vue` L65 — ternario redundante

- **Problema:** `guardando ? (edicion ? 'Guardando...' : 'Guardando...') : (...)` — ambas ramas del ternario interno son iguales.
- **Recomendación:** Simplificar a `guardando ? 'Guardando...' : (edicion ? 'Actualizar producción' : 'Registrar producción')`.
- **Prioridad:** 🟢 Baja

---

### 🟢 7.6 — `ProduccionForm.vue` L136 — `cancelar` desestructurado pero no retornado

- **Problema:** Se desestructura `cancelar` de `useProduccionForm` pero este no existe en el composable.
- **Causa:** Residuo de una implementación anterior.
- **Recomendación:** Remover la desestructuración de `cancelar`.
- **Prioridad:** 🟢 Baja

---

### 🟢 7.7 — `MermasPage.vue` — Doble carga de datos después de registrar merma

- **Problema:** Después de registrar una merma, se actualiza el stock localmente (L144-159) Y se llama `this.cargarDatos()` que recarga TODO.
- **Recomendación:** Mantener solo la recarga completa (eliminar actualizaciones locales) o solo las actualizaciones locales (eliminar `cargarDatos()`).
- **Prioridad:** 🟢 Baja

---

### 🟢 7.8 — Duplicación de `autoCompletarPedidos` (recordatorio)

- **Estado:** Descartada intencionalmente en auditoría #4. Se documenta como deuda técnica aceptada.
- **Prioridad:** ⏸️ Descartada

---

## Hoja de Ruta de Implementación

### Fase 15 — 🔴 Arreglo Crítico de Alertas de Sincronización

| Tarea | Archivo | Prioridad |
|---|---|---|
| [ ] Refactorizar `useInventario()` para recibir `mostrarMensaje` como parámetro | `useInventario.js` | 🔴 Alta |
| [ ] Actualizar `MaterialesPage.vue` y `MateriaPrimaPage.vue` para pasar `mostrarMensaje` a `useInventario` | `MaterialesPage.vue`, `MateriaPrimaPage.vue` | 🔴 Alta |
| [ ] Agregar `return { success: true }` en `MateriaPrimaClient.sincronizarConSupabase()` | `MateriaPrimaClient.js` | 🔴 Alta |
| [ ] Agregar `return { success: true }` en los flujos vacíos de `PedidoClient.sincronizarConSupabase()` | `PedidoClient.js` | 🔴 Alta |

### Fase 16 — 🟠 Validación de Producciones y Títulos

| Tarea | Archivo | Prioridad |
|---|---|---|
| [ ] Implementar validación de que todas las categorías tengan valor > 0 | `useProduccionForm.js` | 🟠 Media |
| [ ] Mover título de `PlanificacionAsignacion.vue` a `PlanificacionPage.vue` | `PlanificacionAsignacion.vue`, `PlanificacionPage.vue` | 🟠 Media |
| [ ] Envolver `sincronizarAPI()` en `PedidoPage.vue` con try/catch | `PedidoPage.vue` | 🟠 Media |

### Fase 17 — 🟢 Limpieza y Consistencia

| Tarea | Archivo | Prioridad |
|---|---|---|
| [ ] Eliminar CSS muerto de `ClientesPage.vue` (`.active-filter-banner`, `.btn-clear-filter`, `@keyframes slideDown`) | `ClientesPage.vue` | 🟢 Baja |
| [ ] Simplificar ternario redundante en `ProduccionForm.vue` L65 | `ProduccionForm.vue` | 🟢 Baja |
| [ ] Remover desestructuración de `cancelar` en `ProduccionForm.vue` L136 | `ProduccionForm.vue` | 🟢 Baja |
| [ ] Corregir mutación directa de `mensaje` en `PlanificacionPage.vue` L330 | `PlanificacionPage.vue` | 🟢 Baja |
| [ ] (Opcional) Resaltar visualmente categorías vacías en producción | `ProduccionForm.vue` | 🟢 Baja |

### Fase 18 — 🟢 Mejoras Arquitectónicas (Opcionales)

| Tarea | Archivo | Prioridad |
|---|---|---|
| [ ] Extraer lógica de `PlanificacionPage` a un composable `usePlanificacion()` | Nuevo archivo + `PlanificacionPage.vue` | 🟠 Media |
| [ ] Refactorizar `ProduccionRecetasView` para usar `.data-card` global en lugar de `.recetas-view` | `ProduccionRecetasView.vue` | 🟢 Baja |
| [ ] Agregar delay al mensaje de carga en `ProduccionRecetasView.vue` | `ProduccionRecetasView.vue` | 🟢 Baja |
| [ ] Simplificar doble carga en `MermasPage.vue` post-registro | `MermasPage.vue` | 🟢 Baja |
| [ ] (Largo plazo) Refactorizar `PedidoClient.js` para no usar `useCatalogos()` internamente | `PedidoClient.js` | 🟢 Baja |
