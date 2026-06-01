import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL}/materiales`;

export default {
  
  async obtenerMateriales() {
    try {
      const response = await axios.get(API_URL);
      return response.data;
    } catch (error) {
      console.error("Error al obtener materiales:", error);
      throw error;
    }
  },

  async agregarMaterial(data) {
    try {
      const response = await axios.post(API_URL, data);
      return response.data;
    } catch (error) {
      console.error("Error al agregar material:", error);
      throw error;
    }
  },

  async actualizarMaterial(id, data) {
    try {
      const response = await axios.put(`${API_URL}/${id}`, data);
      return response.data;
    } catch (error) {
      console.error("Error al actualizar material:", error);
      throw error;
    }
  },

  async eliminarMaterial(id) {
    try {
      const response = await axios.delete(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error al eliminar material:", error);
      throw error;
    }
  },
};
