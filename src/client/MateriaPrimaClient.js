import axios from "axios";
import { supabase } from "./supabase";
import { obtenerFechaHoy } from "../utils/date.js";

const API_URL = `http://localhost:8070/materia-prima`;

export default {
  /**
   * Sincroniza la materia prima desde la API externa (puerto 8070) hacia Supabase
   */
  async sincronizarConSupabase(forceOverwrite = false) {
    try {
      console.log(`Iniciando sincronización de materia prima (forceOverwrite: ${forceOverwrite}) desde API externa...`);
      const response = await axios.get(API_URL);
      const materiasPrimasExternas = response.data || [];

      if (materiasPrimasExternas.length === 0) {
        console.log("No se encontró materia prima en la API externa para sincronizar.");
        return;
      }

      // Mapear los datos de la API externa al esquema de Supabase
      const payloadUpsert = materiasPrimasExternas.map(mp => ({
        id: String(mp.id),
        variedad: mp.variedad,
        cantidad_total: mp.cantidadTotal ?? mp.cantidad_total ?? mp.cantidad ?? 0,
        fecha_ingreso: mp.fecha || mp.fecha_ingreso || obtenerFechaHoy()
      }));

      if (!forceOverwrite) {
        // Obtener los IDs y cantidades actuales en Supabase
        const { data: existentes, error: queryErr } = await supabase
          .from('materia_prima')
          .select('id, cantidad_total');

        if (!queryErr && existentes) {
          const mapExistentes = new Map(existentes.map(e => [String(e.id), e.cantidad_total]));

          // Solo insertar los que NO existen en Supabase
          const nuevosRegistros = payloadUpsert.filter(item => !mapExistentes.has(item.id));

          if (nuevosRegistros.length === 0) {
            console.log("No hay nuevas materias primas para insertar (preservando stock actual).");
            return;
          }

          const { error: insErr } = await supabase
            .from('materia_prima')
            .upsert(nuevosRegistros);
          if (insErr) throw insErr;
          return;
        }
      }

      // Realizar upsert en la tabla materia_prima de Supabase
      const { error } = await supabase
        .from('materia_prima')
        .upsert(payloadUpsert);

      if (error) {
        throw error;
      }
      console.log(`Sincronización exitosa. ${payloadUpsert.length} materias primas sincronizadas en Supabase.`);
    } catch (error) {
      console.error("Error al sincronizar materias primas con Supabase:", error);
      throw error;
    }
  },

  /**
   * Obtiene la lista de todas las materias primas desde Supabase
   */
  async obtenerMateriaPrima() {
    try {
      const { data, error } = await supabase
        .from('materia_prima')
        .select('*')
        .order('variedad', { ascending: true });

      if (error) {
        throw error;
      }

      // Mapear los nombres de campos para asegurar compatibilidad con camelCase y snake_case en los componentes Vue
      return (data || []).map(item => ({
        id: item.id,
        variedad: item.variedad,
        cantidad_total: item.cantidad_total,
        cantidadTotal: item.cantidad_total,
        fecha: item.fecha_ingreso,
        fecha_ingreso: item.fecha_ingreso
      }));
    } catch (error) {
      console.error("Error al obtener materias primas desde Supabase:", error);
      throw error;
    }
  },

  /**
   * Carga múltiples materias primas (bulk import) directamente en Supabase.
   * Si la variedad ya existe, actualiza la cantidad.
   */
  async cargarMateriaPrima(data) {
    try {
      // Obtener existentes para resolver IDs por variedad
      const { data: existentes, error: queryErr } = await supabase
        .from('materia_prima')
        .select('id, variedad');

      if (queryErr) throw queryErr;

      const mapExistentes = new Map(
        (existentes || []).map(e => [e.variedad.toLowerCase().trim(), e.id])
      );

      const payload = data.map(mp => {
        const variedad = String(mp.variedad || '').trim();
        const existingId = mapExistentes.get(variedad.toLowerCase());
        return {
          id: existingId || crypto.randomUUID(),
          variedad,
          cantidad_total: mp.cantidad_total ?? mp.cantidadTotal ?? 0,
          fecha_ingreso: mp.fecha_ingreso || mp.fecha || obtenerFechaHoy()
        };
      });

      const { error } = await supabase
        .from('materia_prima')
        .upsert(payload);

      if (error) throw error;

      console.log(`${payload.length} materias primas guardadas directamente en Supabase.`);
    } catch (error) {
      console.error("Error al guardar materias primas en Supabase:", error);
      throw error;
    }
  },

  /**
   * Actualiza el stock de materia prima.
   * @param {string} id — UUID de la materia prima
   * @param {number} nuevaCantidad — nueva cantidad total
   */
  async actualizarStockMateriaPrima(id, nuevaCantidad) {
    const { error } = await supabase
      .from('materia_prima')
      .update({ cantidad_total: nuevaCantidad })
      .eq('id', id);

    if (error) throw error;
  }
}
