# Plan de Trabajo Oficial — MMS App

> **Auditor:** Arquitecto de Software Senior
> **Fecha original:** 2026-07-22
> **Última auditoría:** 2026-08-05
> **Alcance:** Auditoría completa pre-cierre del proyecto Vue 3 + Vite + Supabase

---

## Tabla de Contenidos

- [Resumen Ejecutivo](#resumen-ejecutivo)
- [Prioridad Alta](#prioridad-alta)
  - [A1 — Eliminar botón y código muerto de eliminar materiales](#a1--eliminar-botón-y-código-muerto-de-eliminar-materiales)
  - [A2 — Limpieza de comentarios y código muerto comentado](#a2--limpieza-de-comentarios-y-código-muerto-comentado)
  - [A3 — Eliminar línea duplicada en useFiltroRecursos](#a3--eliminar-línea-duplicada-en-usfiltrorecursos)
  - [A4 — Colores hardcoded y estilos inconsistentes en componentes de Recetas](#a4--colores-hardcoded-y-estilos-inconsistentes-en-componentes-de-recetas)
  - [A5 — Patrón duplicado de extracción de datos del catálogo](#a5--patrón-duplicado-de-extracción-de-datos-del-catálogo)
  - [A6 — Estilos duplicados entre InventoryTable y PreviewTable](#a6--estilos-duplicados-entre-inventorytable-y-previewtable)
  - [A7 — Funciones de selección duplicadas en RecetasPage](#a7--funciones-de-selección-duplicadas-en-recetaspage)
  - [A8 — Bloque style scoped vacío en UsuariosPage](#a8--bloque-style-scoped-vacío-en-usuariospage)
- [Prioridad Media](#prioridad-media)
  - [M1 — Centralizar URLs de APIs externas en .env](#m1--centralizar-urls-de-apis-externas-en-env)
  - [M2 — Evaluación del módulo RecetaResumen](#m2--evaluación-del-módulo-recetaresumen)
  - [M3 — PedidoClient._obtenerCatalogos no extrae correctamente .data](#m3--pedidoclient_obtenercatalogos-no-extrae-correctamente-data)
  - [M4 — Transiciones CSS no utilizadas en PlanificacionPage](#m4--transiciones-css-no-utilizadas-en-planificacionpage)
  - [M5 — Consistencia en el manejo de respuestas de catálogos en las páginas](#m5--consistencia-en-el-manejo-de-respuestas-de-catálogos-en-las-páginas)
  - [M6 — PlanificacionPage usa tabs en lugar de espacios](#m6--planificacionpage-usa-tabs-en-lugar-de-espacios)
  - [M7 — Selector .sin-planificacion p apunta a clase inexistente en ProduccionPage](#m7--selector-sin-planificacion-p-apunta-a-clase-inexistente-en-produccionpage)
  - [M8 — Simplificar comentarios de sección en el código](#m8--simplificar-comentarios-de-sección-en-el-código)
- [Prioridad Baja](#prioridad-baja)
  - [B1 — Eliminar código CRUD comentado (Reservado para futuro)](#b1--eliminar-código-crud-comentado-reservado-para-futuro)
  - [B2 — Inconsistencia menor en nombres de eventos del template](#b2--inconsistencia-menor-en-nombres-de-eventos-del-template)
  - [B3 — Variable today vs hoy en DashboardPage](#b3--variable-today-vs-hoy-en-dashboardpage)
  - [B4 — Archivos innecesarios en assets](#b4--archivos-innecesarios-en-assets)
  - [B5 — ProduccionResumen.vue sin uso visible](#b5--produccionresumenvue-sin-uso-visible)
  - [B6 — Documentar limitación de transaccionalidad en pedidos](#b6--documentar-limitación-de-transaccionalidad-en-pedidos)
- [Hoja de Ruta Priorizada](#hoja-de-ruta-priorizada)

---

## Resumen Ejecutivo

La aplicación se encuentra en un estado de madurez alto. La arquitectura es sólida con una separación clara de capas (`client/`, `composables/`, `pages/`, `components/`, `utils/`), convenciones de nomenclatura consistentes (camelCase en frontend, snake_case confinado a la capa `client/`), y un sistema de design tokens bien definido en `style.css`.

Las recomendaciones de esta auditoría se enfocan exclusivamente en **limpieza, consistencia y mantenibilidad** — no se propone agregar funcionalidades nuevas.

| Prioridad | Cantidad | Enfoque principal |
|---|---|---|
| Alta | 8 | Código muerto, duplicación, inconsistencias visuales |
| Media | 8 | Patrones inconsistentes, mejoras de mantenibilidad |
| Baja | 6 | Limpieza cosmética, documentación |

### Recomendaciones anteriores eliminadas

Las siguientes recomendaciones de auditorías anteriores han sido eliminadas por estar **completadas** o **descartadas por decisión del usuario**:

- **Sección 0 completa** (0.1, 0.2, 0.3) — Bugs de pedidos, todos verificados como completados.
- **1.2** — Estandarizar frontend a camelCase (~90% completado, el snake_case solo vive en `client/`).
- **2.1b, 2.1c, 2.1d, 2.1e** — Centralización de código (`normalizarClaves`, `useInventario`, `formatearFecha`, `mostrarMensajeInline`), todos completados.
- **2.4.1** — Errores silenciosos en MermaClient, completado.
- **2.5** — Refactorizar DashboardClient monolítico, completado.
- **2.6** — Extraer lógica planificación de ProduccionPage, completado.
- **2.7** — Extraer lógica filtrado de MermasPage, completado.
- **3.1** — Archivos sueltos en la raíz, completado (movidos a `db/`).
- **3.2** — Consolidar resolución de clientes faltantes, completado.
- **3.3** — Queries duplicadas en PlanificacionClient, completado.
- **N1** — Fix botones Actualizar `forceRefresh`, completado (ya se pasa `true` explícitamente).
- **N2** — Eliminar botón de eliminar materiales, descartado por el usuario.
- **N3** — Crear `useAsyncAction` composable, completado.
- **N4** — Agregar timeout a llamadas Axios, completado.
- **N5** — Centralizar URLs de APIs externas, completado.
- **N6** — Crear `utils/mapper.js`, completado.
- **N7** — Normalizar UsuariosPage al patrón de layout global, completado.
- **N9** — Reorganizar archivos sueltos de la raíz, completado.
- **N11** — Mover `.badge-cargando` a estilos globales, completado.
- **N12** — Documentar limitación de transaccionalidad, completado.

---

## Prioridad Alta

---

### A1 — Eliminar botón y código muerto de eliminar materiales

- **Estado:** Pendiente
- **Archivos afectados:**
  - `src/pages/MaterialesPage.vue` (L36-39, L200-209)
  - `src/client/MaterialClient.js` (L172-189)
- **Descripción:** El botón de eliminar materiales sigue presente en el inventario, junto con el método `eliminarMaterial()` en la página y la función `eliminarMaterial()` en `MaterialClient.js`. Eliminar un material que sea insumo de una receta puede dejar referencias huérfanas.
- **Motivo:** Riesgo de integridad referencial. Código muerto que confunde y agrega mantenimiento innecesario.
- **Propuesta:**
  1. Eliminar el botón `🗑️` y la columna "Acciones" del template de `MaterialesPage.vue`.
  2. Eliminar el método `eliminarMaterial()` de `MaterialesPage.vue`.
  3. Eliminar la función `eliminarMaterial()` de `MaterialClient.js`.
  4. Eliminar la clase `.actions-column` del `<style scoped>` de `MaterialesPage.vue`.
- **Impacto:** Elimina ~20 líneas de código muerto y un riesgo de integridad de datos.

---

### A2 — Limpieza de comentarios y código muerto comentado

- **Estado:** Pendiente
- **Archivos afectados:** Múltiples archivos en `client/` y `composables/`
- **Descripción:** Detectados tres tipos de comentarios a limpiar:

  **a) Código CRUD comentado ("Reservado para futuro"):** Bloques completos de funciones `actualizarReceta`, `eliminarReceta`, `obtenerUsuario`, `actualizarUsuario`, `actualizarOperadorPedido` comentados en:
  - `RecetaClient.js` (L139-228)
  - `UsuarioClient.js` (L58-98)
  - `PedidoClient.js` (L306-323)
  - `PlanificacionClient.js` (L4, L138+)

  **b) JSDoc que repite lo que la firma ya expresa:** Comentarios como `@param {string} fecha` o `@returns {string}` en funciones donde la firma es autoexplicativa. Archivos:
  - `date.js` (L7-11) — `formatearFecha(fecha)` es autoexplicativo.
  - `MateriaPrimaClient.js` (L142-146) — `actualizarStockMateriaPrima(id, nuevaCantidad)` es autoexplicativo.

  **c) JSDoc útil que debe conservarse:**
  - `useAuth.js` (L1-7) — Explica cuándo usar el composable vs los helpers.
  - `useInventario.js` (L4-9) — Documenta la interfaz del objeto de opciones.
  - `useExcel.js` (L8-12, L31-35) — Documenta parámetros no evidentes.
  - `PlanificacionAlgoritmo.js` — Documenta las estructuras de datos complejas.
  - `DashboardClient.js` (L330-334) — Explica side-effects vs lectura pura.

- **Motivo:** El código comentado "para futuro" nunca se implementará en el alcance de la tesis. Los JSDoc redundantes añaden ruido visual sin aportar información nueva.
- **Propuesta:**
  1. Eliminar todos los bloques de código CRUD comentado.
  2. Eliminar JSDoc que solo repite la firma de la función.
  3. Conservar JSDoc que documenta estructuras complejas, patrones de uso o contratos de interfaz.
- **Impacto:** Elimina ~130 líneas de código muerto. Mejora la legibilidad sin perder documentación útil.

---

### A3 — Eliminar línea duplicada en useFiltroRecursos

- **Estado:** Pendiente
- **Archivos afectados:**
  - `src/composables/useFiltroRecursos.js` (L23-24)
- **Descripción:** La línea `cargandoRecursos.value = true` está duplicada en las líneas 23 y 24. Es un copy-paste evidente.
- **Motivo:** Código duplicado trivial. No causa bugs pero es ruido.
- **Propuesta:** Eliminar la línea 24 (duplicada).
- **Impacto:** Limpieza menor, 1 línea.

---

### A4 — Colores hardcoded y estilos inconsistentes en componentes de Recetas

- **Estado:** Pendiente
- **Archivos afectados:**
  - `src/components/recetas/RecetaResumen.vue` (L83, L102, L129)
  - `src/components/recetas/RecetaForm.vue` (L117, L129)
  - `src/components/recetas/RecetaCategoria.vue` (L80)
- **Descripción:**
  - `RecetaResumen.vue` usa `background: white` (L83) y `background: #f8faf8` (L102, L129) en lugar de las variables CSS del sistema de diseño (`var(--bg)` y `var(--bg-secondary)`).
  - `RecetaForm.vue` usa `background: white` (L117) en `.form-panel input`.
  - `RecetaCategoria.vue` usa `background: linear-gradient(180deg, #ffffff 0%, #f8faf8 100%)` con colores literales.
  - Estos colores no se adaptan al modo oscuro.
- **Motivo:** Inconsistencia con el sistema de design tokens. En dark mode estos elementos se verán como cajas blancas sobre fondo oscuro.
- **Propuesta:**
  1. Reemplazar `white` por `var(--bg)`.
  2. Reemplazar `#f8faf8` por `var(--bg-secondary)`.
  3. Actualizar el gradiente en `RecetaCategoria.vue` para usar variables CSS.
- **Impacto:** Consistencia visual y soporte correcto de dark mode en 3 componentes.

---

### A5 — Patrón duplicado de extracción de datos del catálogo

- **Estado:** Pendiente
- **Archivos afectados:**
  - `src/pages/RecetasPage.vue` (L110, L114, L124, L128, L140-141)
  - `src/pages/PlanificacionPage.vue` (L130, L134, L148, L208)
  - `src/pages/MermasPage.vue` (L94, L98, L104, L112, L116, L123)
  - `src/pages/PedidoPage.vue` (L121, L125)
  - `src/pages/ClientesPage.vue` (L97, L101)
- **Descripción:** El patrón para extraer datos del catálogo se repite en ~15 lugares con variantes:
  ```js
  // Variante más común:
  const response = await this.catalogos.obtenerX()
  if (response && response.success === false) { ... }
  else { this.datos = response?.success ? response.data : (response ?? []) }
  ```
  La expresión `response?.success ? response.data : (response ?? [])` es un "safety net" innecesario porque `useCatalogos` **siempre** retorna `{ success: true, data: [...] }` o propaga el error `{ success: false }`. La rama `(response ?? [])` nunca se ejecuta.
- **Motivo:** Código defensivo redundante que añade ruido y complejidad. La inconsistencia entre variantes dificulta la lectura.
- **Propuesta:** Crear un helper en `utils/` que estandarice la extracción:
  ```js
  // utils/response.js
  export function extraerDatos(response, fallback = []) {
    if (response?.success === false) return fallback
    return response?.data ?? fallback
  }
  ```
  Luego reemplazar todas las variantes por:
  ```js
  const response = await this.catalogos.obtenerX()
  if (response?.success === false) {
    this.mostrarMensaje('error', '...')
    this.datos = []
  } else {
    this.datos = extraerDatos(response)
  }
  ```
- **Impacto:** Elimina ~30 líneas de código redundante. Estandariza un patrón que se repite en 5+ páginas.

---

### A6 — Estilos duplicados entre InventoryTable y PreviewTable

- **Estado:** Pendiente
- **Archivos afectados:**
  - `src/components/shared/InventoryTable.vue` (L58-192)
  - `src/components/shared/PreviewTable.vue` (L60-210)
- **Descripción:** Ambos componentes comparten ~80% de sus estilos scoped: `.inventory-card` / `.preview-card` son idénticos, `.inventory-header` / `.preview-header` son idénticos, `.inventory-table` / `.preview-table` son idénticos, `.content-table` / `.preview-content` son casi idénticos. Las reglas de `thead`, `th`, `td`, `tbody tr:hover`, y los breakpoints responsive son copia exacta.
- **Motivo:** Duplicación masiva de CSS (~120 líneas repetidas). Cualquier cambio visual requiere editar ambos archivos.
- **Propuesta:** Extraer las clases compartidas a `style.css` global bajo un namespace `.data-card`:
  - `.data-card` (wrapper)
  - `.data-card-header` (header con gradiente verde)
  - `.data-card-content` (padding + overflow)
  - `.data-card-table` (tabla base + thead/th/td/hover)
  - Breakpoints responsive asociados

  Mantener en cada componente solo los estilos específicos: `.preview-actions` en PreviewTable, `.btn-refresh` y `.btn-sync` en InventoryTable.
- **Impacto:** Elimina ~120 líneas de CSS duplicado. Un solo punto de mantenimiento para el estilo de tablas de datos.

---

### A7 — Funciones de selección duplicadas en RecetasPage

- **Estado:** Pendiente
- **Archivos afectados:**
  - `src/pages/RecetasPage.vue` (L155-185)
- **Descripción:** Cuatro funciones (`alternarMaterial`, `alternarMateriaPrima`, `actualizarCantidadMaterial`, `actualizarCantidadMateriaPrima`) repiten la misma lógica con la única diferencia del array target (`materialesSeleccionados` vs `materiaPrimaSeleccionada`) y el campo del nombre (`nombre` vs `variedad`).
- **Motivo:** Duplicación lógica que dificulta el mantenimiento. Si se cambia la lógica de selección, hay que actualizar 4 funciones.
- **Propuesta:** Refactorizar a dos funciones genéricas:
  ```js
  alternarItem(lista, item, seleccionado, campoNombre = 'nombre') {
    if (seleccionado) {
      lista.push({ id: item.id, nombre: item[campoNombre], cantidad: 1 })
      return lista
    }
    return lista.filter(x => x.id !== item.id)
  }

  actualizarCantidadItem(lista, id, valor) {
    const item = lista.find(x => x.id === id)
    if (item) item.cantidad = Number(valor) || 1
  }
  ```
  Los handlers del template invocan estas funciones pasando el array correspondiente.
- **Impacto:** Reduce ~30 líneas de código duplicado a ~10 líneas genéricas.

---

### A8 — Bloque style scoped vacío en UsuariosPage

- **Estado:** Pendiente
- **Archivos afectados:**
  - `src/pages/UsuariosPage.vue` (L82-84)
- **Descripción:** El bloque contiene solo un comentario `/* Sin estilos aislados. Toda la vista usa los layout globales. */`. Es un bloque vacío con un comentario que no aporta valor.
- **Motivo:** Ruido innecesario en el archivo. Si no hay estilos scoped, el bloque no debería existir.
- **Propuesta:** Eliminar el bloque `<style scoped>` completo.
- **Impacto:** Limpieza menor, 3 líneas.

---

## Prioridad Media

---

### M1 — Centralizar URLs de APIs externas en .env

- **Estado:** Completado
- **Evidencia:** Las URLs de APIs externas ya están en `.env` usando `VITE_API_PEDIDOS_URL`, `VITE_API_MATERIA_PRIMA_URL`, `VITE_API_MATERIALES_URL`. Los clients usan `import.meta.env.VITE_API_*`.
- **Nota:** Se mantiene para referencia. Ya no requiere acción.

---

### M2 — Evaluación del módulo RecetaResumen

- **Estado:** Evaluado — No recomendado
- **Archivos analizados:**
  - `src/components/recetas/RecetaResumen.vue`
  - `src/pages/RecetasPage.vue`
- **Evaluación completa:**

  El componente `RecetaResumen` muestra los materiales y materia prima **seleccionados durante la creación de una receta**. Su propósito es dar feedback visual al usuario mientras arma una receta nueva.

  | Aspecto | RecetaResumen actual | RecetaDetalle propuesto |
  |---|---|---|
  | Propósito | Feedback durante creación | Visualización de receta guardada |
  | Datos que consume | Arrays reactivos locales (seleccionados) | Receta completa desde BD |
  | Páginas que lo usarían | Solo RecetasPage | Potencialmente Producción, Planificación |
  | Reutilización | Baja (solo creación) | Media-Alta |

  **Conclusión:** No se recomienda reemplazar `RecetaResumen` porque cumple una función diferente a un componente de detalle. Un componente `RecetaDetalle` sería complementario (no sustituto), pero dado que el proyecto está en fase de cierre y no se agregan funcionalidades nuevas, **esta tarea no se incluye en el plan de trabajo**.

---

### M3 — PedidoClient._obtenerCatalogos no extrae correctamente .data

- **Estado:** Pendiente
- **Archivos afectados:**
  - `src/client/PedidoClient.js` (L16-35)
- **Descripción:** El método privado `_obtenerCatalogos()` hace:
  ```js
  let [clientes, recetas] = await Promise.all([
    catalogos.obtenerClientes(),
    catalogos.obtenerRecetas()
  ])
  const mapClientes = new Map(clientes.map(c => [c.nombre.toLowerCase().trim(), c.id]))
  ```
  Pero `catalogos.obtenerClientes()` devuelve `{ success: true, data: [...] }`, no un array directo. El `.map()` en la línea 23 recibiría `{ success, data }` y fallaría al intentar acceder a `c.nombre`. Esto funciona actualmente porque hay un cache previo que en ciertos flujos devuelve el objeto correctamente, pero es un bug potencial.
- **Motivo:** Bug latente que podría manifestarse en escenarios de primera carga sin cache.
- **Propuesta:**
  ```js
  const [clientesRes, recetasRes] = await Promise.all([
    catalogos.obtenerClientes(),
    catalogos.obtenerRecetas()
  ])
  const clientes = clientesRes?.data ?? []
  const recetas = recetasRes?.data ?? []
  ```
- **Impacto:** Previene un crash potencial en escenarios de cache vacío.

---

### M4 — Transiciones CSS no utilizadas en PlanificacionPage

- **Estado:** Pendiente
- **Archivos afectados:**
  - `src/pages/PlanificacionPage.vue` (L399-407)
- **Descripción:** Las clases `.fade-msg-enter-active`, `.fade-msg-leave-active`, `.fade-msg-enter-from`, `.fade-msg-leave-to` están definidas en el `<style scoped>` pero no se usan en ningún `<transition name="fade-msg">` dentro del template.
- **Motivo:** CSS muerto que añade bytes innecesarios.
- **Propuesta:** Eliminar las 8 líneas de transiciones no usadas (L399-407).
- **Impacto:** Limpieza de ~8 líneas de CSS muerto.

---

### M5 — Consistencia en el manejo de respuestas de catálogos en las páginas

- **Estado:** Pendiente
- **Archivos afectados:**
  - `src/pages/RecetasPage.vue` (L106-131)
  - `src/pages/MermasPage.vue` (L88-127)
- **Descripción:** Algunas páginas envuelven la carga en `try/catch` (e.g., `MaterialesPage`, `MateriaPrimaPage` vía `useInventario`) mientras que otras no lo hacen (e.g., `RecetasPage.cargarMateriales`, `RecetasPage.cargarMateriaPrima`, `MermasPage.cargarDatos`).

  En `RecetasPage`, `cargarMateriales()` y `cargarMateriaPrima()` no usan `try/catch` alrededor del `await`. Si `useCatalogos` lanzara una excepción (en lugar de retornar `{ success: false }`), la promesa rechazada no se capturaría.
- **Motivo:** Inconsistencia en el manejo defensivo. Todas las funciones de carga deberían seguir el mismo patrón.
- **Propuesta:** Unificar el patrón de manejo de errores. Dado que los `Client` ya capturan errores internamente y devuelven `{ success: false }`, el `try/catch` adicional no es estrictamente necesario, pero debería ser consistente: o se pone en todas o en ninguna.
- **Impacto:** Consistencia del patrón entre páginas.

---

### M6 — PlanificacionPage usa tabs en lugar de espacios

- **Estado:** Pendiente
- **Archivos afectados:**
  - `src/pages/PlanificacionPage.vue` (todo el archivo)
- **Descripción:** `PlanificacionPage.vue` utiliza tabulaciones como indentación, mientras que el resto de archivos del proyecto usan espacios (2 o 4). Es la única página con esta inconsistencia.
- **Motivo:** Inconsistencia de formato que dificulta la revisión de diffs en Git.
- **Propuesta:** Convertir tabs a espacios (4 espacios, consistente con el resto del proyecto).
- **Impacto:** Consistencia visual del código fuente.

---

### M7 — Selector .sin-planificacion p apunta a clase inexistente en ProduccionPage

- **Estado:** Pendiente
- **Archivos afectados:**
  - `src/pages/ProduccionPage.vue` (L233-238)
- **Descripción:** El estilo scoped define `.sin-planificacion p { ... }` pero en el template la clase usada es `empty-state-card` (global), no `.sin-planificacion`. El selector nunca coincide con ningún elemento.
- **Motivo:** CSS muerto que no aplica a ningún elemento.
- **Propuesta:** Eliminar el selector `.sin-planificacion p` (L233-238).
- **Impacto:** Limpieza de ~6 líneas de CSS muerto.

---

### M8 — Simplificar comentarios de sección en el código

- **Estado:** Pendiente
- **Archivos afectados:**
  - `src/pages/MaterialesPage.vue`, `MateriaPrimaPage.vue`, `RecetasPage.vue`, `PedidoPage.vue`
- **Descripción:** Los separadores de sección tipo `/* ================= CARGAR ================= */` son más ruidosos de lo necesario. También hay comentarios HTML en templates como `<!-- TITULO -->`, `<!-- ALERTAS -->`, `<!-- LAYOUT -->` que son redundantes cuando la estructura del template es clara.
- **Motivo:** Los comentarios de sección decorados ocupan espacio visual sin añadir información que el código no exprese por sí solo. Los comentarios HTML como `<!-- TITULO -->` antes de un `<h1>` son redundantes.
- **Propuesta:**
  1. Simplificar separadores: `/* ================= CARGAR ================= */` pasa a ser `// -- Cargar --` (patrón ya usado en ProduccionPage).
  2. Eliminar comentarios HTML redundantes como `<!-- TITULO -->`, `<!-- ALERTAS -->` donde el código es autoexplicativo.
  3. Conservar comentarios HTML en secciones complejas como `<!-- PANEL IZQUIERDO -->` que ayudan a navegar layouts largos.
- **Impacto:** Reduce ruido visual sin perder orientación en el código.

---

## Prioridad Baja

---

### B1 — Eliminar código CRUD comentado (Reservado para futuro)

- **Estado:** Pendiente (vinculado con A2)
- **Archivos afectados:**
  - `src/client/RecetaClient.js` (L139-228, ~89 líneas)
  - `src/client/UsuarioClient.js` (L58-98, ~40 líneas)
  - `src/client/PedidoClient.js` (L306-323, ~17 líneas)
  - `src/client/PlanificacionClient.js` (L4, L138+)
- **Descripción:** Funciones CRUD completas comentadas con `/* ... */` marcadas como "Reservado para futuro CRUD". Incluyen `actualizarReceta`, `eliminarReceta`, `obtenerUsuario`, `actualizarUsuario`, `actualizarOperadorPedido`.
- **Motivo:** El proyecto está en fase de cierre. Este código nunca se implementará y vive en el historial de Git si se necesita en el futuro. Mantenerlo en los archivos añade ~150 líneas muertas.
- **Propuesta:** Eliminar todos los bloques comentados. Si se necesitaran en el futuro, están en el historial de Git.
- **Impacto:** Elimina ~150 líneas de código muerto distribuido en 4 archivos.

---

### B2 — Inconsistencia menor en nombres de eventos del template

- **Estado:** Pendiente
- **Archivos afectados:**
  - `src/components/recetas/RecetaForm.vue` (L86)
  - `src/pages/RecetasPage.vue` (L19)
- **Descripción:** El evento `actualizar-receta` en RecetaForm usa kebab-case (correcto para eventos Vue), pero la prop se maneja en el padre con `@actualizar-receta="nuevaReceta = $event"` que es una expresión inline compleja. Esto es consistente pero podría simplificarse.
- **Motivo:** Observación menor. La convención kebab-case para eventos se mantiene correctamente en todo el proyecto. No requiere acción inmediata.
- **Propuesta:** No requiere cambio, solo documentar como patrón establecido.
- **Impacto:** Ninguno. Es una observación para referencia.

---

### B3 — Variable today vs hoy en DashboardPage

- **Estado:** Pendiente
- **Archivos afectados:**
  - `src/pages/DashboardPage.vue` (L90)
- **Descripción:** `DashboardPage` usa `const today = obtenerFechaHoy()` con el nombre en inglés, mientras que todo el proyecto usa variables en español (`fecha`, `hoy`, `fechaSeleccionada`).
- **Motivo:** Inconsistencia de idioma en una sola variable.
- **Propuesta:** Renombrar `today` a `hoy` para consistencia con el resto del proyecto.
- **Impacto:** Limpieza cosmética, 2 ocurrencias.

---

### B4 — Archivos innecesarios en assets

- **Estado:** Pendiente
- **Archivos afectados:**
  - `src/assets/vite.svg`
  - `src/assets/vue.svg`
  - `src/assets/WhatsApp Video 2026-07-22 at 9.16.59 PM.mp4` (1 MB)
- **Descripción:** Los archivos `vite.svg` y `vue.svg` son los archivos por defecto del template de Vite y no se usan en la aplicación. El video de WhatsApp tampoco pertenece al proyecto.
- **Motivo:** Archivos que no pertenecen al proyecto incrementan el tamaño del bundle/repo sin beneficio.
- **Propuesta:** Eliminar `vite.svg`, `vue.svg` y el video de WhatsApp. Verificar antes que no se referencien en ningún import.
- **Impacto:** Reduce ~1 MB del repositorio.

---

### B5 — ProduccionResumen.vue sin uso visible

- **Estado:** Requiere verificación
- **Archivos afectados:**
  - `src/components/produccion/ProduccionResumen.vue` (7 KB)
- **Descripción:** El componente `ProduccionResumen.vue` no se importa ni referencia desde `ProduccionPage.vue`. Podría ser código muerto de una versión anterior que fue reemplazada por `ProduccionRecetasView.vue`.
- **Motivo:** Si no se usa, son 7 KB de código muerto que añade confusión.
- **Propuesta:** Verificar con `grep` si se importa desde algún otro archivo. Si no se usa, eliminarlo.
- **Impacto:** Potencialmente elimina un componente entero de código muerto.

---

### B6 — Documentar limitación de transaccionalidad en pedidos

- **Estado:** Completado
- **Evidencia:** Documentado en `ARCHITECTURE.md`. `PedidoClient.sincronizarConSupabase()` hace `DELETE` + `INSERT` sin transacción para los detalles. Aceptado como limitación del alcance de la tesis dado que Supabase client-side no soporta transacciones.

---

## Hoja de Ruta Priorizada

### Fase 1 — Fixes inmediatos y código muerto (Alta prioridad)

| # | Tarea | Esfuerzo | Líneas |
|---|---|---|---|
| A1 | Eliminar botón y `eliminarMaterial` | 5 min | ~20 |
| A3 | Eliminar línea duplicada en `useFiltroRecursos` | 1 min | 1 |
| A8 | Eliminar `<style scoped>` vacío en UsuariosPage | 1 min | 3 |
| M4 | Eliminar transiciones CSS no usadas en PlanificacionPage | 2 min | 8 |
| M7 | Eliminar selector `.sin-planificacion p` muerto | 1 min | 6 |

### Fase 2 — Limpieza de comentarios y código muerto (Alta prioridad)

| # | Tarea | Esfuerzo | Líneas |
|---|---|---|---|
| A2 | Limpiar JSDoc redundante y código CRUD comentado | 15 min | ~150 |
| B1 | Eliminar bloques CRUD "Reservado para futuro" | (incluido en A2) | — |
| M8 | Simplificar comentarios de sección | 10 min | ~40 |

### Fase 3 — Consistencia visual y CSS (Alta prioridad)

| # | Tarea | Esfuerzo | Líneas |
|---|---|---|---|
| A4 | Reemplazar colores hardcoded por variables CSS | 10 min | ~8 |
| A6 | Extraer estilos compartidos de tablas a `style.css` | 20 min | ~120 eliminadas |

### Fase 4 — Refactorización de patrones (Alta/Media prioridad)

| # | Tarea | Esfuerzo | Líneas |
|---|---|---|---|
| A5 | Crear helper `extraerDatos()` y unificar patrón | 15 min | ~30 |
| A7 | Refactorizar funciones de selección duplicadas en RecetasPage | 10 min | ~20 |
| M3 | Fix `_obtenerCatalogos` en PedidoClient | 5 min | ~4 |

### Fase 5 — Limpieza final y consistencia (Media/Baja prioridad)

| # | Tarea | Esfuerzo | Líneas |
|---|---|---|---|
| M5 | Unificar patrón try/catch en páginas | 10 min | — |
| M6 | Convertir tabs a espacios en PlanificacionPage | 5 min | — |
| B3 | Renombrar `today` a `hoy` en DashboardPage | 1 min | 2 |
| B4 | Eliminar archivos innecesarios de `assets/` | 2 min | — |
| B5 | Verificar y eliminar `ProduccionResumen.vue` si no se usa | 5 min | — |

### Estimación total: ~2 horas de trabajo

**Resultado esperado:** Un código base más limpio, con ~400+ líneas eliminadas de código muerto/duplicado, convenciones consistentes, y un CSS más mantenible.
