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
            const datos = await obtenerDatos(forceRefresh)
            inventarioActual.value = datos ?? []
        } catch (error) {
            console.error(error)
            mostrarMensaje('error', `❌ Error al cargar ${nombreModulo}`, 500)
        } finally {
            cargandoInventario.value = false
        }
    }

    async function sincronizarAPI() {
        cargandoInventario.value = true
        try {
            mostrarMensaje('info', '⚡ Sincronizando con la API externa...', 0)
            await sincronizar()
            mostrarMensaje('exito', '✓ Sincronización exitosa con la API externa')
            await cargarInventario(true)
        } catch (error) {
            console.error(error)
            mostrarMensaje('error', '❌ Error al sincronizar con la API externa')
            cargandoInventario.value = false
        }
    }

    return { inventarioActual, cargandoInventario, cargarInventario, sincronizarAPI }
}
