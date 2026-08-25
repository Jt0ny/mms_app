# Plan de Trabajo Oficial — MMS App (Auditoría #4)

> **Auditor:** Antigravity (AI Architect)
> **Fecha de auditoría:** 2026-08-25
> **Alcance:** Nueva auditoría completa de estilos en componentes, análisis de edición de recetas, estado del componente Alertas y evaluación arquitectónica general.

---

## Tabla de Contenidos

- [Resumen Ejecutivo](#resumen-ejecutivo)
- [Auditoría 1: Componentes y Estilos (CSS)](#auditoría-1-componentes-y-estilos-css)
- [Auditoría 2: Edición de Recetas](#auditoría-2-edición-de-recetas)
- [Auditoría 3: Sistema de Alertas (useMensajes)](#auditoría-3-sistema-de-alertas-usemensajes)
- [Hallazgos Arquitectónicos (Nuevas Recomendaciones)](#hallazgos-arquitectónicos-nuevas-recomendaciones)
- [Hoja de Ruta de Implementación (Fase 12+)](#hoja-de-ruta-de-implementación-fase-12)

---

## Resumen Ejecutivo

Se realizó una revisión exhaustiva del código actual de la aplicación (`/src`). El estado general del código ha mejorado enormemente tras las últimas refactorizaciones (Fases 1 a 11). Los patrones globales definidos en `style.css` (como `.btn`, `.data-card`, `.form-input`, `.selector-group`, `.progress-track`) están siendo utilizados adecuadamente.

Sin embargo, se han detectado fallos arquitectónicos silenciosos en el manejo del estado global (`useMensajes`), una falta de estandarización en la UI de ciertas alertas, y lógica de negocio duplicada en componentes visuales.

---

## Auditoría 1: Componentes y Estilos (CSS)

Se analizó la carpeta `/src/components` y `/src/pages` para evaluar si los estilos `scoped` actuales deberían permanecer locales o migrarse a globales.

**Veredicto General:** La limpieza de las auditorías anteriores fue efectiva. Los estilos locales actuales están en su mayoría **justificados** y fuertemente ligados a la estructura HTML de sus respectivos componentes. No se recomienda globalizar por obligación.

### Estilos que DEBEN permanecer locales:
- **Layouts de Dashboard** (`DashboardAvanceOperador`, `DashboardPage`): Clases como `.grid-halves`, `.pedidos-widget` y dimensiones específicas de gráficos son únicas a esta vista.
- **Tarjetas de Planificación** (`PlanificacionOperadorCard`, `PlanificacionMapeoRecetas`): Las grillas de distribución de trabajo (`.operadores-panel`, `.categorias-grid`) son muy específicas al modelo de negocio de este módulo.
- **Badges de Dominio**: Clases como `.badge-billing`, `.badge-shipping` (en `ClienteList`), `.role-supervisor` (en `UsuarioList`), `.badge-materia_prima` (en `MermaList`). Estos mapean colores semánticos a lógica de negocio local.
- **Uploaders** (`CargaArchivo`): La `.upload-zone` y `.upload-icon` tienen una UX muy particular (dashed borders, drag area) que solo se usa aquí.

### Estilos que PODRÍAN centralizarse (Opcional, prioridad baja):
- **Empty States**: Hay variantes locales como `.no-data` (en `ClienteList`) que podrían heredar o usar directamente `.empty-state` o `.text-light`.
- **Links**: En `ClienteList`, la clase `.link-contact` (hover con underline y primary color) podría ser una clase global `.link-primary` si hubieran más enlaces en la app.

*Recomendación:* Mantener la estructura de CSS actual. El balance entre global (`style.css`) y local (`<style scoped>`) es el adecuado.

---

## Auditoría 2: Edición de Recetas

Se solicitó verificar el comportamiento del botón "Editar" en la sección de recetas (`RecetasPage.vue`, `RecetaList.vue` y `RecetaForm.vue`).

**Flujo actual verificado:**
1. En `RecetaList.vue`, hacer clic en el botón (que usa correctamente el icono global `.btn-action-ghost.edit`) emite el evento `'editar'` con el objeto `receta` completo.
2. `RecetasPage.vue` recibe el evento, carga la receta en `recetaEnEdicion` y muestra el formulario `RecetaForm`.
3. `RecetaForm` recibe la prop `recetaSeleccionada`. Su watcher (con `immediate: true, deep: true`) captura la receta y la clona en el formulario local: `this.form = { ...nuevoValor }`.

**Diagnóstico:**
- El flujo de UI es **correcto**. Los datos llegan al formulario y se cargan.
- **Problema de Mutabilidad (Riesgo):** En `RecetaForm.vue` L124, el clonado se hace mediante destructuring superficial (`...nuevoValor`). Dado que las recetas incluyen arreglos anidados (`materiales` y `materiaPrima`), cualquier modificación a la cantidad de materiales en el formulario mutará directamente el estado de la lista subyacente *antes* de hacer clic en guardar.
- **Recomendación:** Se debe realizar un **deep clone** (clonación profunda) al cargar la receta en el formulario para asegurar que la edición y la posterior cancelación no alteren los datos en caché de la lista. `this.form = JSON.parse(JSON.stringify(nuevoValor))` o usar `structuredClone(nuevoValor)`.

---

## Auditoría 3: Sistema de Alertas (useMensajes)

La app usa un patrón donde múltiples componentes importan `useMensajes()` para interactuar con un componente `<Alertas />` renderizado en sus respectivos templates.

### Hallazgo Crítico 1: Singleton Involuntario
En `useMensajes.js`, el estado (`mensaje` y `temporizador`) está declarado **fuera** de la función `export function useMensajes()`.
Esto crea un patrón Singleton. Al haber un único estado reactivo en memoria:
- Si `DashboardPage` y un componente hijo cargan datos y ambos usan el composable, el último en terminar sobrescribirá la alerta del otro.
- Los mensajes "mágicamente" aparecen y desaparecen a lo largo de componentes no relacionados.

**Solución:** Mover la creación del objeto reactivo al interior de la función exportada para que cada invocación (componente) tenga su propia instancia de mensaje.

### Hallazgo Crítico 2: Soporte para 'Warning'
La aplicación soporta alertas tipo "warning" (las variables CSS como `--alert-warning-bg` existen en `style.css`), y el código las invoca ocasionalmente.
Sin embargo, el componente `Alertas.vue`:
1. No mapea `tipo: 'warning'` a ninguna clase de color en su computed `claseAlerta`.
2. No tiene un icono asignado (ej. `ExclamationTriangleIcon`) en la computed `iconoAlerta`.
3. Resultado: las alertas de advertencia se renderizan como texto plano sin estilos, asumiendo un fallback por defecto (a menudo rojo/error).

---

## Hallazgos Arquitectónicos (Nuevas Recomendaciones)

Durante la lectura del código surgieron patrones mejorables a nivel lógico:

### 1. Duplicación de Lógica de Side-Effects (Auto Completado de Pedidos)
En `DashboardPage.vue` L96, la app llama a `DashboardClient.autoCompletarPedidos(hoy)`.
En `ProduccionPage.vue` L170, la app *también* llama a este mismo método tras guardar una producción.
**Problema:** Genera múltiples peticiones a la base de datos redundantes, y mezcla la responsabilidad de side-effects de negocio con la renderización de la UI.
**Recomendación:** Como el frontend está asumiendo el rol del backend para autocompletar, la lógica debería ser invocada exclusivamente en el Client correspondiente tras registrar una transacción (ej. al finalizar `ProduccionClient.agregarProduccion`), y no delegarse a los componentes Vue.

### 2. Validaciones débiles de fechas
Existen comparadores de fechas que dependen del formato de string nativo de JavaScript, lo que podría generar bugs en cambios de zona horaria del cliente. 

---

## Hoja de Ruta de Implementación (Fase 12+)

A continuación, las tareas para implementar las soluciones de este diagnóstico. **Ninguna de estas se ha aplicado al código aún.**

### Fase 12 — Arreglo Crítico de Estado y Alertas
- [ ] Refactorizar `useMensajes.js` para mover `reactive({ tipo: null, texto: '' })` dentro de la función (Eliminar singleton).
- [ ] Actualizar `Alertas.vue` para soportar `tipo === 'warning'` (añadir lógica en `claseAlerta` e `iconoAlerta` usando `ExclamationTriangleIcon`).

### Fase 13 — Fix de Mutabilidad en Formularios
- [ ] En `RecetaForm.vue` (watcher de `clienteSeleccionado`), aplicar `structuredClone` (o equivalente) para evitar la mutación superficial de arreglos de materiales.

### Fase 14 — Refactor de Responsabilidades de Negocio
- [ ] Eliminar las llamadas sueltas a `DashboardClient.autoCompletarPedidos()` en componentes Vue.
- [ ] Integrar la llamada de autocompletar dentro de `ProduccionClient.js` al finalizar con éxito el guardado de una producción.
