import { ref } from 'vue'
import { useMensajes } from './useMensajes.js'

/**
 * @param {Object} opciones
 * @param {Function} opciones.obtenerDatos — Función para obtener los datos locales
 * @param {Function} opciones.sincronizar — Función para sincronizar con la API externa
 * @param {string} opciones.nombreModulo — Nombre para los mensajes de error
 */
export function useInventario({ obtenerDatos, sincronizar, nombreModulo }) {
    const { mostrarMensaje } = useMensajes()

    const inventarioActual = ref([])
    const cargandoInventario = ref(false)

    async function cargarInventario(forceRefresh = false) {
        cargandoInventario.value = true
        try {
            const response = await obtenerDatos(forceRefresh)
            if (response && response.success === false) {
                console.error(response.error)
                mostrarMensaje('error', `❌ Error al cargar ${nombreModulo}`, 3000)
                inventarioActual.value = []
            } else {
                inventarioActual.value = response?.success ? (response.data ?? []) : (response ?? [])
            }
        } catch (error) {
            console.error(error)
            mostrarMensaje('error', `❌ Error al cargar ${nombreModulo}`, 3000)
        } finally {
            cargandoInventario.value = false
        }
    }

    async function sincronizarAPI() {
        cargandoInventario.value = true
        mostrarMensaje('info', '⚡ Sincronizando con la API externa...', 0)
        
        try {
            const response = await sincronizar()
            
            // Verificar si la respuesta es el nuevo objeto {success, error}
            if (response && response.success === false) {
                console.error(response.error)
                mostrarMensaje('error', '❌ Error al sincronizar con la API externa')
                cargandoInventario.value = false
                return
            }

            mostrarMensaje('exito', '✓ Sincronización exitosa con la API externa')
            await cargarInventario(true)
        } catch (error) {
            // Fallback por si lanza una excepción (legacy)
            console.error(error)
            mostrarMensaje('error', '❌ Error al sincronizar con la API externa')
            cargandoInventario.value = false
        }
    }

    return { inventarioActual, cargandoInventario, cargarInventario, sincronizarAPI }
}
