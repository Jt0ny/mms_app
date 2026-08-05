# Plan de Trabajo Oficial — MMS App

> **Auditor:** Arquitecto de Software Senior
> **Fecha original:** 2026-07-22
> **Última auditoría:** 2026-08-06
> **Alcance:** Auditoría completa pre-cierre del proyecto Vue 3 + Vite + Supabase

---

## Tabla de Contenidos

- [Resumen Ejecutivo](#resumen-ejecutivo)
- [Prioridad Alta](#prioridad-alta)
  - [A1 — Eliminar botón y código muerto de eliminar materiales](#a1--eliminar-botón-y-código-muerto-de-eliminar-materiales)
  - [A2 — Colores hardcoded (`white`, `#f8faf8`) en componentes scoped](#a2--colores-hardcoded-white-f8faf8-en-componentes-scoped)
  - [A3 — Simplificar comentarios de sección decorativos y HTML redundante](#a3--simplificar-comentarios-de-sección-decorativos-y-html-redundante)
- [Prioridad Media](#prioridad-media)
  - [M1 — Bloque `else` vacío en `MaterialClient.sincronizarConSupabase`](#m1--bloque-else-vacío-en-materialclientsincronizarconsupabase)
  - [M2 — `sincronizarConSupabase` de MaterialClient no retorna respuesta en caso de éxito](#m2--sincronizarconsupabase-de-materialclient-no-retorna-respuesta-en-caso-de-éxito)
  - [M3 — Import `PlanificacionClient` no utilizado en `MermasPage`](#m3--import-planificacionclient-no-utilizado-en-mermaspage)
  - [M4 — `limpiarDatos` en MaterialesPage/MateriaPrimaPage asigna a objeto reactivo global](#m4--limpiardatos-en-materialespagemateriaprima-asigna-a-objeto-reactivo-global)
  - [M5 — `resolverClientesDePedidos` accede `.forEach` sobre resultado no-array](#m5--resolverClientesDePedidos-accede-foreach-sobre-resultado-no-array)
  - [M6 — Funciones de selección duplicadas en RecetasPage](#m6--funciones-de-selección-duplicadas-en-recetaspage)
  - [M7 — Evaluación del módulo RecetaResumen](#m7--evaluación-del-módulo-recetaresumen)
- [Prioridad Baja](#prioridad-baja)
  - [B1 — Inconsistencia menor en nombres de eventos del template](#b1--inconsistencia-menor-en-nombres-de-eventos-del-template)
  - [B2 — Espacio faltante en texto de `RecetaResumen`](#b2--espacio-faltante-en-texto-de-recetaresumen)
  - [B3 — Espacio faltante en texto de `RecetaMaterialesTabla`](#b3--espacio-faltante-en-texto-de-recetamaterialestabla)
  - [B4 — Comentario obsoleto en `RecetasPage.cargarCategorias`](#b4--comentario-obsoleto-en-recetaspagecargarCategorias)
- [Recomendaciones Anteriores](#recomendaciones-anteriores)
- [Hoja de Ruta Priorizada](#hoja-de-ruta-priorizada)

---

## Resumen Ejecutivo

La aplicación se encuentra en un estado de madurez alto. La arquitectura es sólida con una separación clara de capas (`client/`, `composables/`, `pages/`, `components/`, `utils/`), convenciones de nomenclatura consistentes (camelCase en frontend, snake_case confinado a la capa `client/`), y un sistema de design tokens bien definido en `style.css`.

Las recomendaciones de esta auditoría se enfocan exclusivamente en **limpieza, consistencia y mantenibilidad** — no se propone agregar funcionalidades nuevas.

| Prioridad | Cantidad | Enfoque principal |
|---|---|---|
| Alta | 3 | Código muerto, colores hardcoded, limpieza de comentarios |
| Media | 7 | Bugs latentes, imports muertos, inconsistencias |
| Baja | 4 | Textos con errores tipográficos, comentarios obsoletos |

### Estado general del código

- **Manejo de errores:** Consistente. Todos los `Client` siguen el patrón `try/catch` → `{ success: false, error }`. Las páginas verifican `response?.success === false` antes de procesar datos.
- **`console.error/warn`:** Se usan correctamente en ~50 lugares. Todos están en contextos de captura de errores reales (`catch` blocks, verificaciones de `success === false`). No hay `console.log` de depuración sueltos. Se recomienda mantener todos — son útiles para diagnóstico en producción.
- **`throw new Error`:** Solo 2 ocurrencias, ambas justificadas: `useExcel.js` (archivo vacío) y `usePedidoExcel.js` (formato inválido). Ambas se capturan correctamente en los llamadores.
- **JSDoc:** Se usa moderadamente (~28 anotaciones). Todas las restantes documentan contratos de interfaz útiles (estructuras complejas en `PlanificacionAlgoritmo`, opciones de composables). No hay JSDoc redundante que eliminar.
- **Código CRUD comentado:** Eliminado completamente en auditorías anteriores. No queda ningún bloque `/* Reservado para futuro */`.
- **Archivos muertos:** `ProduccionResumen.vue` ya fue eliminado. Los assets innecesarios (SVGs de Vite, video de WhatsApp) ya fueron limpiados. Solo queda `hero.png` en `assets/` que es un asset legítimo.

---

## Prioridad Alta

---

### A1 — Eliminar botón y código muerto de eliminar materiales

- **Estado:** ⏳ Pendiente (Descartado previamente por el usuario, pero persiste en el código)
- **Archivos afectados:**
  - `src/pages/MaterialesPage.vue` (L33-36: botón 🗑️, L198-206: método `eliminarMaterial`)
  - `src/client/MaterialClient.js` (L172-189: función `eliminarMaterial`)
- **Descripción:** El botón de eliminar materiales sigue presente en el inventario, junto con el método `eliminarMaterial()` en la página y la función `eliminarMaterial()` en `MaterialClient.js`. Eliminar un material que sea insumo de una receta puede dejar referencias huérfanas.
- **Motivo:** Riesgo de integridad referencial. Código activo que expone una acción peligrosa sin validación.
- **Propuesta:**
  1. Eliminar el botón `🗑️` y la columna "Acciones" del template de `MaterialesPage.vue`.
  2. Eliminar el método `eliminarMaterial()` de `MaterialesPage.vue`.
  3. Eliminar la función `eliminarMaterial()` de `MaterialClient.js`.
  4. Eliminar la clase `.actions-column` del `<style scoped>` de `MaterialesPage.vue`.
  5. Eliminar el header `<th>Acciones</th>` del template.
- **Impacto:** Elimina ~25 líneas de código riesgoso y un riesgo de integridad de datos.
- **Nota:** El usuario descartó esta recomendación anteriormente. Se mantiene documentada para referencia dado que el riesgo persiste.

---

### A2 — Colores hardcoded (`white`, `#f8faf8`) en componentes scoped

- **Estado:** ⏳ Pendiente (parcialmente completado — los 3 componentes de recetas fueron corregidos, pero hay 8 componentes más con el mismo problema)
- **Archivos afectados (pendientes):**

  | Archivo | Líneas | Color hardcoded |
  |---|---|---|
  | `RecetaMaterialesTabla.vue` | L114, L181 | `white`, `#f8faf8` |
  | `RecetaMateriaPrimaTabla.vue` | L120, L187 | `white`, `#f8faf8` |
  | `ProduccionForm.vue` | L218, L232, L281 | `white`, `#f8faf8` |
  | `ProduccionRecetasView.vue` | L228 | `white` |
  | `PlanificacionVista.vue` | L128, L176, L218 | `white` |
  | `PlanificacionMapeoRecetas.vue` | L231, L344, L440 | `white` |
  | `LoginForm.vue` | L93, L133 | `white` |
  | `DashboardEstadoPedidos.vue` | L183 | `white` |
  | `MermaOperadorSelector.vue` | L72 | `#ffffff`, `#f8faf8` (en gradiente) |

- **Descripción:** 14 instancias de `background: white` y 4 instancias de `#f8faf8` distribuidas en 9 componentes. Estos colores no se adaptan al modo oscuro y violan el sistema de design tokens establecido en `style.css`.
- **Motivo:** Inconsistencia con el sistema de design tokens. En dark mode estos elementos aparecerán como cajas blancas sobre fondo oscuro.
- **Propuesta:**
  1. Reemplazar `white` por `var(--bg)`.
  2. Reemplazar `#f8faf8` por `var(--bg-secondary)`.
  3. Reemplazar gradientes con `#ffffff`/`#f8faf8` por `linear-gradient(180deg, var(--bg) 0%, var(--bg-secondary) 100%)`.
- **Impacto:** Consistencia visual y soporte correcto de dark mode en 9 componentes. Cambio puramente CSS, sin riesgo funcional.

---

### A3 — Simplificar comentarios de sección decorativos y HTML redundante

- **Estado:** ⏳ Pendiente
- **Archivos afectados:**
  - `src/pages/RecetasPage.vue` (L105, L154, L187, L202, L225) — 5 separadores `/* === */`
  - `src/pages/PedidoPage.vue` (L116, L146, L166, L172) — 4 separadores `/* === */`
  - `src/pages/RecetasPage.vue` (L6, L9) — `<!-- TÍTULO -->`, `<!-- ALERTAS -->`
  - `src/pages/PedidoPage.vue` (L6, L9) — `<!-- TÍTULO -->`, `<!-- ALERTAS -->`
- **Descripción:** Separadores tipo `/* ================= CARGAR ================= */` y comentarios HTML como `<!-- TÍTULO -->` antes de un `<h1>` que son redundantes. Otras páginas como `ProduccionPage` ya usan el patrón más limpio `// -- Sección --` o simplemente no tienen separadores.
- **Motivo:** Ruido visual. Los separadores decorados ocupan espacio sin añadir información que el código no exprese por sí solo.
- **Propuesta:**
  1. Simplificar separadores: `/* ================= CARGAR ================= */` → `// -- Cargar --`.
  2. Eliminar `<!-- TÍTULO -->` y `<!-- ALERTAS -->` donde el código es autoexplicativo (justo antes de `<h1>` y `<Alertas>`).
  3. Conservar `<!-- PANEL IZQUIERDO -->`, `<!-- PANEL DERECHO -->` que sí ayudan a navegar layouts complejos.
- **Impacto:** Reduce ruido visual sin perder orientación en el código. ~15 líneas.

---

## Prioridad Media

---

### M1 — Bloque `else` vacío en `MaterialClient.sincronizarConSupabase`

- **Estado:** ⏳ Pendiente
- **Archivos afectados:**
  - `src/client/MaterialClient.js` (L64-66)
- **Descripción:** El bloque `else` en las líneas 64-66 está completamente vacío:
  ```js
  } else {
  
  }
  ```
  Es un remanente de un `console.log` eliminado durante limpieza anterior.
- **Motivo:** Código muerto que dificulta la lectura.
- **Propuesta:** Eliminar el bloque `else` vacío.
- **Impacto:** Limpieza menor, 3 líneas.

---

### M2 — `sincronizarConSupabase` de MaterialClient no retorna respuesta en caso de éxito

- **Estado:** ⏳ Pendiente
- **Archivos afectados:**
  - `src/client/MaterialClient.js` (L11-71)
- **Descripción:** La función `sincronizarConSupabase()` retorna `{ success: false, error }` en caso de error (L69), pero no retorna nada en caso de éxito (ni cuando `materialesExternos.length === 0` en L19, ni tras el upsert exitoso). Esto hace que el consumidor (`useInventario.sincronizarAPI`) reciba `undefined`, lo cual funciona porque el composable solo verifica `response?.success === false`, pero es inconsistente con el patrón del resto de clients que siempre retornan `{ success: true }`.
- **Motivo:** Inconsistencia con el patrón establecido. Puede causar bugs si un futuro consumidor verifica `response.success`.
- **Propuesta:** Agregar `return { success: true }` al final del bloque `try`, y `return { success: true }` en el early return de L19.
- **Impacto:** Consistencia de contrato. 2 líneas.

---

### M3 — Import `PlanificacionClient` no utilizado en `MermasPage`

- **Estado:** ⏳ Pendiente
- **Archivos afectados:**
  - `src/pages/MermasPage.vue` (L41)
- **Descripción:** La línea `import PlanificacionClient from '../client/PlanificacionClient'` importa un módulo que no se usa directamente en el componente. El filtrado por planificación se delega al composable `useFiltroRecursos`, que importa internamente a `PlanificacionClient`.
- **Motivo:** Import muerto que infla el bundle y confunde al lector.
- **Propuesta:** Eliminar la línea 41.
- **Impacto:** Limpieza menor, 1 línea.

---

### M4 — `limpiarDatos` en MaterialesPage/MateriaPrimaPage asigna a objeto reactivo global

- **Estado:** ⏳ Pendiente
- **Archivos afectados:**
  - `src/pages/MaterialesPage.vue` (L164)
  - `src/pages/MateriaPrimaPage.vue` (L159-161)
- **Descripción:** En `limpiarDatos()`, ambas páginas asignan directamente al reactive `mensaje`:
  ```js
  this.mensaje = { tipo: null, texto: '' }
  ```
  Pero `mensaje` viene de `useMensajes()` y es un `reactive()` compartido globalmente. La asignación con `=` no modifica el reactive original; crea una nueva referencia local en `data()` que sombrea al global. El efecto visible es que el mensaje de la barra de alertas no se limpia.
- **Motivo:** Bug sutil. La alerta puede quedar visible después de "limpiar datos".
- **Propuesta:** Usar `this.mensaje.tipo = null; this.mensaje.texto = ''` (mutación directa del reactive) o simplemente eliminar esas líneas, ya que el siguiente `mostrarMensaje()` lo sobreescribirá de todas formas.
- **Impacto:** Fix de bug visual menor. ~2 líneas.

---

### M5 — `resolverClientesDePedidos` accede `.forEach` sobre resultado no-array

- **Estado:** ⏳ Pendiente
- **Archivos afectados:**
  - `src/client/ClientesClient.js` (L282-284)
- **Descripción:** Después de `agregarClientesMasivos()`, el resultado se usa directamente con `.forEach()`:
  ```js
  const insertadosFact = await this.agregarClientesMasivos(...)
  insertadosFact.forEach(c => { ... })
  ```
  Pero `agregarClientesMasivos()` retorna `{ success: true, data: [...] }`, no un array directo. Debería ser `insertadosFact.data.forEach(...)` o extraer los datos primero.
- **Motivo:** Bug potencial que crashearía al insertar nuevos clientes de facturación desde un Excel de pedidos. Puede que no se haya manifestado si siempre se cargan clientes antes del primer Excel.
- **Propuesta:**
  ```js
  const insertRes = await this.agregarClientesMasivos(...)
  if (insertRes.success && insertRes.data) {
    insertRes.data.forEach(c => {
      mapaClientes.set(c.nombre.toLowerCase().trim(), c)
    })
  }
  ```
- **Impacto:** Fix de bug latente. ~3 líneas.

---

### M6 — Funciones de selección duplicadas en RecetasPage

- **Estado:** ⏳ Pendiente (Descartado previamente — se mantiene documentada para referencia)
- **Archivos afectados:**
  - `src/pages/RecetasPage.vue` (L155-185)
- **Descripción:** Cuatro funciones (`alternarMaterial`, `alternarMateriaPrima`, `actualizarCantidadMaterial`, `actualizarCantidadMateriaPrima`) repiten la misma lógica con la única diferencia del array target y el campo del nombre (`nombre` vs `variedad`).
- **Motivo:** Duplicación lógica. Si se cambia la lógica de selección, hay que actualizar 4 funciones.
- **Propuesta:** Refactorizar a dos funciones genéricas (`alternarItem`, `actualizarCantidadItem`).
- **Impacto:** Reduce ~30 líneas de código duplicado a ~10 líneas genéricas.
- **Nota:** Descartado previamente por el usuario. Se mantiene documentada para referencia.

---

### M7 — Evaluación del módulo RecetaResumen

- **Estado:** ✅ Evaluado — No recomendado
- **Archivos analizados:**
  - `src/components/recetas/RecetaResumen.vue`
  - `src/pages/RecetasPage.vue`
- **Evaluación:**
  El componente muestra los materiales y materia prima **seleccionados durante la creación de una receta**. Su propósito es dar feedback visual al usuario mientras arma una receta nueva. No se recomienda reemplazarlo por una tabla ni por un componente de detalle. Cumple su función específica correctamente. Un componente `RecetaDetalle` sería complementario (no sustituto), pero dado que el proyecto está en fase de cierre, **no se incluye en el plan de trabajo**.

---

## Prioridad Baja

---

### B1 — Inconsistencia menor en nombres de eventos del template

- **Estado:** ℹ️ Observación (no requiere cambio)
- **Archivos afectados:**
  - `src/components/recetas/RecetaForm.vue` (L86)
  - `src/pages/RecetasPage.vue` (L19)
- **Descripción:** El evento `actualizar-receta` en RecetaForm usa kebab-case (correcto para eventos Vue), y se maneja consistentemente. La convención se mantiene en todo el proyecto.
- **Impacto:** Ninguno. Observación para referencia.

---

### B2 — Espacio faltante en texto de `RecetaResumen`

- **Estado:** ⏳ Pendiente
- **Archivos afectados:**
  - `src/components/recetas/RecetaResumen.vue` (L43)
- **Descripción:** En la línea 43, el texto dice `{{ item.cantidad }}unidad(es)` (falta un espacio antes de "unidad"):
  ```html
  {{ item.cantidad }}unidad(es)
  ```
  Debería ser `{{ item.cantidad }} unidad(es)`.
- **Motivo:** Error tipográfico visible al usuario final.
- **Propuesta:** Agregar el espacio faltante.
- **Impacto:** Fix cosmético, 1 carácter.

---

### B3 — Espacio faltante en texto de `RecetaMaterialesTabla`

- **Estado:** ⏳ Pendiente
- **Archivos afectados:**
  - `src/components/recetas/RecetaMaterialesTabla.vue` (L7)
- **Descripción:** El texto del subtítulo dice `Selecciona los materialespara la receta` (falta espacio entre "materiales" y "para"):
  ```html
  <p>Selecciona los materialespara la receta</p>
  ```
- **Motivo:** Error tipográfico visible al usuario final.
- **Propuesta:** Corregir a `Selecciona los materiales para la receta`.
- **Impacto:** Fix cosmético, 1 carácter.

---

### B4 — Comentario obsoleto en `RecetasPage.cargarCategorias`

- **Estado:** ⏳ Pendiente
- **Archivos afectados:**
  - `src/pages/RecetasPage.vue` (L137)
- **Descripción:** El comentario en la línea 137 dice:
  ```js
  PedidoClient.obtenerPedidos() // PedidoClient aún no retorna objeto de respuesta, pero lo hará pronto. Manejaremos ambos formatos por seguridad.
  ```
  Pero `PedidoClient.obtenerPedidos()` **ya retorna** `{ success: true, data: [...] }` (verificado en `PedidoClient.js` L297-305). El comentario es obsoleto.
- **Motivo:** Comentario que contradice el estado real del código y confunde al lector.
- **Propuesta:** Eliminar el comentario.
- **Impacto:** Limpieza de 1 línea de comentario obsoleto.

---

## Recomendaciones Anteriores

Las siguientes recomendaciones de auditorías anteriores han sido **verificadas como completadas** o **eliminadas por decisión del usuario** durante esta auditoría:

### Completadas (verificadas contra el código actual)

| ID | Recomendación | Verificación |
|---|---|---|
| A2 (prev) | Limpieza de comentarios y código muerto | ✅ No queda código `/* Reservado para futuro */` en ningún client |
| A3 (prev) | Línea duplicada en `useFiltroRecursos` | ✅ Solo una línea `cargandoRecursos.value = true` en L23 |
| A4 (prev) | Colores hardcoded en 3 componentes de recetas | ✅ `RecetaResumen`, `RecetaForm`, `RecetaCategoria` usan `var(--bg)` |
| A5 (prev) | Patrón duplicado de extracción de catálogos | ✅ Las páginas usan `response?.data ?? []` consistentemente |
| A6 (prev) | Estilos duplicados InventoryTable/PreviewTable | ✅ Ambos usan clases globales `.data-card` definidas en `style.css` |
| A8 (prev) | `<style scoped>` vacío en UsuariosPage | ✅ No existe bloque `<style>` en el archivo |
| M1 (prev) | URLs de APIs externas en `.env` | ✅ Todas usan `import.meta.env.VITE_API_*` |
| M3 (prev) | `PedidoClient._obtenerCatalogos` no extrae `.data` | ✅ Verificado que extrae correctamente `res?.data ?? []` |
| M4 (prev) | Transiciones CSS no usadas en PlanificacionPage | ✅ No quedan clases `.fade-msg-*` en el archivo |
| M5 (prev) | Consistencia try/catch en páginas | ✅ Patrón unificado con `if (response?.success === false)` |
| M6 (prev) | Tabs vs espacios en PlanificacionPage | ✅ Todo el archivo usa espacios de 4 |
| M7 (prev) | Selector `.sin-planificacion p` muerto | ✅ No existe ese selector en ProduccionPage |
| M8 (prev) | Simplificar comentarios de sección | ⚠️ Parcialmente — quedan 9 separadores en RecetasPage y PedidoPage (nueva A3) |
| B1 (prev) | Código CRUD comentado | ✅ Eliminado de todos los clients |
| B3 (prev) | Variable `today` en DashboardPage | ✅ Ya usa `hoy` |
| B4 (prev) | Archivos innecesarios en `assets/` | ✅ Solo queda `hero.png` (legítimo) |
| B5 (prev) | `ProduccionResumen.vue` sin uso | ✅ Eliminado |
| B6 (prev) | Documentar limitación de transaccionalidad | ✅ Documentado en `ARCHITECTURE.md` |

### Eliminadas de auditorías anteriores (histórico completo)

- **Sección 0 completa** (0.1, 0.2, 0.3) — Bugs de pedidos completados.
- **1.2** — Estandarizar frontend a camelCase (completado).
- **2.1b-e** — Centralización de `normalizarClaves`, `useInventario`, `formatearFecha`, `mostrarMensajeInline` (completado).
- **2.4.1** — Errores silenciosos en MermaClient (completado).
- **2.5** — Refactorizar DashboardClient monolítico (completado).
- **2.6** — Extraer lógica planificación de ProduccionPage (completado).
- **2.7** — Extraer lógica filtrado de MermasPage (completado).
- **3.1-3.3** — Archivos raíz, resolución clientes, queries duplicadas (completados).
- **N1-N12** — Diversas mejoras (todos completados).

---

## Hoja de Ruta Priorizada

### Fase 1 — Fixes y código muerto (5 min)

| # | Tarea | Esfuerzo | Líneas |
|---|---|---|---|
| A1 | Eliminar botón y `eliminarMaterial` (si el usuario aprueba) | 5 min | ~25 |
| M1 | Eliminar bloque `else` vacío en `MaterialClient` | 1 min | 3 |
| M2 | Agregar `return { success: true }` en `MaterialClient.sincronizarConSupabase` | 1 min | 2 |
| M3 | Eliminar import `PlanificacionClient` muerto en `MermasPage` | 1 min | 1 |

### Fase 2 — Bugs latentes (5 min)

| # | Tarea | Esfuerzo | Líneas |
|---|---|---|---|
| M4 | Fix asignación a reactive en `limpiarDatos` | 2 min | ~4 |
| M5 | Fix `.forEach` sobre objeto en `resolverClientesDePedidos` | 3 min | ~5 |

### Fase 3 — Consistencia visual CSS (10 min)

| # | Tarea | Esfuerzo | Líneas |
|---|---|---|---|
| A2 | Reemplazar 18 instancias de `white`/`#f8faf8` por variables CSS | 10 min | ~18 |

### Fase 4 — Limpieza de comentarios y textos (5 min)

| # | Tarea | Esfuerzo | Líneas |
|---|---|---|---|
| A3 | Simplificar separadores decorativos y eliminar HTML redundante | 5 min | ~15 |
| B2 | Fix espacio faltante en `RecetaResumen` | 1 min | 1 |
| B3 | Fix espacio faltante en `RecetaMaterialesTabla` | 1 min | 1 |
| B4 | Eliminar comentario obsoleto en `RecetasPage` | 1 min | 1 |

### Estimación total: ~30 minutos de trabajo

**Resultado esperado:** Un código base más limpio, con ~70 líneas de mejoras (código muerto, bugs latentes, colores hardcoded, comentarios obsoletos), convenciones consistentes, y CSS compatible con dark mode en todos los componentes.
