import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL}/clientes`;

export default {

  async obtenerClientes() {
    try {
      const response = await axios.get(API_URL);
      return response.data;
    } catch (error) {
      console.error("Error al obtener clientes:", error);
      throw error;
    }
  },

  async agregarCliente(data) {
    try {
      const response = await axios.post(API_URL, data);
      return response.data;
    } catch (error) {
      console.error("Error al guardar cliente:", error);
      throw error;
    }
  },

  async actualizarCliente(id, data) {
    try {
      const response = await axios.put(`${API_URL}/${id}`, data);
      return response.data;
    } catch (error) {
      console.error("Error al actualizar cliente:", error);
      throw error;
    }
  },

  async eliminarCliente(id) {
    try {
      await axios.delete(`${API_URL}/${id}`);
    } catch (error) {
      console.error("Error al eliminar cliente:", error);
      throw error;
    }
  }
};

