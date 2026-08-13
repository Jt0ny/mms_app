# 🔐 Plan de Implementación RLS — Auditoría Completa de Seguridad

> **Proyecto:** mms_app (Gestión de Manufactura)  
> **Fecha de auditoría inicial:** 2026-08-11  
> **Última actualización:** 2026-08-12  
> **Alcance:** Row Level Security (RLS) en todas las tablas del schema `public`  
> **Excluido:** Funciones RPC (se auditarán por separado)

---

## Tabla de Contenidos

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Estado Actual de RLS](#2-estado-actual-de-rls)
3. [Arquitectura de Autenticación](#3-arquitectura-de-autenticación)
4. [Inventario de Tablas y Relaciones](#4-inventario-de-tablas-y-relaciones)
5. [Auditoría por Módulo](#5-auditoría-por-módulo)
6. [Auditoría por Tabla](#6-auditoría-por-tabla)
7. [Seguridad de Relaciones](#7-seguridad-de-relaciones)
8. [Riesgos Encontrados](#8-riesgos-encontrados)
9. [Decisión Arquitectónica — RESUELTA](#9-decisión-arquitectónica--resuelta)
10. [Políticas RLS Propuestas](#10-políticas-rls-propuestas)
11. [SQL de Implementación](#11-sql-de-implementación)
12. [Plan de Implementación](#12-plan-de-implementación)
13. [Plan de Pruebas](#13-plan-de-pruebas)
14. [Información Pendiente](#14-información-pendiente)

---

## 1. Resumen Ejecutivo

### Hallazgo Principal

> **⛔ CRÍTICO: Las 15 tablas del schema `public` tienen RLS DESHABILITADO y no existe ninguna política de seguridad.** Cualquier persona con la `anon key` de Supabase (visible en el frontend) puede leer, insertar, modificar y eliminar TODOS los registros de TODAS las tablas directamente, sin necesidad de autenticarse.

### Progreso de la Migración de Autenticación

> **✅ COMPLETADO: La aplicación fue migrada a Supabase Auth.** La autenticación ahora usa `supabase.auth.signInWithPassword()`, los usuarios están registrados en `auth.users`, y las funciones helper (`get_user_rol()`, `get_usuario_id()`) están desplegadas. **Los prerequisitos para habilitar RLS están listos.** Solo falta habilitar RLS en las tablas y crear las políticas.

### Estadísticas Actualizadas

| Métrica | Antes (2026-08-11) | Ahora (2026-08-12) |
|---|---|---|
| Tablas en `public` | 15 | 15 |
| Tablas con RLS habilitado | **0** | **0** ⚠️ |
| Políticas RLS existentes | **0** | **0** ⚠️ |
| Usuarios en `auth.users` | **0** | **3** ✅ |
| Usuarios en `public.usuarios` | 2 | 4 |
| Usuarios vinculados (`auth_user_id`) | 0 | **3 de 4** ✅ |
| Funciones helper RLS | 0 | **2** ✅ (`get_user_rol`, `get_usuario_id`) |
| Edge Functions | 0 | **1** ✅ (`create-user` optimizada) |
| Usa Supabase Auth | ❌ | ✅ |
| Usa `sessionStorage` | ✅ | ❌ (migrado a estado reactivo) |
| Roles de aplicación | `supervisor`, `operador` | `supervisor`, `operador` |

### Usuarios Registrados

| Nombre | Rol | Email | Vinculado a Auth | Contraseña Legacy |
|---|---|---|---|---|
| anthony | supervisor | dinaxa9309@primetor.com | ✅ | Sí (backup) |
| pedro | supervisor | growing.parrot.jobe@hidepost.net | ✅ | No |
| juan | operador | helpful.manatee.rbrp@hidepost.net | ✅ | No |
| ana | operador | — | ❌ **Sin vincular** | Sí (legacy) |

> **⚠️ NOTA:** La usuaria "ana" es un registro legacy sin vinculación a `auth.users`. No puede autenticarse con el sistema actual. Se recomienda eliminarla o migrarla manualmente.

---

## 2. Estado Actual de RLS

| # | Tabla | RLS Habilitado | Políticas | Filas | Estado |
|---|---|---|---|---|---|
| 1 | `usuarios` | ❌ NO | 0 | 4 | 🔴 Crítico |
| 2 | `clientes` | ❌ NO | 0 | 207 | 🔴 Crítico |
| 3 | `materia_prima` | ❌ NO | 0 | 95 | 🔴 Crítico |
| 4 | `materiales` | ❌ NO | 0 | 12 | 🔴 Crítico |
| 5 | `recetas` | ❌ NO | 0 | 10 | 🔴 Crítico |
| 6 | `receta_materiales` | ❌ NO | 0 | 4 | 🔴 Crítico |
| 7 | `receta_materia_prima` | ❌ NO | 0 | 4 | 🔴 Crítico |
| 8 | `pedidos` | ❌ NO | 0 | 208 | 🔴 Crítico |
| 9 | `pedido_detalles` | ❌ NO | 0 | 209 | 🔴 Crítico |
| 10 | `mermas` | ❌ NO | 0 | 2 | 🔴 Crítico |
| 11 | `producciones` | ❌ NO | 0 | 3 | 🔴 Crítico |
| 12 | `produccion_detalle` | ❌ NO | 0 | 8 | 🔴 Crítico |
| 13 | `produccion_consumos` | ❌ NO | 0 | 11 | 🔴 Crítico |
| 14 | `planificaciones` | ❌ NO | 0 | 2 | 🔴 Crítico |
| 15 | `planificacion_recetas` | ❌ NO | 0 | 17 | 🔴 Crítico |

---

## 3. Arquitectura de Autenticación

### ~~Flujo Anterior (Obsoleto)~~ → Flujo Actual ✅

```
LoginForm.vue
  → Toma email + contraseña del formulario
  → Llama UsuarioClient.login(email, password)
  → Supabase Auth: supabase.auth.signInWithPassword({ email, password })
  → Si autentica → SELECT id, nombre, rol FROM usuarios WHERE auth_user_id = authData.user.id
  → Almacena en estado reactivo (useAuth.js): { rol, usuarioId, usuarioNombre }
  → El router usa getRol() del estado reactivo para controlar acceso a rutas
  → Al refrescar la página: useAuth.inicializar() recupera sesión JWT persistente
```

### Flujo de Creación de Usuarios ✅

```
UsuarioForm.vue
  → Supervisor llena: nombre, email, contraseña, rol
  → UsuarioClient.agregarUsuario() → supabase.functions.invoke('create-user')
  → Edge Function verifica que el caller sea supervisor
  → Crea usuario en auth.users via supabaseAdmin.auth.admin.createUser()
  → Inserta registro en public.usuarios con auth_user_id vinculado
  → Si falla public.usuarios → rollback: elimina de auth.users
```

### Flujo de Eliminación de Usuarios ✅

```
UsuariosPage.vue
  → Supervisor hace clic en eliminar
  → UsuarioClient.eliminarUsuario(id) → supabase.from('usuarios').delete() (Trigger limpia auth.users)
  → Edge Function verifica que el caller sea supervisor
  → Elimina de auth.users y public.usuarios
```

### ~~Problemas de Seguridad del Flujo Anterior~~ → Estado Actual

| Problema Original | Severidad Original | Estado Actual |
|---|---|---|
| No usa Supabase Auth | 🔴 Crítico | ✅ **RESUELTO** — Usa `signInWithPassword()` |
| Contraseña expuesta en query | 🔴 Crítico | ✅ **RESUELTO** — Hash se maneja en auth.users |
| `anon key` sin restricciones | 🔴 Crítico | ⚠️ **PARCIALMENTE** — Auth protege pero RLS NO habilitado |
| Autorización solo en frontend | 🔴 Crítico | ⚠️ **PARCIALMENTE** — Router protege + Edge Functions validan roles, pero sin RLS en tablas |
| sessionStorage manipulable | 🟠 Alto | ✅ **RESUELTO** — Usa estado reactivo + JWT persistente |
| No hay tokens JWT con claims | 🔴 Crítico | ✅ **RESUELTO** — Supabase Auth emite JWT con `auth.uid()` |

### Roles Descubiertos

| Rol | Acceso en Router | Páginas |
|---|---|---|
| `supervisor` | Todas las páginas excepto Producción | Dashboard, Pedidos, Materia Prima, Materiales, Recetas, Planificación, Usuarios, Mermas, Clientes |
| `operador` | Solo Producción | ProduccionPage |

### Tabla `usuarios` — Estructura Actualizada

| Columna | Tipo | Nullable | Default | Estado |
|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | Original |
| `nombre` | `varchar` | NO | — | Original |
| `contrasena` | `varchar` | **SÍ** ✅ | — | **Modificado**: `DROP NOT NULL` (ya no obligatorio) |
| `rol` | `varchar` | NO | — | Original |
| `auth_user_id` | `uuid` (UNIQUE, FK → auth.users) | SÍ | — | **NUEVO** ✅ |
| `email` | `varchar` (UNIQUE) | SÍ | — | **NUEVO** ✅ |

---

## 4. Inventario de Tablas y Relaciones

### Diagrama de Relaciones

```
usuarios ──┬── mermas.operador_id
            ├── pedidos.operador_id
            ├── producciones.operador_id
            └── planificaciones.operador_id

clientes ──┬── clientes.cliente_facturacion_id (auto-referencia)
            ├── pedidos.cliente_facturacion_id
            └── pedidos.cliente_envio_id

recetas ───┬── receta_materiales.receta_id
            ├── receta_materia_prima.receta_id
            ├── pedido_detalles.receta_id
            ├── mermas.receta_id
            └── planificacion_recetas.receta_id

materiales ─┬── receta_materiales.material_id
             ├── mermas.material_id
             └── produccion_consumos.material_id

materia_prima ─┬── receta_materia_prima.materia_prima_id
                ├── mermas.materia_prima_id
                └── produccion_consumos.materia_prima_id

pedidos ──── pedido_detalles.pedido_id

producciones ─┬── produccion_detalle.produccion_id
               └── produccion_consumos.produccion_id

planificaciones ── planificacion_recetas.planificacion_id
```

### Resumen de Foreign Keys

| Tabla Hijo | Columna FK | Tabla Padre | Columna Referenciada |
|---|---|---|---|
| `clientes` | `cliente_facturacion_id` | `clientes` | `id` (auto-referencia) |
| `usuarios` | `auth_user_id` | `auth.users` | `id` (**NUEVO** ✅) |
| `mermas` | `operador_id` | `usuarios` | `id` |
| `mermas` | `material_id` | `materiales` | `id` |
| `mermas` | `materia_prima_id` | `materia_prima` | `id` |
| `mermas` | `receta_id` | `recetas` | `id` |
| `pedidos` | `cliente_facturacion_id` | `clientes` | `id` |
| `pedidos` | `cliente_envio_id` | `clientes` | `id` |
| `pedidos` | `operador_id` | `usuarios` | `id` |
| `pedido_detalles` | `pedido_id` | `pedidos` | `id` |
| `pedido_detalles` | `receta_id` | `recetas` | `id` |
| `planificaciones` | `operador_id` | `usuarios` | `id` |
| `planificacion_recetas` | `planificacion_id` | `planificaciones` | `id` |
| `planificacion_recetas` | `receta_id` | `recetas` | `id` |
| `producciones` | `operador_id` | `usuarios` | `id` |
| `produccion_detalle` | `produccion_id` | `producciones` | `id` |
| `produccion_consumos` | `produccion_id` | `producciones` | `id` |
| `produccion_consumos` | `materia_prima_id` | `materia_prima` | `id` |
| `produccion_consumos` | `material_id` | `materiales` | `id` |
| `receta_materiales` | `receta_id` | `recetas` | `id` |
| `receta_materiales` | `material_id` | `materiales` | `id` |
| `receta_materia_prima` | `receta_id` | `recetas` | `id` |
| `receta_materia_prima` | `materia_prima_id` | `materia_prima` | `id` |

---

## 5. Auditoría por Módulo

### 5.1 Módulo: Login / Autenticación ✅ MIGRADO

**Archivo:** `LoginForm.vue` → `UsuarioClient.js` → `useAuth.js`

| Aspecto | Detalle |
|---|---|
| **Tablas** | `usuarios`, `auth.users` (vía Supabase Auth) |
| **Operaciones** | `signInWithPassword` (login), `signOut` (logout), `getSession` (restaurar), `SELECT` (obtener datos app) |
| **Quién consulta** | Usuario que se autentica |
| **Quién inserta** | Supervisor (vía Edge Function `create-user`) |
| **Quién actualiza** | Nadie (no hay endpoint) |
| **Quién elimina** | Supervisor (vía RLS .delete() directo + Trigger PostgreSQL) |
| **Bloquear** | ⚠️ Con RLS: `SELECT` solo para autenticados; `INSERT`/`DELETE` bloqueados (se manejan vía Edge Functions con `service_role`) |
| **Estado** | ✅ Auth migrado, Edge Functions desplegadas. Pendiente: habilitar RLS en tabla `usuarios`. |

---

### 5.2 Módulo: Clientes

**Archivo:** `ClientesPage.vue` → `ClientesClient.js`

| Aspecto | Detalle |
|---|---|
| **Tablas** | `clientes` |
| **Operaciones** | `SELECT`, `INSERT`, `INSERT` masivo, `UPDATE`, `UPSERT`, `DELETE` |
| **Quién consulta** | Supervisor |
| **Quién inserta** | Supervisor (manual y masivo desde Excel) |
| **Quién actualiza** | Supervisor |
| **Quién elimina** | Supervisor |
| **Bloquear** | Operadores no deberían gestionar clientes; anónimos no deberían acceder |
| **Relaciones** | Auto-referencia (`cliente_facturacion_id` → `clientes.id`), referenciada por `pedidos` |
| **Riesgos** | 🔴 Sin RLS, un anónimo puede ver y modificar todos los datos de clientes |

---

### 5.3 Módulo: Materia Prima

**Archivo:** `MateriaPrimaPage.vue` → `MateriaPrimaClient.js` → `useInventario.js`

| Aspecto | Detalle |
|---|---|
| **Tablas** | `materia_prima` |
| **Operaciones** | `SELECT`, `INSERT` (carga masiva), `UPSERT` (sincronización API), `UPDATE` (stock) |
| **Quién consulta** | Supervisor, Operador (lectura para producción) |
| **Quién inserta/actualiza** | Supervisor (carga manual), Sistema (sincronización) |
| **Quién elimina** | Nadie (no hay endpoint de DELETE) |
| **Bloquear** | Anónimos; operadores no deberían modificar directamente |
| **Relaciones** | Referenciada por `receta_materia_prima`, `mermas`, `produccion_consumos` |
| **Riesgos** | 🔴 Un anónimo puede alterar cantidades de inventario |

---

### 5.4 Módulo: Materiales

**Archivo:** `MaterialesPage.vue` → `MaterialClient.js` → `useInventario.js`

| Aspecto | Detalle |
|---|---|
| **Tablas** | `materiales` |
| **Operaciones** | `SELECT`, `INSERT`, `UPSERT` (sincronización API), `UPDATE` (stock), `DELETE` |
| **Quién consulta** | Supervisor, Operador (lectura para producción) |
| **Quién inserta/actualiza** | Supervisor |
| **Quién elimina** | Supervisor |
| **Bloquear** | Anónimos; operadores no deberían modificar |
| **Relaciones** | Referenciada por `receta_materiales`, `mermas`, `produccion_consumos` |
| **Riesgos** | 🔴 Un anónimo puede alterar inventario de materiales |

---

### 5.5 Módulo: Recetas

**Archivo:** `RecetasPage.vue` → `RecetaClient.js`

| Aspecto | Detalle |
|---|---|
| **Tablas** | `recetas`, `receta_materiales`, `receta_materia_prima` |
| **Operaciones** | `SELECT` (con joins), `INSERT` (receta + detalles), `UPDATE` (receta + reemplazo detalles), `DELETE` (receta + detalles) |
| **Quién consulta** | Supervisor, Operador (lectura en producción) |
| **Quién inserta/actualiza/elimina** | Supervisor |
| **Bloquear** | Anónimos; operadores no deberían modificar recetas |
| **Relaciones** | Tabla padre de `receta_materiales` y `receta_materia_prima`; referenciada por `pedido_detalles`, `mermas`, `planificacion_recetas` |
| **Riesgos** | 🔴 Un anónimo puede crear, modificar o eliminar recetas completas |

---

### 5.6 Módulo: Pedidos

**Archivo:** `PedidoPage.vue` → `PedidoClient.js`

| Aspecto | Detalle |
|---|---|
| **Tablas** | `pedidos`, `pedido_detalles`, `clientes` (lectura), `recetas` (lectura/insert) |
| **Operaciones** | `SELECT` (con joins complejos), `INSERT`, `UPSERT` (sincronización API), `DELETE` (detalles antes de re-insert) |
| **Quién consulta** | Supervisor |
| **Quién inserta** | Supervisor (manual y sincronización) |
| **Quién actualiza** | Sistema (auto-completar pedidos en Dashboard) |
| **Quién elimina** | Nadie directamente (pero se borran detalles para reemplazar) |
| **Bloquear** | Anónimos; operadores no deberían gestionar pedidos directamente |
| **Relaciones** | `pedidos` → `clientes`, `pedidos` → `usuarios`, `pedido_detalles` → `pedidos` + `recetas` |
| **Riesgos** | 🔴 Un anónimo puede ver todos los pedidos con información de clientes, precios y estados |

---

### 5.7 Módulo: Producción

**Archivo:** `ProduccionPage.vue` → `ProduccionClient.js` → `useProduccionForm.js` → `usePlanificacionOperador.js`

| Aspecto | Detalle |
|---|---|
| **Tablas** | `producciones`, `produccion_detalle`, `produccion_consumos`, `materia_prima` (update stock), `materiales` (update stock), `recetas` (lectura), `planificaciones` (lectura) |
| **Operaciones** | `SELECT`, `INSERT` (producción + detalles + consumos), `UPDATE` (stocks de materia prima y materiales), `DELETE` (detalles al editar), `DELETE` (producción) |
| **Quién consulta** | Operador (sus producciones), Supervisor (dashboard) |
| **Quién inserta** | Operador |
| **Quién actualiza** | Operador (editar), Sistema (stocks) |
| **Quién elimina** | Operador (solo supervisado) |
| **Bloquear** | Anónimos; un operador no debería eliminar producciones de otro operador |
| **Relaciones** | `producciones` → `usuarios`, `produccion_detalle` → `producciones`, `produccion_consumos` → `producciones` + `materia_prima` + `materiales` |
| **Riesgos** | 🔴 Un operador podría modificar registros de producción de otro operador. Un anónimo puede insertar producciones ficticias. |

---

### 5.8 Módulo: Planificación

**Archivo:** `PlanificacionPage.vue` → `PlanificacionClient.js` → `PlanificacionAlgoritmo.js`

| Aspecto | Detalle |
|---|---|
| **Tablas** | `planificaciones`, `planificacion_recetas`, `pedidos` (lectura/update operador_id), `pedido_detalles` (lectura/delete/insert para remapeo), `recetas` (lectura) |
| **Operaciones** | `SELECT`, `INSERT` (planificación + recetas), `DELETE` (por fecha), `UPDATE` (pedidos.operador_id) |
| **Quién consulta** | Supervisor, Operador (su planificación del día) |
| **Quién inserta** | Supervisor (crea planificaciones masivas) |
| **Quién elimina** | Supervisor (borra planificaciones por fecha) |
| **Bloquear** | Anónimos; operadores no deberían crear/eliminar planificaciones |
| **Relaciones** | `planificaciones` → `usuarios`, `planificacion_recetas` → `planificaciones` + `recetas` |
| **Riesgos** | 🔴 Un anónimo puede crear planificaciones asignadas a cualquier operador |

---

### 5.9 Módulo: Mermas

**Archivo:** `MermasPage.vue` → `MermaClient.js`

| Aspecto | Detalle |
|---|---|
| **Tablas** | `mermas`, `materiales` (update stock), `materia_prima` (update stock) |
| **Operaciones** | `SELECT` (con joins), `INSERT`, `DELETE`, `UPDATE` (stocks) |
| **Quién consulta** | Supervisor |
| **Quién inserta** | Supervisor, Operador (via producción) |
| **Quién elimina** | Supervisor |
| **Bloquear** | Anónimos |
| **Relaciones** | `mermas` → `usuarios`, `materiales`, `materia_prima`, `recetas` |
| **Riesgos** | 🔴 Un anónimo puede registrar mermas ficticias y descontar inventario |

---

### 5.10 Módulo: Dashboard

**Archivo:** `DashboardPage.vue` → `DashboardClient.js`

| Aspecto | Detalle |
|---|---|
| **Tablas** | `pedidos` (lectura), `producciones` (lectura), `planificaciones` (lectura), `mermas` (lectura), `materia_prima` (lectura), `materiales` (lectura), `pedidos` (update estado) |
| **Operaciones** | `SELECT` múltiples (KPIs), `UPDATE` (auto-completar pedidos) |
| **Quién consulta** | Supervisor |
| **Quién actualiza** | Sistema (auto-completar pedidos) |
| **Bloquear** | Anónimos; operadores |
| **Riesgos** | 🔴 Un anónimo puede auto-completar pedidos cambiando su estado |

---

### 5.11 Módulo: Usuarios ✅ MIGRADO

**Archivo:** `UsuariosPage.vue` → `UsuarioClient.js` → DB API + Edge Function (`create-user`)

| Aspecto | Detalle |
|---|---|
| **Tablas** | `usuarios`, `auth.users` (vía Edge Functions) |
| **Operaciones** | `SELECT` (lista sin contraseña), `INSERT` (vía Edge Function), `DELETE` (vía Edge Function) |
| **Quién consulta** | Supervisor |
| **Quién inserta** | Supervisor (Edge Function valida rol server-side) ✅ |
| **Quién elimina** | Supervisor (Edge Function valida rol server-side) ✅ |
| **Bloquear** | Anónimos; operadores no deberían gestionar usuarios |
| **Riesgos** | 🟠 La tabla `usuarios` aún no tiene RLS. Un anónimo con la `anon key` podría hacer SELECT directamente (pero ya no ve contraseñas en el query normal). INSERT/DELETE se manejan vía Edge Functions con `service_role`. |

---

## 6. Auditoría por Tabla

### 6.1 `usuarios` — ✅ Estructura Actualizada

| Columna | Tipo | Operaciones Detectadas | Estado |
|---|---|---|---|
| `id` | uuid (PK) | SELECT, filtro en DELETE (vía Edge Function) | Original |
| `nombre` | varchar | SELECT, INSERT (vía Edge Function) | Original |
| `contrasena` | varchar (NULLABLE) | — (ya no se usa en login) | **Modificado** ✅ |
| `rol` | varchar | SELECT, INSERT (vía Edge Function) | Original |
| `auth_user_id` | uuid (UNIQUE, FK → auth.users) | SELECT (filtro eq en login) | **NUEVO** ✅ |
| `email` | varchar (UNIQUE) | SELECT, INSERT (vía Edge Function) | **NUEVO** ✅ |

**Operaciones por Cliente (Actualizadas):**
- `UsuarioClient.login()` → `supabase.auth.signInWithPassword()` + SELECT por `auth_user_id` ✅
- `UsuarioClient.logout()` → `supabase.auth.signOut()` ✅
- `UsuarioClient.getSession()` → `supabase.auth.getSession()` + SELECT por `auth_user_id` ✅
- `UsuarioClient.obtenerUsuarios()` → SELECT id, nombre, rol, email ✅
- `UsuarioClient.agregarUsuario()` → `supabase.functions.invoke('create-user')` ✅
- `UsuarioClient.eliminarUsuario()` → `supabase.from('usuarios').delete()` ✅ (Trigger borra en Auth)

---

### 6.2 `clientes`

| Columna | Tipo | Operaciones Detectadas |
|---|---|---|
| `id` | uuid (PK) | SELECT, filtro en UPDATE/DELETE |
| `nombre` | varchar (UNIQUE) | SELECT, INSERT, UPDATE, filtro |
| `tipo` | varchar | SELECT, INSERT, UPDATE |
| `cliente_facturacion_id` | uuid (FK → clientes.id) | SELECT, INSERT, UPDATE |
| `email` | varchar | SELECT, INSERT, UPDATE |
| `telefono` | varchar | SELECT, INSERT, UPDATE |
| `direccion` | varchar | SELECT, INSERT, UPDATE |
| `notas` | text | SELECT, INSERT, UPDATE |
| `creado_en` | timestamp | SELECT |

**Operaciones por Cliente:**
- `ClientesClient.obtenerClientes()` → SELECT con join self-ref
- `ClientesClient.agregarCliente()` → SELECT (buscar broker) + INSERT
- `ClientesClient.actualizarCliente()` → SELECT (buscar broker) + UPDATE
- `ClientesClient.eliminarCliente()` → DELETE
- `ClientesClient.agregarClientesMasivos()` → INSERT masivo
- `ClientesClient.upsertClientesMasivos()` → UPSERT masivo
- `ClientesClient.resolverClientesDePedidos()` → SELECT + INSERT/UPSERT (llamado desde PedidoClient)

---

### 6.3 `materia_prima`

| Columna | Tipo | Operaciones Detectadas |
|---|---|---|
| `id` | varchar (PK) | SELECT, filtro en UPDATE, IN |
| `variedad` | varchar (UNIQUE) | SELECT |
| `cantidad_total` | integer | SELECT, UPDATE, UPSERT |
| `fecha_ingreso` | date | SELECT, INSERT |

---

### 6.4 `materiales`

| Columna | Tipo | Operaciones Detectadas |
|---|---|---|
| `id` | varchar (PK) | SELECT, filtro en UPDATE/DELETE, IN |
| `nombre` | varchar (UNIQUE) | SELECT, INSERT |
| `cantidad` | integer | SELECT, UPDATE, INSERT |
| `descripcion` | varchar | SELECT, INSERT |

---

### 6.5 `recetas`

| Columna | Tipo | Operaciones Detectadas |
|---|---|---|
| `id` | uuid (PK) | SELECT, filtro en UPDATE/DELETE |
| `nombre` | varchar | SELECT, INSERT, UPDATE |
| `categoria` | varchar | SELECT, INSERT, UPDATE |
| `instrucciones` | varchar | SELECT, INSERT, UPDATE |
| `total_items` | integer | SELECT, INSERT, UPDATE |
| `fecha_creacion` | timestamp | SELECT, INSERT |

---

### 6.6 `receta_materiales`

| Columna | Tipo | Operaciones Detectadas |
|---|---|---|
| `receta_id` | uuid (PK, FK) | SELECT (join), INSERT, DELETE (filtro) |
| `material_id` | varchar (PK, FK) | SELECT (join), INSERT |
| `cantidad` | integer | SELECT, INSERT |
| `disponible_snapshot` | integer | — (no usado en código) |

---

### 6.7 `receta_materia_prima`

| Columna | Tipo | Operaciones Detectadas |
|---|---|---|
| `receta_id` | uuid (PK, FK) | SELECT (join), INSERT, DELETE (filtro) |
| `materia_prima_id` | varchar (PK, FK) | SELECT (join), INSERT |
| `cantidad` | integer | SELECT, INSERT |
| `disponible_snapshot` | integer | — (no usado en código) |

---

### 6.8 `pedidos`

| Columna | Tipo | Operaciones Detectadas |
|---|---|---|
| `id` | varchar (PK) | SELECT, filtro en UPDATE/DELETE/IN |
| `cliente_facturacion_id` | uuid (FK) | SELECT (join), INSERT, UPSERT |
| `cliente_envio_id` | uuid (FK) | SELECT (join), INSERT, UPSERT |
| `fecha_pedido` | date | SELECT, INSERT, filtro |
| `estado` | varchar | SELECT, UPDATE, filtro |
| `operador_id` | uuid (FK) | SELECT, UPDATE |
| `fecha_creacion` | timestamp | SELECT (order by) |
| `fecha_completado` | date | SELECT, UPDATE |

---

### 6.9 `pedido_detalles`

| Columna | Tipo | Operaciones Detectadas |
|---|---|---|
| `pedido_id` | varchar (PK, FK) | SELECT (join), INSERT, DELETE (filtro), IN |
| `receta_id` | uuid (PK, FK) | SELECT (join), INSERT |
| `stems` | integer | SELECT, INSERT |
| `cantidad` | integer | INSERT |
| `precio` | numeric | SELECT, INSERT |

---

### 6.10 `mermas`

| Columna | Tipo | Operaciones Detectadas |
|---|---|---|
| `id` | uuid (PK) | SELECT, DELETE (filtro) |
| `fecha` | date | SELECT, INSERT, filtro |
| `tipo` | varchar | SELECT, INSERT |
| `material_id` | varchar (FK) | SELECT (join), INSERT |
| `materia_prima_id` | varchar (FK) | SELECT (join), INSERT |
| `receta_id` | uuid (FK) | SELECT (join), INSERT |
| `cantidad` | integer | SELECT, INSERT |
| `motivo` | varchar | SELECT, INSERT |
| `operador_id` | uuid (FK) | SELECT (join), INSERT |
| `creado_en` | timestamp | SELECT (order by), INSERT |

---

### 6.11 `producciones`

| Columna | Tipo | Operaciones Detectadas |
|---|---|---|
| `id` | uuid (PK) | SELECT, DELETE (filtro) |
| `fecha` | date | SELECT, INSERT, filtro |
| `total` | integer | SELECT, INSERT, UPDATE |
| `operador_id` | uuid (FK) | SELECT (join), INSERT, filtro |
| `creado_en` | timestamp | SELECT |

---

### 6.12 `produccion_detalle`

| Columna | Tipo | Operaciones Detectadas |
|---|---|---|
| `produccion_id` | uuid (PK, FK) | SELECT (join), INSERT, DELETE (filtro) |
| `categoria` | varchar (PK) | SELECT, INSERT |
| `cantidad` | integer | SELECT, INSERT |

---

### 6.13 `produccion_consumos`

| Columna | Tipo | Operaciones Detectadas |
|---|---|---|
| `id` | uuid (PK) | — |
| `produccion_id` | uuid (FK) | INSERT |
| `tipo` | varchar | INSERT |
| `materia_prima_id` | varchar (FK) | INSERT |
| `material_id` | varchar (FK) | INSERT |
| `cantidad_consumida` | integer | INSERT |
| `creado_en` | timestamp | INSERT |

---

### 6.14 `planificaciones`

| Columna | Tipo | Operaciones Detectadas |
|---|---|---|
| `id` | uuid (PK) | SELECT |
| `operador_id` | uuid (FK) | SELECT, INSERT, filtro |
| `fecha` | date | SELECT, INSERT, filtro, DELETE (filtro) |
| `creado_en` | timestamp | SELECT, INSERT |

---

### 6.15 `planificacion_recetas`

| Columna | Tipo | Operaciones Detectadas |
|---|---|---|
| `planificacion_id` | uuid (PK, FK) | SELECT (join), INSERT |
| `receta_id` | uuid (PK, FK) | SELECT (join), INSERT |
| `cantidad` | integer | SELECT, INSERT |

---

## 7. Seguridad de Relaciones

### 7.1 Exposición Indirecta vía Joins

> **⚠️ IMPORTANTE:** Supabase PostgREST permite hacer queries con joins embebidos. Si una tabla tiene RLS pero la tabla relacionada no, los datos de la tabla sin RLS quedan expuestos a través del join.

| Relación | Riesgo |
|---|---|
| `pedidos` → `clientes` (join) | Si `pedidos` tiene RLS pero `clientes` no, los datos de clientes siguen accesibles directamente |
| `mermas` → `usuarios` (join) | Los nombres de operadores se exponen a través de mermas |
| `producciones` → `usuarios` (join) | Los nombres de operadores se exponen |
| `planificaciones` → `usuarios` (join) | Idem |
| `pedidos` → `pedido_detalles` → `recetas` (cadena) | Toda la cadena debe protegerse de forma coherente |

### 7.2 Relación Padre/Hijo — Consistencia

| Padre | Hijo | Riesgo si inconsistente |
|---|---|---|
| `recetas` | `receta_materiales`, `receta_materia_prima` | Si se protege `recetas` pero no los detalles, un atacante puede ver los ingredientes |
| `pedidos` | `pedido_detalles` | Si se protege `pedidos` pero no `pedido_detalles`, se exponen stems, precios y recetas |
| `producciones` | `produccion_detalle`, `produccion_consumos` | Los consumos quedan expuestos |
| `planificaciones` | `planificacion_recetas` | La asignación de recetas queda expuesta |
| `clientes` | `clientes` (self-ref) | La relación de facturación queda expuesta |

### 7.3 Operaciones que Cruzan Tablas

| Operación | Tablas Involucradas | Riesgo |
|---|---|---|
| `agregarProduccion` | `producciones`, `produccion_detalle`, `produccion_consumos`, `materia_prima`, `materiales`, `recetas`, `planificaciones` | Una transacción que toca 7 tablas — las políticas deben ser coherentes |
| `sincronizarConSupabase` (pedidos) | `pedidos`, `pedido_detalles`, `clientes`, `recetas` | Sincronización que escribe en 4 tablas |
| `registrarMermaConDescuento` | `mermas`, `materiales`, `materia_prima` | Escribe en 3 tablas |
| `autoCompletarPedidos` | `pedidos` (lectura + update) | Cambia estado de pedidos |

---

## 8. Riesgos Encontrados

### 🔴 Críticos — Pueden permitir acceso o modificación no autorizada

| # | Riesgo | Tabla(s) | Impacto | Estado |
|---|---|---|---|---|
| C1 | **Todas las tablas sin RLS** | Todas (15) | Cualquier persona con la `anon key` puede hacer CRUD completo en todas las tablas | ⚠️ **PENDIENTE** |
| C2 | ~~**Tabla `usuarios` expone contraseñas**~~ | `usuarios` | ~~`SELECT * FROM usuarios` devuelve los hashes SHA-256~~ | ✅ **MITIGADO** — Login ya no usa contraseña local; `obtenerUsuarios` ya no selecciona `contrasena`. Aún se podría hacer un SELECT directo sin RLS. |
| C3 | ~~**No se usa Supabase Auth**~~ | — | ~~`auth.uid()` no existe~~ | ✅ **RESUELTO** — Supabase Auth activo con `auth.uid()` disponible |
| C4 | ~~**Anónimo puede crear usuarios con rol supervisor**~~ | `usuarios` | ~~Atacante puede crear su propio admin~~ | ✅ **RESUELTO** — Creación vía Edge Function que valida rol server-side |
| C5 | **Anónimo puede modificar inventario** | `materia_prima`, `materiales` | Un atacante puede poner cantidades en 0 o valores arbitrarios | ⚠️ **PENDIENTE** — Requiere RLS |
| C6 | **Anónimo puede completar/cancelar pedidos** | `pedidos` | Un atacante puede cambiar el estado de todos los pedidos | ⚠️ **PENDIENTE** — Requiere RLS |
| C7 | **Anónimo puede eliminar datos** | Todas | Sin restricciones de DELETE en ninguna tabla | ⚠️ **PENDIENTE** — Requiere RLS |

### 🟠 Altos — Deben corregirse antes de producción

| # | Riesgo | Tabla(s) | Impacto | Estado |
|---|---|---|---|---|
| A1 | **Operador puede acceder a módulos de supervisor vía query directa** | Todas | El control de acceso tiene protección frontend (router) pero sin RLS no hay protección server-side para SELECT | ⚠️ **PENDIENTE** — Requiere RLS |
| A2 | **Operador puede modificar datos de otro operador** | `producciones`, `mermas` | No hay validación server-side de `operador_id` | ⚠️ **PENDIENTE** — Requiere RLS |
| A3 | **Exposición indirecta por joins** | Todas las relacionadas | Datos accesibles a través de relaciones no protegidas | ⚠️ **PENDIENTE** |
| A4 | ~~**sessionStorage manipulable**~~ | — | ~~Cambiar rol en DevTools~~ | ✅ **RESUELTO** — Sesión basada en JWT de Supabase Auth |
| A5 | **Usuario legacy "ana" sin vincular** | `usuarios` | Registro huérfano sin `auth_user_id` ni `email` | ⚠️ **NUEVO** — Limpiar o migrar |

### 🟡 Medios — Mejora importante de seguridad

| # | Riesgo | Tabla(s) | Impacto |
|---|---|---|---|
| M1 | **No hay auditoría de quién modificó qué** | Todas | Sin `updated_by` ni `created_by` en la mayoría de tablas |
| M2 | **Columna `disponible_snapshot` no usada** | `receta_materiales`, `receta_materia_prima` | Columnas sin uso que podrían confundir |
| M3 | **Columna `contrasena` legacy en `usuarios`** | `usuarios` | Ya no se usa pero sigue existiendo con datos legacy |

### 🟢 Bajos — Mejora recomendada

| # | Riesgo | Tabla(s) | Impacto |
|---|---|---|---|
| B1 | **IDs de materia_prima y materiales son varchar** | `materia_prima`, `materiales` | No usan UUID como el resto; menor consistencia |
| B2 | **Pedidos tienen PK varchar** | `pedidos`, `pedido_detalles` | IDs vienen de API externa; complejidad adicional |

---

## 9. Decisión Arquitectónica — RESUELTA

> **✅ DECIDIDO: Se adoptó la Opción A — Migrar a Supabase Auth.** La migración fue completada el 2026-08-12.

### Opción A: Migrar a Supabase Auth ✅ IMPLEMENTADA

**Descripción:** Crear usuarios en `auth.users` usando Edge Functions con `supabase.auth.admin.createUser()`, almacenar el rol en la tabla `usuarios` vinculada al `auth.users.id` vía `auth_user_id`, y usar `auth.uid()` + funciones helper en las políticas RLS.

**Lo que se implementó:**

| Componente | Estado | Detalle |
|---|---|---|
| Columna `auth_user_id` en `usuarios` | ✅ | FK → `auth.users(id)`, UNIQUE |
| Columna `email` en `usuarios` | ✅ | VARCHAR, UNIQUE |
| `contrasena` ya no obligatorio | ✅ | `DROP NOT NULL` |
| Función `get_user_rol()` | ✅ | Desplegada en BD |
| Función `get_usuario_id()` | ✅ | Desplegada en BD |
| Edge Function `create-user` | ✅ | v2, ACTIVE, valida rol supervisor |
| Trigger `on_user_deleted` | ✅ | Limpia auth.users tras borrado de public.usuarios |
| `LoginForm.vue` usa email | ✅ | `signInWithPassword()` |
| `useAuth.js` sin sessionStorage | ✅ | Estado reactivo + `inicializar()` con `getSession()` |
| `UsuarioClient.js` refactorizado | ✅ | Todos los métodos usan Supabase Auth / Edge Functions |
| `UsuarioForm.vue` con email | ✅ | Campos: nombre, email, contraseña, rol |
| Router con guard asíncrono | ✅ | `await inicializar()` antes de verificar roles |
| Supervisor vinculado a auth | ✅ | `anthony` → `dinaxa9309@primetor.com` |
| Usuarios nuevos creados vía Edge Function | ✅ | `juan` (operador), `pedro` (supervisor) |

**Ejemplo de política RLS con Supabase Auth (ahora funcional):**

```sql
-- Solo usuarios autenticados pueden leer clientes
CREATE POLICY "authenticated_select_clientes" ON clientes
  FOR SELECT TO authenticated
  USING (true);

-- Solo supervisores pueden modificar clientes
CREATE POLICY "supervisor_insert_clientes" ON clientes
  FOR INSERT TO authenticated
  WITH CHECK (public.get_user_rol() = 'supervisor');
```

---

## 10. Políticas RLS Propuestas

> **✅ Las políticas pueden implementarse ahora.** Los prerequisitos están listos: `auth.uid()` funciona, las funciones helper están desplegadas, y los usuarios están vinculados.

### Función Helper — ✅ YA DESPLEGADA

```sql
-- ✅ Ya existe en la BD
CREATE OR REPLACE FUNCTION public.get_user_rol()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT rol FROM public.usuarios WHERE auth_user_id = auth.uid();
$$;

-- ✅ Ya existe en la BD
CREATE OR REPLACE FUNCTION public.get_usuario_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT id FROM public.usuarios WHERE auth_user_id = auth.uid();
$$;
```

### Resumen de Políticas por Tabla

| Tabla | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `usuarios` | authenticated (sin contraseña) | — (vía Edge Function) | — (no hay endpoint) | — (vía Edge Function) |
| `clientes` | authenticated | supervisor | supervisor | supervisor |
| `materia_prima` | authenticated | authenticated | authenticated | DENY ALL |
| `materiales` | authenticated | authenticated | authenticated | supervisor |
| `recetas` | authenticated | supervisor | supervisor | supervisor |
| `receta_materiales` | authenticated | supervisor | — (delete+insert) | supervisor |
| `receta_materia_prima` | authenticated | supervisor | — (delete+insert) | supervisor |
| `pedidos` | authenticated | supervisor | authenticated | DENY ALL |
| `pedido_detalles` | authenticated | supervisor | — | supervisor |
| `mermas` | authenticated | authenticated | — (no hay endpoint) | supervisor |
| `producciones` | authenticated | authenticated | authenticated | supervisor |
| `produccion_detalle` | authenticated | authenticated | — | authenticated (solo propias) |
| `produccion_consumos` | authenticated | authenticated | — | DENY ALL |
| `planificaciones` | authenticated | supervisor | — | supervisor |
| `planificacion_recetas` | authenticated | supervisor | — | supervisor (via CASCADE) |

> **Nota sobre `usuarios`:** Las operaciones de INSERT y DELETE se manejan exclusivamente vía Edge Functions que usan `service_role` (bypass RLS). Por eso no se necesitan políticas de INSERT/DELETE para el rol `authenticated`. Solo se necesita SELECT para que los usuarios autenticados puedan ver la lista.

> **Nota sobre `materia_prima` y `materiales` INSERT/UPDATE:** Aunque la UI restringe estas operaciones al supervisor, el sistema (ProduccionClient) también actualiza stocks durante el registro de producción. Si el operador que registra producción necesita que el UPDATE funcione, la política debe permitir `authenticated` para UPDATE.

---

## 11. SQL de Implementación

> **✅ Este SQL puede ejecutarse ahora.** Los prerequisitos de autenticación están completos.

### ~~Paso 0: Prerequisito — Agregar columna de vínculo con Supabase Auth~~ ✅ YA COMPLETADO

```sql
-- ✅ YA EJECUTADO — No repetir
ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS auth_user_id uuid UNIQUE REFERENCES auth.users(id);
ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS email varchar UNIQUE;
ALTER TABLE public.usuarios ALTER COLUMN contrasena DROP NOT NULL;
```

### ~~Paso 1: Función Helper~~ ✅ YA COMPLETADO

```sql
-- ✅ YA EJECUTADO — No repetir
CREATE OR REPLACE FUNCTION public.get_user_rol() ...
CREATE OR REPLACE FUNCTION public.get_usuario_id() ...
```

### Paso 2: Habilitar RLS en todas las tablas ⚠️ PENDIENTE

```sql
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materia_prima ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materiales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recetas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receta_materiales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receta_materia_prima ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedido_detalles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mermas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.producciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produccion_detalle ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produccion_consumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planificacion_recetas ENABLE ROW LEVEL SECURITY;
```

### Paso 3: Políticas por Tabla ⚠️ PENDIENTE

#### 3.1 `usuarios`

```sql
-- SELECT: cualquier usuario autenticado puede ver la lista (sin contraseña)
-- Nota: la columna 'contrasena' no se selecciona en UsuarioClient.obtenerUsuarios()
-- pero un SELECT directo sí la mostraría. Evaluar crear VIEW.
CREATE POLICY "usuarios_select_authenticated"
  ON public.usuarios FOR SELECT
  TO authenticated
  USING (true);

-- INSERT/DELETE: NO se crean políticas.
-- Estas operaciones se manejan vía Edge Functions con service_role (bypass RLS).
```

#### 3.2 `clientes`

```sql
-- SELECT: todos los autenticados
CREATE POLICY "clientes_select_authenticated"
  ON public.clientes FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: solo supervisores
CREATE POLICY "clientes_insert_supervisor"
  ON public.clientes FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_rol() = 'supervisor');

-- UPDATE: solo supervisores
CREATE POLICY "clientes_update_supervisor"
  ON public.clientes FOR UPDATE
  TO authenticated
  USING (public.get_user_rol() = 'supervisor')
  WITH CHECK (public.get_user_rol() = 'supervisor');

-- DELETE: solo supervisores
CREATE POLICY "clientes_delete_supervisor"
  ON public.clientes FOR DELETE
  TO authenticated
  USING (public.get_user_rol() = 'supervisor');
```

#### 3.3 `materia_prima`

```sql
-- SELECT: todos los autenticados
CREATE POLICY "materia_prima_select_authenticated"
  ON public.materia_prima FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: autenticados (supervisor carga, sistema sincroniza)
CREATE POLICY "materia_prima_insert_authenticated"
  ON public.materia_prima FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE: autenticados (producción descuenta stock)
CREATE POLICY "materia_prima_update_authenticated"
  ON public.materia_prima FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- DELETE: nadie desde el frontend (no hay endpoint)
-- No se crea política de DELETE = bloqueado por defecto con RLS
```

#### 3.4 `materiales`

```sql
-- SELECT: todos los autenticados
CREATE POLICY "materiales_select_authenticated"
  ON public.materiales FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: autenticados (supervisor carga, sistema sincroniza)
CREATE POLICY "materiales_insert_authenticated"
  ON public.materiales FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE: autenticados (producción descuenta stock)
CREATE POLICY "materiales_update_authenticated"
  ON public.materiales FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- DELETE: solo supervisores
CREATE POLICY "materiales_delete_supervisor"
  ON public.materiales FOR DELETE
  TO authenticated
  USING (public.get_user_rol() = 'supervisor');
```

#### 3.5 `recetas`

```sql
-- SELECT: todos los autenticados
CREATE POLICY "recetas_select_authenticated"
  ON public.recetas FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: solo supervisores (incluye auto-generación desde PedidoClient)
CREATE POLICY "recetas_insert_supervisor"
  ON public.recetas FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_rol() = 'supervisor');

-- UPDATE: solo supervisores
CREATE POLICY "recetas_update_supervisor"
  ON public.recetas FOR UPDATE
  TO authenticated
  USING (public.get_user_rol() = 'supervisor')
  WITH CHECK (public.get_user_rol() = 'supervisor');

-- DELETE: solo supervisores
CREATE POLICY "recetas_delete_supervisor"
  ON public.recetas FOR DELETE
  TO authenticated
  USING (public.get_user_rol() = 'supervisor');
```

#### 3.6 `receta_materiales`

```sql
-- SELECT: todos los autenticados (joins desde recetas)
CREATE POLICY "receta_materiales_select_authenticated"
  ON public.receta_materiales FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: solo supervisores
CREATE POLICY "receta_materiales_insert_supervisor"
  ON public.receta_materiales FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_rol() = 'supervisor');

-- DELETE: solo supervisores (editarReceta borra y re-inserta)
CREATE POLICY "receta_materiales_delete_supervisor"
  ON public.receta_materiales FOR DELETE
  TO authenticated
  USING (public.get_user_rol() = 'supervisor');
```

#### 3.7 `receta_materia_prima`

```sql
-- SELECT: todos los autenticados
CREATE POLICY "receta_materia_prima_select_authenticated"
  ON public.receta_materia_prima FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: solo supervisores
CREATE POLICY "receta_materia_prima_insert_supervisor"
  ON public.receta_materia_prima FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_rol() = 'supervisor');

-- DELETE: solo supervisores
CREATE POLICY "receta_materia_prima_delete_supervisor"
  ON public.receta_materia_prima FOR DELETE
  TO authenticated
  USING (public.get_user_rol() = 'supervisor');
```

#### 3.8 `pedidos`

```sql
-- SELECT: todos los autenticados
CREATE POLICY "pedidos_select_authenticated"
  ON public.pedidos FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: solo supervisores (sincronización y carga)
CREATE POLICY "pedidos_insert_supervisor"
  ON public.pedidos FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_rol() = 'supervisor');

-- UPDATE: autenticados (auto-completar pedidos desde Dashboard, asignar operador_id)
CREATE POLICY "pedidos_update_authenticated"
  ON public.pedidos FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- DELETE: no se crea política (bloqueado por defecto)
```

#### 3.9 `pedido_detalles`

```sql
-- SELECT: todos los autenticados
CREATE POLICY "pedido_detalles_select_authenticated"
  ON public.pedido_detalles FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: solo supervisores
CREATE POLICY "pedido_detalles_insert_supervisor"
  ON public.pedido_detalles FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_rol() = 'supervisor');

-- DELETE: solo supervisores (reemplazo durante sincronización y remapeo)
CREATE POLICY "pedido_detalles_delete_supervisor"
  ON public.pedido_detalles FOR DELETE
  TO authenticated
  USING (public.get_user_rol() = 'supervisor');
```

#### 3.10 `mermas`

```sql
-- SELECT: todos los autenticados
CREATE POLICY "mermas_select_authenticated"
  ON public.mermas FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: autenticados (supervisor registra, operador podría registrar via producción)
CREATE POLICY "mermas_insert_authenticated"
  ON public.mermas FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- DELETE: solo supervisores
CREATE POLICY "mermas_delete_supervisor"
  ON public.mermas FOR DELETE
  TO authenticated
  USING (public.get_user_rol() = 'supervisor');
```

#### 3.11 `producciones`

```sql
-- SELECT: todos los autenticados
CREATE POLICY "producciones_select_authenticated"
  ON public.producciones FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: autenticados (operadores registran producción)
CREATE POLICY "producciones_insert_authenticated"
  ON public.producciones FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE: autenticados (editar producción)
-- Nota: si se quiere restringir a que solo el operador dueño pueda editar:
-- USING (operador_id = public.get_usuario_id() OR public.get_user_rol() = 'supervisor')
CREATE POLICY "producciones_update_authenticated"
  ON public.producciones FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- DELETE: solo supervisores
CREATE POLICY "producciones_delete_supervisor"
  ON public.producciones FOR DELETE
  TO authenticated
  USING (public.get_user_rol() = 'supervisor');
```

#### 3.12 `produccion_detalle`

```sql
-- SELECT: todos los autenticados
CREATE POLICY "produccion_detalle_select_authenticated"
  ON public.produccion_detalle FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: autenticados
CREATE POLICY "produccion_detalle_insert_authenticated"
  ON public.produccion_detalle FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- DELETE: autenticados (editar producción borra y re-inserta detalles)
CREATE POLICY "produccion_detalle_delete_authenticated"
  ON public.produccion_detalle FOR DELETE
  TO authenticated
  USING (true);
```

#### 3.13 `produccion_consumos`

```sql
-- SELECT: todos los autenticados
CREATE POLICY "produccion_consumos_select_authenticated"
  ON public.produccion_consumos FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: autenticados (se inserta durante el registro de producción)
CREATE POLICY "produccion_consumos_insert_authenticated"
  ON public.produccion_consumos FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- No se crea política de DELETE ni UPDATE (bloqueado por defecto)
-- Los consumos son registros históricos inmutables
```

#### 3.14 `planificaciones`

```sql
-- SELECT: todos los autenticados (operadores necesitan ver su planificación)
CREATE POLICY "planificaciones_select_authenticated"
  ON public.planificaciones FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: solo supervisores
CREATE POLICY "planificaciones_insert_supervisor"
  ON public.planificaciones FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_rol() = 'supervisor');

-- DELETE: solo supervisores
CREATE POLICY "planificaciones_delete_supervisor"
  ON public.planificaciones FOR DELETE
  TO authenticated
  USING (public.get_user_rol() = 'supervisor');
```

#### 3.15 `planificacion_recetas`

```sql
-- SELECT: todos los autenticados
CREATE POLICY "planificacion_recetas_select_authenticated"
  ON public.planificacion_recetas FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: solo supervisores
CREATE POLICY "planificacion_recetas_insert_supervisor"
  ON public.planificacion_recetas FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_rol() = 'supervisor');

-- DELETE: solo supervisores (eliminación de planificaciones)
CREATE POLICY "planificacion_recetas_delete_supervisor"
  ON public.planificacion_recetas FOR DELETE
  TO authenticated
  USING (public.get_user_rol() = 'supervisor');
```

---

## 12. Plan de Implementación

### Fase 0: Decisión Arquitectónica ✅ COMPLETADA

| # | Tarea | Estado |
|---|---|---|
| 0.1 | Decidir estrategia de autenticación | ✅ Opción A seleccionada |
| 0.2 | Migrar supervisor existente a `auth.users` | ✅ `anthony` vinculado |
| 0.3 | Agregar columnas `auth_user_id` y `email` a `public.usuarios` | ✅ Ejecutado |
| 0.4 | Modificar `LoginForm.vue` y `useAuth.js` para usar `supabase.auth.signInWithPassword()` | ✅ Implementado |
| 0.5 | Implementar Edge Function create-user y Trigger para eliminar | ✅ `create-user` (optimizada) y Trigger DB implementados |
| 0.6 | Refactorizar `UsuarioClient.js` para usar Edge Functions | ✅ Implementado |
| 0.7 | Eliminar dependencia de `sessionStorage` | ✅ Estado reactivo en `useAuth.js` |
| 0.8 | Agregar guard asíncrono al router | ✅ `await inicializar()` |
| 0.9 | Resolver doble logout (NavBar.vue) | ✅ Corregido |

### Fase 1: Preparación de Base de Datos — ✅ PARCIALMENTE COMPLETADA

| # | Tarea | Estado |
|---|---|---|
| 1.1 | Crear función `get_user_rol()` | ✅ Desplegada |
| 1.2 | Crear función `get_usuario_id()` | ✅ Desplegada |
| 1.3 | Crear VIEW `public.usuarios_safe` sin columna `contrasena` | ⚠️ **PENDIENTE** (recomendado) |
| 1.4 | Verificar que todos los FK y constraints están correctos | ⚠️ **PENDIENTE** |
| 1.5 | Limpiar usuario legacy "ana" (sin vincular a auth) | ⚠️ **PENDIENTE** |

### Fase 2: Habilitar RLS (Tablas de Catálogo) ⚠️ PENDIENTE

Empezar por las tablas más simples y menos riesgosas:

| # | Tarea | Tablas |
|---|---|---|
| 2.1 | Habilitar RLS + políticas en tablas de catálogo | `materia_prima`, `materiales` |
| 2.2 | Probar lectura y escritura desde la app | — |
| 2.3 | Habilitar RLS + políticas en recetas y detalles | `recetas`, `receta_materiales`, `receta_materia_prima` |
| 2.4 | Probar CRUD completo de recetas | — |

### Fase 3: Habilitar RLS (Tablas de Negocio) ⚠️ PENDIENTE

| # | Tarea | Tablas |
|---|---|---|
| 3.1 | Habilitar RLS + políticas en clientes | `clientes` |
| 3.2 | Habilitar RLS + políticas en pedidos | `pedidos`, `pedido_detalles` |
| 3.3 | Probar sincronización de pedidos | — |
| 3.4 | Habilitar RLS + políticas en producción | `producciones`, `produccion_detalle`, `produccion_consumos` |
| 3.5 | Probar flujo completo de producción con operador | — |

### Fase 4: Habilitar RLS (Tablas Restantes) ⚠️ PENDIENTE

| # | Tarea | Tablas |
|---|---|---|
| 4.1 | Habilitar RLS + políticas en planificación | `planificaciones`, `planificacion_recetas` |
| 4.2 | Habilitar RLS + políticas en mermas | `mermas` |
| 4.3 | Habilitar RLS + políticas en usuarios | `usuarios` |

### Fase 5: Verificación y Endurecimiento ⚠️ PENDIENTE

| # | Tarea |
|---|---|
| 5.1 | Ejecutar plan de pruebas completo (Sección 13) |
| 5.2 | Verificar que Dashboard funciona correctamente |
| 5.3 | Verificar que sincronización con APIs externas funciona |
| 5.4 | Revisar logs de Supabase para errores de permisos |
| 5.5 | Auditoría final: verificar que no quedan tablas sin RLS |

---

## 13. Plan de Pruebas

### 13.1 Pruebas de Acceso Anónimo

| # | Prueba | Resultado Esperado |
|---|---|---|
| T1 | `SELECT * FROM usuarios` con `anon key` | ❌ Error: no rows / permission denied |
| T2 | `SELECT * FROM clientes` con `anon key` | ❌ Error |
| T3 | `INSERT INTO usuarios (nombre, contrasena, rol) VALUES ('hacker', 'abc', 'supervisor')` con `anon key` | ❌ Error |
| T4 | `DELETE FROM pedidos` con `anon key` | ❌ Error |
| T5 | `UPDATE materia_prima SET cantidad_total = 0` con `anon key` | ❌ Error |

### 13.2 Pruebas de Usuario Autenticado — Supervisor

| # | Prueba | Resultado Esperado |
|---|---|---|
| T6 | Login como supervisor (`dinaxa9309@primetor.com`) | ✅ Sesión iniciada via `signInWithPassword` |
| T7 | `SELECT` en todas las tablas | ✅ Retorna datos |
| T8 | `INSERT` en `clientes` | ✅ Éxito |
| T9 | `UPDATE` en `clientes` | ✅ Éxito |
| T10 | `DELETE` en `clientes` | ✅ Éxito |
| T11 | `INSERT` en `recetas` + `receta_materiales` | ✅ Éxito |
| T12 | `INSERT` en `planificaciones` + `planificacion_recetas` | ✅ Éxito |
| T13 | `DELETE` en `planificaciones` | ✅ Éxito |
| T14 | Crear usuario via Edge Function `create-user` | ✅ Éxito |
| T15 | Eliminar usuario via Trigger (RLS de Supervisor) | ✅ Éxito (<< 200ms) |
| T16 | Auto-completar pedidos desde Dashboard | ✅ Éxito |

### 13.3 Pruebas de Usuario Autenticado — Operador

| # | Prueba | Resultado Esperado |
|---|---|---|
| T17 | Login como operador (`helpful.manatee.rbrp@hidepost.net`) | ✅ Sesión iniciada via `signInWithPassword` |
| T18 | `SELECT` en `recetas`, `planificaciones`, `materia_prima`, `materiales` | ✅ Retorna datos (lectura permitida) |
| T19 | `INSERT` en `producciones` | ✅ Éxito |
| T20 | `INSERT` en `produccion_detalle` | ✅ Éxito |
| T21 | `INSERT` en `produccion_consumos` | ✅ Éxito |
| T22 | `UPDATE` en `materia_prima` (descuento de stock) | ✅ Éxito |
| T23 | `INSERT` en `clientes` | ❌ Error (solo supervisor) |
| T24 | `INSERT` en `recetas` | ❌ Error (solo supervisor) |
| T25 | `INSERT` en `planificaciones` | ❌ Error (solo supervisor) |
| T26 | `DELETE` en `planificaciones` | ❌ Error (solo supervisor) |
| T27 | Crear usuario via Edge Function `create-user` | ❌ Error (Edge Function valida rol) |
| T28 | Eliminar usuario via Trigger | ❌ Error (RLS valida rol) |
| T29 | `DELETE` en `producciones` (ajena) | ❌ Error (solo supervisor) |
| T30 | `DELETE` en `mermas` | ❌ Error (solo supervisor) |

### 13.4 Pruebas de Acceso a Registros Ajenos

| # | Prueba | Resultado Esperado |
|---|---|---|
| T31 | Operador A intenta ver producción de Operador B | ✅ Visible (las producciones son de lectura compartida) |
| T32 | Operador A intenta editar producción de Operador B | Depende de la política elegida — ver nota en Sección 10, tabla `producciones` |
| T33 | Insertar merma con `operador_id` de otro usuario | ✅ Permitido actualmente — **evaluar si restringir** |
| T34 | Insertar producción con `operador_id` de otro usuario | ✅ Permitido actualmente — **evaluar si restringir** |

### 13.5 Pruebas de Relaciones Indirectas

| # | Prueba | Resultado Esperado |
|---|---|---|
| T35 | `SELECT` en `pedido_detalles` directamente (sin join por pedidos) | ✅ Visible para autenticados (los detalles por sí solos no exponen clientes) |
| T36 | `SELECT` en `produccion_consumos` directamente | ✅ Visible para autenticados (datos de consumo histórico) |
| T37 | `SELECT * FROM usuarios` incluyendo `contrasena` | ⚠️ RLS no filtra columnas — evaluar VIEW |

### 13.6 Pruebas de Integridad Transaccional

| # | Prueba | Resultado Esperado |
|---|---|---|
| T38 | Flujo completo de producción: insertar producción + detalles + consumos + actualizar stocks | ✅ Todas las operaciones exitosas |
| T39 | Flujo completo de receta: insertar receta + materiales + materia prima | ✅ Exitoso como supervisor |
| T40 | Sincronización de pedidos desde API externa | ✅ Exitoso como supervisor |
| T41 | Registro de merma con descuento de inventario | ✅ Exitoso como supervisor/operador |

---

## 14. Información Pendiente

> **⚠️ IMPORTANTE:** Los siguientes puntos requieren decisión o información adicional antes de implementar las políticas RLS.

| # | Información Requerida | Motivo | Impacto | Estado |
|---|---|---|---|---|
| P1 | ~~**¿Se adoptará Supabase Auth?**~~ | ~~Determina si `auth.uid()` está disponible~~ | ~~🔴 Bloqueante~~ | ✅ **RESUELTO** |
| P2 | **¿El operador puede editar/eliminar sus propias producciones?** | Si sí, la política de UPDATE/DELETE en `producciones` debe usar `operador_id = get_usuario_id()`. Si solo el supervisor puede, se restringe más. | 🟠 Afecta política | ⚠️ Pendiente |
| P3 | **¿El operador puede registrar mermas?** | En el código actual, `MermaClient.agregarMerma` acepta un `operador_id` pero MermasPage solo es accesible por supervisor en el router. ¿Debería un operador poder registrar mermas desde otro módulo? | 🟠 Afecta política | ⚠️ Pendiente |
| P4 | **¿Se debe restringir que un operador inserte producción con el `operador_id` de otro operador?** | Actualmente el frontend pasa el `operadorId` desde el estado de `useAuth`. Un atacante autenticado podría usar otro ID en una query directa. ¿Se debe forzar `operador_id = get_usuario_id()`? | 🟠 Afecta WITH CHECK | ⚠️ Pendiente |
| P5 | ~~**¿La columna `contrasena` debe seguir existiendo?**~~ | Con Supabase Auth, las contraseñas se manejan en `auth.users`. La columna es legacy. | 🟡 Limpieza | ⚠️ Pendiente (recomendado limpiar) |
| P6 | **¿Hay otros roles planificados además de `supervisor` y `operador`?** | Si hay planes de agregar `admin`, `gerente`, etc., las políticas deben diseñarse para escalar. | 🟡 Diseño futuro | ⚠️ Pendiente |
| P7 | **¿La sincronización con API externa (pedidos, materia prima, materiales) se ejecuta siempre como supervisor?** | Si se ejecuta como operador, las políticas de INSERT en `pedidos` y `recetas` bloquearían la sincronización. | 🟠 Afecta flujo | ⚠️ Pendiente |
| P8 | **¿Se necesita proteger `produccion_consumos` contra DELETE?** | Actualmente no hay endpoint de DELETE, pero si son registros históricos inmutables, no se debe crear política de DELETE. | 🟡 Buena práctica | ⚠️ Pendiente |
| P9 | **¿Qué hacer con la usuaria "ana" (legacy, sin vincular)?** | Tiene `auth_user_id = null` y no puede autenticarse. ¿Eliminar, migrar, o dejar como histórica? | 🟡 Limpieza | ⚠️ **NUEVO** |

---

> **Próximo paso:** Los prerequisitos de autenticación (Fase 0) están **completados**. Se puede proceder directamente con la **Fase 1.3–1.5** (limpieza) y luego **Fase 2** (habilitar RLS en tablas de catálogo) una vez que se resuelvan las preguntas pendientes P2–P4.
>
> **Fuera de alcance:** Funciones RPC (se auditarán por separado en una fase posterior).
