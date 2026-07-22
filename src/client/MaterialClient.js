import axios from "axios";
import { supabase } from "./supabase";

const API_URL = "http://localhost:8090/materiales";

export default {
  /**
   * Sincroniza los materiales desde la API externa (puerto 8090) hacia Supabase.
   * Usa upsert para no duplicar registros existentes.
   */
  async sincronizarConSupabase(forceOverwrite = false) {
    try {
      console.log(`Iniciando sincronización de materiales (forceOverwrite: ${forceOverwrite}) desde API externa...`);
      const response = await axios.get(API_URL);
      const materialesExternos = response.data || [];

      if (materialesExternos.length === 0) {
        console.log("No se encontraron materiales en la API externa para sincronizar.");
        return;
      }

      // Mapear los datos de la API externa al esquema de Supabase
      const payloadUpsert = materialesExternos.map(m => ({
        id: String(m.id),
        nombre: m.nombre,
        cantidad: m.cantidad ?? m.cantidadTotal ?? m.cantidad_total ?? 0,
        descripcion: m.descripcion || null
      }));

      if (!forceOverwrite) {
        // Obtener los IDs y cantidades actuales en Supabase
        const { data: existentes, error: queryErr } = await supabase
          .from('materiales')
          .select('id, cantidad');

        if (!queryErr && existentes) {
          const mapExistentes = new Map(existentes.map(e => [String(e.id), e.cantidad]));

          // Solo insertar los que NO existen en Supabase
          const nuevosRegistros = payloadUpsert.filter(item => !mapExistentes.has(item.id));

          if (nuevosRegistros.length === 0) {
            console.log("No hay nuevos materiales para insertar (preservando stock actual).");
            return;
          }

          const { error: insErr } = await supabase
            .from('materiales')
            .upsert(nuevosRegistros);
          if (insErr) throw insErr;
          return;
        }
      }

      // Realizar upsert en la tabla materiales de Supabase
      const { error } = await supabase
        .from('materiales')
        .upsert(payloadUpsert);

      if (error) throw error;

      console.log(`Sincronización exitosa. ${payloadUpsert.length} materiales sincronizados en Supabase.`);
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

      console.log(`${payload.length} materiales guardados directamente en Supabase.`);
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
   * Actualiza un material existente directamente en Supabase.
   */
  async actualizarMaterial(id, data) {
    try {
      const { error } = await supabase
        .from('materiales')
        .update({
          nombre: data.nombre,
          cantidad: parseInt(data.cantidad) || 0,
          descripcion: data.descripcion || null
        })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error(`Error al actualizar material con ID ${id} en Supabase:`, error);
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
