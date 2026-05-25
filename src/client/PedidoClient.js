import axios from "axios";

//const API_URL = "http://localhost:3000/pedidos";
const API_URL = "http://192.168.1.6:3000/pedidos";

export default {

    async obtenerPedidos() {
        try {
            const response = await axios.get(API_URL);
            return response.data;
        } catch (error) {
            console.error("Error al obtener pedidos:", error);
            throw error;
        }
    },

    async agregarPedido(data) {
        try {
            const response = await axios.post(API_URL, data);
            return response.data;
        } catch (error) {
            console.error("Error al agregar pedido:", error);
            throw error;
        }
    }

}