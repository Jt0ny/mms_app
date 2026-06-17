import axios from "axios";

//const API_URL = `http://localhost:8070/materia-prima`;
const API_URL = `http://192.168.1.3:8070/materia-prima`;

/*const client = axios.create({
  baseURL: `http://localhost:8070`,
  headers: {
    'Content-Type': 'application/json'
  }
})*/

export default {

  /**
   * Obtiene la lista de todas las materias primas
   */
  async obtenerMateriaPrima() {
    try {
      const response = await axios.get(API_URL);
      return response.data;
    } catch (error) {
      console.error("Error al obtener materias primas:", error);
      throw error;
    }
  },

  /**
   * Obtiene una materia prima por ID
   *
  async obtenerMateriaPrimaById(id) {
    try {
      const response = await client.get(`/materia-prima/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener materia prima con ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Crea una nueva materia prima individual
   
  async crearMateriaPrima(data) {
    try {
      const response = await client.post('/materia-prima', data);
      return response.data;
    } catch (error) {
      console.error("Error al crear materia prima:", error);
      throw error;
    }
  },

  /**
   * Carga múltiples materias primas (bulk import)
   * @param {Array} data - Array de objetos MateriaPrimaDto
   */
  async cargarMateriaPrima(data) {
    try {
      const response = await axios.post(API_URL + '/importar', data);
      return response.data;
    } catch (error) {
      console.error("Error al guardar materias primas en el servidor:", error);
      throw error;
    }
  },

  /**
   * Actualiza una materia prima existente
   
  async actualizarMateriaPrima(id, data) {
    try {
      const response = await client.put(`/materia-prima/${id}`, data);
      return response.data;
    } catch (error) {
      console.error("Error al actualizar materia prima:", error);
      throw error;
    }
  },

  /**
   * Elimina una materia prima
   *
  async eliminarMateriaPrima(id) {
    try {
      await client.delete(`/materia-prima/${id}`);
      return true;
    } catch (error) {
      console.error(`Error al eliminar materia prima con ID ${id}:`, error);
      throw error;
    }
  }*/
}
