import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL}/recetas`;

export default {

    async obtenerRecetas() {
        try {
            const response = await axios.get(API_URL);
            return response.data;
        } catch (error) {
            console.error("Error al obtener recetas:", error);
            throw error;
        }
    },

    async agregarReceta(data) {
        try {
            const response = await axios.post(API_URL, data);
            return response.data;
        } catch (error) {
            console.error("Error al agregar receta:", error);
            throw error;
        }
    },

    async actualizarReceta(id, data) {
        try {
            const response = await axios.put(`${API_URL}/${id}`, data);
            return response.data;
        } catch (error) {
            console.error("Error al actualizar receta:", error);
            throw error;
        }
    },

    async eliminarReceta(id) {
        try {
            const response = await axios.delete(`${API_URL}/${id}`);
            return response.data;
        } catch (error) {
            console.error("Error al eliminar receta:", error);
            throw error;
        }
    },

}