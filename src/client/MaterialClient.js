import axios from "axios";
import { supabase } from "./supabase";

const API_URL = "http://localhost:8090/materiales";

export default {
  /**
   * Sincroniza los materiales desde la API externa (puerto 8090) hacia Supabase.
   * Usa upsert para no duplicar registros existentes.
   */
  async sincronizarConSupabase() {
    try {

      const response = await axios.get(API_URL);
      const materialesExternos = response.data || [];

      if (materialesExternos.length === 0) {

        return;
      }

      // 1. Obtener catálogo existente en una sola consulta
      const { data: existentes, error: queryErr } = await supabase
        .from('materiales').select('*'); // Traemos todo para no perder descripciones locales

      if (queryErr) throw queryErr;

      const mapExistentes = new Map(
        (existentes || []).map(e => [String(e.id), e])
      );

      // 2. Preparar los datos (insertar nuevos o actualizar solo cantidad)
      const upsertData = [];
      for (const m of materialesExternos) {
        const idStr = String(m.id);
        const cantidadExterna = m.cantidad ?? m.cantidadTotal ?? m.cantidad_total ?? 0;

        if (mapExistentes.has(idStr)) {
          // Si existe, preservamos sus datos actuales y solo actualizamos la cantidad
          const actual = mapExistentes.get(idStr);
          upsertData.push({
            ...actual,
            cantidad: cantidadExterna
          });
        } else {
          // Si es nuevo, insertamos todos sus datos
          upsertData.push({
            id: idStr,
            nombre: m.nombre,
            cantidad: cantidadExterna,
            descripcion: m.descripcion || null
          });
        }
      }

      // 3. Una sola petición para hacer upsert masivo
      if (upsertData.length > 0) {
        const { error } = await supabase
          .from('materiales')
          .upsert(upsertData);

        if (error) throw error;

      } else {

      }
    } catch (error) {
      console.error("Error al sincronizar materiales con Supabase:", error);
      throw error;
    }
  },

  /**
   * Obtiene la lista de todos los materiales desde Supabase ordenados por nombre
   */
  async obtenerMateriales() {
    try {
      const { data, error } = await supabase
        .from('materiales')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error al obtener materiales desde Supabase:", error);
      throw error;
    }
  },

  /**
   * Carga múltiples materiales (bulk import) directamente en Supabase.
   * Si el nombre ya existe, actualiza la cantidad.
   */
  async cargarMateriales(data) {
    try {
      // Obtener existentes para resolver IDs por nombre
      const { data: existentes, error: queryErr } = await supabase
        .from('materiales')
        .select('id, nombre');

      if (queryErr) throw queryErr;

      const mapExistentes = new Map(
        (existentes || []).map(e => [e.nombre.toLowerCase().trim(), e.id])
      );

      const payload = data.map(m => {
        const nombre = String(m.nombre || '').trim();
        const existingId = mapExistentes.get(nombre.toLowerCase());
        return {
          id: existingId || crypto.randomUUID(),
          nombre,
          cantidad: parseInt(m.cantidad) || 0,
          descripcion: m.descripcion || null
        };
      });

      const { error } = await supabase
        .from('materiales')
        .upsert(payload);

      if (error) throw error;


    } catch (error) {
      console.error("Error al guardar materiales en Supabase:", error);
      throw error;
    }
  },

  /**
   * Agrega un nuevo material directamente en Supabase.
   */
  async agregarMaterial(data) {
    try {
      const { error } = await supabase
        .from('materiales')
        .insert({
          id: crypto.randomUUID(),
          nombre: data.nombre,
          cantidad: parseInt(data.cantidad) || 0,
          descripcion: data.descripcion || null
        });

      if (error) throw error;
    } catch (error) {
      console.error("Error al agregar material en Supabase:", error);
      throw error;
    }
  },

  /**
   * Actualiza el stock de un material directamente en Supabase.
   */
  async actualizarStockMaterial(id, nuevaCantidad) {
    try {
      const { error } = await supabase
        .from('materiales')
        .update({ cantidad: nuevaCantidad })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error(`Error al actualizar stock de material con ID ${id} en Supabase:`, error);
      throw error;
    }
  },

  /**
   * Elimina un material directamente en Supabase.
   */
  async eliminarMaterial(id) {
    try {
      const { error } = await supabase
        .from('materiales')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error(`Error al eliminar material con ID ${id} en Supabase:`, error);
      throw error;
    }
  },
};
