import axios from 'axios'

const API_URL = `${import.meta.env.VITE_API_URL}/producciones`

export default {
    async obtenerProducciones() {
        try {
            const response = await axios.get(API_URL)
            return response.data
        } catch (error) {
            console.error('Error al obtener producciones:', error)
            throw error
        }
    },

    async agregarProduccion(data) {
        try {
            const response = await axios.post(API_URL, data)
            return response.data
        } catch (error) {
            console.error('Error al agregar producción:', error)
            throw error
        }
    },

    async editarProduccion(id, data) {
        try {
            const response = await axios.put(`${API_URL}/${id}`, data)
            return response.data
        } catch (error) {
            console.error('Error al editar producción:', error)
            throw error
        }
    }
}