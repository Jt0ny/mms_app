import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL}/usuarios`;


export default {

  async obtenerUsuarios() {
    try {
      const response = await axios.get(API_URL);
      return response.data;
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
      throw error;
    }
  },
  async agregarUsuario(usuario) {
    try {
      const response = await axios.post(API_URL, usuario);
      return response.data;
    } catch (error) {
      console.error("Error al agregar usuario:", error);
      throw error;
    }
  },
  async obtenerUsuario(id) {
    try {
      const response = await axios.get(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error al obtener usuario:", error);
      throw error;
    }
  },

  async actualizarUsuario(id, usuario) {
    try {
      const response = await axios.put(`${API_URL}/${id}`, usuario);
      return response.data;
    } catch (error) {
      console.error("Error al actualizar usuario:", error);
      throw error;
    }
  },
  async eliminarUsuario(id) {
    try {
      await axios.delete(`${API_URL}/${id}`);
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      throw error;
    }
  },
};
