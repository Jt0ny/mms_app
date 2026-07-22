import axios from "axios";
import { supabase } from "./supabase";
import ClientesClient from "./ClientesClient";
import RecetaClient from "./RecetaClient";
import { obtenerFechaHoy } from "../utils/date.js";

const API_URL = "http://localhost:8060/pedidos";

export default {

  /**
   * Sincroniza los pedidos de la API externa (puerto 8060) hacia Supabase,
   * resolviendo clientes y categorías a IDs relacionales correctos de forma masiva (bulk).
   */
  async sincronizarConSupabase() {
    try {
      console.log("Iniciando sincronización de pedidos desde API externa...");
      const response = await axios.get(API_URL);
      const pedidosExternos = response.data || [];

      if (pedidosExternos.length === 0) {
        console.log("No se encontraron pedidos en la API externa para sincronizar.");
        return;
      }

      // 1. Obtener los catálogos de clientes y recetas desde Supabase
      let [clientes, recetas] = await Promise.all([
        ClientesClient.obtenerClientes(),
        RecetaClient.obtenerRecetas()
      ]);

      const mapClientes = new Map(clientes.map(c => [c.nombre.toLowerCase().trim(), c.id]));

      // Rastrear qué nombres faltan y en qué rol aparecen (facturación, envío o ambos)
      const billNames = new Set();  // nombres que aparecen como cliente de facturación
      const shipNames = new Set();  // nombres que aparecen como cliente de envío

      for (const item of pedidosExternos) {
        const billName = (item.clienteFacturacion || item.cliente_facturacion || "").trim();
        const shipName = (item.clienteEnvio || item.cliente_envio || "").trim();

        if (billName && !mapClientes.has(billName.toLowerCase())) {
          billNames.add(billName);
        }
        if (shipName && !mapClientes.has(shipName.toLowerCase())) {
          shipNames.add(shipName);
        }
      }

      const missingClientNames = new Set([...billNames, ...shipNames]);

      if (missingClientNames.size > 0) {
        console.log(`Creando clientes placeholder para nombres faltantes:`, [...missingClientNames]);

        const payloadClientes = [...missingClientNames].map(name => {
          const esBill = billNames.has(name);
          const esShip = shipNames.has(name);
          let tipo = 'Ambos';
          if (esBill && !esShip) tipo = 'Facturación';
          else if (!esBill && esShip) tipo = 'Envío';

          return {
            nombre: name,
            tipo,
            email: '',
            telefono: '',
            direccion: '',
            notas: 'Autogenerado durante sincronización de pedidos'
          };
        });

        const { data: creadosClientes, error: cliError } = await supabase
          .from('clientes')
          .insert(payloadClientes)
          .select();

        if (cliError) throw cliError;

        if (creadosClientes) {
          creadosClientes.forEach(c => {
            mapClientes.set(c.nombre.toLowerCase().trim(), c.id);
          });
        }
      }

      // Mapear recetas por categoría. Si hay múltiples recetas de la misma categoría, toma la primera.
      const mapRecetas = new Map();
      recetas.forEach(r => {
        if (r.categoria) {
          const catKey = r.categoria.toLowerCase().trim();
          if (!mapRecetas.has(catKey)) {
            mapRecetas.set(catKey, r.id);
          }
        }
      });

      // 2. Resolver recetas placeholder en paralelo para todas las categorías faltantes antes de sincronizar
      const missingCategories = [...new Set(
        pedidosExternos
          .map(item => (item.categoria || "").trim())
          .filter(cat => cat && !mapRecetas.has(cat.toLowerCase()))
      )];

      if (missingCategories.length > 0) {
        console.log(`Creando recetas placeholder para categorías faltantes:`, missingCategories);

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
        }
      }

      // 3. Procesar cada pedido en memoria construyendo las colecciones masivas
      const pedidosMap = new Map();
      const detallesToUpsert = [];

      for (const item of pedidosExternos) {
        const billName = (item.clienteFacturacion || item.cliente_facturacion || "").trim();
        const shipName = (item.clienteEnvio || item.cliente_envio || "").trim();
        const category = (item.categoria || "").trim();
        const stemsVal = parseInt(item.stems) || 0;
        const precioVal = parseFloat(item.precio) || 0;

        if (!billName) continue; // No se puede procesar sin cliente de facturación

        // Buscar UUID del cliente de facturación
        let billId = mapClientes.get(billName.toLowerCase());
        if (!billId) {
          console.warn(`Cliente de facturación "${billName}" no encontrado en Supabase. Se omitirá el pedido ${item.id}.`);
          continue;
        }

        // Buscar UUID del cliente de envío
        let shipId = null;
        if (shipName) {
          shipId = mapClientes.get(shipName.toLowerCase()) || null;
        }

        // Buscar UUID de la receta
        let recetaId = category ? (mapRecetas.get(category.toLowerCase()) || null) : null;
        if (!recetaId) {
          console.warn(`No se pudo resolver receta para la categoría "${category}". Omitiendo pedido ${item.id}.`);
          continue;
        }

        const pedidoIdStr = String(item.id);

        // Agrupar en el mapa para evitar claves primarias duplicadas en el bulk insert
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

      if (pedidosToUpsert.length === 0) {
        console.log("No hay registros válidos para sincronizar.");
        return;
      }

      // 4. Realizar el Upsert masivo (bulk) en Supabase (solo 2 peticiones en total)
      console.log(`Guardando ${pedidosToUpsert.length} cabeceras de pedido en Supabase...`);
      const { error: pedError } = await supabase
        .from('pedidos')
        .upsert(pedidosToUpsert);

      if (pedError) throw pedError;

      // Limpiar detalles antiguos para evitar duplicados por recetas huérfanas
      const pedidoIds = pedidosToUpsert.map(p => p.id);
      const { error: cleanError } = await supabase
        .from('pedido_detalles')
        .delete()
        .in('pedido_id', pedidoIds);

      if (cleanError) throw cleanError;

      console.log(`Guardando ${detallesToUpsert.length} detalles de pedido en Supabase...`);
      const { error: detError } = await supabase
        .from('pedido_detalles')
        .upsert(detallesToUpsert);

      if (detError) throw detError;

      console.log("Sincronización de pedidos completada.");
    } catch (error) {
      console.error("Error al sincronizar pedidos con Supabase:", error);
      throw error;
    }
  },

  /**
   * Obtiene la lista de todos los pedidos desde Supabase y la devuelve en formato plano,
   * ordenada alfabéticamente de la A a la Z.
   */
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
            cliente_facturacion: item.cliente_facturacion?.nombre || '',
            clienteEnvio: item.cliente_envio?.nombre || '',
            cliente_envio: item.cliente_envio?.nombre || '',
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
              cliente_facturacion: item.cliente_facturacion?.nombre || '',
              clienteEnvio: item.cliente_envio?.nombre || '',
              cliente_envio: item.cliente_envio?.nombre || '',
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

      // Ordenar alfabéticamente por cliente de facturación (de la A a la Z)
      flatList.sort((a, b) => {
        const nameA = String(a.clienteFacturacion || '').trim().toLowerCase();
        const nameB = String(b.clienteFacturacion || '').trim().toLowerCase();
        return nameA.localeCompare(nameB);
      });

      return flatList;
    } catch (error) {
      console.error("Error al obtener pedidos desde Supabase:", error);
      throw error;
    }
  },

  /**
   * Asigna o desasigna un operador a un pedido en Supabase
   */
  async actualizarOperadorPedido(pedidoId, operadorId) {
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .update({ operador_id: operadorId || null })
        .eq('id', pedidoId)
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error al actualizar operador del pedido ${pedidoId}:`, error);
      throw error;
    }
  },

  /**
   * Guarda pedidos directamente en Supabase, resolviendo clientes y recetas.
   * Recibe los datos procesados del Excel (array de objetos con cliente_facturacion, cliente_envio, categoria, stems).
   */
  async agregarPedido(data) {
    try {
      // 1. Obtener catálogos de clientes y recetas desde Supabase
      let [clientes, recetas] = await Promise.all([
        ClientesClient.obtenerClientes(),
        RecetaClient.obtenerRecetas()
      ]);

      const mapClientes = new Map(clientes.map(c => [c.nombre.toLowerCase().trim(), c.id]));

      // Rastrear nombres faltantes
      const billNames = new Set();
      const shipNames = new Set();

      for (const item of data) {
        const billName = (item.cliente_facturacion || item.clienteFacturacion || "").trim();
        const shipName = (item.cliente_envio || item.clienteEnvio || "").trim();

        if (billName && !mapClientes.has(billName.toLowerCase())) {
          billNames.add(billName);
        }
        if (shipName && !mapClientes.has(shipName.toLowerCase())) {
          shipNames.add(shipName);
        }
      }

      const missingClientNames = new Set([...billNames, ...shipNames]);

      if (missingClientNames.size > 0) {
        const payloadClientes = [...missingClientNames].map(name => {
          const esBill = billNames.has(name);
          const esShip = shipNames.has(name);
          let tipo = 'Ambos';
          if (esBill && !esShip) tipo = 'Facturación';
          else if (!esBill && esShip) tipo = 'Envío';

          return {
            nombre: name,
            tipo,
            email: '',
            telefono: '',
            direccion: '',
            notas: 'Autogenerado durante carga de pedidos'
          };
        });

        const { data: creadosClientes, error: cliError } = await supabase
          .from('clientes')
          .insert(payloadClientes)
          .select();

        if (cliError) throw cliError;

        if (creadosClientes) {
          creadosClientes.forEach(c => {
            mapClientes.set(c.nombre.toLowerCase().trim(), c.id);
          });
        }
      }

      // Mapear recetas por categoría
      const mapRecetas = new Map();
      recetas.forEach(r => {
        if (r.categoria) {
          const catKey = r.categoria.toLowerCase().trim();
          if (!mapRecetas.has(catKey)) {
            mapRecetas.set(catKey, r.id);
          }
        }
      });

      // Resolver recetas placeholder para categorías faltantes
      const missingCategories = [...new Set(
        data
          .map(item => (item.categoria || "").trim())
          .filter(cat => cat && !mapRecetas.has(cat.toLowerCase()))
      )];

      if (missingCategories.length > 0) {
        const payloadRecetas = missingCategories.map(category => ({
          nombre: `Receta Genérica ${category}`,
          categoria: category,
          instrucciones: "Receta autogenerada para carga de pedidos"
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
        }
      }

      // 2. Construir pedidos y detalles
      const pedidosMap = new Map();
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

        // Generar un ID único para cada pedido basado en el contenido
        const pedidoKey = `${billName}-${shipName}-${item.fecha_ingreso || ''}`;
        if (!pedidosMap.has(pedidoKey)) {
          const pedidoIdStr = crypto.randomUUID();
          pedidosMap.set(pedidoKey, {
            id: pedidoIdStr,
            cliente_facturacion_id: billId,
            cliente_envio_id: shipId,
            fecha_pedido: item.fecha_ingreso || item.fecha || obtenerFechaHoy(),
            estado: 'Pendiente'
          });
        }

        const pedido = pedidosMap.get(pedidoKey);
        detallesToInsert.push({
          pedido_id: pedido.id,
          receta_id: recetaId,
          stems: stemsVal,
          cantidad: 1,
          precio: item.precio || 0
        });
      }

      const pedidosToInsert = Array.from(pedidosMap.values());

      if (pedidosToInsert.length === 0) {
        console.log("No hay registros válidos para guardar.");
        return;
      }

      // 3. Insertar en Supabase
      const { error: pedError } = await supabase
        .from('pedidos')
        .insert(pedidosToInsert);

      if (pedError) throw pedError;

      const { error: detError } = await supabase
        .from('pedido_detalles')
        .insert(detallesToInsert);

      if (detError) throw detError;

      console.log(`${pedidosToInsert.length} pedidos con ${detallesToInsert.length} detalles guardados en Supabase.`);
    } catch (error) {
      console.error("Error al guardar pedidos en Supabase:", error);
      throw error;
    }
  },

  /**
   * Obtiene la lista única de nombres de clientes de facturación
   */
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
