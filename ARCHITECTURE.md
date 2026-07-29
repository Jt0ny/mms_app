# Arquitectura Frontend

Este documento describe las convenciones arquitectónicas, patrones de diseño y manejo de estado adoptados en la aplicación frontend (Vue 3). Es esencial seguir estas guías para asegurar la consistencia y mantenibilidad del código a medida que la aplicación crece.

## 1. Manejo del Estado Global (Store)

Para el estado global (autenticación, catálogos, configuraciones en caché) **no se utiliza Pinia ni Vuex**. Debido al alcance y tamaño actual del proyecto, se ha adoptado un patrón de **Stores Ligeros** usando *Composables* nativos de Vue 3 (`ref` / `reactive`).

### Patrón "Store Ligero"
Los archivos dentro de la carpeta `src/composables/` (como `useAuth.js` y `useCatalogos.js`) declaran su estado reactivo fuera de la función exportada. Esto garantiza que todas las instancias de los componentes compartan la misma referencia en memoria.

**Ventajas del patrón actual:**
- Menos boilerplate, fácil de entender y directamente acoplado con la *Composition API*.
- Suficiente para el manejo de caché global de la aplicación.

**Regla Importante:** La invalidación de la caché debe hacerse explícitamente. Por ejemplo, al hacer logout, el módulo `useAuth` invoca `useCatalogos().invalidar()` para asegurar que no ocurra una fuga de datos (*data leak*) entre sesiones.

*(Nota: Si el estado global de la aplicación se vuelve inmanejable en el futuro, el reemplazo natural y oficial recomendado para Vue 3 es migrar hacia **Pinia**).*

## 2. Capa de Servicios (Directorio `client/`)

La carpeta `src/client/` actúa conceptualmente como la **Capa de Servicios** de la aplicación.

### ¿Qué debe ir en `client/`?
- **Llamadas a la Base de Datos:** Toda la interacción directa con Supabase u otra API debe encapsularse en los clientes (ej. `RecetaClient.js`, `PedidoClient.js`). Los componentes Vue **nunca** deben hacer queries a Supabase directamente.
- **Algoritmos y Lógica de Negocio Compleja:** Lógica pesada, como el algoritmo de distribución equitativa de recetas o mapeo, debe ubicarse aquí (ej. `PlanificacionAlgoritmo.js`). De esta manera se evita inflar los componentes (`.vue`).

### ¿Qué NO debe ir en `client/`?
- Estado reactivo de Vue (`ref`, `reactive`, `watch`). La capa de servicios debe ser agnóstica a la vista, retornando Promises y datos puros.

## 3. Componentes y API de Vue

El proyecto adopta un estándar híbrido:

1. **Componentes Visuales (`.vue`)**: Utilizan **Options API**. Se eligió Options API por su consistencia, clara separación estructural (`data`, `computed`, `methods`) y familiaridad en las etapas iniciales del desarrollo. 
2. **Composables y Hooks**: Utilizan **Composition API** (`setup()`). Cuando un componente (Options API) requiere inyectar un composable global, lo hace exponiéndolo a través del bloque `setup()`.

### Ejemplo Estándar de Componente:
```vue
<script>
import { useAuth } from '../composables/useAuth'

export default {
    name: 'MiComponente',
    setup() {
        // Inyección de dependencias globales
        const auth = useAuth()
        return { auth }
    },
    data() {
        return {
            estadoLocal: true
        }
    },
    methods: {
        accionLocal() {
            if (this.auth.isLogged) {
                // ...
            }
        }
    }
}
</script>
```

Mantener estas fronteras limpias asegura que la lógica de negocio pueda probarse y reutilizarse sin depender de los componentes de Vue.
