import axios from 'axios'

const API_URL = `${import.meta.env.VITE_API_URL}/mermas`

export default {
    async obtenerMermas() {
        try {
            const response = await axios.get(API_URL)
            return response.data
        } catch (error) {
            console.error('Error al obtener mermas:', error)
            throw error
        }
    },

    async agregarMerma(data) {
        try {
            const response = await axios.post(API_URL, data)
            return response.data
        } catch (error) {
            console.error('Error al agregar merma:', error)
            throw error
        }
    },

    async eliminarMerma(id) {
        try {
            const response = await axios.delete(`${API_URL}/${id}`)
            return response.data
        } catch (error) {
            console.error(`Error al eliminar merma con ID ${id}:`, error)
            throw error
        }
    }
}
