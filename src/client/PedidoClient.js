import axios from "axios";

//const API_URL = `${import.meta.env.VITE_API_URL}/pedidos`;
const API_URL = "http://localhost:8060/pedidos";

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
            const response = await axios.post(`${API_URL}/importar`, data);
            return response.data;
        } catch (error) {
            console.error("Error al agregar pedido:", error);
            throw error;
        }
    },

    async obtenerClientesFacturacion() {
        try {
            const pedidos = await this.obtenerPedidos();
            const clientes = pedidos
                .map((pedido) => pedido.cliente_facturacion ?? pedido.clienteFacturacion)
                .filter((cliente) => cliente != null)
                .map((cliente) => String(cliente).trim())
                .filter((cliente) => cliente.length > 0);

            return [...new Set(clientes)];
        } catch (error) {
            console.error("Error al obtener clientes de facturación:", error);
            throw error;
        }
    }

}