import axios from "axios";
import { supabase } from "./supabase";
import ClienteClient from "./ClienteClient";
import RecetaClient from "./RecetaClient";
import { obtenerFechaHoy } from "../utils/date.js";
import { useCatalogos } from "../composables/useCatalogos.js";

const API_URL = import.meta.env.VITE_API_PEDIDOS_URL;

export default {

  // ==========================================
  // HELPERS INTERNOS PARA SINCRONIZACIÓN Y CARGA
  // ==========================================

  async _obtenerCatalogos() {
    const catalogos = useCatalogos();
    const [clientesRes, recetasRes] = await Promise.all([
      catalogos.obtenerClientes(),
      catalogos.obtenerRecetas()
    ]);

    const clientes = clientesRes?.data ?? [];
    const recetas = recetasRes?.data ?? [];

    const mapClientes = new Map(clientes.map(c => [c.nombre.toLowerCase().trim(), c.id]));
    const mapRecetas = new Map();
    recetas.forEach(r => {
      if (r.categoria) {
        const catKey = r.categoria.toLowerCase().trim();
        if (!mapRecetas.has(catKey)) {
          mapRecetas.set(catKey, r.id);
        }
      }
    });

    return { mapClientes, mapRecetas };
  },


  async _resolverRecetasFaltantes(pedidos, mapRecetas) {
    const missingCategories = [...new Set(
      pedidos
        .map(item => (item.categoria || "").trim())
        .filter(cat => cat && !mapRecetas.has(cat.toLowerCase()))
    )];

    if (missingCategories.length > 0) {


      const payloadRecetas = missingCategories.map(category => ({
        nombre: `Receta Genérica ${category}`,
        categoria: category,
        instrucciones: "Receta autogenerada para sincronización de pedidos"
      }));

      const { data: creadas, error: recError } = await supabase
        .from('recetas')
        .insert(payloadRecetas)
        .select();

      if (recError) throw recError;

      if (creadas) {
        creadas.forEach(r => {
          mapRecetas.set(r.categoria.toLowerCase(), r.id);
        });
        const catalogos = useCatalogos();
        catalogos.obtenerRecetas(true).catch(console.error);
      }
    }
  },

  // ==========================================
  // MÉTODOS PÚBLICOS
  // ==========================================

  /**
   * Sincroniza los pedidos de la API externa (puerto 8060) hacia Supabase.
   */
  async sincronizarConSupabase() {
    try {

      const response = await axios.get(API_URL);
      const pedidosExternos = response.data || [];

      if (pedidosExternos.length === 0) {

        return { success: true };
      }

      const huboCambiosCli = await ClienteClient.resolverClientesDePedidos(pedidosExternos);
      if (huboCambiosCli) {
        const catalogos = useCatalogos();
        await catalogos.obtenerClientes(true);
      }

      const { mapClientes, mapRecetas } = await this._obtenerCatalogos();
      await this._resolverRecetasFaltantes(pedidosExternos, mapRecetas);

      // Procesar cada pedido
      const pedidosMap = new Map();
      const detallesToUpsert = [];

      for (const item of pedidosExternos) {
        const billName = (item.clienteFacturacion || item.cliente_facturacion || "").trim();
        const shipName = (item.clienteEnvio || item.cliente_envio || "").trim();
        const category = (item.categoria || "").trim();
        const stemsVal = parseInt(item.stems) || 0;
        const precioVal = parseFloat(item.precio) || 0;

        if (!billName) continue;

        let billId = mapClientes.get(billName.toLowerCase());
        if (!billId) {
          console.warn(`Cliente de facturación "${billName}" no encontrado. Omitiendo.`);
          continue;
        }

        let shipId = shipName ? (mapClientes.get(shipName.toLowerCase()) || null) : null;
        let recetaId = category ? (mapRecetas.get(category.toLowerCase()) || null) : null;
        if (!recetaId) {
          console.warn(`No se pudo resolver receta para "${category}". Omitiendo.`);
          continue;
        }

        const pedidoIdStr = String(item.id);

        pedidosMap.set(pedidoIdStr, {
          id: pedidoIdStr,
          cliente_facturacion_id: billId,
          cliente_envio_id: shipId,
          fecha_pedido: item.fecha_ingreso || item.fecha || obtenerFechaHoy(),
          estado: item.estado || 'Pendiente'
        });

        detallesToUpsert.push({
          pedido_id: pedidoIdStr,
          receta_id: recetaId,
          stems: stemsVal,
          cantidad: 1,
          precio: precioVal
        });
      }

      const pedidosToUpsert = Array.from(pedidosMap.values());
      if (pedidosToUpsert.length === 0) return { success: true };


      const { error: rpcError } = await supabase.rpc('rpc_sincronizar_pedidos', {
        payload_pedidos: pedidosToUpsert,
        payload_detalles: detallesToUpsert
      });
      
      if (rpcError) throw rpcError;


      return { success: true };
    } catch (error) {
      console.error("Error al sincronizar pedidos:", error);
      return { success: false, error };
    }
  },

  /**
   * Guarda pedidos directamente en Supabase, resolviendo clientes y recetas.
   */
  async agregarPedido(data) {
    try {
      const huboCambiosCli = await ClienteClient.resolverClientesDePedidos(data);
      if (huboCambiosCli) {
        const catalogos = useCatalogos();
        await catalogos.obtenerClientes(true);
      }

      const { mapClientes, mapRecetas } = await this._obtenerCatalogos();
      await this._resolverRecetasFaltantes(data, mapRecetas);

      const pedidosToInsert = [];
      const detallesToInsert = [];

      for (const item of data) {
        const billName = (item.cliente_facturacion || item.clienteFacturacion || "").trim();
        const shipName = (item.cliente_envio || item.clienteEnvio || "").trim();
        const category = (item.categoria || "").trim();
        const stemsVal = parseInt(item.stems) || 0;

        if (!billName) continue;

        let billId = mapClientes.get(billName.toLowerCase());
        if (!billId) continue;

        let shipId = shipName ? (mapClientes.get(shipName.toLowerCase()) || null) : null;
        let recetaId = category ? (mapRecetas.get(category.toLowerCase()) || null) : null;
        if (!recetaId) continue;

        const pedidoId = crypto.randomUUID();
        pedidosToInsert.push({
          id: pedidoId,
          cliente_facturacion_id: billId,
          cliente_envio_id: shipId,
          fecha_pedido: item.fechaIngreso || item.fecha_ingreso || item.fecha || obtenerFechaHoy(),
          estado: 'Pendiente'
        });

        detallesToInsert.push({
          pedido_id: pedidoId,
          receta_id: recetaId,
          stems: stemsVal,
          cantidad: 1,
          precio: item.precio || 0
        });
      }

      if (pedidosToInsert.length === 0) return;

      const { error: rpcError } = await supabase.rpc('rpc_sincronizar_pedidos', {
        payload_pedidos: pedidosToInsert,
        payload_detalles: detallesToInsert
      });
      
      if (rpcError) throw rpcError;


      return { success: true };

    } catch (error) {
      console.error("Error al guardar pedidos:", error);
      return { success: false, error };
    }
  },

  async obtenerPedidos() {
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select(`
          id,
          fecha_pedido,
          estado,
          operador_id,
          usuarios ( nombre ),
          cliente_facturacion:cliente_facturacion_id ( id, nombre ),
          cliente_envio:cliente_envio_id ( id, nombre ),
          pedido_detalles (
            stems,
            precio,
            recetas (
              id,
              nombre,
              categoria
            )
          )
        `)
        .order('fecha_creacion', { ascending: false });

      if (error) throw error;

      const flatList = [];
      for (const item of (data || [])) {
        const details = item.pedido_detalles || [];
        if (details.length === 0) {
          flatList.push({
            id: item.id,
            clienteFacturacion: item.cliente_facturacion?.nombre || '',
            clienteEnvio: item.cliente_envio?.nombre || '',
            categoria: '',
            stems: 0,
            precio: 0,
            fecha: item.fecha_pedido,
            estado: item.estado,
            operadorId: item.operador_id,
            operadorNombre: item.usuarios?.nombre || ''
          });
        } else {
          for (const det of details) {
            flatList.push({
              id: item.id,
              clienteFacturacion: item.cliente_facturacion?.nombre || '',
              clienteEnvio: item.cliente_envio?.nombre || '',
              categoria: det.recetas?.categoria || '',
              stems: det.stems || 0,
              precio: det.precio || 0,
              fecha: item.fecha_pedido,
              estado: item.estado,
              operadorId: item.operador_id,
              operadorNombre: item.usuarios?.nombre || ''
            });
          }
        }
      }

      flatList.sort((a, b) => {
        const nameA = String(a.clienteFacturacion || '').trim().toLowerCase();
        const nameB = String(b.clienteFacturacion || '').trim().toLowerCase();
        return nameA.localeCompare(nameB);
      });

      return { success: true, data: flatList };
    } catch (error) {
      console.error("Error al obtener pedidos:", error);
      return { success: false, error };
    }
  },

}
