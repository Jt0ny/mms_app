import { ref } from 'vue'
import { useMensajes } from './useMensajes.js'

export function useInventario({ obtenerDatos, sincronizar, nombreModulo }) {
    const { mostrarMensaje } = useMensajes()

    const inventarioActual = ref([])
    const cargandoInventario = ref(false)

    async function cargarInventario(forceRefresh = false) {
        cargandoInventario.value = true
        const response = await obtenerDatos(forceRefresh)

        if (response?.success === false) {
            console.error(response.error)
            mostrarMensaje('error', `Error al cargar ${nombreModulo}`, 3000)
            inventarioActual.value = []
        } else {
            inventarioActual.value = response?.data ?? []
        }
        cargandoInventario.value = false
    }

    async function sincronizarAPI() {
        cargandoInventario.value = true
        mostrarMensaje('info', ' Sincronizando con la API externa...', 0)

        const response = await sincronizar()

        if (response?.success === false) {
            console.error(response.error)
            mostrarMensaje('error', 'Error al sincronizar con la API externa')
            cargandoInventario.value = false
            return
        }

        mostrarMensaje('exito', 'Sincronización exitosa con la API externa')
        await cargarInventario(true)
    }

    return { inventarioActual, cargandoInventario, cargarInventario, sincronizarAPI }
}
