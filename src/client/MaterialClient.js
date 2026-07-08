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
   * Carga múltiples materiales (bulk import) en el servidor externo (puerto 8090)
   * y luego ejecuta la sincronización con Supabase.
   */
  async cargarMateriales(data) {
    try {
      const response = await axios.post(API_URL + '/importar', data);

      // Intentar sincronizar los datos recién cargados en Supabase (forzando sobreescritura)
      try {
        await this.sincronizarConSupabase(true);
      } catch (syncError) {
        console.warn("Materiales importados en API 8090, pero falló la sincronización con Supabase:", syncError);
      }

      return response.data;
    } catch (error) {
      console.error("Error al guardar materiales en el servidor externo:", error);
      throw error;
    }
  },

  /**
   * Agrega un nuevo material en el servidor externo (puerto 8090)
   * y luego sincroniza los cambios en Supabase.
   */
  async agregarMaterial(data) {
    try {
      const response = await axios.post(API_URL, {
        nombre: data.nombre,
        cantidad: parseInt(data.cantidad) || 0,
        descripcion: data.descripcion || null
      });

      // Sincronizar inmediatamente (forzando sobreescritura)
      try {
        await this.sincronizarConSupabase(true);
      } catch (syncError) {
        console.warn("Material agregado en el puerto 8090, pero falló la sincronización con Supabase:", syncError);
      }

      return response.data;
    } catch (error) {
      console.error("Error al agregar material en el servidor externo:", error);
      throw error;
    }
  },

  /**
   * Actualiza un material existente en el servidor externo (puerto 8090)
   * y luego sincroniza los cambios en Supabase.
   */
  async actualizarMaterial(id, data) {
    try {
      const response = await axios.put(`${API_URL}/${id}`, {
        nombre: data.nombre,
        cantidad: parseInt(data.cantidad) || 0,
        descripcion: data.descripcion || null
      });

      // Sincronizar inmediatamente (forzando sobreescritura)
      try {
        await this.sincronizarConSupabase(true);
      } catch (syncError) {
        console.warn(`Material actualizado en el puerto 8090, pero falló la sincronización del ID ${id} con Supabase:`, syncError);
      }

      return response.data;
    } catch (error) {
      console.error(`Error al actualizar material con ID ${id} en el servidor externo:`, error);
      throw error;
    }
  },

  /**
   * Elimina un material en el servidor externo (puerto 8090)
   * y luego sincroniza los cambios en Supabase (eliminando el registro correspondiente).
   */
  async eliminarMaterial(id) {
    try {
      const response = await axios.delete(`${API_URL}/${id}`);

      // Eliminar el registro en Supabase directamente para mantener consistencia inmediata
      const { error: dbError } = await supabase
        .from('materiales')
        .delete()
        .eq('id', id);

      if (dbError) {
        console.warn(`Material eliminado del puerto 8090, pero falló la eliminación local en Supabase:`, dbError);
      }

      return response.data;
    } catch (error) {
      console.error(`Error al eliminar material con ID ${id} en el servidor externo:`, error);
      throw error;
    }
  },
};
