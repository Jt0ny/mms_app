# Plan de Trabajo Oficial — MMS App

> **Auditor:** Arquitecto de Software Senior
> **Fecha original:** 2026-07-22
> **Última auditoría:** 2026-08-19
> **Alcance:** Auditoría exhaustiva de estilos en `/src`, análisis de Dark Mode en recetas, viabilidad de supervisor conectado, análisis de "Agregar Cliente", y oportunidades de mejora adicionales.

---

## Tabla de Contenidos

- [Resumen Ejecutivo](#resumen-ejecutivo)
- [Estado de Recomendaciones Anteriores](#estado-de-recomendaciones-anteriores)
- [Prioridad Alta 🔴](#prioridad-alta-)
  - [A1 — Dark Mode en RecetaList: variable --text-dark inexistente](#a1--dark-mode-en-recetalist-variable---text-dark-inexistente)
  - [A2 — .empty-state-card duplicada en style.css](#a2--empty-state-card-duplicada-en-stylecss)
- [Prioridad Media 🟠](#prioridad-media-)
  - [M1 — Centralizar filtros duplicados (.filters, .filter-input)](#m1--centralizar-filtros-duplicados-filters-filter-input)
  - [M2 — Centralizar override .data-card-header neutral](#m2--centralizar-override-data-card-header-neutral)
  - [M3 — Centralizar patrón "selector de chips"](#m3--centralizar-patrón-selector-de-chips)
  - [M4 — Alinear inputs de formularios al sistema global .form-input](#m4--alinear-inputs-de-formularios-al-sistema-global-form-input)
  - [M5 — Centralizar botón submit con gradiente](#m5--centralizar-botón-submit-con-gradiente)
  - [M6 — Refactorizar UsuarioList para usar sistema global .data-card](#m6--refactorizar-usuariolist-para-usar-sistema-global-data-card)
  - [M7 — HEX hardcoded en componentes](#m7--hex-hardcoded-en-componentes)
  - [M8 — Reutilización de InventarioTable.vue (Descartado)](#m8--reutilización-de-inventariotablevue-descartado)
- [Prioridad Baja 🟢](#prioridad-baja-)
  - [B1 — Variables CSS inexistentes (--text-main, --bg-hover, --primary-rgb)](#b1--variables-css-inexistentes---text-main---bg-hover---primary-rgb)
  - [B2 — Mostrar supervisor conectado en NavBar](#b2--mostrar-supervisor-conectado-en-navbar)
  - [B3 — Focus state faltante en filtros de ClienteList](#b3--focus-state-faltante-en-filtros-de-clientelist)
  - [B4 — Centralizar .actions-col / .font-medium](#b4--centralizar-actions-col--font-medium)
  - [B5 — RecetaList usa .btn-icon en vez de .btn-action-ghost global](#b5--recetalist-usa-btn-icon-en-vez-de-btn-action-ghost-global)
  - [B6 — Inline style en ProduccionForm y bloques style vacíos](#b6--inline-style-en-produccionform-y-bloques-style-vacíos)
- [Análisis: Botón "Agregar Nuevo Cliente"](#análisis-botón-agregar-nuevo-cliente)
- [Hoja de Ruta de Implementación](#hoja-de-ruta-de-implementación)

---

## Resumen Ejecutivo

La auditoría del 2026-08-19 se centró en una **revisión exhaustiva de estilos** de todos los componentes de `/src`, con atención especial a `ClienteList`, `NavBar` y `ProduccionForm`. También se investigó el problema de Dark Mode en la lista de recetas, la viabilidad de mostrar el supervisor conectado y el análisis del botón "Agregar nuevo cliente".

**Hallazgos clave:**
- **Dark Mode en RecetaList:** La causa raíz es la variable CSS `--text-dark` que **no existe** en el proyecto. El fallback HEX `#1f2937` genera texto casi invisible en fondo oscuro. Afecta también a `RecetaForm.vue`.
- **Estilos duplicados:** Se identificaron **8 patrones de estilos** duplicados entre componentes que podrían centralizarse (filtros, chips, inputs, submit buttons, header overrides, actions columns).
- **UsuarioList aislado:** `UsuarioList.vue` no usa el sistema global `.data-card` y replica ~126 líneas de CSS que ya existen globalmente.
- **HEX hardcoded:** Persisten colores HEX en 5+ componentes (`RecetaList`, `RecetaForm`, `MermaList`, `DashboardAvanceOperador`, `PlanificacionAsignacion`) que no respetan Dark Mode.
- **Supervisor conectado:** Implementación trivial (~5 líneas) reutilizando `useAuth()` ya importado en NavBar.
- **Recomendaciones anteriores completadas:** A1 (Dark Mode inputs), A2 (sincronizarContadorReceta), B1 (nomenclatura), B2 (useCatalogos), M5 (badges HEX en style.css), `.spin` duplicado — todos verificados como completados en el código real.

---

## Estado de Recomendaciones Anteriores

Se verificó el código real para confirmar el progreso de **todas** las tareas previas.

| Recomendación | Estado anterior | Estado verificado (2026-08-19) |
|---|---|---|
| **RLS en Supabase** | ✅ | ✅ Completado — Implementado mediante Supabase Auth. |
| **Tabla DashboardEstadoPedidos** | ✅ | ✅ Completado — Usa clases globales `.data-card`. |
| **Operaciones multi-tabla (RPCs)** | ✅ | ✅ Completado — `ProduccionClient`, `MermaClient`, `PedidoClient` usan RPCs. |
| **Mensaje de usuarios no desaparece** | ✅ | ✅ Completado — `UsuarioForm.vue` usa `setTimeout` + `clearTimeout`. |
| **Sincronización diaria sin límite** | ✅ | ✅ Completado — `SyncLogClient.js` controla via tabla `sync_log`. |
| **Colores CSS Variables (UsuarioRol)** | ✅ | ✅ Completado. |
| **Colores CSS Variables (Badges en style.css)** | 🟡 Parcial | ✅ Completado — `.badge-warning`, `.badge-success`, `.badge-danger` ahora usan variables CSS. Los HEX restantes están en componentes locales (ver M7). |
| **Animación `.spin` duplicada** | ❌ Pendiente | ✅ Completado — `@keyframes spin` existe únicamente en `style.css:907`. |
| **A1 — Dark Mode inputs (color-scheme)** | 🔴 Pendiente | ✅ Completado — `color: inherit` en L99 y `color-scheme: dark` en L67 de `style.css`. |
| **A2 — sincronizarContadorReceta** | 🔴 Pendiente | ✅ Completado — `useContadorRecetas.js:103` usa destructuración `({ categoria, cantidad })`. |
| **M2 — Comentarios y código muerto** | 🟡 Parcial | 🟡 Parcial — `crypto.js` eliminado. Comentarios residuales en `RecetaClient.js` no verificados en detalle. |
| **B1 — Nomenclatura inglés/español** | 🔴 Pendiente | ✅ Completado — `useAuth.js` exporta `estaAutenticado()`, `obtenerRol()`. |
| **B2 — Race condition en useCatalogos** | 🔴 Pendiente | ✅ Completado (marcado en Hoja de Ruta anterior). |
| **M4 — Composables grandes** | 🔴 Pendiente | ✅ Completado (marcado en Hoja de Ruta anterior). |

---

## Prioridad Alta 🔴

### A1 — Dark Mode en RecetaList: variable --text-dark inexistente
- **Estado:** 🔴 Pendiente
- **Prioridad:** Alta
- **Archivos afectados:** `RecetaList.vue`, `RecetaForm.vue`.
- **Problema encontrado:** La clase `.font-medium` en `RecetaList.vue:110` usa `color: var(--text-dark, #1f2937)`. La variable `--text-dark` **no existe** en ningún lugar de `style.css`, ni en modo claro ni en modo oscuro. El navegador siempre aplica el fallback `#1f2937` (gris casi negro). En Dark Mode, con fondo `#16171d`, este texto tiene contraste prácticamente nulo y es invisible.
- **Otros textos afectados:**
  - `RecetaForm.vue:176` — botón "Cancelar Edición" usa `var(--text-dark, #4b5563)` → pierde contraste en dark mode.
  - `RecetaForm.vue:177` — borde `#d1d5db` hardcoded.
  - `RecetaForm.vue:186` — fondo `#f3f4f6` hardcoded.
  - `RecetaList.vue:80` — `.badge-gray` usa `background: #f3f4f6; color: #4b5563` → fondo gris claro totalmente fuera de lugar en dark mode.
- **Solución recomendada:**
  - `RecetaList.vue:110`: Cambiar `var(--text-dark, #1f2937)` → `var(--text-h)`.
  - `RecetaList.vue:80`: Cambiar `.badge-gray { background: #f3f4f6; color: #4b5563; }` → `background: var(--bg-secondary); color: var(--text-light);`.
  - `RecetaForm.vue:176`: Cambiar `var(--text-dark, #4b5563)` → `var(--text)`.
  - `RecetaForm.vue:177`: Cambiar `#d1d5db` → `var(--border)`.
  - `RecetaForm.vue:186`: Cambiar `#f3f4f6` → `var(--bg-secondary)`.
- **Impacto:** Resuelve completamente el problema de contraste en Dark Mode de recetas sin afectar el modo claro.

### A2 — .empty-state-card duplicada en style.css
- **Estado:** 🔴 Pendiente
- **Prioridad:** Alta
- **Archivos afectados:** `style.css`.
- **Problema encontrado:** La clase `.empty-state-card` está definida **dos veces** en `style.css`:
  - Primera definición: **L428-L435** (sin `text-align: center`).
  - Segunda definición: **L951-L959** (con `text-align: center`).
  La segunda sobreescribe a la primera. Esto es CSS redundante y confuso.
- **Solución recomendada:** Unificar en una sola definición con `text-align: center` incluido. Eliminar la primera ocurrencia.
- **Impacto:** Elimina confusión y CSS redundante.

---

## Prioridad Media 🟠

### M1 — Centralizar filtros duplicados (.filters, .filter-input)
- **Estado:** 🔴 Pendiente
- **Problema encontrado:** Los estilos de filtros (`.filters`, `.filter-input`, `.filter-select`, `.filter-search`) están duplicados con ligeras variantes en `ClienteList.vue` y `MermaList.vue`. Ambos definen flexbox + gap + wrap para `.filters`, y bordes/padding/border-radius para inputs. MermaList añade `background`, `color` y `transition` explícitos (más completos), mientras ClienteList no.
- **Solución recomendada:** Extraer a `style.css` un set de clases de filtro global (`.filter-bar`, `.filter-input`, `.filter-select`) tomando las propiedades más completas de MermaList.
- **Componentes que se benefician:** `ClienteList.vue`, `MermaList.vue`.
- **Impacto:** Elimina ~30 líneas de CSS duplicado y garantiza consistencia visual entre todas las listas con filtros.

### M2 — Centralizar override .data-card-header neutral
- **Estado:** 🔴 Pendiente
- **Problema encontrado:** `ClienteList.vue:318-331` y `MermaList.vue:212-223` definen **exactamente** la misma sobreescritura local de `.data-card-header` para reemplazar el gradiente verde global por un fondo blanco con borde inferior:
  ```css
  .data-card-header { background: var(--bg); border-bottom: 1px solid var(--border-light); color: var(--text); }
  .data-card-header h2 { color: var(--text-h); }
  .data-card-header p.data-card-subtitle { color: var(--text-light); opacity: 1; }
  ```
- **Solución recomendada:** Crear un modificador global `.data-card-header.neutral` o `.data-card--flat` en `style.css`.
- **Impacto:** Elimina ~13 líneas de CSS duplicado exacto.

### M3 — Centralizar patrón "selector de chips"
- **Estado:** 🔴 Pendiente
- **Problema encontrado:** Tres componentes implementan el mismo patrón visual de selector tipo "chip/pill" con estado activo, borde redondeado 999px y gradiente verde activo:
  - `RecetaCategoria.vue:58-123` (~65 líneas)
  - `UsuarioRol.vue:50-95` (~45 líneas)
  - `MermaOperadorSelector.vue:53-127` (~75 líneas)
  Todos comparten: `border-radius: 999px`, `border: 1px solid var(--border)`, transición hover con `translateY(-1px)`, estado `.activa` con gradiente verde y color blanco.
- **Solución recomendada:** Crear un set de clases globales `.chip-selector`, `.chip-option`, `.chip-option.active` en `style.css`. Los componentes solo necesitarían CSS local para diferencias menores.
- **Impacto:** Reduce ~140 líneas de CSS a ~40 globales reutilizables.

### M4 — Alinear inputs de formularios al sistema global .form-input
- **Estado:** 🔴 Pendiente
- **Problema encontrado:** `style.css` ya provee `.form-input` con `padding: 12px`, `border-radius: 8px`, focus con `box-shadow` y `color: var(--text)`. Sin embargo, estos componentes definen sus propios estilos de input que replican el mismo patrón:
  - `UsuarioForm.vue:169-184` — `.form-body input` con `border-radius: 10px`, `padding: 11px 14px`.
  - `RecetaForm.vue:116-125` — `.form-panel input` con `padding: 10px 12px`, `border-radius: 8px`.
  - `ProduccionForm.vue:212-227` — `.date-field input`, `.category-input` con `border-radius: 12px`, `padding: 11px 12px`.
- **Formularios que SÍ usan el sistema global:** `ClienteForm`, `MermaForm`, `MaterialForm` — estos son el ejemplo a seguir.
- **Solución recomendada:** Migrar `UsuarioForm`, `RecetaForm` y `ProduccionForm` para que usen las clases globales `.form-input`, `.form-textarea`, `.form-select` en sus templates, eliminando los estilos locales de inputs.
- **Impacto:** Consistencia visual de inputs en toda la aplicación y reducción de CSS local.

### M5 — Centralizar botón submit con gradiente
- **Estado:** 🔴 Pendiente
- **Problema encontrado:** Cuatro componentes definen individualmente un botón de submit verde con gradiente `linear-gradient(135deg, var(--primary), var(--primary-dark))`, hover con `translateY(-1px)` y estado disabled:
  - `ProduccionForm.vue:293-312` — `.submit-btn`
  - `RecetaForm.vue:142-163` — `.btn-submit`
  - `LoginForm.vue:135-162` — `button` genérico
  - `UsuarioForm.vue:186-207` — `.form-body button[type="submit"]`
  La clase global `.btn.btn-primary` ya existe pero no tiene gradiente.
- **Solución recomendada:** Crear una variante `.btn-primary-gradient` o añadir el gradiente a `.btn-primary` en `style.css`. Los 4 componentes podrían entonces usar la clase global.
- **Impacto:** Elimina ~60 líneas de CSS duplicado.

### M6 — Refactorizar UsuarioList para usar sistema global .data-card
- **Estado:** 🔴 Pendiente
- **Problema encontrado:** `UsuarioList.vue` define ~126 líneas de CSS propio (`.usuario-table-container`, `.usuario-table-header`, `.usuario-table`, `.content-table`, etc.) que replican exactamente lo que `.data-card`, `.data-card-header` y `.data-card-table` ya proveen globalmente:
  - `.usuario-table-container` → equivalente a `.data-card`
  - `.usuario-table-header` → equivalente a `.data-card-header` (mismo gradiente verde, padding, color blanco)
  - `.usuario-table` → equivalente a `.data-card-table` (mismo collapse, font-size, padding, hover)
- **Solución recomendada:** Refactorizar el template de `UsuarioList.vue` para usar las clases globales `.data-card`, `.data-card-header`, `.data-card-table`, eliminando la mayor parte del CSS local.
- **Impacto:** Reduce ~100 líneas de CSS y garantiza consistencia con las demás tablas de la aplicación.

### M7 — HEX hardcoded en componentes
- **Estado:** 🔴 Pendiente
- **Problema encontrado:** Varios componentes usan colores HEX directos que no respetan el Dark Mode:

  | Componente | Valores HEX | Variable sugerida |
  |---|---|---|
  | `RecetaList.vue:77-80` | `#ec4899`, `#10b981`, `#f59e0b`, `#4b5563`, `#f3f4f6` | Variables CSS o `rgba()` con fallback dark |
  | `RecetaForm.vue:176-186` | `#d1d5db`, `#f3f4f6`, `var(--text-dark)` | `var(--border)`, `var(--bg-secondary)`, `var(--text)` |
  | `MermaList.vue:225-238` | `#db2777`, `#2563eb`, `#7c3aed` | Crear variables CSS para colores de categoría |
  | `DashboardAvanceOperador.vue:59-62` | `#16a34a`, `#2563eb`, `#d97706`, `#dc2626` (en JS) | `var(--primary)`, etc. o variables dedicadas |
  | `PlanificacionAsignacion.vue:122` | `#0f172a` | `var(--bg-secondary)` o crear `--bg-dark` |

- **Nota:** Los `.badge-*` globales en `style.css` ya fueron corregidos y usan variables CSS.
- **Impacto:** Garantiza consistencia visual en Dark Mode en toda la aplicación.

### M8 — Reutilización de InventarioTable.vue (Descartado)
- **Estado:** 🚫 No aplica (Descartado tras análisis en auditoría anterior)
- **Problema encontrado:** `InventarioTable.vue` fue analizado para ver si podía reemplazar las tablas de listas. Sin embargo, cada lista tiene layouts de header muy distintos.
- **Solución recomendada:** No reutilizar `InventarioTable.vue`. Asegurar que todas las tablas usen la estructura CSS global `.data-card`, `.data-card-header`, `.data-card-table`.

---

## Prioridad Baja 🟢

### B1 — Variables CSS inexistentes (--text-main, --bg-hover, --primary-rgb)
- **Estado:** 🔴 Pendiente
- **Problema encontrado:** Se usan variables CSS que **no están definidas** en `:root` de `style.css`:
  - `--text-main`: Usado en `style.css:584` (`.section-title`) y `DashboardEstadoPedidos.vue:117` (`.column-title`). Debería ser `var(--text-h)`.
  - `--bg-hover`: Usado en `DashboardDistribucionMermas.vue:148` (`.insumo-item`). El fondo se renderiza transparente. Debería ser `var(--bg-secondary)`.
  - `--primary-rgb`: Usado en `DashboardDistribucionMermas.vue:158` (`.insumo-rank`). El fallback `219, 39, 119` genera rosa en lugar del verde primario. Debería ser `rgba(22, 163, 74, 0.1)` o crear la variable `--primary-rgb: 22, 163, 74`.
- **Impacto:** Corrige colores incorrectos y fondos faltantes en el dashboard.

### B2 — Mostrar supervisor conectado en NavBar
- **Estado:** 🔴 Pendiente
- **Problema encontrado:** Se desea mostrar qué usuario/supervisor está conectado a la aplicación.
- **Análisis de viabilidad:**
  - `useAuth.js` ya centraliza `usuarioNombre`, `rol`, `isLogged` como computeds reactivos.
  - `NavBar.vue` ya importa y usa `useAuth()` en su `setup()`, pero solo extrae `{ rol, isLogged }`.
  - **Solo se necesita extraer `usuarioNombre` adicionalmente** y mostrarlo en el template.
- **Solución recomendada:** En `NavBar.vue`, cambiar `const { rol, isLogged } = useAuth()` por `const { rol, isLogged, usuarioNombre } = useAuth()` y añadir un `<span>` junto al botón para mostrarlo. ~5 líneas de código.
- **Impacto:** Mejora de UX — el usuario siempre sabe con qué cuenta está conectado.

### B3 — Focus state faltante en filtros de ClienteList
- **Estado:** 🔴 Pendiente
- **Problema encontrado:** Los inputs de filtro en `ClienteList.vue` (`.filter-search`, `.filter-select`) no tienen estilos de `:focus` definidos. En contraste, `MermaList.vue` sí define `.filter-input:focus` con `border-color: var(--primary)` y `box-shadow: 0 0 0 3px var(--primary-bg)`.
- **Solución:** Al centralizar los filtros (M1), asegurar que los estilos de focus estén incluidos.
- **Impacto:** Mejora de accesibilidad y consistencia visual.

### B4 — Centralizar .actions-col / .font-medium
- **Estado:** 🔴 Pendiente
- **Problema encontrado:** La clase `.actions-col { text-align: right; }` se repite en `ClienteList.vue`, `MermaList.vue` y `UsuarioList.vue`. La clase `.font-medium { font-weight: 500; }` se repite en `RecetaList.vue` y `DashboardEstadoPedidos.vue`.
- **Solución:** Mover a `style.css` como utilidades globales.
- **Impacto:** Elimina duplicación menor pero recurrente.

### B5 — RecetaList usa .btn-icon en vez de .btn-action-ghost global
- **Estado:** 🔴 Pendiente
- **Problema encontrado:** `RecetaList.vue:87-106` define `.btn-icon` y `.btn-icon-danger` localmente (~20 líneas). Estas clases son funcionalmente idénticas a `.btn-action-ghost.edit` y `.btn-action-ghost.delete` que ya existen globalmente en `style.css`.
- **Solución:** Reemplazar `.btn-icon` por `.btn-action-ghost` en el template y eliminar el CSS local.
- **Impacto:** Elimina CSS redundante y usa el sistema global existente.

### B6 — Inline style en ProduccionForm y bloques style vacíos
- **Estado:** 🔴 Pendiente
- **Problema encontrado:**
  - `ProduccionForm.vue:65` usa `style="display:flex; gap:8px;"` directamente en el template. Debería ser una clase CSS (podría usar `.form-actions` global).
  - `DashboardKPIs.vue`, `MaterialForm.vue` y `MermaForm.vue` tienen bloques `<style scoped>` completamente vacíos.
- **Solución:** Reemplazar inline style por clase CSS; eliminar bloques `<style>` vacíos.
- **Impacto:** Limpieza de código.

---

## Análisis: Botón "Agregar Nuevo Cliente"

Se analizó la funcionalidad de "Agregar nuevo cliente" en `ClientesPage.vue` para determinar qué quedaría innecesario si se elimina.

**Ubicación del botón:** `ClientesPage.vue:12-16`
```html
<button class="btn btn-primary" @click="abrirNuevoFormulario">
  <PlusIcon class="icon-md icon-inline" /> Nuevo Cliente
</button>
```

### Lo que se puede eliminar de forma segura:

| Elemento | Archivo | Líneas |
|---|---|---|
| `import { PlusIcon }` | `ClientesPage.vue` | L52 |
| `PlusIcon` en components | `ClientesPage.vue` | L63 |
| Botón "Nuevo Cliente" en template | `ClientesPage.vue` | L12-16 |
| `abrirNuevoFormulario()` | `ClientesPage.vue` | L125-128 |
| Título condicional "Agregar Nuevo Cliente" | `ClienteForm.vue` | L6 (simplificar a solo "Editar Cliente") |

### Lo que NO se puede eliminar:

| Elemento | Razón |
|---|---|
| `mostrarFormulario` (data) | También lo usa la edición de clientes existentes |
| `clienteParaEditar` (data) | También lo usa la edición |
| `cerrarFormulario()` | También lo usa la edición |
| `guardarCliente()` | Maneja tanto creación como actualización |
| `<div class="column-form">` | Se muestra al editar un cliente existente |
| CSS de `.with-form`, `.column-form`, `slideInRight` | Necesarios para la animación del panel de edición |
| `ClienteForm.vue` completo | Sigue siendo necesario para editar clientes |

---

## Hoja de Ruta de Implementación

**Fase 1 — Completada ✅ (Auditorías anteriores)**
- [x] Aplicar fix global de Dark Mode en `style.css` — `color: inherit` y `color-scheme: dark` (A1 anterior).
- [x] Arreglar destructuración en `useContadorRecetas.js` (A2 anterior).
- [x] Eliminar `.spin` local duplicado en componentes.
- [x] Eliminar archivo muerto `crypto.js`.
- [x] Unificar nomenclatura inglés/español (B1 anterior).
- [x] Extraer `.btn-refresh`, `.loading-state`, `.empty-state`, `.stat-card` a `style.css`.
- [x] Reemplazar colores HEX en `.badge-*` globales por variables CSS.
- [x] Implementar Singleton Promise en `useCatalogos.js`.

**Fase 2 — Bugs Críticos de UX (Nueva)**
- [x] Corregir Dark Mode en RecetaList: reemplazar `var(--text-dark)` por `var(--text-h)` y HEX por variables (A1).
- [x] Unificar `.empty-state-card` duplicada en `style.css` (A2).

**Fase 3 — Centralización de Estilos Duplicados (Nueva)**
- [x] Centralizar `.filters` / `.filter-input` / `.filter-select` a `style.css` (M1).
- [x] Crear modificador `.data-card-header.neutral` en `style.css` (M2).
- [x] Crear clases globales `.chip-selector` / `.chip-option` en `style.css` (M3).
- [x] Centralizar botón submit con gradiente como `.btn-primary-gradient` (M5).


**Fase 4 — Alineación de Formularios (Nueva)**
- [x] Migrar inputs de `UsuarioForm`, `RecetaForm` y `ProduccionForm` al sistema global `.form-input` (M4).
- [x] Refactorizar `UsuarioList` para usar `.data-card` global (M6).
- [x] Reemplazar `.btn-icon` por `.btn-action-ghost` en `RecetaList` (B5).

**Fase 5 — Colores y Variables CSS (Nueva)**
- [x] Reemplazar HEX hardcoded en componentes por variables CSS (M7).
- [x] Corregir variables CSS inexistentes: `--text-main`, `--bg-hover`, `--primary-rgb` (B1).

**Fase 6 — Mejoras de UX (Nueva)**
- [x] Mostrar supervisor/usuario conectado en NavBar de forma sutil (B2).
- [x] Eliminar botón "Agregar nuevo cliente" de la pantalla de Clientes.

**Fase 7 — Limpieza Menor (Nueva)**
- [x] Añadir focus state a filtros de ClienteList (B3).
- [x] Centralizar `.actions-col` y `.font-medium` como utilidades globales (B4).
- [x] Reemplazar inline style en ProduccionForm:65 por clase CSS (B6).
- [x] Eliminar bloques `<style scoped>` vacíos en DashboardKPIs, MaterialForm, MermaForm (B6).
