import axios from "axios";

//const API_URL = "http://localhost:3000/materia_prima";
const API_URL = "http://192.168.1.6:3000/materia_prima";

export default {
  async obtenerMateriaPrima() {
    try {
      const response = await axios.get(API_URL);
      return response.data;
    } catch (error) {
      console.error("Error al obtener inventario:", error);
      throw error;
    }
  },

  async cargarMateriaPrima(data) {
    try {
      const response = await axios.post(API_URL, data);
      return response.data;
    } catch (error) {
      console.error("Error al guardar en el servidor:", error);
      throw error;
    }
  },

  async actualizarMateriaPrima(id, data) {
    try {
      const response = await axios.put(`${API_URL}/${id}`, data);
      return response.data;
    } catch (error) {
      console.error("Error al actualizar en el servidor:", error);
      throw error;
    }
  },
};
