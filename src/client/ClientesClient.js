import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL}/clientes`;

export default {

  async agregarCliente(data) {
      try {
      const response = await axios.post(API_URL, data);
      return response.data;
    } catch (error) {
      console.error("Error al guardar en el servidor:", error);
      throw error;
    }
  },
};
