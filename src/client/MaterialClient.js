import axios from "axios";
import { supabase } from "./supabase";

const API_URL = import.meta.env.VITE_API_MATERIALES_URL;

export default {
  async sincronizarConSupabase() {
    try {

      const response = await axios.get(API_URL);
      const materialesExternos = response.data || [];

      if (materialesExternos.length === 0) {
        return { success: true };
      }

      // 1. Obtener catálogo existente en una sola consulta
      const { data: existentes, error: queryErr } = await supabase
        .from('materiales').select('*'); // Traemos todo para no perder descripciones locales

      if (queryErr) throw queryErr;

      const mapExistentesPorId = new Map(
        (existentes || []).map(e => [String(e.id), e])
      );
      const mapExistentesPorNombre = new Map(
        (existentes || []).map(e => [String(e.nombre).toLowerCase().trim(), e])
      );

      // 2. Preparar los datos (insertar nuevos o actualizar solo cantidad)
      const upsertData = [];
      for (const m of materialesExternos) {
        const idStr = String(m.id);
        const nombreNormalizado = String(m.nombre || '').toLowerCase().trim();
        const cantidadExterna = m.cantidad ?? m.cantidadTotal ?? m.cantidad_total ?? 0;

        const actual = mapExistentesPorId.get(idStr) || mapExistentesPorNombre.get(nombreNormalizado);

        if (actual) {
          // Si existe, preservamos sus datos actuales de la BD (como su ID) y actualizamos cantidad
          upsertData.push({
            ...actual,
            cantidad: cantidadExterna,
            nombre: m.nombre // Por si cambió la capitalización
          });
        } else {
          // Si es completamente nuevo, insertamos
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
      }
      
      return { success: true };
    } catch (error) {
      console.error("Error al sincronizar materiales con Supabase:", error);
      return { success: false, error };
    }
  },

  async obtenerMateriales() {
    try {
      const { data, error } = await supabase
        .from('materiales')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      console.error("Error al obtener materiales desde Supabase:", error);
      return { success: false, error };
    }
  },

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
      
      return { success: true };
    } catch (error) {
      console.error("Error al guardar materiales en Supabase:", error);
      return { success: false, error };
    }
  },

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
      return { success: true };
    } catch (error) {
      console.error("Error al agregar material en Supabase:", error);
      return { success: false, error };
    }
  },

  async actualizarStockMaterial(id, nuevaCantidad) {
    try {
      const { error } = await supabase
        .from('materiales')
        .update({ cantidad: nuevaCantidad })
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error(`Error al actualizar stock de material con ID ${id} en Supabase:`, error);
      return { success: false, error };
    }
  },

  async eliminarMaterial(id) {
    try {
      const { error } = await supabase
        .from('materiales')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error(`Error al eliminar material con ID ${id} en Supabase:`, error);
      return { success: false, error };
    }
  },
};
