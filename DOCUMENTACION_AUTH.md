# Documentación: Migración a Supabase Auth y Edge Functions

Este documento detalla todos los cambios arquitectónicos, comandos y modificaciones de código realizados para migrar el sistema de autenticación de la aplicación desde un esquema local (basado en encriptación SHA-256 en el frontend) hacia el servicio profesional **Supabase Auth**.

## 1. Motivo de la Migración
El sistema anterior almacenaba las contraseñas hasheadas en la tabla pública `public.usuarios` y gestionaba las sesiones usando `sessionStorage`. Esto presentaba riesgos de seguridad e impedía la implementación de **Row Level Security (RLS)**, ya que Supabase necesita validar la identidad a nivel de base de datos mediante tokens JWT para aplicar reglas RLS.

---

## 2. Cambios en la Base de Datos (SQL)

Para vincular las identidades de Supabase Auth con los usuarios locales de la aplicación, se ejecutaron las siguientes consultas SQL a través de la API:

```sql
-- 1. Agregar columnas necesarias para la vinculación
ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS auth_user_id uuid UNIQUE REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS email varchar UNIQUE;

-- 2. Eliminar la restricción de contraseña local obligatoria (ya que ahora se gestionan en Supabase Auth)
ALTER TABLE public.usuarios ALTER COLUMN contrasena DROP NOT NULL;

-- 3. Crear funciones helper para su futuro uso en las políticas RLS
CREATE OR REPLACE FUNCTION public.get_user_rol()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT rol FROM public.usuarios WHERE auth_user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_usuario_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT id FROM public.usuarios WHERE auth_user_id = auth.uid();
$$;

-- 4. Vincular el supervisor manualmente creado en Supabase Auth con su registro existente
UPDATE public.usuarios
SET auth_user_id = (SELECT id FROM auth.users WHERE email = 'dinaxa9309@primetor.com'),
    email = 'dinaxa9309@primetor.com'
WHERE rol = 'supervisor';
```

---

## 3. Implementación de Edge Functions

Al crear usuarios desde el frontend usando `supabase.auth.signUp()`, Supabase cerraba automáticamente la sesión del Supervisor (quien estaba creando la cuenta) e iniciaba sesión como el nuevo Operador. Para solucionar este comportamiento (auto-login), implementamos **Edge Functions**.

Las Edge Functions se comunican con Supabase de forma segura, permitiendo el uso del `SUPABASE_SERVICE_ROLE_KEY` (permisos de administrador) en la nube, para registrar usuarios sin alterar la sesión del frontend.

### Despliegue y Solución de Problemas (CORS)

**Comandos Oficiales de Despliegue (Supabase CLI):**
Para desplegar o actualizar estas funciones en el futuro, se debe abrir una terminal en la **raíz del proyecto** (donde se encuentra la carpeta `supabase/`) y ejecutar los siguientes comandos:

```bash
# Despliega la función para crear usuarios
supabase functions deploy create-user --no-verify-jwt
```
*(Nota: Originalmente existía una función `delete-user`, pero fue reemplazada por un Trigger SQL de PostgreSQL para reducir la latencia de ~3000ms a ~50ms).*

**Despliegue realizado en nuestra sesión (API MCP):**
- Durante nuestro proceso de migración, se detectó que el equipo local no contaba con la interfaz de línea de comandos de Supabase (`Supabase CLI`) instalada. Para no interrumpir el flujo de trabajo, se utilizó una herramienta automatizada (MCP Tool) que se comunica directamente con la API REST de administración de Supabase (`deploy_edge_function`).
- Esto permitió compilar y subir el código fuente directamente desde los archivos locales hacia los servidores de Supabase en la región `us-west-2`.

**Solución al problema de rutas (CORS):**
Inicialmente, el código de la función importaba los encabezados de seguridad desde un archivo externo (`import { corsHeaders } from '../_shared/cors.ts'`). Sin embargo, al desplegar a través de la API, las rutas relativas fuera del directorio principal de la función suelen generar conflictos de resolución en el entorno de Deno en la nube, lo que provocaba un error **400 Bad Request** al invocar la función desde el cliente.

Para solucionar esto de raíz y garantizar la estabilidad:
1. Se **eliminó la dependencia del archivo externo** `_shared/cors.ts`.
2. Se inyectó directamente el objeto `corsHeaders` (con los permisos `Access-Control-Allow-Origin: *`) en la cabecera de los archivos `index.ts` de ambas funciones.
3. Se volvió a realizar el despliegue a través de la API (pasando a la `versión 2` de la función en la nube). Esto solucionó el error y permitió la comunicación correcta desde Vue.

### Código: `create-user/index.ts` (Optimizada)
Esta función verifica que quien llama sea Supervisor usando un procedimiento almacenado RPC (`get_user_rol`) para mayor seguridad y velocidad. Luego crea la cuenta en Auth y posteriormente hace un registro en `public.usuarios`. Si la tabla pública falla, se ejecuta un *rollback* borrando al usuario de Auth.
```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')!
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    // Validar token y verificar rol con una sola llamada RPC
    const { data: rol, error: userError } = await supabaseClient.rpc('get_user_rol')
    
    if (userError || rol !== 'supervisor') {
      throw new Error('No autorizado: Solo supervisores pueden crear usuarios')
    }

    const { email, password, nombre, rol: rolNuevo } = await req.json()
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email, password, email_confirm: true
    })
    if (authError) throw authError

    const { data: usuario, error: dbError } = await supabaseAdmin
      .from('usuarios')
      .insert({ nombre, rol: rolNuevo, email, auth_user_id: authUser.user.id })
      .select().single()

    if (dbError) {
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      throw dbError
    }

    return new Response(JSON.stringify(usuario), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
```

### Eliminación Reactiva de Usuarios (Trigger)
Para evitar el retraso significativo ("Cold Start") de 3 a 5 segundos de una Edge Function al eliminar usuarios, la lógica de borrado se trasladó directamente a PostgreSQL.
Al eliminar un registro de `public.usuarios`, un Trigger con permisos elevados (`SECURITY DEFINER`) purga automáticamente al usuario de `auth.users` en la misma transacción:

```sql
CREATE OR REPLACE FUNCTION public.handle_deleted_user()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM auth.users WHERE id = OLD.auth_user_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_user_deleted
  AFTER DELETE ON public.usuarios
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_deleted_user();
```

---

## 4. Cambios en el Frontend (Vue.js)

Se refactorizó el manejo de sesiones en todo el cliente:

1. **`src/composables/useAuth.js`:** 
   - Se reemplazó el uso obsoleto de `sessionStorage`. 
   - Se añadió la función `inicializar()` que recupera el token de JWT persistente de Supabase.
   - El logout ahora es asíncrono.
2. **`src/client/UsuarioClient.js`:**
   - En lugar de una query simple SQL, el método `login` ahora utiliza `supabase.auth.signInWithPassword`.
   - `agregarUsuario` llama a la Edge Function (`create-user`) optimizada.
   - `eliminarUsuario` fue refactorizado para interactuar **directamente con la base de datos** (`supabase.from('usuarios').delete()`), apoyándose en el Trigger de PostgreSQL para la eliminación completa, reduciendo el tiempo de ejecución de ~3 segundos a ~200ms.
3. **`src/components/login/LoginForm.vue` & `UsuarioForm.vue`:**
   - Se eliminó la librería manual de criptografía (`generarSHA256`).
   - Los formularios ahora piden `email` en lugar de nombre de usuario.
4. **`src/router/index.js`:**
   - Se añadió un guard que bloquea la carga de la aplicación usando `await inicializar()` para asegurarse de que Supabase haya recuperado la sesión antes de chequear los roles del router.
5. **Doble Petición de Logout (Fix):**
   - Se descubrió que `NavBar.vue` y los componentes padres (`MainLayout.vue` / `PublicHomePage.vue`) estaban ejecutando la orden de salir del sistema en cadena, lo que generaba un error 403. Se corrigió eliminando la llamada redundante desde `NavBar.vue`.

---

## 5. Registro de Errores y Troubleshooting (Historial de Sesión)

Durante la implementación, nos encontramos y resolvimos tres inconvenientes clave que vale la pena documentar:

### A. Error de Base de Datos al Crear Usuarios (Restricción de Contraseña)
- **Síntoma:** Al invocar la Edge Function de `create-user`, el servidor devolvía un HTTP 400. Inspeccionando la pestaña Network, el JSON de respuesta revelaba el error: `null value in column "contrasena" of relation "usuarios" violates not-null constraint`.
- **Causa:** En la arquitectura antigua, el campo `contrasena` era obligatorio en la tabla `public.usuarios`. Como la Edge Function solo inserta `nombre`, `rol` y `email`, la base de datos lo rechazaba.
- **Solución:** Se ejecutó una migración SQL `ALTER TABLE public.usuarios ALTER COLUMN contrasena DROP NOT NULL;`. Esto permitió preservar la contraseña antigua de respaldo del supervisor, pero habilitó la creación de nuevos usuarios sin el campo de contraseña local.

### B. Latencia (Cold Starts) en Edge Functions y Optimización Extrema
- **Síntoma Inicial:** Al probar la creación y eliminación del usuario en el navegador, las peticiones demoraban casi 5 segundos (4.71s), con un `preflight (OPTIONS)` que tomaba cientos de milisegundos.
- **Explicación:** Se trata de un comportamiento normal de la infraestructura "Serverless". La primera vez que se llama a una Edge Function inactiva, los servidores sufren de **"Cold Start"** (arranque en frío) mientras preparan el entorno. A esto se suma el costo de red.
- **Solución y Optimización:**
  - Para la **Creación**, se optimizó la función `create-user` usando una única llamada segura de validación por RPC en la base de datos, lo que redujo los saltos de red. Sin embargo, el tiempo siempre será un poco superior al borrado debido al proceso criptográfico de contraseñas (`bcrypt`).
  - Para la **Eliminación**, **se eliminó por completo la Edge Function `delete-user`**. Se implementó un **Trigger en PostgreSQL** (`on_user_deleted`) que purga automáticamente al usuario de `auth.users` tan pronto como el cliente borra el registro en la tabla `usuarios`. Esto anula el problema de *Cold Start* y redujo el tiempo de eliminación a escasos milisegundos.

### C. Error `403 Forbidden` al Cerrar Sesión
- **Síntoma:** En la pestaña Network, la acción de cerrar sesión disparaba dos peticiones a `/logout?scope=global`. La primera devolvía `403 Forbidden` y la segunda `204 No Content`.
- **Causa:** Redundancia en el código de Vue. El componente `NavBar.vue` ejecutaba `this.logout()` y además emitía el evento al padre, quien a su vez volvía a ejecutar `this.logout()`. La segunda llamada intentaba destruir una sesión ya invalidada por la primera, provocando el rechazo del servidor.
- **Solución:** Se modificó `NavBar.vue` para que actúe como un componente puramente presentacional, limitándose a emitir `this.$emit('logout')` y dejando la lógica asíncrona exclusivamente al componente padre.

---

## 6. Implementación de Row Level Security (RLS)

Tras completar la migración a Supabase Auth, se implementó un estricto modelo de seguridad a nivel de base de datos utilizando **Row Level Security (RLS)** en las 15 tablas del esquema `public`. Esto garantiza que los operadores no puedan alterar el historial ni manipular datos ajenos, protegiendo la aplicación incluso frente a vulnerabilidades en el frontend.

### 6.1. Fases de Ejecución

La implementación se dividió en 5 fases para minimizar riesgos:

1. **Fase 1 (Limpieza Legacy):**
   - Eliminación del usuario legacy "ana" y purga final de la columna `contrasena` para estandarizar el esquema.
2. **Fase 2 (Catálogos):**
   - RLS habilitado en `materia_prima`, `materiales`, `recetas`, `receta_materiales` y `receta_materia_prima`.
   - **Regla:** Lectura pública (para usuarios autenticados). Creación, edición y eliminación exclusivas para el rol `supervisor`.
3. **Fase 3 (Negocio):**
   - RLS habilitado en `clientes`, `pedidos`, `pedido_detalles` y `mermas`.
   - **Regla (Pedidos/Clientes):** Solo el supervisor puede sincronizar o editar. El operador tiene acceso de solo lectura para visualizar el Dashboard.
   - **Regla (Mermas):** El registro y eliminación de mermas quedó configurado como un privilegio **exclusivo del supervisor**.
4. **Fase 4 (Producción y Planificación):**
   - RLS habilitado en `producciones`, `produccion_detalle`, `produccion_consumos`, `planificaciones` y `usuarios`.
   - **Regla Central de Producción:** El operador *puede* registrar nuevas producciones, pero se implementó un `WITH CHECK` que obliga a que el `operador_id` coincida con su propio identificador (`auth.uid()`). No pueden modificar ni eliminar el registro histórico una vez creado (solo el supervisor puede hacerlo).
   - **Regla de Planificación:** Exclusiva del supervisor.
5. **Fase 5 (Frontend):**
   - Se verificó que el cliente `ProduccionClient.js` estuviera enviando el `operador_id` correctamente desde la interfaz. No se requirieron modificaciones en Vue.js ya que la arquitectura preexistente del frontend era sólida y ya contemplaba estas variables.

### 6.2. Resolución de Conflictos (Edge Cases)

Durante la implementación surgieron dos puntos clave que requirieron corrección en tiempo real:

1. **Parche en Sincronización de Materiales (`MaterialClient.js`):**
   - **Problema:** Al sincronizar el catálogo de materiales, el código original comparaba únicamente por `id` (UUID). Si los materiales se subían inicialmente por Excel (generando UUIDs aleatorios locales) y posteriormente se sincronizaban por la API externa (trayendo los UUIDs reales del sistema de ventas), la app intentaba insertar el material como nuevo, provocando conflictos de duplicidad.
   - **Solución:** Se implementó una doble validación en memoria (`mapExistentesPorId` y `mapExistentesPorNombre`). Ahora el código busca coincidencias tanto por ID como por el `nombre` exacto (normalizado a minúsculas). Esto unifica el registro y evita duplicados en el inventario.

2. **Privilegios de Mermas (Corrección de Alcance):**
   - Inicialmente se había planteado que los operadores pudieran registrar sus propias mermas durante la producción.
   - Por regla de negocio estricta, se corrigió sobre la marcha: **solo el supervisor puede declarar y eliminar mermas**. Se actualizó la política SQL de `mermas` (`mermas_insert_supervisor`) para rechazar cualquier intento de inserción proveniente de un operador.
