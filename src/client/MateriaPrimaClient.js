import axios from "axios";
import { supabase } from "./supabase";
import { obtenerFechaHoy } from "../utils/date.js";

const API_URL = import.meta.env.VITE_API_MATERIA_PRIMA_URL;

export default {
  /**
   * Sincroniza la materia prima desde la API externa (puerto 8070) hacia Supabase
   */
  async sincronizarConSupabase() {
    try {

      const response = await axios.get(API_URL);
      const materiasPrimasExternas = response.data || [];

      if (materiasPrimasExternas.length === 0) {

        return;
      }

      // 1. Obtener catálogo existente en una sola consulta
      const { data: existentes, error: queryErr } = await supabase
        .from('materia_prima').select('*'); // Traemos todo para no perder fechas o nombres locales

      if (queryErr) throw queryErr;

      const mapExistentesPorId = new Map(
        (existentes || []).map(e => [String(e.id), e])
      );
      const mapExistentesPorVariedad = new Map(
        (existentes || []).map(e => [String(e.variedad).toLowerCase().trim(), e])
      );

      // 2. Preparar los datos (insertar nuevos o actualizar solo cantidad)
      const upsertData = [];
      for (const mp of materiasPrimasExternas) {
        const idStr = String(mp.id);
        const variedadNormalizada = String(mp.variedad || '').toLowerCase().trim();
        const externaCantidad = mp.cantidadTotal ?? mp.cantidad ?? 0;

        // Buscar si existe por ID o por Variedad
        const actual = mapExistentesPorId.get(idStr) || mapExistentesPorVariedad.get(variedadNormalizada);

        if (actual) {
          // Si existe (por ID o por variedad), conservamos su ID de la BD para no romper relaciones
          upsertData.push({
            ...actual,
            cantidad_total: externaCantidad,
            variedad: mp.variedad // Actualizamos por si cambió la capitalización
          });
        } else {
          // Si es nuevo, insertamos todos sus datos
          upsertData.push({
            id: idStr,
            variedad: mp.variedad,
            cantidad_total: externaCantidad,
            fecha_ingreso: mp.fechaIngreso || mp.fecha || obtenerFechaHoy()
          });
        }
      }

      // 3. Una sola petición para hacer upsert masivo
      if (upsertData.length > 0) {
        const { error } = await supabase
          .from('materia_prima')
          .upsert(upsertData);

        if (error) throw error;

      } else {

      }
    } catch (error) {
      console.error("Error al sincronizar materias primas con Supabase:", error);
      return { success: false, error };
    }
  },

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
      const dataMapped = (data || []).map(item => ({
        id: item.id,
        variedad: item.variedad,
        cantidadTotal: item.cantidad_total,
        fechaIngreso: item.fecha_ingreso
      }));
      return { success: true, data: dataMapped };
    } catch (error) {
      console.error("Error al obtener materias primas desde Supabase:", error);
      return { success: false, error };
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
          cantidad_total: mp.cantidadTotal ?? 0,
          fecha_ingreso: mp.fechaIngreso || mp.fecha || obtenerFechaHoy()
        };
      });

      const { error } = await supabase
        .from('materia_prima')
        .upsert(payload);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error("Error al guardar materias primas en Supabase:", error);
      return { success: false, error };
    }
  },

  // Actualiza el stock de materia prima.
  async actualizarStockMateriaPrima(id, nuevaCantidad) {
    try {
      const { error } = await supabase
        .from('materia_prima')
        .update({ cantidad_total: nuevaCantidad })
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error(`Error al actualizar stock de materia prima con ID ${id} en Supabase:`, error);
      return { success: false, error };
    }
  }
}
