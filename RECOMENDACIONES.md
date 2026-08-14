# Plan de Trabajo Oficial — MMS App

> **Auditor:** Arquitecto de Software Senior
> **Fecha original:** 2026-07-22
> **Última auditoría:** 2026-08-13
> **Alcance:** Auditoría completa — código, estilos, comentarios, nomenclatura, mensajes, sincronización, Supabase, RLS

---

## Tabla de Contenidos

- [Resumen Ejecutivo](#resumen-ejecutivo)
- [Prioridad Crítica](#prioridad-crítica)
  - [C1 — RLS en Supabase (Implementado)](#c1--rls-en-supabase-implementado)
  - [C2 — Operaciones multi-tabla sin transaccionalidad](#c2--operaciones-multi-tabla-sin-transaccionalidad)
- [Prioridad Alta](#prioridad-alta)
  - [A1 — Mensaje de éxito al guardar usuarios no desaparece](#a1--mensaje-de-éxito-al-guardar-usuarios-no-desaparece)
  - [A2 — Inconsistencias de nomenclatura en el frontend](#a2--inconsistencias-de-nomenclatura-en-el-frontend)
  - [A3 — Sincronización de pedidos sin límite diario](#a3--sincronización-de-pedidos-sin-límite-diario)
  - [A4 — Colores hardcoded dispersos en estilos scoped](#a4--colores-hardcoded-dispersos-en-estilos-scoped)
- [Prioridad Media](#prioridad-media)
  - [M1 — Animación `.spin` duplicada en 5 componentes](#m1--animación-spin-duplicada-en-5-componentes)
  - [M2 — Comentarios `// Mapeo snake_case a camelCase` residuales](#m2--comentarios--mapeo-snake_case-a-camelcase-residuales)
  - [M3 — JSDoc redundante en clients](#m3--jsdoc-redundante-en-clients)
  - [M4 — `.badge-warning/success/danger` con colores hardcoded en style.css](#m4--badge-warningsuccessdanger-con-colores-hardcoded-en-stylecss)
  - [M5 — Race condition en sistema de caché](#m5--race-condition-en-sistema-de-caché)
  - [M6 — Colores hardcoded en UsuarioRol y UsuarioTablaActual](#m6--colores-hardcoded-en-usuariorol-y-usuariotablaactual)
  - [M7 — DashboardEstadoPedidos eliminar `.mms-table` local (resuelto)](#m7--dashboardestadopedidos-tabla-refactorizada)
- [Prioridad Baja](#prioridad-baja)
  - [B1 — Comentarios HTML `<!-- LAYOUT -->` residuales](#b1--comentarios-html----layout----residuales)
  - [B2 — Archivo muerto: `crypto.js`](#b2--archivo-muerto-cryptojs)
  - [B3 — Gradiente minor en ProduccionForm `.stat-card`](#b3--gradiente-minor-en-produccionform-stat-card)
  - [B4 — LoginForm define su propio `mostrarMensaje` local](#b4--loginform-define-su-propio-mostrarmensaje-local)
- [Supabase — Estructura y Seguridad](#supabase--estructura-y-seguridad)
- [Recomendaciones Anteriores](#recomendaciones-anteriores)
- [Hoja de Ruta Priorizada](#hoja-de-ruta-priorizada)

---

## Resumen Ejecutivo

La aplicación se encuentra en un estado de madurez alto. La arquitectura es sólida con una separación clara de capas (`client/`, `composables/`, `pages/`, `components/`, `utils/`), convenciones de nomenclatura mayoritariamente consistentes (camelCase en frontend, snake_case confinado a la capa `client/`), y un sistema de design tokens bien definido en `style.css`.

La auditoría de 2026-08-13 verificó las recomendaciones del documento anterior contra el código real, incorporó análisis de nomenclatura, comentarios, estilos, el bug de mensajes de usuario, la evaluación de sincronización diaria, y hallazgos nuevos.

**Cambios clave desde la última auditoría:**
- Se implementó **Supabase Auth** (reemplazando auth propia con hashing SHA256).
- Se creó una **Edge Function** (`create-user`) para creación segura de usuarios.
- Se creó un **trigger SQL** para limpiar `auth.users` al eliminar de `public.usuarios`.
- Se creó una función RPC `get_user_rol` para validación de permisos.
- La tabla `usuarios` ahora tiene columna `auth_user_id` y `email`.
- Se está implementando RLS (plan en `PLAN_IMPLEMENTACION_RLS.md`).
- `DashboardEstadoPedidos` fue refactorizado para usar clases globales `data-card-table`.
- Las variables CSS de warning (`--alert-warning-*`) fueron creadas en `style.css`.
- Los estilos duplicados de `RecetaMaterialesTabla`/`RecetaMateriaPrimaTabla` fueron extraídos a clases globales en `style.css`.
- `ProduccionRecetasView` unificó `.materiales-list`/`.materia-list` a `.ingrediente-list`.

| Prioridad | Cantidad | Enfoque principal |
|---|---|---|
| Crítica | 2 | Operaciones sin transaccionalidad (RLS ya fue implementado) |
| Alta | 4 | Bug de mensajes, nomenclatura, sincronización diaria, colores hardcoded |
| Media | 7 | Spin duplicado, comentarios, JSDoc, badges, caché, colores en UsuarioRol |
| Baja | 4 | Comentarios HTML, archivo muerto, gradiente minor, LoginForm local |

### Estado general del código

- **Manejo de errores:** Consistente. Todos los `Client` siguen el patrón `try/catch` → `{ success: false, error }`.
- **`console.error/warn`:** Se usan correctamente. No hay `console.log` de depuración sueltos.
- **Auth:** Migrada a Supabase Auth con Edge Function para creación de usuarios.
- **RLS:** Completado y habilitado en las 15 tablas.

---

## Prioridad Crítica

---

### C1 — RLS en Supabase (Implementado)

- **Estado:** ✅ Completado
- **Documentación:** `PLAN_IMPLEMENTACION_RLS.md`
- **Descripción:** RLS ya ha sido implementado y habilitado en las 15 tablas. La base de datos ahora está asegurada basándose en el rol del usuario (`supervisor` u `operador`). La migración a Supabase Auth ya se había completado exitosamente.

---

### C2 — Operaciones multi-tabla sin transaccionalidad

- **Estado:** 🔴 Pendiente
- **Operaciones afectadas:**

  | Operación | Client | Tablas | Queries |
  |---|---|---|---|
  | `agregarProduccion` | `ProduccionClient` | 7+ tablas | ~10 |
  | `registrarMermaConDescuento` | `MermaClient` | 2-4 tablas | 2-4 |
  | `resolverClientesDePedidos` | `ClientesClient` | `clientes` | 3-5 |
  | `sincronizarConSupabase` (pedidos) | `PedidoClient` | 3 tablas | ~5 |

- **Descripción:** `agregarProduccion` sigue siendo el caso más grave: toca 7+ tablas en ~10 queries secuenciales desde el frontend. Si falla a mitad de ejecución, los stocks quedan inconsistentes.
- **Propuesta:** Crear funciones RPC (`SECURITY DEFINER`) para las operaciones críticas.
- **Impacto:** Requiere refactorizar `ProduccionClient.js`, `MermaClient.js`, `ClientesClient.js`.

---

## Prioridad Alta

---

### A1 — Mensaje de éxito al guardar usuarios no desaparece

- **Estado:** 🔴 Pendiente
- **Prioridad:** 🔴 Alta
- **Archivos afectados:**
  - `src/components/usuarios/UsuarioForm.vue` (L57-60, L67, L87-96)
  - `src/pages/UsuariosPage.vue` (L11, L38)
  - `src/composables/useMensajes.js`
  - `src/components/Alertas.vue`

#### Problema encontrado

`UsuarioForm.vue` define su propio estado de mensaje **local** (`data() → mensaje: { tipo, texto }`) y lo asigna directamente con `this.mensaje = { tipo, texto }` (L67, L88, L95). Esto reemplaza el objeto reactivo completo por un objeto nuevo **sin temporizador de auto-limpieza**.

Al mismo tiempo, `UsuariosPage.vue` usa el composable `useMensajes()` que sí tiene `setTimeout` para auto-limpiar. Pero el componente `Alertas` que está dentro de `UsuarioForm` recibe el `mensaje` local del componente, no el del composable.

**Flujo del bug:**
1. Usuario llena el formulario y presiona "Guardar"
2. `UsuarioForm.guardar()` se ejecuta → llama a `UsuarioClient.agregarUsuario()`
3. Si `response.success` → `this.mensaje = { tipo: 'exito', texto: '...' }` (L88)
4. El `<Alertas :mensaje="mensaje" />` interno (L27) muestra el mensaje de éxito
5. **No hay `setTimeout`** que limpie `this.mensaje`, por lo que permanece visible indefinidamente
6. El mensaje solo desaparece si el usuario realiza otra acción que modifique `this.mensaje`

**Causa raíz:** `UsuarioForm` no usa `useMensajes()` sino un estado local reactivo sin temporizador. A diferencia de las demás páginas que usan `mostrarMensaje()` del composable (que sí incluye `setTimeout`).

#### Solución recomendada

**Opción A (Recomendada) — Agregar temporizador al estado local de UsuarioForm:**

Mantener el estado local en `UsuarioForm` (porque los mensajes son internos del formulario) pero agregar la lógica de auto-limpieza:

```javascript
// En UsuarioForm.vue methods:
mostrarMensaje(tipo, texto, duracion = 4000) {
    this.mensaje = { tipo, texto }
    if (duracion > 0) {
        clearTimeout(this._mensajeTimer)
        this._mensajeTimer = setTimeout(() => {
            this.mensaje = { tipo: null, texto: '' }
        }, duracion)
    }
}
```

Y reemplazar las asignaciones directas `this.mensaje = {...}` por llamadas a `this.mostrarMensaje(tipo, texto)`.

**Opción B — Migrar a `useMensajes()`:**

Eliminar el estado local y usar el composable global. Esto es más limpio pero tiene el efecto secundario de que los mensajes del formulario y los mensajes de la página se solaparían (porque ambos comparten el mismo estado singleton).

**Recomendación:** Opción A, porque `UsuarioForm` tiene su propio `<Alertas>` interno y sus mensajes son contextuales al formulario (validación de campos, éxito de guardado).

**Nota adicional:** `LoginForm.vue` tiene el mismo patrón (define `mostrarMensaje` local con `setTimeout`) y funciona correctamente. `UsuarioForm` es el único componente que asigna directamente sin temporizador.

#### ¿Es reutilizable para toda la app?

El composable `useMensajes()` ya es reutilizable y funciona correctamente en todas las páginas que lo usan. El problema es exclusivo de `UsuarioForm.vue` que no lo usa. No se necesita un sistema nuevo; solo alinear `UsuarioForm` al patrón existente.

---

### A2 — Inconsistencias de nomenclatura en el frontend

- **Estado:** 🔴 Pendiente
- **Prioridad:** 🔴 Alta

#### Hallazgos por categoría

**1. Mezcla inglés/español en nombres de métodos**

| Nombre actual | Ubicación | Nombre recomendado | Razón |
|---|---|---|---|
| `getCantidad()` | `RecetaMaterialesTabla.vue` L117, `RecetaMateriaPrimaTabla.vue` L114 | `obtenerCantidad()` | El resto de la app usa español: `obtenerMateriales`, `obtenerRecetas`, `obtenerPedidos`. `get` rompe la convención. |
| `getSession()` | `UsuarioClient.js` L37 | `obtenerSesion()` | Mismo caso, el resto usa español. |
| `getIsLogged()` | `useAuth.js` L73 | `estaAutenticado()` | Helper para router, pero inconsistente con convención española. |
| `getRol()` | `useAuth.js` L69 | `obtenerRol()` | Mismo caso. |
| `getInicializado()` | `useAuth.js` L77 | `estaInicializado()` | Mismo caso. |
| `handleCancelar` | `useProduccionForm.js` L191 | `cancelar` o `manejarCancelacion` | Mezcla `handle` (inglés) con `Cancelar` (español). |
| `applyEdicion` | `useProduccionForm.js` L117 | `aplicarEdicion` | `apply` es inglés. |
| `resetForm()` | `MaterialesPage.vue` L215 | `resetearFormulario()` | `RecetasPage.vue` ya usa `resetearFormulario()`. |

**2. Props con nombres inconsistentes**

| Prop actual | Componente | Inconsistencia |
|---|---|---|
| `loading` | `InventoryTable.vue`, `PreviewTable.vue` | Inglés. El resto de componentes usan `cargando` |
| `item-label` | `InventoryTable.vue`, `PreviewTable.vue` | Inglés. El resto usa español |
| `empty-text` | `InventoryTable.vue` | Inglés. Inconsistente con el resto |
| `confirm-text`, `loading-text` | `PreviewTable.vue` | Inglés. Inconsistente |
| `title` | `InventoryTable.vue` | Inglés. Aunque se podría argumentar que los componentes `shared/` usen inglés, no hay convención explícita |

**Nota:** Los componentes `shared/` (`InventoryTable`, `PreviewTable`) usan inglés en sus props, mientras que todo el resto de la app usa español. Si la convención es español, debería unificarse. Si se acepta que `shared/` use inglés como excepción de reutilización, debería documentarse.

**3. Inconsistencia en emits**

| Emit | Componente | Observación |
|---|---|---|
| `'guardado'` | `UsuarioForm.vue` | Correcto, español |
| `'guardar'` | `MermaForm.vue`, `RecetaForm.vue`, `MaterialForm.vue`, `ProduccionForm.vue` | Correcto |
| `'actualizar'` | `UsuarioTablaActual.vue`, Receta tablas | Correcto |
| `'alternar'` | `RecetaMaterialesTabla`, `RecetaMateriaPrimaTabla` | Correcto |
| `'cantidad'` | `RecetaMaterialesTabla`, `RecetaMateriaPrimaTabla` | Nombre ambiguo. `'cambiar-cantidad'` sería más expresivo |
| `'archivo-seleccionado'` | `CargaArchivo.vue` | Correcto, kebab-case |

**4. Variables locales con diferente nombre para el mismo concepto**

| Concepto | Nombre en A | Nombre en B | Recomendación |
|---|---|---|---|
| Estado de guardado | `guardando` (MermasPage) | `guardandoReceta` (RecetasPage) | Usar `guardando` consistentemente |
| Lista de producción | `editingProduccion` (ProduccionPage L106) | N/A | `produccionEnEdicion` para mantener español |
| Datos de API | `huboCambiosCli` (PedidoClient L92) | `huboCambios` (usePedidoExcel L108) | Unificar a `huboCambios` |

**Impacto:** Refactoring de ~30 líneas dispersas. Sin riesgo funcional si se hacen rename consistentes.

---

### A3 — Sincronización de pedidos sin límite diario

- **Estado:** 🔴 Pendiente (análisis)
- **Prioridad:** 🔴 Alta

#### Análisis del flujo actual

**¿Dónde se ejecuta?**
1. `PedidoPage.vue` → botón "Sincronizar" → `sincronizarAPI()` (L135-149)
2. `sincronizarAPI()` → `PedidoClient.sincronizarConSupabase()` (L139)
3. `MaterialesPage.vue` → botón "Sincronizar" → `useInventario.sincronizarAPI()` → `MaterialClient.sincronizarConSupabase()`
4. `MateriaPrimaPage.vue` → mismo flujo → `MateriaPrimaClient.sincronizarConSupabase()`

**¿Qué hace la sincronización de pedidos?**
1. Llama a `axios.get(VITE_API_PEDIDOS_URL)` — API externa en puerto 8060
2. Resuelve clientes nuevos via `ClientesClient.resolverClientesDePedidos()`
3. Resuelve recetas faltantes (crea recetas genéricas si la categoría no existe)
4. Hace `upsert` de pedidos y `delete + upsert` de detalles

**¿Cómo se determina la fecha?** La fecha viene de los datos del pedido externo. No hay registro de "última sincronización".

**¿Puede ejecutarse múltiples veces al día?** Sí, sin restricción. El `upsert` por ID hace que no se dupliquen pedidos, pero cada ejecución:
- Realiza consultas innecesarias a la API externa
- Ejecuta resolución de clientes y recetas (aunque no haya cambios)
- Borra y re-inserta detalles de pedidos existentes

**¿Existe un registro de última sincronización?** No. No hay campo, tabla ni localStorage que registre cuándo fue la última sincronización.

#### Alternativas evaluadas

| Alternativa | Pros | Contras | Viabilidad |
|---|---|---|---|
| **A. Frontend (localStorage)** | Implementación rápida, sin cambios en BD | Evitable limpiando localStorage, no comparte entre dispositivos | ⚠️ No confiable |
| **B. Supabase — tabla `sync_log`** | Registro permanente, compartido entre usuarios, auditable | Requiere tabla nueva y consulta adicional | ✅ Recomendada |
| **C. Supabase — campo en tabla existente** | Sin tabla nueva | No hay tabla lógica donde agregar el campo | ❌ Forzado |
| **D. Backend/Edge Function** | Control total server-side | Over-engineering para este caso | ⚠️ Solo si se necesitan más controles |

#### Solución recomendada: Opción B — Tabla `sync_log` en Supabase

**1. Crear tabla:**
```sql
CREATE TABLE sync_log (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tipo TEXT NOT NULL,        -- 'pedidos', 'materiales', 'materia_prima'
    fecha_sync DATE NOT NULL,
    ejecutado_por uuid REFERENCES usuarios(id),
    creado_en TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tipo, fecha_sync)   -- Solo una sync por tipo por día
);
```

**2. Flujo propuesto:**
1. Antes de sincronizar, consultar: `SELECT * FROM sync_log WHERE tipo = 'pedidos' AND fecha_sync = HOY`
2. Si existe un registro → mostrar mensaje: "La sincronización de pedidos ya se realizó hoy a las HH:MM. ¿Deseas sincronizar nuevamente?"
3. Si no existe → ejecutar la sincronización normalmente
4. Al completar exitosamente → insertar registro en `sync_log`

**3. Comportamiento si el usuario intenta sincronizar de nuevo:**
- Mostrar un diálogo de confirmación con la hora de la última sincronización
- Permitir forzar la re-sincronización si el usuario confirma (para casos excepcionales)
- Registrar cada sincronización para trazabilidad

**4. Archivos a modificar:**
- Crear `SyncLogClient.js` (nuevo) — CRUD de `sync_log`
- Modificar `useInventario.js` — verificar antes de sincronizar
- Modificar `PedidoPage.vue` → `sincronizarAPI()` — verificar antes de sincronizar
- Crear migración SQL para la tabla `sync_log`

**Impacto:** Moderado. 1 client nuevo, 2-3 archivos modificados, 1 tabla nueva.

---

### A4 — Colores hardcoded dispersos en estilos scoped

- **Estado:** 🟡 Parcialmente completado
- **Prioridad:** 🔴 Alta

**Recomendaciones anteriores resueltas:**
- ✅ `DashboardEstadoPedidos` ya usa `data-card-table` global (no `#1eab55`)
- ✅ Variables `--alert-warning-*` ya existen en `style.css` (L41-43)
- ✅ `RecetaMaterialesTabla`/`RecetaMateriaPrimaTabla` ya usan clases globales
- ✅ `PlanificacionOperadorCard.vue` y `PlanificacionResumen.vue` ya usan `var(--bg)`/`var(--bg-secondary)` en gradientes
- ✅ `ProduccionRecetasView.vue` unificó `.materiales-list`/`.materia-list` a `.ingrediente-list`
- ✅ `PlanificacionMapeoRecetas` status badges usan `var(--alert-warning-bg/text)` (L309-311)
- ✅ `ClienteList.vue` badges usan `var(--alert-info-bg)`, `var(--alert-warning-bg)` (L334-347)

**Pendientes:**

| Archivo | Línea | Color hardcoded | Propuesta |
|---|---|---|---|
| `UsuarioRol.vue` | L70, L74 | `#dcdcdc`, `#888` | → `var(--border)`, `var(--text-light)` |
| `UsuarioRol.vue` | L86 | `#dcdcdc` | → `var(--border)` |
| `UsuarioRol.vue` | L92-94 | `#2c7be5` | → `var(--alert-info-text)` o crear `--primary-alt` |
| `UsuarioTablaActual.vue` | L139 | `#64748b` | → `var(--text-light)` |
| `UsuarioTablaActual.vue` | L149-150 | `#1e293b` | → `var(--text-h)` |
| `LoginForm.vue` | L132 | `rgba(16, 185, 129, 0.12)` | → `var(--primary-bg)` |
| `style.css` | L473-488 | `.badge-warning/success/danger` hardcoded | → usar `var(--alert-*-bg/text/border)` |
| `ProduccionRecetasView.vue` | L245 | `var(--primary, #2f6fed)` | Eliminar fallback `#2f6fed` (la variable siempre existe) |

**Impacto:** ~12 líneas CSS. Sin riesgo funcional. Mejora dark mode.

---

## Prioridad Media

---

### M1 — Animación `.spin` duplicada en 5 componentes

- **Estado:** 🔴 Pendiente
- **Archivos afectados:**
  - `DashboardPage.vue` (L140-145)
  - `UsuarioTablaActual.vue` (L237-242)
  - `InventoryTable.vue` (definición local)
  - `RecetaMaterialesTabla.vue` (L73-78)
  - `PlanificacionAsignacion.vue` (definición local)
- **Descripción:** La clase `.spin` con `@keyframes spin` está definida en `style.css` (L842-846) como animación global. Sin embargo, 5 componentes la redefinen localmente en su `<style scoped>`.
- **Propuesta:** Eliminar las 5 definiciones locales de `.spin` y `@keyframes spin`. La definición global en `style.css` (L842-846) ya es suficiente.
- **Impacto:** Reduce ~30 líneas duplicadas. Sin riesgo funcional.

---

### M2 — Comentarios `// Mapeo snake_case a camelCase` residuales

- **Estado:** 🟡 Parcialmente completado
- **Archivos con comentarios eliminados:** `ClientesClient.js`, `MermaClient.js`, `ProduccionClient.js` ✅
- **Archivos pendientes:**
  - `RecetaClient.js` (L45, L127) — 2 instancias restantes
- **Propuesta:** Eliminar las 2 instancias restantes en `RecetaClient.js`.
- **Impacto:** 2 líneas.

---

### M3 — JSDoc redundante en clients

- **Estado:** 🟡 Parcialmente completado
- **JSDoc eliminados previamente:** `MaterialClient.js` (6 bloques) ✅
- **Pendientes:**

  | Archivo | Líneas | JSDoc redundante |
  |---|---|---|
  | `MateriaPrimaClient.js` | L8-10, L80-82, L108-111 | 3 bloques que repiten el nombre de la función |
  | `RecetaClient.js` | L4-7, L68-70 | 2 bloques que repiten el nombre |

- **JSDoc a CONSERVAR:**

  | Archivo | Líneas | Motivo |
  |---|---|---|
  | `PlanificacionAlgoritmo.js` | L100-102, L165-169, L278-280, L332-335, L554 | Estructuras complejas |
  | `PlanificacionClient.js` | L71-75 | Interfaz de API con constraint UNIQUE |
  | `MermaClient.js` | L164-167 | `registrarMermaConDescuento` — operación compleja |
  | `useAuth.js` | L1-7 | Contexto de uso |
  | `useInventario.js` | L4 (signature) | Contrato de interfaz |

- **Impacto:** ~15 líneas.

---

### M4 — `.badge-warning/success/danger` con colores hardcoded en style.css

- **Estado:** 🟡 Parcialmente completado
- **Archivo:** `style.css` (L473-489)
- **Descripción:** Los tokens `--alert-warning-*` ya fueron creados (L41-43) ✅, pero las clases `.badge-warning`, `.badge-success`, `.badge-danger` todavía usan hex hardcoded en lugar de las variables.
- **Propuesta:**
  ```css
  .badge-warning {
      background-color: var(--alert-warning-bg);
      color: var(--alert-warning-text);
      border: 1px solid var(--alert-warning-border);
  }
  .badge-success {
      background-color: var(--alert-success-bg);
      color: var(--alert-success-text);
      border: 1px solid var(--alert-success-border);
  }
  .badge-danger {
      background-color: var(--alert-error-bg);
      color: var(--alert-error-text);
      border: 1px solid var(--alert-error-border);
  }
  ```
- **Impacto:** ~9 líneas. Consistencia del sistema de tokens.

---

### M5 — Race condition en sistema de caché

- **Estado:** ⏳ Pendiente
- **Archivo:** `src/composables/useCatalogos.js`
- **Descripción:** El sistema de caché almacena el resultado (`res.data`) en lugar de la Promesa. Si dos componentes llaman a `obtenerRecetas()` simultáneamente, ambas ven el caché vacío y disparan peticiones HTTP duplicadas.
- **Propuesta:** Almacenar la Promesa (singleton promise pattern).
- **Impacto:** Optimización de red. Reduce peticiones duplicadas.

---

### M6 — Colores hardcoded en UsuarioRol y UsuarioTablaActual

- **Estado:** 🔴 Pendiente
- **Archivos:**
  - `UsuarioRol.vue` (L70, L74, L86, L92-94) — `#dcdcdc`, `#888`, `#2c7be5`
  - `UsuarioTablaActual.vue` (L139, L149-150) — `#64748b`, `#1e293b`
- **Descripción:** Estos componentes de la sección de usuarios usan colores hex directos en lugar de variables CSS. En dark mode, estos colores no se adaptan.
- **Propuesta:** Reemplazar por variables del sistema:
  - `#dcdcdc` → `var(--border)`
  - `#888` → `var(--text-light)`
  - `#2c7be5` → `var(--alert-info-text)` o `var(--primary)`
  - `#64748b` → `var(--text-light)`
  - `#1e293b` → `var(--text-h)`
- **Impacto:** ~7 líneas CSS.

---

### M7 — DashboardEstadoPedidos tabla refactorizada

- **Estado:** ✅ Completado
- **Verificación:** El componente ahora usa `data-card-table` global (L26, L56). Ya no existe `.mms-table` local ni `#1eab55`. Se eliminó el color hardcoded.

---

## Prioridad Baja

---

### B1 — Comentarios HTML `<!-- LAYOUT -->` residuales

- **Estado:** ⏳ Pendiente
- **Archivos:**
  - `RecetasPage.vue` (L12)
  - `PedidoPage.vue` (L12)
- **Descripción:** El comentario `<!-- LAYOUT -->` aparece en 2 archivos. Otros como `<!-- TÍTULO -->` y `<!-- ALERTAS -->` ya fueron eliminados.
- **Propuesta:** Eliminar para consistencia total.
- **Impacto:** 2 líneas.

---

### B2 — Archivo muerto: `crypto.js`

- **Estado:** 🔴 Pendiente
- **Archivo:** `src/utils/crypto.js`
- **Descripción:** La función `generarSHA256()` ya no se importa ni usa en ningún archivo del proyecto. Era usada para el hashing de contraseñas en el sistema de auth propio, que fue reemplazado por Supabase Auth.
- **Propuesta:** Eliminar `crypto.js`.
- **Impacto:** 1 archivo, 8 líneas.

---

### B3 — Gradiente minor en ProduccionForm `.stat-card`

- **Estado:** ⏳ Pendiente (observación)
- **Archivo:** `ProduccionForm.vue` (~L253)
- **Descripción:** `.stat-card` usa un gradiente con `rgba(255, 255, 255, ...)`. En dark mode sería un parche blanco sutil.
- **Impacto:** 1 línea CSS. Baja prioridad por impacto visual mínimo.

---

### B4 — LoginForm define su propio `mostrarMensaje` local

- **Estado:** ⏳ Observación (funciona correctamente)
- **Archivo:** `src/components/login/LoginForm.vue` (L42-49)
- **Descripción:** `LoginForm` define su propio `mostrarMensaje` con `setTimeout`. Esto funciona correctamente y es razonable porque el login es una pantalla aislada antes de la autenticación (no tiene acceso al layout principal). No requiere cambio, pero se documenta para referencia.

---

## Supabase — Estructura y Seguridad

### Estado actual (post-migración Auth)

- **Auth:** Migrada a Supabase Auth. Edge Function `create-user` para creación segura.
- **RPC:** `get_user_rol` — retorna el rol del usuario autenticado.
- **Triggers:** Trigger para eliminar `auth.users` al borrar de `public.usuarios`.
- **RLS:** Implementado y activo.
- **Tabla `usuarios`:** Ahora incluye `auth_user_id`, `email`. Ya no almacena `contrasena`.

### Propuesta RLS por tabla

Se mantiene la propuesta original documentada en `PLAN_IMPLEMENTACION_RLS.md`.

### Operaciones candidatas a RPC

| Operación | Client actual | Riesgo | Propuesta RPC |
|---|---|---|---|
| `agregarProduccion` | `ProduccionClient` | 🔴 7+ tablas, ~10 queries | `rpc_registrar_produccion(...)` |
| `registrarMermaConDescuento` | `MermaClient` | 🟠 2-4 queries | `rpc_registrar_merma(...)` |
| `resolverClientesDePedidos` | `ClientesClient` | 🟡 3-5 queries | `rpc_resolver_clientes_pedidos(...)` |
| `sincronizarConSupabase` (pedidos) | `PedidoClient` | 🟡 ~5 queries | `rpc_sincronizar_pedidos(...)` |

---

## Recomendaciones Anteriores

### Completadas (verificadas contra el código actual — auditoría 2026-08-13)

| ID | Recomendación | Verificación |
|---|---|---|
| A1 (prev) | Gradientes hardcoded en PlanificacionOperadorCard y PlanificacionResumen | ✅ Ambos usan `var(--bg)` y `var(--bg-secondary)` en gradientes |
| A2 (prev) | `background: white`/`#f8faf8` en recetas | ✅ Eliminado. Usan `var(--bg)` |
| A3 (prev) | Estilos CSS duplicados RecetaMaterialesTabla/RecetaMateriaPrimaTabla | ✅ Extraídos a clases globales en `style.css` (`.selection-panel`, `.selection-panel-header`, `.selection-table`, `.btn-refresh`, `.qty-input`) |
| A3 (prev) | Separadores decorativos `/* === */` | ✅ Eliminados. Patrón `// -- Sección --` adoptado |
| M1 (prev) | Bloque `else` vacío en MaterialClient | ✅ Eliminado |
| M2 (prev) | `sincronizarConSupabase` sin return en éxito | ✅ Retorna `{ success: true }` |
| M3 (prev) | Import `PlanificacionClient` muerto en MermasPage | ✅ Eliminado |
| M4 (prev) | `limpiarDatos` asigna reactive con `=` | ✅ Usa mutación directa |
| M5 (prev) | `.forEach` sobre objeto en `resolverClientesDePedidos` | ✅ Corregido |
| M7 (prev) | Evaluación de RecetaResumen | ✅ Evaluado, no requiere cambio |
| M3 (actual) | `DashboardEstadoPedidos` replica `.data-card-table` | ✅ Refactorizado para usar clase global |
| M5 (actual) | Duplicación `.materiales-list`/`.materia-list` en ProduccionRecetasView | ✅ Unificado a `.ingrediente-list` |
| B1 (prev) | Espacio faltante en RecetaMateriaPrimaTabla `Fecha:{{ }}` | ✅ Verificado: `Fecha: {{ item.fechaIngreso || '-' }}` tiene espacio correcto |
| B2 (prev) | Espacio faltante en RecetaResumen | ✅ Correcto |
| B3 (prev) | Espacio faltante en RecetaMaterialesTabla | ✅ Correcto |
| B4 (prev) | Comentario obsoleto en RecetasPage | ✅ Eliminado |
| B1-B6 (prev) | Todos completados | ✅ |
| N1-N12 (prev) | Todos completados | ✅ |
| B4 (actual) | RecetaResumen — evaluado, no requiere cambio | ✅ |

### Parcialmente completadas

| ID | Recomendación | Estado |
|---|---|---|
| A4 (actual) | Colores hardcoded dispersos | 🟡 ~60% completado. Quedan UsuarioRol, UsuarioTablaActual, LoginForm, badges en style.css |
| M2 (actual) | Comentarios `// Mapeo snake_case a camelCase` | 🟡 2 de 4 eliminados. Quedan 2 en RecetaClient.js |
| M3 (actual) | JSDoc redundante | 🟡 6 de ~15 eliminados. Quedan ~5 en MateriaPrimaClient y RecetaClient |
| M4 (actual) | Badge variables en style.css | 🟡 Variables creadas, pero clases aún usan hex |

### Descartadas (por decisión del usuario)

| ID | Recomendación | Motivo |
|---|---|---|
| M6 (prev) | Funciones de selección duplicadas en RecetasPage | Descartado — lógica similar pero contextos distintos |

### Ya no aplican

| ID | Recomendación | Motivo |
|---|---|---|
| N/A | Auth propia con SHA256 | 🚫 Migrado a Supabase Auth. `crypto.js` es ahora código muerto |
| C1 original | RLS deshabilitado sin auth | 🚫 Replanteado como C1 actual (en implementación con Supabase Auth) |

---

## Hoja de Ruta Priorizada

### Fase 1 — Seguridad: RPC (RLS Completado)

| # | Tarea | Esfuerzo | Estado |
|---|---|---|---|
| C1 | Completar implementación RLS (15 tablas) | N/A | ✅ Completado |
| C2 | Crear RPCs para operaciones multi-tabla | ~90 min | Pendiente |
| C2b | Refactorizar clients para usar RPCs | ~30 min | Pendiente |

### Fase 2 — Bugs y funcionalidad (Alta prioridad)

| # | Tarea | Esfuerzo | Líneas |
|---|---|---|---|
| A1 | Fix mensaje de usuario que no desaparece | 5 min | ~10 |
| A3 | Implementar límite de sincronización diaria | 30-45 min | ~80 (tabla + client + UI) |

### Fase 3 — Consistencia visual y nomenclatura (~20 min)

| # | Tarea | Esfuerzo | Líneas |
|---|---|---|---|
| A2 | Unificar nombres inglés/español | 10 min | ~30 |
| A4 | Reemplazar colores hardcoded restantes | 5 min | ~12 |
| M4 | Badges hardcoded → variables CSS | 2 min | ~9 |
| M6 | Colores en UsuarioRol/UsuarioTablaActual | 3 min | ~7 |

### Fase 4 — Limpieza de código (~10 min)

| # | Tarea | Esfuerzo | Líneas |
|---|---|---|---|
| M1 | Eliminar `.spin` duplicado en 5 componentes | 3 min | ~30 |
| M2 | Eliminar 2 comentarios mapeo en RecetaClient | 1 min | 2 |
| M3 | Eliminar ~5 bloques JSDoc redundantes | 3 min | ~15 |
| B2 | Eliminar `crypto.js` muerto | 1 min | 8 |
| B1 | Eliminar `<!-- LAYOUT -->` en 2 páginas | 1 min | 2 |

### Fase 5 — Optimización (cuando convenga)

| # | Tarea | Esfuerzo | Impacto |
|---|---|---|---|
| M5 | Singleton promise en useCatalogos | 15 min | Reduce peticiones duplicadas |
| B3 | Gradiente minor en ProduccionForm | 1 min | Cosmético |

### Estimación total

- **Fase 1 (Seguridad):** ~3 horas (depende de decisiones de arquitectura)
- **Fase 2 (Bugs):** ~45 minutos
- **Fases 3-4 (Limpieza):** ~30 minutos
- **Total limpieza:** ~75 min, ~200 líneas de mejoras
- **Total seguridad:** ~3h, refactorización de 3+ clients + SQL

**Resultado esperado:** Código con nomenclatura unificada, mensajes de éxito funcionales, sincronización controlada, CSS consistente con design tokens, sin código muerto, y seguridad RLS en Supabase.
