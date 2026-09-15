# Plan de Trabajo Oficial — MMS App (Auditoría #11)

> **Auditor:** Antigravity (AI Architect)
> **Fecha de última auditoría:** 2026-09-11
> **Alcance acumulado:** Auditorías 1–11. La #11 cubre: auditoría de cumplimiento completa, análisis de estilos global/local, reporte de eventos click/submit, verificación de alertas centralizadas, y hallazgos nuevos.

---

## Tabla de Contenidos

- [1. Auditoría de Cumplimiento](#1-auditoría-de-cumplimiento)
- [2. Estilos: Global vs. Local](#2-estilos-global-vs-local)
- [3. Reporte de Eventos: click vs submit](#3-reporte-de-eventos-click-vs-submit)
- [4. Uso de Alertas Centralizadas](#4-uso-de-alertas-centralizadas)
- [5. Recomendaciones Accionables](#5-recomendaciones-accionables)
  - [5.1 — Estilos](#51--estilos)
  - [5.2 — Eventos](#52--eventos)
  - [5.3 — Alertas y Duraciones](#53--alertas-y-duraciones)
  - [5.4 — Otros Hallazgos](#54--otros-hallazgos)
- [6. Deuda Técnica Aceptada](#6-deuda-técnica-aceptada)
- [7. Pendientes de Auditorías Anteriores](#7-pendientes-de-auditorías-anteriores)

---

## 1. Auditoría de Cumplimiento

Se verificó cada recomendación vigente del archivo anterior contra el código actual del proyecto.

### ✅ Recomendaciones Completadas (Confirmadas)

| # | Recomendación | Estado | Verificación |
|---|---|---|---|
| Fase 15 | `useInventario()` recibe `mostrarMensaje` como param | ✅ Se cumple | `useInventario.js` L5 — `mostrarMensaje` es parámetro |
| Fase 15 | Pages pasan `mostrarMensaje` a `useInventario` | ✅ Se cumple | `MaterialesPage.vue` L112, `MateriaPrimaPage.vue` L101 |
| Fase 15 | `return { success: true }` en `MateriaPrimaClient` | ✅ Se cumple | Verificado en `MateriaPrimaClient.js` |
| Fase 15 | `return { success: true }` en `PedidoClient` | ✅ Se cumple | Verificado en `PedidoClient.js` |
| Fase 16 | Validación categorías > 0 en producción | ✅ Se cumple | `useProduccionForm.js` L160-168 `categoriasVacias` |
| Fase 16 | Título de `PlanificacionAsignacion` movido a Page | ✅ Se cumple | `PlanificacionPage.vue` L4-11 contiene el `page-header` |
| Fase 16 | `sincronizarAPI()` en `PedidoPage.vue` con try/catch | ✅ Se cumple | `PedidoPage.vue` L140-167 |
| Fase 17 | CSS muerto eliminado de `ClientesPage.vue` | ✅ Se cumple | Sin `.active-filter-banner` ni `.btn-clear-filter` |
| Fase 17 | Ternario simplificado en `ProduccionForm.vue` | ✅ Se cumple | `ProduccionForm.vue` L65-66 |
| Fase 17 | Mutación de `mensaje` corregida en `PlanificacionPage` | ✅ Se cumple | `PlanificacionPage.vue` L239 usa `mostrarMensaje(null, '')` |
| Fase 18 | Composable `usePlanificacion()` extraído | ✅ Se cumple | `usePlanificacion.js` — 248 líneas |
| Fase 18 | Delay al mensaje de carga en `ProduccionRecetasView` | ✅ Se cumple | `ProduccionRecetasView.vue` L176 — `setTimeout` |
| Aud #6 | Inline styles movidos a clase scoped en `ProduccionRecetasView` | ✅ Se cumple | Sin atributos `style=` inline |
| Aud #6 | `<style scoped>` vacío eliminado de `MaterialesPage` | ✅ Se cumple | `MaterialesPage.vue` no tiene bloque `<style>` |
| Aud #6 | Mutaciones reemplazadas por `mostrarMensaje(null, '')` | ✅ Se cumple | `MaterialesPage.vue` L177, `MateriaPrimaPage.vue` L170 |
| Aud #6 | Import no utilizado de `useCatalogos` eliminado de `DashboardClient` | ✅ Se cumple | `DashboardClient.js` no importa `useCatalogos` |
| Aud #6 | Try/catch en `UsuarioClient.logout()` y `.obtenerSesion()` | ✅ Se cumple | `UsuarioClient.js` |
| Aud #6 | Doble llamada a `obtenerRecetas(true)` eliminada en `RecetasPage` | ✅ Se cumple | Solo `cargarTodasLasRecetas(true)` |
| Aud #7 | CSS muerto eliminado de `style.css` (`.msg-*`, `.btn-action-*`, `.section-*`) | ✅ Se cumple | 0 clases muertas encontradas |
| Aud #7 | `--shadow-md` definida en `:root` | ✅ Se cumple | `style.css` L23 |
| Aud #7 | Badges unificados (solo `.badge-success`, `.badge-danger`) | ✅ Se cumple | `style.css` L548-558 |
| Aud #7 | Solo `.actions-col` para columna de acciones | ✅ Se cumple | Sin `.actions-column` ni `.actions-header` |
| Aud #8 | Sincronización de stems correcta en 3 módulos | ✅ Se cumple | `MaterialClient.js`, `MateriaPrimaClient.js`, `PedidoClient.js` |
| Aud #9 | Fix bug sync materiales (suma en vez de reemplazo) | ✅ Se cumple | `MaterialClient.js` L43, `MateriaPrimaClient.js` L46 |
| Aud #9 | `.btn-action` código muerto eliminado | ✅ Se cumple | No existe en `style.css` |
| Aud #9 | Limpieza de edición en `ProduccionPage.vue` | ✅ Se cumple | Sin `produccionEnEdicion`, sin métodos huérfanos |
| Fase 12.1 | Unicidad de producción (constraint + validación frontend) | ✅ Se cumple | `ProduccionClient.js` L41-56, `ProduccionPage.vue` L155-160 |
| 3.1 | Constantes de duración centralizadas | ✅ Se cumple | `alertTimes.js` creado, `useMensajes.js` L2,8,16 importa constantes |
| 3.1 | `useInventario.js` usa `DURACION_ERROR` | ✅ Se cumple | `useInventario.js` L3,16 |
| 3.1 | `usePlanificacion.js` usa `DURACION_EXITO` | ✅ Se cumple | `usePlanificacion.js` L4,169 |
| 3.1 | `useProduccionForm.js` usa `DURACION_INFO`, `DURACION_EXITO` | ✅ Se cumple parcialmente | L4,31,33 — **pero L85 mantiene `4000` hardcoded** |
| 3.1 | `useContadorRecetas.js` usa `DURACION_INFO` | ✅ Se cumple | `useContadorRecetas.js` L2,100 |

### ⚠️ Recomendaciones con Cumplimiento Parcial

| # | Recomendación | Estado | Detalle |
|---|---|---|---|
| 3.1 | Constantes de duración — `useProduccionForm.js` | ⚠️ Parcial | L85: `notificar = (tipo, texto, duracion = 4000)` — el default `4000` debería ser `DURACION_ERROR` (ya importa las constantes en L4 pero no la usa aquí) |

### ❌ Recomendaciones Pendientes (Sin cambios)

| # | Recomendación | Estado | Detalle |
|---|---|---|---|
| 5.2 | Refactorizar `PedidoClient.js` sin `useCatalogos` | ❌ Pendiente | 5 referencias confirmadas en `PedidoClient.js` L6, L17, L68, L94, L172. Deuda técnica aceptada |
| 13.1 | Renombrar objetos en inglés en Supabase | ❌ Pendiente | Plan documentado en auditoría #10. No ejecutado |

---

## 2. Estilos: Global vs. Local

### 2.1 — Estilos correctamente globales (en `style.css`)

El archivo `style.css` (1056 líneas) organiza correctamente los estilos que definen la identidad visual del proyecto:

| Categoría | Líneas | Componentes que lo usan |
|---|---|---|
| Variables/Tokens (`:root`) | L4-77 | Todos los componentes |
| Reset y base | L98-141 | Todos |
| Tipografía (`.form-title`, `.form-title-lg`) | L146-181 | `MermaForm`, `ClienteForm`, `ProduccionForm` |
| Formularios (`.form-group`, `.form-input`, etc.) | L186-253 | 6+ componentes de formularios |
| Layout de páginas (`.page-container`, `.page-header`, etc.) | L258-324 | Todas las pages |
| Botones (`.btn`, `.btn-primary`, etc.) | L329-466 | Todos |
| Data display / Badges | L471-564 | `ClienteList`, `MermaList`, `ProduccionPage`, etc. |
| Stat cards | L569-654 | `DashboardKPIs`, `ProduccionForm` |
| Data cards / Tablas | L659-790 | 10+ componentes |
| Utilidades (`.icon-*`, `.text-*`, `.flex-*`, `.gap-*`) | L794-867 | Uso generalizado |
| Filtros (`.filter-bar`, `.filter-input`) | L872-899 | `ClienteList`, `RecetaList`, etc. |
| Chips | L919-955 | `RecetaCategoria`, `MermaTipoSelector`, `MermaOperadorSelector`, `UsuarioRol` |
| Animaciones | L960-1000 | `PublicHomePage`, `PlanificacionPage`, `Alertas` |
| Responsive | L1006-1056 | Todos |

### 2.2 — Estilos correctamente locales (scoped)

Estilos específicos de un solo componente que NO tienen sentido extraer:

| Componente | Estilos locales | Justificación |
|---|---|---|
| `ClientesPage.vue` | `.main-layout`, `.column-left/right/form`, `@keyframes slideInRight` | Layout de 3 columnas con animación, único en la app |
| `ProduccionPage.vue` | `.sin-plan-icon`, `.sin-plan-sub`, `.page-grid-produccion` | Grid específico de producción con proporciones únicas |
| `ProduccionForm.vue` | `.produccion-form-card`, `.eyebrow`, `.category-row/list`, `.stepper`, `.stepper-btn` | Componente de formulario con stepper táctil, muy específico |
| `ProduccionRecetasView.vue` | `.custom-scrollbar`, card de recetas con contador | Layout único de tarjetas de recetas |
| `PlanificacionResumen.vue` | `.summary-card`, `.balance-row`, `.balance-*` | Indicador de balance de carga, único |
| `PlanificacionOperadorCard.vue` | Tarjeta de operador con recetas | Layout de card con tabla interna |
| `PlanificacionMapeoRecetas.vue` | Wizard de mapeo | UI de wizard, único |
| `LoginForm.vue` | `.login-card`, inputs pill-shaped | Diseño visual particular del login |
| `PublicHomePage.vue` | `.public-home`, `.hero`, `.login-overlay` | Landing page con gradientes radiales |
| `DashboardPage.vue` | `.alertas-stock-wrap`, `.pedidos-widget` | Layout de dashboard |
| `ClienteList.vue` | `.fila-*` selección de filas | Interacción de selección por click |
| `ClienteForm.vue` | `.select-wrapper`, `.help-text` | Muy pequeño, específico |
| `RecetaForm.vue` | `.form-panel`, `.resume-box`, `.actions` | Layout de formulario de recetas |
| `RecetaMateriaPrimaList.vue` / `RecetaMaterialesList.vue` | `.selection-panel` | Paneles de selección con checkbox |
| `MermaList.vue` | Layout de tabla de mermas | Tabla con agrupación |
| `UsuarioForm.vue` | `.form-body` | Grid de formulario |
| `UsuarioList.vue` | Layout de tabla | — |
| `SideBar.vue` | `.sidebar`, `.toggle` | Navegación colapsable |
| `NavBar.vue` | `.navbar`, `.logout-icon-btn` | Navegación |
| `CargaArchivo.vue` | `.drop-zone` | Área de drag & drop |

### 2.3 — Estilos que deberían moverse a global

| Origen | Estilo | Razón para mover a global |
|---|---|---|
| `PlanificacionPage.vue` L261-268 | `.fade-msg-enter-active/leave-active`, `.fade-msg-enter-from/leave-to` | **Duplicación**: Ya existe idéntica en `style.css` L961-973. El scoped en `PlanificacionPage` no surte efecto porque las transiciones de Vue requieren clases globales. Eliminar la copia scoped |
| `PlanificacionPage.vue` L273-276 | `.page-container { padding: 12px; }` dentro de `@media (max-width: 768px)` | **Duplicación**: Ya existe idéntica en `style.css` L1019-1021. Al ser scoped, sobrescribe innecesariamente la regla global |
| `UsuarioList.vue` L134, `ProduccionRecetasView.vue` L221, `MermaList.vue` L212 | `.data-card-content { max-height: none !important; }` | **Patrón repetido en 3 componentes**: Todos necesitan desactivar el `max-height: 450px` de `.data-card-content` global. Crear un modificador global como `.data-card-content.no-limit { max-height: none; }` evitaría los 3 `!important` |
| `RecetaCategoria.vue` L56 | `<style scoped></style>` vacío | **Innecesario**: Bloque vacío, se puede eliminar |

### 2.4 — Uso de `!important`

Se encontraron **11 usos de `!important`** en estilos scoped (0 en `style.css`):

| Archivo | Línea | Propiedad | Evaluación |
|---|---|---|---|
| `ProduccionPage.vue` | L215-217 | `color`, `font-weight`, `font-size` en `.sin-plan-sub` | ⚠️ Evitable — sobrescribe estilos de `.empty-state-card p`. Mejor usar una clase más específica |
| `ClientesPage.vue` | L172 | `max-width: 1500px !important` en `.page-content-wide` | ⚠️ Evitable — sobrescribe `.page-content-wrap` global (max-width 1400px). Mover `.page-content-wide` a global o usar mayor especificidad |
| `UsuarioList.vue` | L134 | `max-height: none !important` | ⚠️ Patrón repetido (ver 2.3 arriba) |
| `ProduccionRecetasView.vue` | L221 | `max-height: none !important` | ⚠️ Patrón repetido |
| `MermaList.vue` | L212 | `max-height: none !important` | ⚠️ Patrón repetido |
| `ProduccionForm.vue` | L226 | `border-color: var(--error) !important` en `.category-error` | ✅ Aceptable — necesario para sobrescribir `.category-row` border |
| `PlanificacionView.vue` | L149 | `vertical-align: top !important` | ✅ Aceptable — override puntual de tabla |
| `SideBar.vue` | L161 | `max-width: 0 !important` | ✅ Aceptable — estado collapsed del sidebar |
| `ClienteList.vue` | L244 | `background: var(--primary-bg) !important` | ✅ Aceptable — estado `.fila-seleccionada` necesita override de hover |

---

## 3. Reporte de Eventos: click vs submit

### 3.1 — Formularios con `@submit.prevent`

Todos los formularios del proyecto usan correctamente `<form @submit.prevent>`:

| Componente | Elemento | Handler | Botón submit | ✅ Correcto |
|---|---|---|---|---|
| `ClienteForm.vue` | `<form @submit.prevent="enviarFormulario">` L10 | `enviarFormulario()` | `<button type="submit">` L70 | ✅ |
| `MaterialForm.vue` | `<form @submit.prevent="enviarFormulario">` L3 | `enviarFormulario()` | `<button type="submit">` L28 | ✅ |
| `MermaForm.vue` | `<form @submit.prevent="enviarFormulario">` L10 | `enviarFormulario()` | `<button type="submit">` L52 | ✅ |
| `RecetaForm.vue` | `<form @submit.prevent="$emit('guardar')">` L3 | Emite `guardar` | `<button type="submit">` L33 | ✅ |
| `ProduccionForm.vue` | `<form @submit.prevent="enviarFormulario">` L20 | `enviarFormulario()` | `<button type="submit">` L64 | ✅ |
| `UsuarioForm.vue` | `<form @submit.prevent="guardar">` L2 | `guardar()` | `<button type="submit">` L31 | ✅ |

### 3.2 — Componente sin formulario que debería tener uno

| Componente | Elemento | Handler | Observación |
|---|---|---|---|
| `LoginForm.vue` | No usa `<form>` | `<button type="button" @click="ingresar">` L8 | ⚠️ **Inconsistente**: Tiene un campo de email, uno de password con `@keyup.enter`, y un botón de login. Debería usar `<form @submit.prevent="ingresar">` y `<button type="submit">`. Así el `@keyup.enter` en el password ya no sería necesario y el envío funcionaría desde ambos campos |

### 3.3 — Botones de acción con `@click` (correctos — NO son formularios)

| Componente | Acción | Tipo de botón | ✅ |
|---|---|---|---|
| `DashboardPage.vue` L11 | Actualizar panel | `<button @click>` | ✅ Correcto (acción aislada) |
| `PlanificacionAsignacion.vue` L12 | Distribuir automáticamente | `<button @click>` | ✅ Correcto |
| `PlanificacionResumen.vue` L19 | Guardar planificaciones | `<button @click>` | ✅ Correcto (no es formulario) |
| `PlanificacionView.vue` L19 | Eliminar planificaciones | `<button @click>` | ✅ Correcto |
| `PlanificacionMapeoRecetas.vue` L69 | Confirmar mapeo | `<button @click>` | ✅ Correcto |
| `InventarioTable.vue` L9,12 | Sincronizar / Actualizar | `<button @click>` | ✅ Correcto |
| `ProduccionRecetasView.vue` L52 | Acción receta | `<button @click>` | ✅ Correcto |
| Todas las tablas | Editar / Eliminar | `btn-action-ghost @click` | ✅ Correcto |

---

## 4. Uso de Alertas Centralizadas

### 4.1 — Sistema de alertas

El proyecto usa un sistema centralizado:
- **Composable**: `useMensajes()` → expone `mostrarMensaje()` y `mostrarMensajeInline()`
- **Componente visual**: `<Alertas :mensaje="mensaje" />`
- **Constantes de duración**: `alertTimes.js` → `DURACION_EXITO`, `DURACION_ERROR`, `DURACION_INFO`, `DURACION_INLINE`
- **No hay** `window.alert()`, `window.confirm()`, ni librerías de toast externas en todo el proyecto

### 4.2 — Componentes que SÍ usan alertas correctamente

| Componente | Mecanismo | Verificación |
|---|---|---|
| `ClientesPage.vue` | `useMensajes()` + `<Alertas>` | ✅ L64, L17 |
| `MaterialesPage.vue` | `useMensajes()` + `<Alertas>` | ✅ L104, L13 |
| `MateriaPrimaPage.vue` | `useMensajes()` + `<Alertas>` | ✅ L93, L13 |
| `MermasPage.vue` | `useMensajes()` + `<Alertas>` | ✅ L55, L14 |
| `PedidoPage.vue` | `useMensajes()` + `<Alertas>` | ✅ L100, L14 |
| `RecetasPage.vue` | `useMensajes()` + `<Alertas>` | ✅ L73, L15 |
| `ProduccionPage.vue` | `useMensajes()` + `<Alertas>` | ✅ L71, L21 |
| `PlanificacionPage.vue` | `usePlanificacion()` (que internamente usa `useMensajes()`) + `<Alertas>` | ✅ L94-97, L19 |
| `DashboardPage.vue` | `useMensajes()` + `<Alertas>` (+ alertas de stock vía `<Alertas>` repetido) | ✅ L68, L18, L22-23 |
| `UsuariosPage.vue` | `useMensajes()` + `<Alertas>` | ✅ L38, L11 |
| `LoginForm.vue` | `useMensajes()` + `<Alertas>` | ✅ L28, L7 |
| `UsuarioForm.vue` | `useMensajes()` + `<Alertas>` | ✅ L53, L29 |
| `ProduccionForm.vue` | `<Alertas>` con objeto literal inline (info de carga) + emit `notificar` para mensajes del composable | ✅ L15,17 |
| `MermaForm.vue` | `<Alertas>` para filtro info | ✅ L8 |
| `PlanificacionResumen.vue` | `<Alertas>` para mensaje inline | ✅ L44 |

### 4.3 — Componentes que NO muestran alertas (no las necesitan)

Los siguientes componentes NO usan alertas porque son componentes de presentación puros (listas, selectores, tarjetas) que delegan los mensajes a sus pages padres:

`RecetaList`, `RecetaMaterialesList`, `RecetaMateriaPrimaList`, `RecetaCategoria`, `ClienteList`, `MermaList`, `MermaTipoSelector`, `MermaMotivoSelector`, `MermaOperadorSelector`, `UsuarioList`, `UsuarioRol`, `DashboardKPIs`, `DashboardAvanceOperador`, `DashboardDistribucionMermas`, `DashboardEstadoPedidos`, `PlanificacionAsignacion`, `PlanificacionOperadorCard`, `PlanificacionMapeoRecetas`, `PlanificacionView`, `ProduccionRecetasView`, `InventarioTable`, `VistaPreviaTable`, `CargaArchivo`, `AccionesButton`, `SideBar`, `NavBar`, `MainLayout`, `PublicHomePage`

### 4.4 — Resultado

✅ **Todos los componentes que muestran alertas usan `useMensajes()` + `<Alertas>`**. No hay implementaciones propias, `alert()`, `confirm()`, ni librerías de toast.

---

## 5. Recomendaciones Accionables

### 5.1 — Estilos

#### E1 — Eliminar animación `.fade-msg` duplicada en `PlanificacionPage.vue`

**Archivo:** `PlanificacionPage.vue` L261-268
**Problema:** Las clases `.fade-msg-enter-active`, `.fade-msg-leave-active`, `.fade-msg-enter-from`, `.fade-msg-leave-to` están duplicadas. Ya existen en `style.css` L961-973. Además, al ser `scoped`, Vue les agrega un atributo `data-v-xxxx` que impide que funcionen como transiciones de Vue (que requieren clases globales).
**Acción:** Eliminar las líneas 261-269 del bloque `<style scoped>` de `PlanificacionPage.vue`.

#### E2 — Eliminar `@media .page-container` duplicada en `PlanificacionPage.vue`

**Archivo:** `PlanificacionPage.vue` L273-276
**Problema:** La regla `@media (max-width: 768px) { .page-container { padding: 12px; } }` es idéntica a la de `style.css` L1019-1021. Al ser scoped, solo aplica si `.page-container` tiene el `data-v` de esta page, pero la regla global ya cubre este caso.
**Acción:** Eliminar las líneas 273-277 del bloque `<style scoped>` de `PlanificacionPage.vue`.

#### E3 — Crear modificador global `.data-card-content.no-limit` y eliminar 3 `!important`

**Archivos:** `UsuarioList.vue` L134, `ProduccionRecetasView.vue` L221, `MermaList.vue` L212
**Problema:** Tres componentes usan `max-height: none !important` para desactivar el `max-height: 450px` de `.data-card-content` en `style.css` L714.
**Acción:**
1. Agregar en `style.css` después de L714: `.data-card-content.no-limit { max-height: none; }`
2. En los templates de los 3 componentes, agregar la clase `no-limit` al div que tiene `.data-card-content`
3. Eliminar las reglas scoped con `!important` de los 3 archivos

#### E4 — Reducir `!important` en `ProduccionPage.vue` `.sin-plan-sub`

**Archivo:** `ProduccionPage.vue` L214-218
**Problema:** 3 propiedades con `!important` para sobrescribir los estilos de `<p>` dentro de `.empty-state-card`.
**Acción:** Cambiar la clase `.sin-plan-sub` a un `<span>` en vez de `<p>` en el template (L36-37), o usar un selector más específico como `.empty-state-card .sin-plan-sub` sin `!important`.

#### E5 — Mover `.page-content-wide` a `style.css` como variante de `.page-content-wrap`

**Archivo:** `ClientesPage.vue` L171-173
**Problema:** `.page-content-wide { max-width: 1500px !important; }` existe solo en `ClientesPage` pero podría ser reutilizada por cualquier page que necesite más ancho.
**Acción:** Agregar en `style.css` junto a `.page-content-wrap`: `.page-content-wrap.wide { max-width: 1500px; }` y cambiar `ClientesPage.vue` L4 a `class="page-content-wrap wide"`. Eliminar la regla scoped.

#### E6 — Eliminar `<style scoped></style>` vacío en `RecetaCategoria.vue`

**Archivo:** `RecetaCategoria.vue` L56
**Problema:** Bloque `<style scoped></style>` vacío.
**Acción:** Eliminar la línea.

---

### 5.2 — Eventos

#### EV1 — Convertir `LoginForm.vue` a `<form @submit.prevent>`

**Archivo:** `LoginForm.vue` L1-11
**Problema:** El componente de login no usa `<form>`. Usa `<button type="button" @click="ingresar">` y `@keyup.enter` en el campo de contraseña. Esto es inconsistente con los demás formularios del proyecto y tiene un bug sutil: si el usuario presiona Enter en el campo de email, no se envía el formulario.
**Acción:**
1. Envolver los inputs y el botón en `<form @submit.prevent="ingresar">`
2. Cambiar `<button type="button" ... @click="ingresar">` a `<button type="submit">`
3. Eliminar `@keyup.enter="ingresar"` del campo de contraseña (ya no es necesario con `<form>`)

---

### 5.3 — Alertas y Duraciones

#### A1 — Corregir duración hardcoded en `useProduccionForm.js` L85

**Archivo:** `useProduccionForm.js` L85
**Problema:** `const notificar = (tipo, texto, duracion = 4000)` — el valor por defecto `4000` no usa la constante centralizada. El archivo ya importa `DURACION_INFO` y `DURACION_EXITO` en L4, pero la función `notificar` no los usa.
**Acción:** Cambiar L85 a: `const notificar = (tipo, texto, duracion = DURACION_ERROR) => {`
Importar `DURACION_ERROR` en L4 si no está ya importada:
```js
import { DURACION_INFO, DURACION_EXITO, DURACION_ERROR } from '../utils/alertTimes.js'
```

> **Nota:** `DURACION_ERROR` (4000ms) coincide con el valor actual, así que el comportamiento no cambia, pero queda centralizado.

#### A2 — Considerar agregar `DELAY_CARGA` a `alertTimes.js`

**Archivo:** `ProduccionRecetasView.vue` L176
**Problema:** El `setTimeout` de `200`ms para el delay de carga no está centralizado. No es crítico porque no es una alerta, pero si se decidió centralizar las duraciones, este delay también podría estar ahí.
**Acción (opcional):** Agregar `export const DELAY_CARGA = 200` a `alertTimes.js` e importarlo en `ProduccionRecetasView.vue`. **Prioridad baja.**

---

### 5.4 — Otros Hallazgos

#### O1 — `useCatalogos()` dentro de `PedidoClient.js` (deuda técnica)

**Archivo:** `PedidoClient.js` L6, L17, L68, L94, L172
**Problema:** `PedidoClient.js` invoca `useCatalogos()` en 5 ubicaciones. Funciona por diseño de promesas globales de módulo, pero rompe el patrón arquitectónico de no usar composables dentro de clients.
**Estado:** ❌ Deuda técnica aceptada (bajo impacto, alto costo de refactorización).

#### O2 — Renombrar objetos en inglés en Supabase

**Estado:** ❌ Pendiente de ejecución. Plan completo documentado en auditoría #10. 
**Resumen:** 2 funciones, 1 trigger, 2 políticas por renombrar. 28 políticas que referencian `get_user_rol()`. 0 impacto en código del cliente.
**Acción:** Ejecutar la migración SQL documentada en la auditoría #10 cuando se apruebe.

---

## 6. Deuda Técnica Aceptada

| Deuda | Razón | Desde |
|---|---|---|
| `useCatalogos()` dentro de `PedidoClient.js` (O1) | Funciona por diseño de promesas globales, refactorizar tendría alto costo | Auditoría #4 |
| Doble carga en `MermasPage.vue` post-registro | Funciona correctamente — actualiza stocks localmente Y llama `cargarDatos()`. Simplificación de bajo impacto | Auditoría #6 |
| Duplicación de `autoCompletarPedidos` | Descartada intencionalmente — se usa en `DashboardPage.vue` L96 y `ProduccionPage.vue` L172 | Auditoría #4 |
| Variantes de estados vacíos/cargando en tablas | Variantes coexisten sin bugs, unificar requiere testing extensivo | Auditoría #6 |

---

## 7. Pendientes de Auditorías Anteriores

### Hoja de ruta de implementación

| Tarea | Prioridad | Estado | Auditoría |
|---|---|---|---|
| E1 — Eliminar `.fade-msg` duplicada en `PlanificacionPage` | 🟢 Baja | ❌ Pendiente | #11 |
| E2 — Eliminar `@media .page-container` duplicada en `PlanificacionPage` | 🟢 Baja | ❌ Pendiente | #11 |
| E3 — Crear `.data-card-content.no-limit` (eliminar 3 `!important`) | 🟡 Media | ❌ Pendiente | #11 |
| E4 — Reducir `!important` en `.sin-plan-sub` | 🟢 Baja | ❌ Pendiente | #11 |
| E5 — Mover `.page-content-wide` a global | 🟢 Baja | ❌ Pendiente | #11 |
| E6 — Eliminar `<style>` vacío en `RecetaCategoria.vue` | 🟢 Baja | ❌ Pendiente | #11 |
| EV1 — Convertir `LoginForm.vue` a `<form>` | 🟡 Media | ❌ Pendiente | #11 |
| A1 — Corregir `4000` hardcoded en `useProduccionForm.js` | 🟢 Baja | ❌ Pendiente | #11 |
| 13.1 — Ejecutar migración de renombrado Supabase | 🟡 Media | ❌ Pendiente | #10 |
| 5.2 — Refactorizar `PedidoClient.js` sin `useCatalogos` | 🟢 Baja | ❌ Deuda aceptada | #4 |

### Resumen de estado

| Categoría | Total | Estado |
|---|---|---|
| Recomendaciones verificadas como completadas | 30 | ✅ |
| Recomendaciones con cumplimiento parcial | 1 | ⚠️ |
| Nuevas recomendaciones (auditoría #11) | 8 | ❌ Pendiente |
| Pendientes de auditorías anteriores | 2 | ❌ Pendiente |
| Deuda técnica aceptada | 4 | 🟠 Sin plan |
