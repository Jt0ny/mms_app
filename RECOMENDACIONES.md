# Revisión Completa y Recomendaciones — MMS App

> Revisión exhaustiva del proyecto Vue 3 + Vite + Supabase para gestión de producción florícola.
> Fecha: 2026-07-22

---

## Tabla de Contenidos

1. [Inconsistencias Prioritarias (Reportadas por el usuario)](#1-inconsistencias-prioritarias)
   - 1.1 Sincronizaciones deben igualarse al patrón de PedidoClient
   - 1.2 Eliminar botón "Sincronizar Clientes"
   - 1.3 Distribución equitativa en la planificación
2. [Centralización y Responsividad de Estilos](#2-centralización-y-responsividad-de-estilos)
3. [Bugs y Errores Detectados](#3-bugs-y-errores-detectados)
4. [Refactorizaciones de Código](#4-refactorizaciones-de-código)
5. [Arquitectura y Mejoras Estructurales](#5-arquitectura-y-mejoras-estructurales)
6. [Tabla Resumen de Prioridades](#6-tabla-resumen-de-prioridades)

---

## 1. Inconsistencias Prioritarias

### 1.1 ⚡ Las sincronizaciones deben igualarse al patrón de PedidoClient

**Problema:** El patrón de sincronización de `PedidoClient.sincronizarConSupabase()` es más eficiente (bulk/batch) que el usado por `MaterialClient` y `MateriaPrimaClient`, los cuales son más lentos porque:

| Archivo | Estrategia actual | Problema |
|---|---|---|
| [`PedidoClient.js`](file:///c:/Users/jtony/OneDrive/Escritorio/TESIS%20APP/mms_app/src/client/PedidoClient.js) | ✅ **Batch optimizado**: Obtiene catálogos en `Promise.all()`, crea maps en memoria, resuelve dependencias faltantes en bloques bulk, hace upsert masivo (solo 2-3 peticiones a Supabase) | — Referencia ideal — |
| [`MaterialClient.js`](file:///c:/Users/jtony/OneDrive/Escritorio/TESIS%20APP/mms_app/src/client/MaterialClient.js#L11-L67) | ⚠️ **Dos caminos divergentes**: Si `forceOverwrite=false`, hace SELECT + filtro + upsert solo nuevos. Si `forceOverwrite=true`, hace upsert masivo directo que **sobrescribe cantidades editadas manualmente** | Lento en modo seguro; destructivo en modo force |
| [`MateriaPrimaClient.js`](file:///c:/Users/jtony/OneDrive/Escritorio/TESIS%20APP/mms_app/src/client/MateriaPrimaClient.js#L11-L68) | ⚠️ **Mismo problema que MaterialClient**: Dos caminos con `forceOverwrite`, mismo riesgo de sobrescribir stock real | Lento + destructivo |

#### Paso a paso para igualar el patrón:

**Paso 1:** Refactorizar `MaterialClient.sincronizarConSupabase()`:

```js
// ANTES (actual) — dos caminos divergentes y lentos
async sincronizarConSupabase(forceOverwrite = false) {
  // ... obtiene datos externos
  if (!forceOverwrite) {
    // SELECT existentes → filtrar → upsert solo nuevos
  }
  // Si forceOverwrite: upsert completo sobrescribiendo TODO
}

// DESPUÉS (patrón PedidoClient) — eficiente y seguro
async sincronizarConSupabase() {
  const response = await axios.get(API_URL);
  const materialesExternos = response.data || [];
  if (materialesExternos.length === 0) return;

  // 1. Obtener catálogo existente en una sola consulta
  const { data: existentes } = await supabase
    .from('materiales').select('id, nombre, cantidad');

  const mapExistentes = new Map(
    (existentes || []).map(e => [String(e.id), e])
  );

  // 2. Separar: nuevos registros vs actualizaciones sin tocar stock
  const nuevos = [];
  const actualizaciones = [];

  for (const m of materialesExternos) {
    const idStr = String(m.id);
    const existente = mapExistentes.get(idStr);

    if (!existente) {
      // Registro nuevo: insertar con cantidad de la API
      nuevos.push({
        id: idStr,
        nombre: m.nombre,
        cantidad: m.cantidad ?? 0,
        descripcion: m.descripcion || null
      });
    } else if (existente.nombre !== m.nombre) {
      // Existente pero nombre cambió: actualizar solo metadata, NO stock
      actualizaciones.push({
        id: idStr,
        nombre: m.nombre,
        descripcion: m.descripcion || null
        // ⚠️ NO incluir 'cantidad' para no sobreescribir stock manual
      });
    }
  }

  // 3. Batch insert + batch update (máximo 2 peticiones)
  if (nuevos.length > 0) {
    await supabase.from('materiales').insert(nuevos);
  }
  if (actualizaciones.length > 0) {
    // Actualizar metadatos sin tocar cantidades
    for (const upd of actualizaciones) {
      await supabase.from('materiales')
        .update({ nombre: upd.nombre, descripcion: upd.descripcion })
        .eq('id', upd.id);
    }
  }
}
```

**Paso 2:** Aplicar el mismo patrón en `MateriaPrimaClient.sincronizarConSupabase()`:

```js
async sincronizarConSupabase() {
  const response = await axios.get(API_URL);
  const materiasPrimasExternas = response.data || [];
  if (materiasPrimasExternas.length === 0) return;

  // 1. Obtener catálogo existente
  const { data: existentes } = await supabase
    .from('materia_prima').select('id, variedad, cantidad_total');

  const mapExistentes = new Map(
    (existentes || []).map(e => [String(e.id), e])
  );

  // 2. Separar nuevos vs metadatos por actualizar
  const nuevos = [];

  for (const mp of materiasPrimasExternas) {
    const idStr = String(mp.id);
    if (!mapExistentes.has(idStr)) {
      nuevos.push({
        id: idStr,
        variedad: mp.variedad,
        cantidad_total: mp.cantidadTotal ?? mp.cantidad_total ?? 0,
        fecha_ingreso: mp.fecha || mp.fecha_ingreso || obtenerFechaHoy()
      });
    }
    // No actualizar stock de registros existentes
  }

  // 3. Insertar solo los nuevos (1 petición)
  if (nuevos.length > 0) {
    await supabase.from('materia_prima').insert(nuevos);
  }
}
```

**Paso 3:** Quitar el parámetro `forceOverwrite` de las páginas que lo usen:

- En [`MateriaPrimaPage.vue` L130](file:///c:/Users/jtony/OneDrive/Escritorio/TESIS%20APP/mms_app/src/pages/MateriaPrimaPage.vue#L130): Cambiar `sincronizarConSupabase(true)` → `sincronizarConSupabase()`
- En [`MaterialesPage.vue` L139](file:///c:/Users/jtony/OneDrive/Escritorio/TESIS%20APP/mms_app/src/pages/MaterialesPage.vue#L139): Cambiar `sincronizarConSupabase(true)` → `sincronizarConSupabase()`

---

### 1.2 🗑️ Eliminar botón "Sincronizar desde Pedidos" en ClientesPage

**Problema:** En [`ClientesPage.vue` L13-16](file:///c:/Users/jtony/OneDrive/Escritorio/TESIS%20APP/mms_app/src/pages/ClientesPage.vue#L13-L16) existe un botón "🔄 Sincronizar desde Pedidos" que ejecuta una lógica compleja de sincronización de clientes (L176-L279). Esta funcionalidad es redundante porque:

1. `PedidoClient.sincronizarConSupabase()` ya crea clientes automáticamente cuando detecta nombres faltantes (L52-L84)
2. `PedidoClient.agregarPedido()` también auto-genera clientes durante la carga de Excel (L351-L381)
3. La sincronización manual de clientes nunca debería ser necesaria si los pedidos ya manejan esto

#### Paso a paso para eliminarlo:

**Paso 1:** Eliminar el botón del template en `ClientesPage.vue`:

```diff
  <div class="header-actions">
-   <button class="btn btn-secondary btn-sync"
-     :disabled="sincronizando || cargando" @click="sincronizarManual"
-     title="Extraer nuevos clientes del historial de pedidos">
-     🔄 {{ sincronizando ? 'Sincronizando...' : 'Sincronizar desde Pedidos' }}
-   </button>
    <button class="btn btn-primary" @click="abrirNuevoFormulario">
      ➕ Nuevo Cliente
    </button>
  </div>
```

**Paso 2:** Eliminar la variable `sincronizando` de `data()`:

```diff
  data() {
    return {
      clientes: [],
      cargando: false,
-     sincronizando: false,
      guardando: false,
      ...
    }
  },
```

**Paso 3:** Eliminar todo el método `sincronizarManual()` (L176-L279):

```diff
- async sincronizarManual() { ... toda la función ... }
```

**Paso 4:** Eliminar el import de `PedidoClient` que ya no se usa:

```diff
  import ClientesClient from '../client/ClientesClient'
- import PedidoClient from '../client/PedidoClient'
```

**Paso 5:** Eliminar estilos del botón `.btn-sync` si existen estilos específicos.

---

### 1.3 📊 Distribución equitativa de la planificación

**Problema:** En [`PlanificacionAlgoritmo.js` L98-L124](file:///c:/Users/jtony/OneDrive/Escritorio/TESIS%20APP/mms_app/src/client/PlanificacionAlgoritmo.js#L98-L124), el algoritmo `distribuirEquitativamente()` usa una estrategia **Greedy Least-Loaded** que distribuye **por receta** (cada grupo de receta es indivisible). El problema es que si hay pocas recetas con muchos stems concentrados, la distribución puede ser muy desigual.

**Ejemplo del problema actual:**
- 3 operadores
- 2 recetas: Receta A = 5000 stems, Receta B = 500 stems
- Resultado: Operador 1 recibe 5000, Operador 2 recibe 500, Operador 3 recibe 0
- **La carga NO es equitativa** porque las recetas no se dividen

#### Paso a paso para mejorar la distribución:

**Paso 1:** Modificar `distribuirEquitativamente()` para dividir recetas entre operadores:

```js
/**
 * Algoritmo de distribución equitativa mejorado.
 * Divide los stems de cada receta proporcionalmente entre los operadores,
 * de modo que cada operador reciba una cantidad similar de stems totales.
 */
distribuirEquitativamente(operadores, gruposReceta) {
  if (!operadores.length || !gruposReceta.length) return [];

  const totalStemsGlobal = gruposReceta.reduce((s, g) => s + g.totalStems, 0);
  const numOperadores = operadores.length;
  const stemsPorOperador = Math.ceil(totalStemsGlobal / numOperadores);

  // Inicializar carga de cada operador
  const carga = operadores.map(op => ({
    operador: op,
    recetas: [],
    stemsTotal: 0
  }));

  // Ordenar recetas de mayor a menor stems para mejor distribución
  const recetasOrdenadas = [...gruposReceta].sort((a, b) => b.totalStems - a.totalStems);

  for (const grupo of recetasOrdenadas) {
    let stemsRestantes = grupo.totalStems;

    // Encontrar el operador con menos carga
    carga.sort((a, b) => a.stemsTotal - b.stemsTotal);
    const destino = carga[0];

    // Calcular cuánto le corresponde a este operador
    const stemsAsignar = Math.min(stemsRestantes, Math.max(
      1,
      stemsPorOperador - destino.stemsTotal
    ));

    // Si la receta cabe completa en un operador, asignarla completa
    if (stemsRestantes <= stemsPorOperador - destino.stemsTotal || stemsRestantes <= stemsPorOperador) {
      destino.recetas.push({
        recetaId: grupo.recetaId,
        nombre: grupo.nombre,
        cantidad: grupo.totalStems
      });
      destino.stemsTotal += grupo.totalStems;
    } else {
      // La receta es muy grande: dividirla entre operadores
      while (stemsRestantes > 0) {
        carga.sort((a, b) => a.stemsTotal - b.stemsTotal);
        const op = carga[0];
        const porción = Math.min(stemsRestantes, Math.max(1, stemsPorOperador - op.stemsTotal));
        const stemsParaEste = porción > 0 ? porción : stemsRestantes;

        op.recetas.push({
          recetaId: grupo.recetaId,
          nombre: grupo.nombre,
          cantidad: stemsParaEste
        });
        op.stemsTotal += stemsParaEste;
        stemsRestantes -= stemsParaEste;

        // Prevenir bucle infinito
        if (stemsParaEste <= 0) break;
      }
    }
  }

  // Filtrar operadores sin asignación
  return carga.filter(c => c.recetas.length > 0);
},
```

**Paso 2:** Verificar en [`PlanificacionPage.vue`](file:///c:/Users/jtony/OneDrive/Escritorio/TESIS%20APP/mms_app/src/pages/PlanificacionPage.vue#L286) que la llamada siga siendo compatible:

```js
// Esta llamada no cambia, la firma es la misma:
const dist = PlanificacionAlgoritmo.distribuirEquitativamente(operadores, gruposReceta)
```

**Paso 3:** Agregar un indicador visual de balance en [`PlanificacionResumen.vue`](file:///c:/Users/jtony/OneDrive/Escritorio/TESIS%20APP/mms_app/src/components/planificacion/PlanificacionResumen.vue):

Sería bueno mostrar al supervisor el porcentaje de carga de cada operador vs. el promedio. Por ejemplo:
```
Operador A: 2500 stems (33%) ✅ Balanceado
Operador B: 2500 stems (33%) ✅ Balanceado
Operador C: 2500 stems (34%) ✅ Balanceado
```

---

## 2. Centralización y Responsividad de Estilos

### 2.1 Estilos duplicados entre páginas

**Problema:** Hay un gran volumen de CSS duplicado entre las páginas. Cada página redefine las mismas clases con ligeras variaciones:

| Clase CSS | Duplicada en | Variaciones |
|---|---|---|
| `.page-content-wrap` | 8 páginas + `style.css` | `max-width` varía (1400px vs 1500px), `display` varía (flex vs grid) |
| `.page-header` | DashboardPage, MermasPage, ProduccionPage, ClientesPage | Básicamente idéntica en todas |
| `.page-title` | ClientesPage, DashboardPage, MermasPage, MaterialesPage, RecetasPage | `font-size`, `font-weight`, `margin` ligeramente diferentes |
| `.page-subtitle` | DashboardPage, ClientesPage, ProduccionPage | Idéntica en todas |
| `.btn` / `.btn-primary` / `.btn-secondary` | ClientesPage estilos locales | Debería ser global |
| `.main-layout` | MateriaPrimaPage, PedidoPage, MaterialesPage, MermasPage | Mismo grid pattern |
| `.left-panel` | MateriaPrimaPage, PedidoPage, MaterialesPage, MermasPage | Idéntica en todas |
| `.variety` / `.quantity` / `.date` | MateriaPrimaPage, PedidoPage, MaterialesPage | Idéntica en todas |
| `.msg-exito` / `.msg-error` / `.msg-info` | PlanificacionPage | Usa colores hardcoded vs variables CSS definidas |

#### Paso a paso para centralizar:

**Paso 1:** Agregar las clases globales reutilizables al final de [`style.css`](file:///c:/Users/jtony/OneDrive/Escritorio/TESIS%20APP/mms_app/src/style.css):

```css
/* =========================================
   PAGE HEADERS
   ========================================= */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.page-title {
  margin: 0 0 4px 0;
  font-size: clamp(20px, 3vw, 28px);
  color: var(--text-h);
  font-weight: 700;
  letter-spacing: -0.5px;
}

.page-subtitle {
  margin: 0;
  font-size: 14px;
  color: var(--text-light);
}

.header-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

/* =========================================
   BUTTONS (GLOBAL)
   ========================================= */
.btn {
  border: none;
  border-radius: 8px;
  padding: 10px 18px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--primary);
  color: white;
  box-shadow: var(--shadow-sm);
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-dark);
  transform: translateY(-1px);
}

.btn-secondary {
  background: var(--bg);
  border: 1px solid var(--border);
  color: var(--text);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--bg-secondary);
}

.btn-danger {
  background: var(--error);
  color: white;
}

.btn-danger:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* =========================================
   DATA DISPLAY UTILITIES
   ========================================= */
.text-variety {
  color: var(--text-h);
  font-weight: 600;
}

.text-quantity {
  color: var(--primary);
  font-weight: 700;
}

.text-date {
  color: var(--text-light);
  font-size: 13px;
}

.text-category {
  color: var(--text-h);
  font-weight: 600;
  text-transform: uppercase;
  font-size: 13px;
}

/* =========================================
   PAGE LAYOUTS
   ========================================= */
.main-layout-split {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}

.main-layout-split.with-preview {
  grid-template-columns: minmax(220px, 360px) 1fr;
}

.panel-column {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* =========================================
   ACTION BUTTONS (inline in tables)
   ========================================= */
.btn-action {
  border: none;
  border-radius: 6px;
  padding: 8px 10px;
  cursor: pointer;
  transition: 0.3s ease;
}

.btn-action:hover {
  transform: scale(1.05);
}

.btn-action-edit {
  background: #dbeafe;
}

.btn-action-delete {
  background: #fee2e2;
}

/* =========================================
   FEEDBACK MESSAGES
   ========================================= */
.msg-feedback {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  padding: 8px 12px;
  border-radius: 8px;
}

.msg-exito {
  background: var(--alert-success-bg);
  color: var(--alert-success-text);
}

.msg-error {
  background: var(--alert-error-bg);
  color: var(--alert-error-text);
}

.msg-info {
  background: var(--alert-info-bg);
  color: var(--alert-info-text);
}

/* =========================================
   RESPONSIVE BREAKPOINTS
   ========================================= */
@media (max-width: 768px) {
  .page-container {
    padding: 12px;
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-actions {
    flex-direction: column;
  }

  .main-layout-split,
  .main-layout-split.with-preview {
    grid-template-columns: 1fr;
  }
}
```

**Paso 2:** Eliminar las clases duplicadas de las secciones `<style scoped>` de cada página:

- [`MateriaPrimaPage.vue`](file:///c:/Users/jtony/OneDrive/Escritorio/TESIS%20APP/mms_app/src/pages/MateriaPrimaPage.vue#L224-L268): Eliminar `.main-layout`, `.left-panel`, `.variety`, `.quantity`, `.date`, responsive
- [`PedidoPage.vue`](file:///c:/Users/jtony/OneDrive/Escritorio/TESIS%20APP/mms_app/src/pages/PedidoPage.vue#L199-L245): Eliminar `.main-layout`, `.left-panel`, `.variety`, `.category`, `.quantity`, responsive
- [`MaterialesPage.vue`](file:///c:/Users/jtony/OneDrive/Escritorio/TESIS%20APP/mms_app/src/pages/MaterialesPage.vue#L276-L360): Eliminar `.page-content-wrap`, `.main-layout`, `.left-panel`, `.variety`, `.quantity`, `.btn-action`, responsive
- [`DashboardPage.vue`](file:///c:/Users/jtony/OneDrive/Escritorio/TESIS%20APP/mms_app/src/pages/DashboardPage.vue#L103-L184): Eliminar `.page-header`, `.page-title`, `.page-subtitle`, `.btn-refresh`
- [`ClientesPage.vue`](file:///c:/Users/jtony/OneDrive/Escritorio/TESIS%20APP/mms_app/src/pages/ClientesPage.vue#L285-L470): Eliminar `.page-header`, `.page-title`, `.page-subtitle`, `.header-actions`, `.btn`, `.btn-primary`, `.btn-secondary`
- [`MermasPage.vue`](file:///c:/Users/jtony/OneDrive/Escritorio/TESIS%20APP/mms_app/src/pages/MermasPage.vue#L309-L429): Eliminar `.page-header`, `.page-title`
- [`PlanificacionPage.vue`](file:///c:/Users/jtony/OneDrive/Escritorio/TESIS%20APP/mms_app/src/pages/PlanificacionPage.vue#L446-L530): Eliminar `.msg-exito`, `.msg-error`, `.msg-info`

**Paso 3:** Actualizar las clases en los templates para usar las clases globales:

```html
<!-- ANTES (en cada página) -->
<td class="variety">{{ item.variedad }}</td>
<td class="quantity">{{ item.cantidadTotal }}</td>

<!-- DESPUÉS (clase global) -->
<td class="text-variety">{{ item.variedad }}</td>
<td class="text-quantity">{{ item.cantidadTotal }}</td>
```

### 2.2 Responsividad inconsistente

**Problema:** Los breakpoints responsive son inconsistentes entre páginas:

| Página | Breakpoints | Problema |
|---|---|---|
| MateriaPrimaPage | `768px` | Solo un breakpoint |
| PedidoPage | `768px` | Solo un breakpoint |
| MaterialesPage | `768px` | Solo un breakpoint |
| ClientesPage | `568px`, `1024px`, `1200px` | 3 breakpoints, bien hecho |
| DashboardPage | `1024px` | Solo un breakpoint |
| ProduccionPage | `768px`, `1100px` | 2 breakpoints |
| PlanificacionPage | `768px`, `1100px` | 2 breakpoints |
| MermasPage | `1024px` | Solo un breakpoint |
| RecetasPage | `900px` | Solo un breakpoint |

#### Paso a paso para estandarizar:

**Paso 1:** Definir breakpoints estándar (ya existen como variables CSS):

```css
/* Ya definidos en style.css */
--bp-sm: 480px;    /* Móvil pequeño */
--bp-md: 768px;    /* Tablet portrait */
--bp-tablet: 1024px; /* Tablet landscape / Desktop pequeño */
```

**Paso 2:** Usar una convención consistente en todas las páginas:

```css
/* Siempre incluir al menos estos 3 breakpoints: */
@media (max-width: 1024px) { /* Tablet → columna única */ }
@media (max-width: 768px) { /* Mobile → padding reducido, headers en columna */ }
@media (max-width: 480px) { /* Mobile pequeño → ajustes de fuente/gap */ }
```

### 2.3 `page-content-wrap` redefinido en cada página

**Problema:** La clase `.page-content-wrap` ya existe en [`style.css` L195-L199](file:///c:/Users/jtony/OneDrive/Escritorio/TESIS%20APP/mms_app/src/style.css#L195-L199), pero cada página la redefine con scoped styles:

```css
/* style.css (global) */
.page-content-wrap {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
}

/* DashboardPage (scoped) - agrega display y gap */
.page-content-wrap {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* ClientesPage (scoped) - diferente max-width */
.page-content-wrap {
  max-width: 1500px; /* ← Diferente! */
  ...
}
```

**Paso a paso:**

**Paso 1:** Actualizar la definición global en `style.css`:

```css
.page-content-wrap {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}
```

**Paso 2:** Eliminar la redefinición de `.page-content-wrap` de los `<style scoped>` de cada página. Si `ClientesPage` necesita un `max-width` diferente, usar una clase modificadora:

```html
<div class="page-content-wrap page-content-wide">
```
```css
/* Solo en ClientesPage scoped */
.page-content-wide { max-width: 1500px; }
```

---

## 3. Bugs y Errores Detectados

### 3.1 🔴 Bug: PedidoPage usa clase CSS de otra página

**Archivo:** [`PedidoPage.vue` L2](file:///c:/Users/jtony/OneDrive/Escritorio/TESIS%20APP/mms_app/src/pages/PedidoPage.vue#L2)

```html
<div class="page-container materia-prima-page">
```

Usa la clase `materia-prima-page` en lugar de una clase propia como `pedido-page`. Esto es un copy-paste residual. Aunque con `scoped` styles no causa errores funcionales, es confuso para el mantenimiento.

**Corrección:**
```html
<div class="page-container pedido-page">
```

### 3.2 🔴 Bug: ProduccionClient hace consultas N+1 secuenciales

**Archivo:** [`ProduccionClient.js` L157-L212](file:///c:/Users/jtony/OneDrive/Escritorio/TESIS%20APP/mms_app/src/client/ProduccionClient.js#L157-L212)

En `agregarProduccion()`, para cada ingrediente de cada receta se hace una consulta `SELECT` individual seguida de un `UPDATE` individual para descontar stock:

```js
// ❌ ACTUAL: N+1 queries dentro de un loop
for (const rm of recetaElegida.receta_materia_prima) {
  const { data: stockMP } = await supabase           // SELECT 1
    .from('materia_prima').select('cantidad_total')
    .eq('id', rm.materia_prima_id).single();
  
  await supabase                                       // UPDATE 1
    .from('materia_prima')
    .update({ cantidad_total: nuevoStock })
    .eq('id', rm.materia_prima_id);
}
// Si hay 5 ingredientes = 10 queries secuenciales
```

**Corrección recomendada:**

```js
// ✅ MEJORADO: Batch queries
// 1. Obtener todo el stock en una sola consulta
const materiaPrimaIds = recetaElegida.receta_materia_prima.map(rm => rm.materia_prima_id);
const { data: stocksMP } = await supabase
  .from('materia_prima')
  .select('id, cantidad_total')
  .in('id', materiaPrimaIds);

const mapStock = new Map(stocksMP.map(s => [s.id, s.cantidad_total]));

// 2. Calcular nuevos stocks y preparar updates
const updates = [];
for (const rm of recetaElegida.receta_materia_prima) {
  const stockActual = mapStock.get(rm.materia_prima_id) || 0;
  const consumido = rm.cantidad * cantProducida;
  const nuevoStock = Math.max(0, stockActual - consumido);
  
  updates.push(
    supabase.from('materia_prima')
      .update({ cantidad_total: nuevoStock })
      .eq('id', rm.materia_prima_id)
  );
  
  consumosInsertar.push({ ... });
}

// 3. Ejecutar todas las actualizaciones en paralelo
await Promise.allSettled(updates);
```

### 3.3 🟡 Bug: `receta_materia_prima` no tiene mapping consistente en RecetaClient

**Archivo:** [`RecetaClient.js` L40-L58](file:///c:/Users/jtony/OneDrive/Escritorio/TESIS%20APP/mms_app/src/client/RecetaClient.js#L40-L58)

El `obtenerRecetas()` transforma los datos pero no incluye `materia_prima_id` ni `material_id` en los objetos mapeados:

```js
// Actual
materiaPrima: (item.receta_materia_prima || []).map(rmp => ({
  id: rmp.materia_prima?.id,        // ← Se usa como "id" genérico
  nombre: rmp.materia_prima?.variedad || '',
  variedad: rmp.materia_prima?.variedad || '',
  cantidad: rmp.cantidad
}))
```

Pero en [`MermasPage.vue` L257-L259](file:///c:/Users/jtony/OneDrive/Escritorio/TESIS%20APP/mms_app/src/pages/MermasPage.vue#L257-L259), se intenta acceder a `rm.materia_prima_id`:

```js
receta.materiaPrima.forEach(rm => materiaPrimaIds.add(
  rm.materia_prima_id || rm.materiaPrimaId || rm.id  // ← Fallback chain
))
```

Esto funciona por el fallback a `rm.id`, pero es frágil. 

**Corrección:** Agregar `materia_prima_id` y `material_id` al mapeo de `RecetaClient.obtenerRecetas()`:

```js
materiaPrima: (item.receta_materia_prima || []).map(rmp => ({
  id: rmp.materia_prima?.id,
  materia_prima_id: rmp.materia_prima?.id,  // ← Agregar
  nombre: rmp.materia_prima?.variedad || '',
  variedad: rmp.materia_prima?.variedad || '',
  cantidad: rmp.cantidad
})),
materiales: (item.receta_materiales || []).map(rm => ({
  id: rm.materiales?.id,
  material_id: rm.materiales?.id,  // ← Agregar
  nombre: rm.materiales?.nombre || rm.materiales?.descripcion || '',
  cantidad: rm.cantidad
})),
// También incluir los datos raw para descuento de stock:
receta_materia_prima: item.receta_materia_prima || [],
receta_materiales: item.receta_materiales || []
```

### 3.4 🟡 Bug: DashboardClient modifica datos (side effect en lectura)

**Archivo:** [`DashboardClient.js` L147-L242](file:///c:/Users/jtony/OneDrive/Escritorio/TESIS%20APP/mms_app/src/client/DashboardClient.js#L147-L242)

El método `obtenerDatosDashboard()` es supuestamente una lectura de datos, pero realiza **escrituras** en la base de datos:

```js
// L220-L224: ¡UPDATE dentro de un método "obtener"!
const { error: updateErr } = await supabase
  .from('pedidos')
  .update({ estado: 'Completado' })
  .in('id', idsParaCompletar)
```

**Riesgo:** Cada vez que se carga el Dashboard, se auto-completan pedidos como efecto secundario. Esto viola el principio de separación de responsabilidades y puede causar cambios de estado no esperados.

**Corrección recomendada:** Separar en dos métodos:

```js
// 1. Método de solo lectura
async obtenerDatosDashboard(fecha) { ... } // Sin updates

// 2. Método explícito para auto-completar
async autoCompletarPedidos(fecha) { ... } // Solo la lógica de update
```

Y llamarlos por separado desde `DashboardPage.vue`:

```js
async cargarDatosDashboard() {
  const datos = await DashboardClient.obtenerDatosDashboard(today)
  // ... asignar datos ...
  
  // Auto-completar como acción separada y explícita
  await DashboardClient.autoCompletarPedidos(today)
}
```

### 3.5 🟡 Bug: Campo duplicado en obtenerPedidos()

**Archivo:** [`PedidoClient.js` L254-L257](file:///c:/Users/jtony/OneDrive/Escritorio/TESIS%20APP/mms_app/src/client/PedidoClient.js#L254-L257)

```js
flatList.push({
  clienteFacturacion: item.cliente_facturacion?.nombre || '',
  cliente_facturacion: item.cliente_facturacion?.nombre || '',  // ← Duplicado!
  clienteEnvio: item.cliente_envio?.nombre || '',
  cliente_envio: item.cliente_envio?.nombre || '',              // ← Duplicado!
  ...
})
```

Se mantienen **ambas convenciones** (camelCase y snake_case) para el mismo dato. Esto genera confusión y obliga al código consumidor a usar fallbacks como `order.cliente_facturacion || order.clienteFacturacion`.

**Corrección:** Elegir una convención (idealmente `camelCase` para el frontend) y usarla consistentemente:

```js
flatList.push({
  clienteFacturacion: item.cliente_facturacion?.nombre || '',
  clienteEnvio: item.cliente_envio?.nombre || '',
  // Eliminar las versiones snake_case
})
```

### 3.6 🟢 Advertencia: Contraseñas en texto plano (hash SHA-256 sin salt)

**Archivo:** [`UsuarioClient.js` L5-L19](file:///c:/Users/jtony/OneDrive/Escritorio/TESIS%20APP/mms_app/src/client/UsuarioClient.js#L5-L19)

La contraseña se hashea con SHA-256 en el cliente (`crypto.js`), pero:
1. No usa **salt**, lo que la hace vulnerable a rainbow tables
2. El hash se compara directamente con `.eq('contrasena', hash)` — cualquier persona con acceso a la DB puede ver los hashes
3. La sesión se almacena en `sessionStorage` sin verificación del servidor

**Nota para la tesis:** Documentar que esta es una limitación de alcance del prototipo, y que en producción se usaría Supabase Auth con JWT tokens.

---

## 4. Refactorizaciones de Código

### 4.1 Código duplicado en PedidoClient: `sincronizarConSupabase()` vs `agregarPedido()`

**Archivo:** [`PedidoClient.js`](file:///c:/Users/jtony/OneDrive/Escritorio/TESIS%20APP/mms_app/src/client/PedidoClient.js)

Los métodos `sincronizarConSupabase()` (L15-L216) y `agregarPedido()` (L323-L490) comparten ~80% del código:
- Ambos obtienen catálogos con `Promise.all([ClientesClient, RecetaClient])`
- Ambos crean mapas de clientes y recetas
- Ambos detectan nombres faltantes y crean placeholders
- Ambos resuelven categorías a IDs de recetas
- Ambos hacen upsert/insert masivo

**Corrección recomendada:** Extraer la lógica compartida a métodos internos:

```js
export default {
  // ── Helpers internos ──
  async _obtenerCatalogos() {
    const [clientes, recetas] = await Promise.all([
      ClientesClient.obtenerClientes(),
      RecetaClient.obtenerRecetas()
    ]);
    return { clientes, recetas };
  },

  async _resolverClientesFaltantes(pedidos, mapClientes) {
    // Lógica de billNames/shipNames/missingClientNames...
    // Devuelve mapClientes actualizado
  },

  async _resolverRecetasFaltantes(pedidos, mapRecetas) {
    // Lógica de missingCategories/payloadRecetas...
    // Devuelve mapRecetas actualizado
  },

  // Los métodos públicos se simplifican a:
  async sincronizarConSupabase() {
    const { clientes, recetas } = await this._obtenerCatalogos();
    // ... usa los helpers ...
  },

  async agregarPedido(data) {
    const { clientes, recetas } = await this._obtenerCatalogos();
    // ... usa los helpers ...
  }
}
```

### 4.2 Lógica duplicada de queries en PlanificacionAlgoritmo

**Archivo:** [`PlanificacionAlgoritmo.js`](file:///c:/Users/jtony/OneDrive/Escritorio/TESIS%20APP/mms_app/src/client/PlanificacionAlgoritmo.js)

Los métodos `obtenerPedidosPendientesPorFecha()` (L11-L87) y `obtenerPedidosAgrupadosPorCategoria()` (L352-L440) hacen **la misma query** a Supabase con la misma estructura `select()`:

```js
// Ambos métodos hacen exactamente esta query:
const { data, error } = await supabase
  .from('pedidos')
  .select(`id, fecha_pedido, estado,
    cliente_facturacion:cliente_facturacion_id(nombre),
    pedido_detalles(stems, recetas(id, nombre, categoria))
  `)
  .lte('fecha_pedido', fecha)
  .eq('estado', 'Pendiente')
  .order('fecha_pedido', { ascending: true });
```

**Corrección:** Extraer la query a un método privado:

```js
async _obtenerPedidosPendientes(fecha) {
  const { data, error } = await supabase
    .from('pedidos')
    .select(`...`)
    .lte('fecha_pedido', fecha)
    .eq('estado', 'Pendiente')
    .order('fecha_pedido', { ascending: true });
  if (error) throw error;
  return data || [];
},
```

### 4.3 MermasPage tiene lógica de negocio compleja en el componente

**Archivo:** [`MermasPage.vue` L132-L213](file:///c:/Users/jtony/OneDrive/Escritorio/TESIS%20APP/mms_app/src/pages/MermasPage.vue#L132-L213)

El método `registrarMerma()` contiene ~80 líneas de lógica para:
1. Guardar la merma
2. Descontar stock de materiales
3. Descontar stock de materia prima
4. Descontar stock según receta (producto terminado)

**Corrección:** Mover esta lógica a `MermaClient.js` en un método `registrarMermaConDescuento()`:

```js
// MermaClient.js
async registrarMermaConDescuento(payload, { materiales, materiaPrima, recetas }) {
  const nuevaMerma = await this.agregarMerma(payload);
  
  // Lógica de descuento según tipo...
  
  return { nuevaMerma, stockActualizado };
}
```

---

## 5. Arquitectura y Mejoras Estructurales

### 5.1 Ausencia de manejo de errores centralizado

**Problema:** Cada página tiene su propio patrón de `try/catch` con mensajes de error ad hoc. No hay un manejador global de errores.

**Corrección recomendada:** Crear un composable `useErrorHandler.js`:

```js
// composables/useErrorHandler.js
export function useErrorHandler(mostrarMensaje) {
  async function ejecutarConError(fn, mensajeError, duracion = 4000) {
    try {
      return await fn();
    } catch (error) {
      console.error(error);
      mostrarMensaje('error', mensajeError, duracion);
      throw error; // re-throw para que el caller pueda manejarlo
    }
  }
  return { ejecutarConError };
}
```

### 5.2 Options API vs Composition API

**Estado actual:** Todo el proyecto usa **Options API** con `setup()` solo para composables.

**Recomendación para la tesis:** Documentar que se usó Options API por consistencia y facilidad de comprensión, y que la evolución natural sería migrar a `<script setup>` (Composition API nativa de Vue 3).

### 5.3 Archivos sueltos en la raíz

| Archivo | Acción |
|---|---|
| `db.json` (68KB) | Mover a `db/db.json` |
| `database_powerdesigner.sql` (9.6KB) | Mover a `db/database_powerdesigner.sql` |
| `database_supabase_uuid.sql` (12KB) | Mover a `db/database_supabase_uuid.sql` |
| `generarExcelEjemplo.js` (1.5KB) | Mover a `scripts/generarExcelEjemplo.js` |

### 5.4 Caché de catálogos repetidos

**Problema:** Múltiples páginas cargan los mismos catálogos (`RecetaClient.obtenerRecetas()`, `UsuarioClient.obtenerUsuarios()`, etc.) cada vez que se montan. Esto genera llamadas redundantes a Supabase.

**Corrección:** Crear un composable `useCatalogos.js` con caché en memoria:

```js
// composables/useCatalogos.js
import { ref } from 'vue'
import RecetaClient from '../client/RecetaClient'
import UsuarioClient from '../client/UsuarioClient'

const recetasCache = ref(null)
const usuariosCache = ref(null)

export function useCatalogos() {
  async function obtenerRecetas(forceRefresh = false) {
    if (!recetasCache.value || forceRefresh) {
      recetasCache.value = await RecetaClient.obtenerRecetas()
    }
    return recetasCache.value
  }

  async function obtenerOperadores(forceRefresh = false) {
    if (!usuariosCache.value || forceRefresh) {
      const todos = await UsuarioClient.obtenerUsuarios()
      usuariosCache.value = todos.filter(u => u.rol === 'operador')
    }
    return usuariosCache.value
  }

  function invalidar() {
    recetasCache.value = null
    usuariosCache.value = null
  }

  return { obtenerRecetas, obtenerOperadores, invalidar }
}
```

### 5.5 Sin validación de tipos en props

**Problema:** Varios componentes no validan completamente sus props. Por ejemplo, `PlanificacionOperadorCard` podría recibir datos malformados sin advertencia.

**Corrección:** Agregar validadores a las props críticas:

```js
props: {
  asig: {
    type: Object,
    required: true,
    validator: (value) => {
      return value.operador && Array.isArray(value.recetas)
    }
  }
}
```

---

## 6. Tabla Resumen de Prioridades

| # | Cambio | Impacto | Esfuerzo | Sección |
|---|---|---|---|---|
| 1.1 | Igualar sincronizaciones al patrón PedidoClient | 🔴 Alto | 🟡 1-2 hrs | §1.1 |
| 1.2 | Eliminar botón "Sincronizar Clientes" | 🔴 Alto | 🟢 15 min | §1.2 |
| 1.3 | Distribución equitativa en planificación | 🔴 Alto | 🟡 2-3 hrs | §1.3 |
| 2.1 | Centralizar estilos duplicados en `style.css` | 🟡 Medio | 🟡 1-2 hrs | §2.1 |
| 2.2 | Estandarizar breakpoints responsive | 🟡 Medio | 🟡 1 hr | §2.2 |
| 2.3 | Unificar `.page-content-wrap` | 🟡 Medio | 🟢 30 min | §2.3 |
| 3.1 | Fix clase CSS incorrecta en PedidoPage | 🟢 Bajo | 🟢 1 min | §3.1 |
| 3.2 | Fix N+1 queries en ProduccionClient | 🔴 Alto | 🟡 1 hr | §3.2 |
| 3.3 | Fix mapping inconsistente en RecetaClient | 🟡 Medio | 🟢 15 min | §3.3 |
| 3.4 | Separar side-effect de DashboardClient | 🟡 Medio | 🟡 45 min | §3.4 |
| 3.5 | Fix campos duplicados en obtenerPedidos | 🟢 Bajo | 🟢 10 min | §3.5 |
| 3.6 | Documentar limitación auth para tesis | 🟡 Medio | 🟢 10 min | §3.6 |
| 4.1 | Refactorizar código duplicado PedidoClient | 🟡 Medio | 🟡 1 hr | §4.1 |
| 4.2 | Refactorizar queries duplicadas PlanificacionAlgoritmo | 🟡 Medio | 🟢 30 min | §4.2 |
| 4.3 | Mover lógica de negocio de MermasPage a Client | 🟡 Medio | 🟡 45 min | §4.3 |
| 5.1 | Crear composable useErrorHandler | 🟢 Bajo | 🟢 20 min | §5.1 |
| 5.2 | Documentar decisión Options vs Composition API | 🟢 Bajo | 🟢 10 min | §5.2 |
| 5.3 | Mover archivos sueltos de la raíz | 🟢 Bajo | 🟢 5 min | §5.3 |
| 5.4 | Crear composable useCatalogos con caché | 🟡 Medio | 🟡 1 hr | §5.4 |
| 5.5 | Agregar validación de props | 🟢 Bajo | 🟡 30 min | §5.5 |

---

> **Nota:** Los cambios marcados como 🔴 Alto son los que el usuario reportó como prioritarios y los bugs que afectan rendimiento o integridad de datos. Se recomienda abordarlos en ese orden.
