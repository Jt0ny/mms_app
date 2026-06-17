import axios from 'axios'

const API_URL = `${import.meta.env.VITE_API_URL}/planificaciones`

export default {
    /**
     * Obtiene todas las planificaciones
     */
    async obtenerPlanificaciones() {
        try {
            const response = await axios.get(API_URL)
            return response.data
        } catch (error) {
            console.error('Error al obtener planificaciones:', error)
            throw error
        }
    },

    /**
     * Obtiene las planificaciones de un operador específico
     */
    async obtenerPlanificacionesPorOperador(operadorId) {
        try {
            const response = await axios.get(API_URL, { params: { operadorId } })
            return response.data
        } catch (error) {
            console.error('Error al obtener planificaciones del operador:', error)
            throw error
        }
    },

    /**
     * Crea una nueva planificación
     * @param {{ operadorId: string, fecha: string, recetas: Array<{ recetaId: string, nombre: string, cantidad: number }> }} data
     */
    async crearPlanificacion(data) {
        try {
            const payload = {
                ...data,
                creado_en: new Date().toISOString()
            }
            const response = await axios.post(API_URL, payload)
            return response.data
        } catch (error) {
            console.error('Error al crear planificación:', error)
            throw error
        }
    },

    /**
     * Elimina una planificación por ID
     */
    async eliminarPlanificacion(id) {
        try {
            await axios.delete(`${API_URL}/${id}`)
        } catch (error) {
            console.error('Error al eliminar planificación:', error)
            throw error
        }
    }
}
