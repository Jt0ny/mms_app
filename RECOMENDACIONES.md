# Plan de Trabajo Oficial — MMS App

> **Auditor:** Arquitecto de Software Senior
> **Fecha original:** 2026-07-22
> **Última auditoría:** 2026-08-20 (Auditoría #3 — Completa)
> **Alcance:** Auditoría integral: estilos, botones, iconos, Alertas, Login, refactorización, verificación de recomendaciones previas.

---

## Tabla de Contenidos

- [Resumen Ejecutivo](#resumen-ejecutivo)
- [Estado de Recomendaciones Anteriores](#estado-de-recomendaciones-anteriores)
- [Prioridad Alta 🔴](#prioridad-alta-)
  - [A1 — Login: manejo de errores incorrecto](#a1--login-manejo-de-errores-incorrecto)
  - [A2 — Botones personalizados sin estandarizar](#a2--botones-personalizados-sin-estandarizar)
  - [A3 — useMensajes: estado global compartido entre componentes](#a3--usemensajes-estado-global-compartido-entre-componentes)
  - [A4 — ProduccionRecetasView: manejo de estado de mensajes independiente](#a4--produccionrecetasview-manejo-de-estado-de-mensajes-independiente)
- [Prioridad Media 🟠](#prioridad-media-)
  - [M1 — Estilos duplicados en selectores tipo chip](#m1--estilos-duplicados-en-selectores-tipo-chip)
  - [M2 — Inline styles residuales en UsuarioList y UsuarioForm](#m2--inline-styles-residuales-en-usuariolist-y-usuarioform)
  - [M3 — HEX hardcoded en NavBar](#m3--hex-hardcoded-en-navbar)
  - [M4 — Patrón .form-icon duplicado entre UsuarioList y UsuarioForm](#m4--patrón-form-icon-duplicado-entre-usuariolist-y-usuarioform)
  - [M5 — PlanificacionView: .summary-card duplica patrón de PlanificacionResumen](#m5--planificacionview-summary-card-duplica-patrón-de-planificacionresumen)
  - [M6 — Patrón de barras de progreso duplicado](#m6--patrón-de-barras-de-progreso-duplicado)
  - [M7 — RecetaForm: .btn-cancel replica .btn .btn-secondary](#m7--recetaform-btn-cancel-replica-btn-btn-secondary)
  - [M8 — .text-info usa HEX hardcoded en style.css](#m8--text-info-usa-hex-hardcoded-en-stylecss)
  - [M9 — ProduccionRecetasView: estilos no usan sistema global](#m9--produccionrecetasview-estilos-no-usan-sistema-global)
- [Prioridad Baja 🟢](#prioridad-baja-)
  - [B1 — MermaMotivoSelector: .mt-16 local debería ser clase global](#b1--mermamotivoselector-mt-16-local-debería-ser-clase-global)
  - [B2 — RecetaList: .badge-gray podría ser clase global](#b2--recetalist-badge-gray-podría-ser-clase-global)
  - [B3 — VistaPreviaTable: @keyframes fadeIn duplicable](#b3--vistapreviatable-keyframes-fadein-duplicable)
  - [B4 — PlanificacionView: .text-muted y .py-4 locales redundantes](#b4--planificacionview-text-muted-y-py-4-locales-redundantes)
  - [B5 — Scrollbar styling duplicado](#b5--scrollbar-styling-duplicado)
  - [B6 — ProduccionForm: return duplicado en setup()](#b6--produccionform-return-duplicado-en-setup)
- [Auditoría de Estilos por Componente](#auditoría-de-estilos-por-componente)
- [Estandarización de Botones](#estandarización-de-botones)
- [Iconos del Dashboard](#iconos-del-dashboard)
- [Auditoría del Componente Alertas](#auditoría-del-componente-alertas)
- [Problema del Login](#problema-del-login)
- [Hoja de Ruta de Implementación](#hoja-de-ruta-de-implementación)

---

## Resumen Ejecutivo

La auditoría del 2026-08-20 (#3) se centró en una revisión exhaustiva y directa de **todo** el código fuente de `/src`, verificando cada recomendación anterior contra el código real.

**Hallazgos clave:**

1. **Todas las recomendaciones previas están completadas.** Se verificaron las 22 recomendaciones anteriores (A1-A4, M1-M13, B1-B10) directamente en el código — todas están resueltas correctamente.
2. **Login: error de UX crítico.** Cuando las credenciales son incorrectas, Supabase Auth arroja un `AuthApiError` que el catch de `UsuarioClient.login()` convierte en un genérico "No se pudo validar el usuario", cuando debería diferenciar entre credenciales inválidas vs. error de conexión.
3. **Botones personalizados sin estandarizar.** Existen al menos 7 variantes de botón creadas localmente (`.btn-asignar`, `.btn-distribuir`, `.btn-limpiar`, `.btn-cancel`, `.btn-cancelar`, `.btn-confirmar`, `.btn-add-receta`, `.btn-eliminar-row`, `.btn-excluir`, `.btn-quitar`) que no usan el sistema `.btn` global.
4. **useMensajes comparte estado global.** El composable usa un `reactive` a nivel de módulo, causando que todos los componentes que lo usan compartan el mismo `mensaje` — mostrando/ocultando alertas en componentes no relacionados.
5. **Estilos en buen estado general.** La mayoría de componentes ya usan clases globales correctamente. Los estilos locales restantes son en su mayoría justificados por la estructura específica del componente.

---

## Estado de Recomendaciones Anteriores

Se verificó el código real para confirmar el progreso de **todas** las tareas previas.

| Recomendación | Estado verificado (2026-08-20) |
|---|---|
| **RLS en Supabase** | ✅ Completado |
| **Tabla DashboardEstadoPedidos** | ✅ Completado |
| **Operaciones multi-tabla (RPCs)** | ✅ Completado |
| **Mensaje de usuarios no desaparece** | ✅ Completado |
| **Sincronización diaria sin límite** | ✅ Completado |
| **Colores CSS Variables (UsuarioRol)** | ✅ Completado |
| **Colores CSS Variables (Badges en style.css)** | ✅ Completado |
| **Animación `.spin` duplicada** | ✅ Completado |
| **A1 — Dark Mode inputs (color-scheme)** | ✅ Completado |
| **A2 — sincronizarContadorReceta** | ✅ Completado |
| **A3 — setup() duplicado en NavBar** | ✅ Completado — Solo un `setup()` (L60-63) |
| **A4 — Parpadeo de .btn-primary:hover** | ✅ Completado — Hover usa `opacity: 0.9` + `translateY(-1px)` |
| **M1 — Filtros duplicados** | ✅ Completado — `.filter-bar`, `.filter-input`, `.filter-select` en style.css |
| **M2 — .data-card-header neutral** | ✅ Completado — `.data-card-header.neutral` en style.css |
| **M3 — Selector de chips** | ✅ Completado — `.chip-options`, `.chip-option` en style.css |
| **M4 — Composables grandes** | ✅ Completado |
| **M5 — Centralizar botón submit gradiente** | ✅ Completado |
| **M6 — UsuarioList data-card** | ✅ Completado — Usa `.data-card`, `.data-card-header`, `.data-card-table`, `.btn-action-ghost` |
| **M7 — HEX hardcoded** | ✅ Completado — PlanificacionAsignacion no tiene HEX |
| **M9 — Variables CSS inexistentes** | ✅ Completado |
| **M10 — Centralizar .summary-label** | ✅ Completado — Presente en style.css (L1135) |
| **M11 — Centralizar indicador selección** | ✅ Completado — `.selector-display` en style.css (L1145) |
| **M12 — .submit-btn sin CSS** | ✅ Completado |
| **M13 — Redefinición local de .badge** | ✅ Completado |
| **B1 — Variables CSS inexistentes** | ✅ Completado |
| **B2 — Supervisor conectado en NavBar** | ✅ Completado — `.user-profile-block` muestra nombre y rol |
| **B3 — Focus state filtros ClienteList** | ✅ Completado — Focus heredado de `.filter-input:focus` global |
| **B4 — Centralizar .actions-col/.font-medium/.text-right** | ✅ Completado — Presentes en style.css |
| **B5 — RecetaList .btn-icon** | ✅ Completado — Usa `.btn-action-ghost` |
| **B6 — Inline styles y bloques style vacíos** | 🟡 Parcial — Quedan 2 inline styles: `style="gap: 14px;"` en UsuarioList L4 y UsuarioForm L5 |
| **B7 — mostrarMensaje composable** | ✅ Completado — `useMensajes.js` existe y se usa |
| **B8 — .date-field código muerto** | ✅ Completado |
| **B9 — Reorganización carpetas** | ✅ Completado |
| **B10 — Scroll en MainLayout** | ✅ Completado — `height: 100vh` + `overflow-y: auto` en `.page-content` |
| **M4 — Alinear inputs al sistema global** | ✅ Completado |

---

## Prioridad Alta 🔴

### A1 — Login: manejo de errores incorrecto

- **Estado:** ❌ Pendiente

#### Problema

Cuando el usuario introduce credenciales incorrectas (email o contraseña), la aplicación muestra el mensaje:

> "No se pudo validar el usuario. Revisa la conexion con la API."

cuando debería mostrar:

> "Email o contraseña incorrectos."

#### Evidencia

**Flujo del error:**

1. `LoginForm.vue` L56 → llama `UsuarioClient.login(email, contrasena)`
2. `UsuarioClient.js` L7 → `supabase.auth.signInWithPassword({ email, password })`
3. Supabase devuelve un `AuthApiError` con `message: "Invalid login credentials"` y `status: 400`
4. `UsuarioClient.js` L12 → `if (authError) throw authError` — lanza el error
5. `UsuarioClient.js` L24 → catch captura y retorna `{ success: false, error }`
6. `LoginForm.vue` L67-68 → `if (!response.success)` → muestra "No se pudo validar el usuario..."

**El problema raíz:** `UsuarioClient.login()` no diferencia entre tipos de error. Un error de credenciales (400) se trata igual que un error de red o servidor (500+). El `response.error` contiene la información necesaria (`error.status === 400` y `error.message === "Invalid login credentials"`), pero `LoginForm.vue` no la usa.

Adicionalmente, hay un path L60-65 que nunca se ejecuta: `if (response.success && !response.data)` mostraría "Email o contraseña incorrectos" — pero en realidad cuando las credenciales son incorrectas, `response.success` es `false`, por lo que este bloque es código muerto.

#### Archivos afectados

- `src/client/UsuarioClient.js` — L5-27
- `src/components/login/LoginForm.vue` — L44-69

#### Recomendación

**Opción A (recomendada):** Enriquecer el retorno de `UsuarioClient.login()` para incluir un `errorTipo`:

```js
// UsuarioClient.js
catch (error) {
  const esCredenciales = error?.status === 400 || 
    error?.message?.includes('Invalid login credentials')
  return { 
    success: false, 
    error,
    errorTipo: esCredenciales ? 'credenciales' : 'conexion'
  }
}
```

```js
// LoginForm.vue
if (!response.success) {
  if (response.errorTipo === 'credenciales') {
    this.mostrarMensaje('error', 'Email o contraseña incorrectos.')
  } else {
    this.mostrarMensaje('error', 'Error de conexión. Verifica tu acceso a internet.')
  }
}
```

**Opción B:** Centralizar la lógica de errores en un helper reutilizable que cualquier Client pueda usar.

#### Impacto

- UX directa: los usuarios ven un mensaje confuso que sugiere un problema técnico cuando simplemente escribieron mal su contraseña.
- Seguridad: no distinguir errores puede dificultar que los usuarios se autocorrijan.

#### Dependencias

- Ninguna. Es un cambio aislado.

---

### A2 — Botones personalizados sin estandarizar

- **Estado:** ❌ Pendiente

#### Problema

Existen al menos **12 clases de botón** definidas localmente en componentes individuales que no usan el sistema global `.btn` + variantes. Esto provoca inconsistencias visuales en tamaños, border-radius, hover, disabled, y transiciones.

#### Evidencia

| Clase local | Componente | Duplica |
|---|---|---|
| `.btn-asignar` | PlanificacionResumen L138-159 | `.btn .btn-primary` (sin gradiente) |
| `.btn-distribuir` | PlanificacionAsignacion L97-116 | `.btn .btn-primary` (sin gradiente) |
| `.btn-limpiar` | PlanificacionAsignacion L118-132 | Nuevo: no tiene equivalente global |
| `.btn-cancel` | RecetaForm L140-160 | `.btn .btn-secondary` (pero con `font-size: 16px` y `width: 100%`) |
| `.btn-cancelar` | PlanificacionMapeoRecetas L438-451 | `.btn .btn-secondary` |
| `.btn-confirmar` | PlanificacionMapeoRecetas L453-471 | `.btn .btn-primary` (sin gradiente) |
| `.btn-add-receta` | PlanificacionMapeoRecetas L408-428 | Nuevo: botón dashed |
| `.btn-eliminar-row` | PlanificacionMapeoRecetas L387-402 | `.btn-action-ghost.delete` parcial |
| `.btn-excluir` | PlanificacionOperadorCard L174-193 | Botón circular transparente |
| `.btn-quitar` | PlanificacionOperadorCard L267-283 | `.btn-action-ghost.delete` parcial |
| `.receta-accion` | ProduccionRecetasView L240-271 | `.btn .btn-primary` |
| `.tipo-btn` | MermaTipoSelector L41-67 | Variante de toggle, justificada |

**Inconsistencias detectadas:**

- `border-radius`: varía entre `6px`, `8px`, `10px`, `12px`, `999px`
- `hover`: algunos usan `opacity`, otros `brightness`, otros `background`
- `disabled`: algunos definen `cursor: progress`, otros `not-allowed`, otros no lo definen
- `transition`: mezcla de `0.15s` y `0.2s` sin estándar
- Ninguno hereda la base `.btn` para padding/font-weight/font-size consistentes

#### Archivos afectados

- `src/components/planificacion/PlanificacionResumen.vue`
- `src/components/planificacion/PlanificacionAsignacion.vue`
- `src/components/planificacion/PlanificacionMapeoRecetas.vue`
- `src/components/planificacion/PlanificacionOperadorCard.vue`
- `src/components/recetas/RecetaForm.vue`
- `src/components/produccion/ProduccionRecetasView.vue`
- `src/components/mermas/MermaTipoSelector.vue`

#### Recomendación

1. Los botones que replican `.btn-primary` o `.btn-secondary` deberían usar las clases globales existentes.
2. Crear 2-3 variantes nuevas en `style.css` si son patrones recurrentes:
   - `.btn-dark` — para el botón "Limpiar" (fondo oscuro)
   - `.btn-dashed` — para botones de "+ Agregar" con borde dashed
3. Los botones de acción específica como `.btn-excluir` y `.btn-quitar` pueden mantenerse locales por su contexto visual muy específico.
4. `.tipo-btn` de `MermaTipoSelector` es un patrón de toggle, no un botón de acción, por lo que debe permanecer local.

#### Impacto

- Consistencia visual en toda la app
- Reducción de ~120 líneas de CSS local redundante
- Facilita cambios de estilo futuros

---

### A3 — useMensajes: estado global compartido entre componentes

- **Estado:** ❌ Pendiente

#### Problema

`useMensajes.js` define `mensaje` y `mensajeInline` como objetos `reactive` **a nivel de módulo** (fuera de la función). Esto significa que **todos los componentes** que llaman a `useMensajes()` comparten la misma referencia. Si `DashboardPage` muestra un error, ese mismo error aparece en `LoginForm`, `UsuarioForm`, etc.

#### Evidencia

```js
// useMensajes.js L3-4
const mensaje = reactive({ tipo: null, texto: '' })        // ← Singleton
const mensajeInline = reactive({ tipo: null, texto: '' })   // ← Singleton
```

**Componentes que usan `useMensajes()`:** LoginForm, UsuarioForm, DashboardPage, y cualquier Page que use `mostrarMensaje`.

El patrón funciona porque cada página ocupa una ruta diferente y Vue destruye/crea componentes al navegar, pero es un diseño frágil: si dos componentes visibles al mismo tiempo usan `useMensajes`, los mensajes colisionan.

#### Archivos afectados

- `src/composables/useMensajes.js`
- Todos los componentes que lo importan (~12 archivos)

#### Recomendación

Evaluar si el patrón singleton es intencional (sólo un mensaje visible a la vez, tipo "toast"). Si es así, documentarlo. Si no, refactorizar para que cada llamada a `useMensajes()` cree su propia instancia:

```js
export function useMensajes() {
  const mensaje = reactive({ tipo: null, texto: '' })
  // ...
}
```

**Nota:** El patrón singleton puede ser deseable si se quiere un sistema de notificaciones centralizado. La decisión depende del diseño deseado.

#### Impacto

- Previene colisiones de mensajes si hay componentes con Alertas visibles simultáneamente (ej. Dashboard con alertas de stock + mensaje del composable)

---

### A4 — ProduccionRecetasView: manejo de estado de mensajes independiente

- **Estado:** ❌ Pendiente

#### Problema

`ProduccionRecetasView.vue` no usa `useMensajes`. En su lugar define su propio `mensaje` local en `data()` (L116) y lo manipula directamente en `buscarRecetas()` (L172-183). Esto es inconsistente con el resto de la app.

#### Evidencia

```js
// ProduccionRecetasView.vue L116
mensaje: { tipo: null, texto: '' },

// L172
this.mensaje = { tipo: 'info', texto: 'Cargando recetas...' }
```

#### Archivos afectados

- `src/components/produccion/ProduccionRecetasView.vue`

#### Recomendación

Migrar a `useMensajes()` para consistencia, o si el singleton de useMensajes se refactoriza a instancias individuales, adoptarlo directamente.

---

## Prioridad Media 🟠

### M1 — Estilos duplicados en selectores tipo chip

- **Estado:** 🟡 Parcial

#### Problema

Los componentes `RecetaCategoria`, `UsuarioRol` y `MermaOperadorSelector` tienen estilos locales para el contenedor del selector (wrapper + label) que siguen un patrón idéntico:

```css
/* Patrón repetido en 3 componentes: */
.xxx-selector { display: flex; flex-direction: column; gap: 10px; }
.xxx label { font-weight: 600; color: var(--text-h); }
.selector-container { display: flex; flex-direction: column; gap: 10px; }
```

La parte de chips/options ya fue centralizada (`.chip-options`, `.selector-display`), pero el wrapper que los envuelve aún se repite.

#### Archivos afectados

- `src/components/recetas/RecetaCategoria.vue` — L59-74
- `src/components/usuarios/UsuarioRol.vue` — L52-66
- `src/components/mermas/MermaOperadorSelector.vue` — L53-71

#### Recomendación

Crear una clase global `.selector-group` en `style.css`:
```css
.selector-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.selector-group label {
  font-weight: 600;
  color: var(--text-h);
}
```

Esto eliminaría ~36 líneas de CSS local.

---

### M2 — Inline styles residuales en UsuarioList y UsuarioForm

- **Estado:** ❌ Pendiente

#### Problema

Quedan 2 inline styles `style="gap: 14px;"` en:
- `UsuarioList.vue` L4
- `UsuarioForm.vue` L5

#### Recomendación

Reemplazar con una clase utilitaria existente o crear `.gap-14 { gap: 14px; }`.

---

### M3 — HEX hardcoded en NavBar

- **Estado:** ❌ Pendiente

#### Problema

NavBar.vue tiene 2 colores HEX hardcoded en `<style scoped>`:
- L126: `color: #fca5a5;` (red-300 para hover de logout)
- L134: `color: #6ee7b7;` (green-300 para hover de login)

#### Archivos afectados

- `src/components/layout/NavBar.vue` — L126, L134

#### Recomendación

Crear variables CSS para estos colores semánticos:
```css
--color-logout-hover: #fca5a5;
--color-login-hover: #6ee7b7;
```

O usar `rgba()` con variables existentes para derivarlos dinámicamente.

**Nota:** Estos son colores válidos para hover states en un navbar oscuro — no son un bug, pero sí una inconsistencia con el patrón de variables.

---

### M4 — Patrón .form-icon duplicado entre UsuarioList y UsuarioForm

- **Estado:** ❌ Pendiente

#### Problema

Ambos componentes definen localmente:
```css
.form-icon { font-size: 28px; line-height: 1; flex-shrink: 0; }
```

#### Archivos afectados

- `src/components/usuarios/UsuarioList.vue` — L87-91
- `src/components/usuarios/UsuarioForm.vue` — L108-112

#### Recomendación

Mover a `style.css` como clase global.

---

### M5 — PlanificacionView: .summary-card duplica patrón de PlanificacionResumen

- **Estado:** 🟡 Parcial

#### Problema

Ambos componentes definen su propio `.summary-card` con estilos similares pero ligeramente diferentes:

| Propiedad | PlanificacionResumen | PlanificacionView |
|---|---|---|
| `border-radius` | `20px` | `12px` |
| `background` | `linear-gradient(...)` | `var(--bg)` |
| `box-shadow` | sombra fuerte | sombra suave |
| `grid` | `repeat(2, minmax(0,1fr))` | `1fr 1fr auto` |

#### Archivos afectados

- `src/components/planificacion/PlanificacionResumen.vue` — L120-134
- `src/components/planificacion/PlanificacionView.vue` — L127-137

#### Recomendación

Clasificar como **LOCAL**. Aunque comparten el nombre `.summary-card`, sus propósitos visuales son suficientemente diferentes (uno es para el modo edición/planificación y el otro para la vista de lectura). Mantener locales pero renombrar uno para evitar confusión (ej. `.view-summary-card`).

---

### M6 — Patrón de barras de progreso duplicado

- **Estado:** ❌ Pendiente

#### Problema

Dos componentes definen barras de progreso con el mismo patrón visual:

**DashboardAvanceOperador:**
```css
.progress-bar-wrap { width: 100%; height: 10px; background: var(--border-light); border-radius: 999px; overflow: hidden; }
.progress-bar-fill { height: 100%; border-radius: 999px; transition: width 0.4s ease; }
```

**DashboardDistribucionMermas:**
```css
.motivo-bar-wrap { width: 100%; height: 6px; background: var(--border-light); border-radius: 999px; overflow: hidden; }
.motivo-bar-fill { height: 100%; background: var(--primary); border-radius: 999px; }
```

**PlanificacionResumen** también tiene barras similares (`.balance-bar-track`, `.balance-bar-fill`).

#### Archivos afectados

- `src/components/dashboard/DashboardAvanceOperador.vue` — L104-116
- `src/components/dashboard/DashboardDistribucionMermas.vue` — L120-132
- `src/components/planificacion/PlanificacionResumen.vue` — L186-197

#### Recomendación

Crear un sistema global de barra de progreso:
```css
.progress-track { width: 100%; background: var(--border-light); border-radius: 999px; overflow: hidden; }
.progress-track.sm { height: 6px; }
.progress-track.md { height: 8px; }
.progress-track.lg { height: 10px; }
.progress-fill { height: 100%; border-radius: 999px; transition: width 0.4s ease; }
```

---

### M7 — RecetaForm: .btn-cancel replica .btn .btn-secondary

- **Estado:** ❌ Pendiente

#### Problema

`RecetaForm.vue` define `.btn-cancel` (L140-160) con ~20 líneas de CSS que replica casi exactamente `.btn .btn-secondary` + `.btn-block`. La diferencia es solo `font-size: 16px`.

#### Archivos afectados

- `src/components/recetas/RecetaForm.vue` — L140-160

#### Recomendación

Reemplazar `<button class="btn-cancel">` por `<button class="btn btn-secondary btn-block">`.

---

### M8 — .text-info usa HEX hardcoded en style.css

- **Estado:** ❌ Pendiente

#### Problema

En `style.css` L1062:
```css
.text-info { color: #3b82f6; }
```

Todos los demás colores utilitarios usan variables CSS. Este valor debería ser una variable (`--info` o `--color-info`), aunque actualmente no existe una variable `--info` definida en `:root`.

#### Archivos afectados

- `src/style.css` — L1062

#### Recomendación

Definir `--info: #3b82f6;` en `:root` y usar `.text-info { color: var(--info); }`. Esto también beneficiaría al dark mode si se necesita un ajuste posterior.

---

### M9 — ProduccionRecetasView: estilos no usan sistema global

- **Estado:** ❌ Pendiente

#### Problema

`ProduccionRecetasView.vue` define ~140 líneas de CSS local (L191-333). Muchos de estos estilos no aprovechan las clases globales existentes:

- `.controls input` podría usar `.filter-input`
- `.empty` podría usar `.empty-state` o `.empty-state-card`
- `.receta-accion` podría usar `.btn .btn-primary`
- `.receta-card` tiene estructura propia que es justificada pero podría usar `.data-card` parcialmente

#### Archivos afectados

- `src/components/produccion/ProduccionRecetasView.vue` — L191-333

#### Recomendación

Migrar gradualmente los estilos que tienen equivalente global. Mantener locales los que son específicos del componente (`.receta-head`, `.ingrediente-list`).

---

## Prioridad Baja 🟢

### B1 — MermaMotivoSelector: .mt-16 local debería ser clase global

- **Estado:** ❌ Pendiente

#### Problema

`MermaMotivoSelector.vue` define localmente `.mt-16 { margin-top: 16px; }`. Ya existe `.mb-4 { margin-bottom: 16px; }` como utilidad global, pero no `mt-16`.

#### Recomendación

Agregar `mt-4 { margin-top: 16px; }` a las utilidades globales de `style.css`.

---

### B2 — RecetaList: .badge-gray podría ser clase global

- **Estado:** ❌ Pendiente

#### Problema

RecetaList define `.badge-gray` localmente. Podría ser útil como variante global de `.badge` ya que "sin categoría" es un patrón común.

#### Recomendación

Mover a `style.css` junto con los demás `.badge-*`.

---

### B3 — VistaPreviaTable: @keyframes fadeIn duplicable

- **Estado:** 🟡 Parcial

#### Problema

`VistaPreviaTable.vue` define `@keyframes fadeIn` localmente. Si otros componentes necesitan animación similar, sería mejor tenerla global.

#### Recomendación

Mantener local por ahora. Centralizar solo si se detecta duplicación futura.

---

### B4 — PlanificacionView: .text-muted y .py-4 locales redundantes

- **Estado:** ❌ Pendiente

#### Problema

`PlanificacionView.vue` define:
- `.text-muted { color: var(--text-light); }` — equivalente a `.text-light` global
- `.py-4 { padding-top: 2rem !important; padding-bottom: 2rem !important; }` — utilidad local con `!important`

#### Recomendación

Reemplazar `.text-muted` por `.text-light`. Crear `.py-4` global si se necesita, o usar clase inline.

---

### B5 — Scrollbar styling duplicado

- **Estado:** ❌ Pendiente

#### Problema

El mismo patrón de scrollbar personalizado se define en:
- `DashboardEstadoPedidos.vue` L144-157
- `PlanificacionOperadorCard.vue` L327-338

#### Recomendación

Crear una clase global `.custom-scroll` o aplicar el estilo a `.data-card-content` directamente.

---

### B6 — ProduccionForm: return duplicado en setup()

- **Estado:** ❌ Pendiente

#### Problema

`ProduccionForm.vue` L150-151 retorna `obtenerCantidad` dos veces en el setup():
```js
return {
  // ...
  obtenerCantidad,
  obtenerCantidad, // ← duplicado
  // ...
}
```

No causa un bug pero es código redundante.

#### Archivos afectados

- `src/components/produccion/ProduccionForm.vue` — L150-151

---

## Auditoría de Estilos por Componente

### Clasificación de estilos: GLOBAL / LOCAL / REFACTORIZAR / ELIMINAR

| Componente | Líneas CSS | Clasificación | Notas |
|---|---|---|---|
| **MainLayout** | 31 | ✅ LOCAL | Layout principal — debe permanecer local |
| **NavBar** | 241 | ✅ LOCAL | Navegación — justificadamente local. HEX a refactorizar (M3) |
| **SideBar** | 204 | ✅ LOCAL | Sidebar colapsable — lógica visual propia |
| **LoginForm** | 83 | ✅ LOCAL | Formulario de login — estilo único |
| **Alertas** | 32 | ✅ LOCAL (scoped) | Los estilos scoped son correctos |
| **DashboardKPIs** | 0 | ✅ SIN ESTILOS | Usa solo clases globales — perfecto |
| **DashboardAvanceOperador** | 53 | 🟡 LOCAL + REFACTORIZAR | Barras de progreso → candidatas a global (M6) |
| **DashboardDistribucionMermas** | 105 | 🟡 LOCAL + REFACTORIZAR | Barras → global (M6). Resto es justificado |
| **DashboardEstadoPedidos** | 61 | 🟡 LOCAL + REFACTORIZAR | Scrollbar duplicada (B5). `.quantity` podría usar `.text-quantity` |
| **DashboardPage** | 17 | ✅ LOCAL | Mínimo y justificado |
| **UsuarioList** | 41 | 🟡 REFACTORIZAR | `.form-icon` duplicado (M4), inline style (M2) |
| **UsuarioForm** | 27 | 🟡 REFACTORIZAR | `.form-icon` duplicado (M4), inline style (M2) |
| **UsuarioRol** | 15 | 🟡 REFACTORIZAR | Wrapper duplicado (M1) |
| **ClienteList** | 87 | ✅ LOCAL | Estilos de tabla con filas activas — justificado |
| **ClienteForm** | 11 | ✅ LOCAL | Mínimo |
| **RecetaList** | 12 | 🟡 REFACTORIZAR | `.badge-gray` → global (B2) |
| **RecetaForm** | 57 | 🟡 REFACTORIZAR | `.btn-cancel` → `.btn .btn-secondary` (M7) |
| **RecetaCategoria** | 18 | 🟡 REFACTORIZAR | Wrapper duplicado (M1) |
| **RecetaMateriaPrimaList** | 0 | ✅ SIN ESTILOS | Usa globales |
| **RecetaMaterialesList** | 0 | ✅ SIN ESTILOS | Usa globales |
| **MermaList** | 56 | ✅ LOCAL | Badges de dominio + filtro date — justificado |
| **MermaForm** | 0 | ✅ SIN ESTILOS | Usa globales |
| **MermaMotivoSelector** | 3 | 🟡 REFACTORIZAR | `.mt-16` → global (B1) |
| **MermaOperadorSelector** | 19 | 🟡 REFACTORIZAR | Wrapper duplicado (M1) |
| **MermaTipoSelector** | 40 | ✅ LOCAL | Toggle buttons — patrón específico |
| **PlanificacionAsignacion** | 78 | 🔴 REFACTORIZAR | Botones → estandarizar (A2) |
| **PlanificacionResumen** | 114 | 🟡 LOCAL + REFACTORIZAR | `.btn-asignar` → estandarizar. Barras → global (M6) |
| **PlanificacionView** | 66 | 🟡 REFACTORIZAR | `.text-muted`/`.py-4` redundantes (B4) |
| **PlanificacionOperadorCard** | 278 | ✅ LOCAL | Card compleja con tablas internas — justificado |
| **PlanificacionMapeoRecetas** | 258 | 🟡 LOCAL + REFACTORIZAR | Botones → estandarizar (A2). Estructura justificada |
| **ProduccionForm** | 176 | ✅ LOCAL | Formulario con stepper — patrón único y complejo |
| **ProduccionRecetasView** | 142 | 🟡 REFACTORIZAR | Varios estilos tienen equivalentes globales (M9) |
| **AccionesButton** | 15 | ✅ LOCAL | Mínimo y específico |
| **InventarioTable** | 12 | ✅ LOCAL | Responsive override — necesario |
| **VistaPreviaTable** | 70 | ✅ LOCAL | Preview + responsive card — justificado |
| **MaterialForm** | 0 | ✅ SIN ESTILOS | Usa globales — perfecto |

---

## Estandarización de Botones

### Patrón predominante actual

El sistema global de botones en `style.css` define:

| Clase | Estilo | Estado |
|---|---|---|
| `.btn` | Base: `padding: 10px 18px`, `border-radius: 8px`, `font-weight: 600`, `font-size: 14px`, `transition: all 0.3s ease` | ✅ Consistente |
| `.btn-primary` | `background: linear-gradient(135deg, ...)`, `color: white`, `box-shadow` | ✅ |
| `.btn-primary:hover` | `opacity: 0.9`, `translateY(-1px)`, sombra ampliada | ✅ Sin parpadeo |
| `.btn-secondary` | `background: var(--bg)`, `border: 1px solid var(--border)` | ✅ |
| `.btn-danger` | `background: var(--error)`, `color: white` | ✅ |
| `.btn:disabled` | `opacity: 0.6`, `cursor: not-allowed` | ✅ |
| `.btn-block` | `width: 100%` | ✅ |
| `.btn-header-outline` | Botón para headers con fondo transparente | ✅ |
| `.btn-action-ghost` | Botones fantasma para acciones en tablas | ✅ |

### Botones que NO usan el sistema global

Véase A2 para el listado completo. Los botones de Planificación son los principales infractores.

### Verificación de comportamiento visual

- **Parpadeo:** No detectado. El fix anterior (A4 de auditoría #2) fue efectivo — `.btn-primary:hover` mantiene el gradiente.
- **Cambios bruscos:** No detectados.
- **Transiciones:** La base global usa `transition: all 0.3s ease`, lo cual es correcto. Los botones locales varían entre `0.15s` y `0.2s`.
- **Focus:** Solo `.chip-option` define `:focus-visible`. Los botones globales `.btn` NO definen `:focus-visible`. **Recomendación:** Agregar `focus-visible` a `.btn`.

### Recomendación de variantes nuevas

```css
/* Agregar a style.css */
.btn:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.btn-dark {
  background: var(--text-h);
  color: var(--bg);
}

.btn-dark:hover:not(:disabled) {
  opacity: 0.88;
  transform: translateY(-1px);
}
```

---

## Iconos del Dashboard

### Implementación

Todos los iconos del Dashboard (y de toda la app) usan **@heroicons/vue** en su variante `24/outline`.

### Inventario de iconos en Dashboard

| Componente | Iconos | Variante |
|---|---|---|
| DashboardPage | `ArrowPathIcon` | 24/outline |
| DashboardKPIs | `ClipboardDocumentListIcon`, `SunIcon`, `ExclamationTriangleIcon` | 24/outline |
| DashboardAvanceOperador | `UserIcon` | 24/outline |
| DashboardDistribucionMermas | `SunIcon` | 24/outline |

### Sistema de clases de iconos

Definido globalmente en `style.css`:
- `.icon-sm` — 16×16px
- `.icon-md` — 20×20px
- `.icon-lg` — 24×24px
- `.icon-xl` — 48×48px
- `.icon-inline` — `display: inline-block; vertical-align: text-bottom; margin-right: 4px;`
- `.icon-action` — 18×18px para acciones en tablas

### Análisis de consistencia

| Criterio | Estado | Detalle |
|---|---|---|
| Tamaños | ✅ Consistente | Todos usan `.icon-sm`, `.icon-md` o `.icon-lg` |
| Colores | ✅ Consistente | Usan clases `.text-primary`, `.text-warning`, `.text-error`, `.text-white` |
| Alineación | ✅ Consistente | Usan `.icon-inline` o `.flex-align-center` |
| Dark Mode | ✅ OK | Los iconos heredan color del texto, que se ajusta con variables CSS |
| Responsive | ✅ OK | Los tamaños fijos (px) se mantienen en todos los breakpoints |
| Parpadeos | ❌ No detectados | |
| Desalineación | ❌ No detectada | |
| Hover | ✅ OK | El `.spin` en `ArrowPathIcon` funciona correctamente con la animación global `@keyframes spin` |

### Hallazgo menor

En `DashboardDistribucionMermas.vue` L5:
```html
<SunIcon class="icon-lg text-primary" />
```
El icono `SunIcon` está dentro del `.data-card-header` que tiene `color: white`. La clase `.text-primary` sobreescribe el color a verde, lo cual crea un icono verde sobre fondo verde. Esto puede ser intencional para diferenciar el icono, pero reduce su visibilidad.

**Recomendación:** Verificar visualmente si el icono es legible. Si no, usar `.text-white` o remover la clase de color.

---

## Auditoría del Componente Alertas

### Ubicación y estructura

- **Archivo:** `src/components/shared/Alertas.vue`
- **Props:** `mensaje: { tipo, texto }` (Object, default `{ tipo: null, texto: '' }`)
- **Iconos:** `CheckCircleIcon` (exito), `XCircleIcon` (error), `InformationCircleIcon` (info) — de `@heroicons/vue/24/solid`
- **Visibilidad:** Se oculta automáticamente cuando `mensaje.texto` es falsy
- **Estilos:** Scoped, usa variables globales `--alert-*`

### Usos encontrados (14 componentes)

| Componente | Importa | Props | Patrón |
|---|---|---|---|
| LoginForm | ✅ `useMensajes` | `:mensaje="mensaje"` | Standard |
| UsuarioForm | ✅ `useMensajes` | `:mensaje="mensaje"` | Standard |
| DashboardPage | ✅ `useMensajes` | `:mensaje="mensaje"` + loop `v-for` de alertas stock | **Extendido** |
| MermaForm | ✅ import | `:mensaje="filtroInfo"` con `v-if` | Condicional por prop |
| ProduccionForm | ✅ `useMensajes` (vía composable) | `:mensaje="mensaje"` + 2 usos con objetos inline | **3 instancias** |
| ProduccionRecetasView | ✅ import | `:mensaje="mensaje"` (data local) | **NO usa useMensajes** |
| PlanificacionResumen | ✅ import | `:mensaje="mensajeInline"` | Usa `mensajeInline` del composable |
| ClientesPage | ✅ `useMensajes` | `:mensaje="mensaje"` | Standard |
| MaterialesPage | ✅ `useMensajes` | `:mensaje="mensaje"` | Standard |
| MateriaPrimaPage | ✅ `useMensajes` | `:mensaje="mensaje"` | Standard |
| MermasPage | ✅ `useMensajes` | `:mensaje="mensaje"` | Standard |
| PedidoPage | ✅ `useMensajes` | `:mensaje="mensaje"` | Standard |
| PlanificacionPage | ✅ `useMensajes` | `:mensaje="mensaje"` | Standard |
| ProduccionPage | ✅ `useMensajes` | `:mensaje="mensaje"` | Standard |
| RecetasPage | ✅ `useMensajes` | `:mensaje="mensaje"` | Standard |
| UsuariosPage | ✅ `useMensajes` | `:mensaje="mensaje"` | Standard |

### Hallazgos

1. **Consistencia de uso:** ✅ La gran mayoría usa el patrón `useMensajes()` + `<Alertas :mensaje="mensaje" />`.
2. **Excepción 1:** `ProduccionRecetasView` define su propio `mensaje` local — ver A4.
3. **Excepción 2:** `DashboardPage` usa Alertas en un loop `v-for` para mostrar múltiples alertas de stock. Esto funciona correctamente.
4. **Excepción 3:** `ProduccionForm` usa 3 instancias de Alertas: una con `useMensajes`, y 2 con objetos inline construidos con `v-if`/`v-else-if`. Esto está bien — el componente recibe información adicional que justifica las alertas extra.
5. **El componente NO maneja tipo "warning":** La computed `claseAlerta()` mapea `exito → status-success`, `error → status-error`, `info → status-info`, pero no tiene `warning → status-warning`. Si alguien pasa `{ tipo: 'warning', texto: '...' }`, el div se renderiza sin clase de estilo.

### Recomendación

1. Agregar soporte para `tipo: 'warning'` en Alertas (agregar clase CSS + icono `ExclamationTriangleIcon`).
2. Evaluar el diseño singleton de `useMensajes` (ver A3).
3. `ProduccionRecetasView` debería migrar a `useMensajes` para consistencia.

---

## Problema del Login

Véase **A1 — Login: manejo de errores incorrecto** para el análisis completo.

### Resumen del flujo

```
Login (LoginForm.vue)
  ↓ ingresar()
UsuarioClient.login(email, password)
  ↓ supabase.auth.signInWithPassword()
Supabase Auth
  ↓ AuthApiError (status: 400, message: "Invalid login credentials")
catch → { success: false, error }
  ↓ (no diferencia tipo de error)
LoginForm → "No se pudo validar el usuario. Revisa la conexion con la API."
```

### Clasificación de errores actual vs. deseada

| Situación | Código HTTP | Error actual mostrado | Error deseado |
|---|---|---|---|
| Credenciales incorrectas | 400 | "No se pudo validar... API" ❌ | "Email o contraseña incorrectos" |
| Sin conexión a internet | Network Error | "No se pudo validar... API" 🟡 | "Error de conexión. Verifica tu internet." |
| Error interno Supabase | 500 | "No se pudo validar... API" 🟡 | "Error del servidor. Intenta más tarde." |
| Usuario no existe en tabla | null data | "Email o contraseña incorrectos" ✅ | (igual) |

---

## Hoja de Ruta de Implementación

### Fases completadas ✅

**Fase 1 — Bugs Críticos de UX (Auditoría #2)**
- [x] Eliminar `setup()` duplicado en `NavBar.vue` (A3)
- [x] Eliminar parpadeo en `.btn-primary` (A4)

**Fase 2 — Unificación de Estilos (Auditoría #2)**
- [x] Refactorizar `UsuarioList` para usar clases globales `.data-card` (M6)

**Fase 3 — Refactorización CSS (Auditoría #2)**
- [x] Reemplazar HEX hardcoded (M7)
- [x] Corregir variables CSS inexistentes (M9)
- [x] Centralizar `.font-medium`, `.text-right` (B4)
- [x] Unificar `.badge` (M13)

**Fase 4 — Patrones Comunes (Auditoría #2)**
- [x] Centralizar `.summary-label` (M10)
- [x] Centralizar selector de chips (M11)

**Fase 5 — Limpieza (Auditoría #2)**
- [x] Fix `.submit-btn` → `.btn .btn-secondary` (M12)
- [x] Eliminar inline styles principales (B6)
- [x] Centralizar `mostrarMensaje` en composable (B7)
- [x] Eliminar `.date-field` código muerto (B8)

**Fase 6 — Arquitectura (Auditoría #2)**
- [x] Mover Alertas y CargaArchivo a `/shared` (B9)
- [x] Implementar scroll en MainLayout (B10)

---

### Fases nuevas (Auditoría #3)

**Fase 7 — Fix Crítico de Login** 🔴
- [ ] Diferenciar errores de credenciales vs. conexión en `UsuarioClient.login()` (A1)
- [ ] Actualizar `LoginForm.vue` para mostrar mensajes apropiados (A1)
- [ ] Eliminar el path muerto `response.success && !response.data` (A1)

**Fase 8 — Estandarización de Botones** 🔴
- [ ] Migrar botones de Planificación a clases globales `.btn` (A2)
- [ ] Crear variante `.btn-dark` en `style.css` (A2)
- [ ] Agregar `:focus-visible` a `.btn` base (A2)
- [ ] Eliminar `.btn-cancel` de RecetaForm → `.btn .btn-secondary .btn-block` (M7)

**Fase 9 — Sistema de Mensajes** 🔴
- [ ] Evaluar y documentar si `useMensajes` debe ser singleton o instancias (A3)
- [ ] Migrar `ProduccionRecetasView` a `useMensajes` (A4)
- [ ] Agregar soporte para `tipo: 'warning'` en Alertas

**Fase 10 — Centralización de Estilos Duplicados** 🟠
- [ ] Crear clase global `.selector-group` para wrappers de chips (M1)
- [ ] Crear sistema global de barras de progreso `.progress-track`/`.progress-fill` (M6)
- [ ] Mover `.form-icon` a `style.css` (M4)
- [ ] Definir variable `--info` y usarla en `.text-info` (M8)
- [ ] Eliminar inline styles `style="gap: 14px;"` en UsuarioList/UsuarioForm (M2)
- [ ] Reemplazar HEX en NavBar con variables CSS (M3)

**Fase 11 — Limpieza y Deuda Técnica** 🟢
- [ ] Refactorizar estilos de `ProduccionRecetasView` hacia clases globales (M9)
- [ ] Mover `.badge-gray` a style.css (B2)
- [ ] Reemplazar `.text-muted` por `.text-light` en PlanificacionView (B4)
- [ ] Centralizar scrollbar styling en clase global (B5)
- [ ] Agregar `mt-4` a utilidades globales (B1)
- [ ] Eliminar return duplicado en ProduccionForm setup() (B6)
