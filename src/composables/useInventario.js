import { ref } from 'vue'
import SyncLogClient from '../client/SyncLogClient'
import { DURACION_ERROR } from '../utils/alertTimes.js'

export function useInventario({ obtenerDatos, sincronizar, nombreModulo, mostrarMensaje }) {

    const inventarioActual = ref([])
    const cargandoInventario = ref(false)

    async function cargarInventario(forceRefresh = false) {
        cargandoInventario.value = true
        const response = await obtenerDatos(forceRefresh)

        if (response?.success === false) {
            console.error(response.error)
            mostrarMensaje('error', `Error al cargar ${nombreModulo}`, DURACION_ERROR)
            inventarioActual.value = []
        } else {
            inventarioActual.value = response?.data ?? []
        }
        cargandoInventario.value = false
    }

    async function sincronizarAPI() {
        try {
            const normalized = String(nombreModulo).toLowerCase().trim()
            let moduloKey = 'desconocido'
            if (normalized === 'materia prima') moduloKey = 'materia_prima'
            else if (normalized === 'materiales') moduloKey = 'materiales'
            const yaSincronizado = await SyncLogClient.yaSincronizadoHoy(moduloKey)
            if (yaSincronizado) {
                mostrarMensaje('info', `El inventario de ${nombreModulo} ya fue sincronizado hoy`)
                return
            }

            cargandoInventario.value = true
            mostrarMensaje('info', ' Sincronizando con la API externa...', 0)

            const response = await sincronizar()

            if (response?.success === false) {
                console.error(response.error)
                mostrarMensaje('error', 'Error al sincronizar con la API externa')
                cargandoInventario.value = false
                return
            }

            await SyncLogClient.registrarSync(moduloKey)
            mostrarMensaje('exito', 'Sincronización exitosa con la API externa')
            await cargarInventario(true)
        } catch (error) {
            console.error("Error inesperado en sincronizarAPI:", error)
            mostrarMensaje('error', 'Ocurrió un error inesperado al sincronizar')
            cargandoInventario.value = false
        }
    }

    return { inventarioActual, cargandoInventario, cargarInventario, sincronizarAPI }
}
