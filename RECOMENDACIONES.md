# Revisión y Recomendaciones — MMS App

> Revisión del proyecto Vue 3 + Vite + Supabase para gestión de producción florícola.
> Fecha: 2026-07-08

---

## Estado General

El proyecto tiene una base sólida y funcional. Los componentes reutilizables (`InventoryTable`, `PreviewTable`, `Alertas`, `ButtonActions`) están bien implementados, la integración con Supabase es consistente, y los componentes están correctamente organizados por feature dentro de `components/`.

### ✅ Ya corregido en esta sesión

- [x] **Composable `useMensajes`**: Movido de `data()` a `setup()` en las 9 páginas.
- [x] **Composable simplificado**: Eliminado el nivel extra `state.mensaje`, ahora retorna `{ mensaje, mostrarMensaje }` directamente.
- [x] **`supabase.js` movido a `client/`**: Ya no está suelto en la raíz de `src/`.
- [x] **Imports de supabase corregidos**: `DashboardPage.vue` y `MermasPage.vue` actualizados a `'../client/supabase'`.

---

## 🔴 Problemas Críticos (Prioridad Alta)

### 1. `.env` no está en `.gitignore`

El archivo `.env` contiene la **Supabase Anon Key** y **no está excluido del repositorio**. Si este repo se ha subido a GitHub, la key está expuesta.

**Acción:**
1. Agregar `.env` al archivo `.gitignore`
2. Si el repo es público, rotar la key en el Dashboard de Supabase
3. Crear un archivo `.env.example` como plantilla:

```env
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=tu_url_aqui
VITE_SUPABASE_ANON_KEY=tu_key_aqui
```

### 2. Autenticación basada solo en `localStorage`

La autenticación del sistema guarda `rol`, `usuarioId` y `usuarioNombre` directamente en `localStorage`. Cualquier usuario puede manipular estos valores desde DevTools del navegador y acceder como supervisor sin credenciales.

El hash SHA-256 en `crypto.js` protege la contraseña al compararla, pero la sesión en sí no tiene verificación del servidor.

**Acción recomendada:**
- **Ideal:** Migrar a Supabase Auth para manejo de sesiones con tokens JWT.
- **Mínimo viable:** Documentar esta limitación en la tesis como una decisión de alcance.
- **Mejora intermedia:** Crear un composable `useAuth.js` que centralice la lógica de sesión dispersa en 6+ archivos.

### 3. Archivos que no pertenecen a la raíz del proyecto

| Archivo | Tamaño | Problema |
|---|---|---|
| `db.json` | 68 KB | Datos de prueba/mock sueltos |
| `database_supabase_uuid.sql` | 12 KB | Script SQL de base de datos |
| `generarExcelEjemplo.js` | 1.5 KB | Script utilitario |

**Acción:** Mover a carpetas dedicadas:
```
scripts/generarExcelEjemplo.js
db/database_supabase_uuid.sql
db/db.json
```

---

## 🟡 Estructura de Carpetas (Prioridad Media)

### Estructura Actual (Post-Correcciones)

```
mms_app/
├── .env                          ⚠️ Agregar a .gitignore
├── database_supabase_uuid.sql    ⚠️ Mover a db/
├── db.json                       ⚠️ Mover a db/
├── generarExcelEjemplo.js        ⚠️ Mover a scripts/
├── index.html
├── package.json
├── vite.config.js
│
└── src/
    ├── App.vue                   ✅
    ├── main.js                   ✅
    ├── style.css                 ✅
    │
    ├── assets/                   ✅
    │   ├── hero.png
    │   ├── vite.svg
    │   └── vue.svg
    │
    ├── client/                   ⚠️ Renombrar a services/
    │   ├── supabase.js           ✅ (ya movido aquí)
    │   ├── ClientesClient.js
    │   ├── MateriaPrimaClient.js
    │   ├── MaterialClient.js
    │   ├── MermaClient.js
    │   ├── PedidoClient.js
    │   ├── PlanificacionClient.js  ← 602 líneas, considerar dividir
    │   ├── ProduccionClient.js
    │   ├── RecetaClient.js
    │   └── UsuarioClient.js
    │
    ├── components/               ✅ Bien organizado por feature
    │   ├── Alertas.vue
    │   ├── ButtonActions.vue
    │   ├── CargaArchivo.vue
    │   ├── clientes/
    │   ├── dashboard/
    │   ├── layout/
    │   ├── login/
    │   ├── materiales/
    │   ├── mermas/
    │   ├── planificacion/
    │   ├── produccion/
    │   ├── recetas/
    │   ├── shared/
    │   └── usuarios/
    │
    ├── composables/              ✅ (ya corregido)
    │   └── useMensajes.js
    │
    ├── pages/                    ⚠️ Algunas páginas muy grandes
    │   ├── ClientesPage.vue
    │   ├── DashboardPage.vue       ← 443 líneas, lógica pesada
    │   ├── MateriaPrimaPage.vue
    │   ├── MaterialesPage.vue
    │   ├── MermasPage.vue
    │   ├── PedidoPage.vue          ← 480 líneas, lógica pesada
    │   ├── PlanificacionPage.vue
    │   ├── ProduccionPage.vue
    │   ├── PublicHomePage.vue
    │   ├── RecetasPage.vue
    │   └── UsuariosPage.vue
    │
    ├── router/                   ✅
    │   └── index.js                ← sin lazy loading
    │
    └── utils/                    ✅
        ├── crypto.js
        └── date.js
```

### Estructura Recomendada

```
mms_app/
├── .env.example                  🆕 Template sin valores sensibles
├── index.html
├── package.json
├── vite.config.js
│
├── db/                           🆕 Archivos de base de datos
│   ├── database_supabase_uuid.sql
│   └── db.json
│
├── scripts/                      🆕 Scripts utilitarios
│   └── generarExcelEjemplo.js
│
└── src/
    ├── App.vue
    ├── main.js
    ├── style.css
    │
    ├── assets/
    │
    ├── services/                 🔄 Renombrado de "client/"
    │   ├── supabase.js
    │   ├── ClientesService.js      (opcional renombrar *Client → *Service)
    │   ├── PedidoService.js
    │   └── ...
    │
    ├── components/               (sin cambios)
    │
    ├── composables/
    │   ├── useMensajes.js          ✅ Ya corregido
    │   └── useAuth.js              🆕 Centralizar lógica de sesión
    │
    ├── pages/
    │
    ├── router/
    │   └── index.js                Con lazy loading
    │
    └── utils/
```

---

## 🟡 Patrones de Código (Prioridad Media)

### 4. Renombrar `client/` → `services/`

La convención estándar en Vue es usar `services/` o `api/` para módulos que encapsulan llamadas al backend. `client/` es ambiguo (¿cliente HTTP? ¿lado del cliente?).

**Cambio:** Renombrar la carpeta y opcionalmente los archivos (`*Client.js` → `*Service.js`). Actualizar los imports en todas las páginas.

### 5. Queries directas a Supabase en las páginas

En `DashboardPage.vue` y `MermasPage.vue`, las queries de Supabase se hacen directamente en el componente en lugar de usar los servicios centralizados.

```js
// ❌ Actual en DashboardPage.vue
const { data: pedidosHoy } = await supabase
    .from('pedidos')
    .select('id, pedido_detalles(stems)')
    .eq('fecha_pedido', today)
```

**Acción:** Mover estas queries a los archivos `*Client.js` correspondientes para mantener la consistencia del patrón.

### 6. Páginas con demasiada lógica de negocio

| Página | Líneas | Problema principal |
|---|---|---|
| `PedidoPage.vue` | ~480 | Procesamiento Excel + sincronización de clientes |
| `DashboardPage.vue` | ~443 | ~280 líneas de cálculos en un solo método |
| `PlanificacionClient.js` | ~602 | Algoritmo greedy + CRUD + mapeo en un archivo |

**Acción:** Extraer lógica pesada a composables dedicados:
- `composables/usePedidoExcel.js` → procesamiento del archivo Excel
- `composables/useDashboardData.js` → cálculos del dashboard
- Dividir `PlanificacionClient.js` en CRUD + algoritmo

### 7. Crear composable `useAuth.js`

El manejo de sesión con `localStorage` está disperso en 6+ archivos:
- `router/index.js` (3 usos)
- `components/layout/NavBar.vue`
- `components/layout/SideBar.vue`
- `components/layout/MainLayout.vue`
- `pages/PublicHomePage.vue`
- `pages/ProduccionPage.vue`

```js
// composables/useAuth.js (propuesta)
import { computed } from 'vue'

export function useAuth() {
    const rol = computed(() => localStorage.getItem('rol'))
    const usuarioId = computed(() => localStorage.getItem('usuarioId'))
    const usuarioNombre = computed(() => localStorage.getItem('usuarioNombre'))
    const isLogged = computed(() => !!rol.value)

    function login(usuario) {
        localStorage.setItem('rol', (usuario.rol || '').toLowerCase())
        localStorage.setItem('usuarioId', usuario.id ?? '')
        localStorage.setItem('usuarioNombre', usuario.nombre ?? '')
    }

    function logout() {
        localStorage.removeItem('rol')
        localStorage.removeItem('usuarioId')
        localStorage.removeItem('usuarioNombre')
    }

    return { rol, usuarioId, usuarioNombre, isLogged, login, logout }
}
```

---

## 🟢 Mejoras Menores (Prioridad Baja)

### 8. Lazy loading de rutas

En `router/index.js`, todas las páginas se importan estáticamente. Para mejorar el tamaño del bundle inicial:

```js
// ❌ Actual
import PedidoPage from '../pages/PedidoPage.vue'

// ✅ Recomendado
const PedidoPage = () => import('../pages/PedidoPage.vue')
```

Esto resolvería el warning de Vite sobre chunks > 500 KB.

### 9. Estilos duplicados entre páginas

Las clases `.container`, `.content-wrap`, `.variety`, `.quantity` se repiten en múltiples páginas con CSS `scoped`. Se podrían mover a `style.css` como clases utilitarias globales de layout.

### 10. Colores hardcodeados en `Alertas.vue`

Los colores en `Alertas.vue` están hardcodeados (`#dcfce7`, `#15803d`, etc.) en lugar de usar las CSS custom properties ya definidas en `style.css` (`--success`, `--error`).

### 11. Options API vs Composition API

Todo el proyecto usa **Options API** (excepto `setup()` para composables). Para una tesis con Vue 3, se recomienda **Composition API** con `<script setup>`, que es el estándar oficial recomendado por Vue.

Si migrar todo no es viable, al menos documentar en la tesis que se usó Options API por consistencia y que Composition API sería la evolución natural.

---

## Tabla Resumen de Prioridades

| # | Cambio | Impacto | Esfuerzo |
|---|---|---|---|
| 1 | `.env` en `.gitignore` + `.env.example` | 🔴 Crítico | 🟢 5 min |
| 2 | Documentar limitación de auth | 🔴 Crítico | 🟢 10 min |
| 3 | Mover archivos sueltos de la raíz | 🟡 Medio | 🟢 15 min |
| 4 | Renombrar `client/` → `services/` | 🟡 Medio | 🟡 30 min |
| 5 | Mover queries del Dashboard a services | 🟡 Medio | 🟡 45 min |
| 6 | Extraer lógica pesada a composables | 🟡 Medio | 🟡 1-2 hrs |
| 7 | Crear `useAuth.js` composable | 🟡 Medio | 🟡 30 min |
| 8 | Lazy loading de rutas | 🟢 Bajo | 🟢 15 min |
| 9 | Centralizar estilos de página | 🟢 Bajo | 🟡 30 min |
| 10 | Usar CSS variables en Alertas | 🟢 Bajo | 🟢 10 min |
| 11 | Migrar a Composition API | 🟢 Bajo | 🔴 Proyecto aparte |
