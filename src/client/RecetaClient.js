import { supabase } from "./supabase";

export default {
  /**
   * Obtiene la lista de todas las recetas de producción desde Supabase,
   * incluyendo sus materiales y materia prima relacionados.
   */
  async obtenerRecetas() {
    try {
      const { data, error } = await supabase
        .from('recetas')
        .select(`
          id,
          nombre,
          categoria,
          instrucciones,
          total_items,
          fecha_creacion,
          receta_materiales (
            cantidad,
            materiales (
              id,
              nombre,
              descripcion
            )
          ),
          receta_materia_prima (
            cantidad,
            materia_prima (
              id,
              variedad
            )
          )
        `)
        .order('nombre', { ascending: true });

      if (error) throw error;

      // Transformar los datos al formato plano esperado por el frontend de Vue
      return { success: true, data: (data || []).map(item => ({
        id: item.id,
        nombre: item.nombre,
        categoria: item.categoria,
        instrucciones: item.instrucciones || '',
        // Mapeo snake_case a camelCase
        totalItems: item.total_items,
        fechaCreacion: item.fecha_creacion,
        materiales: (item.receta_materiales || []).map(rm => ({
          id: rm.materiales?.id,
          materialId: rm.materiales?.id,
          nombre: rm.materiales?.nombre || rm.materiales?.descripcion || '',
          cantidad: rm.cantidad
        })),
        materiaPrima: (item.receta_materia_prima || []).map(rmp => ({
          id: rmp.materia_prima?.id,
          materiaPrimaId: rmp.materia_prima?.id,
          nombre: rmp.materia_prima?.variedad || '',
          variedad: rmp.materia_prima?.variedad || '',
          cantidad: rmp.cantidad
        }))
      }))};
    } catch (error) {
      console.error("Error al obtener recetas desde Supabase:", error);
      return { success: false, error };
    }
  },

  /**
   * Crea una nueva receta en Supabase con sus relaciones de materiales y materias primas
   */
  async agregarReceta(payload) {
    try {
      const totalItems = (payload.materiales?.length || 0) + (payload.materiaPrima?.length || 0);

      // 1. Insertar en la tabla principal 'recetas'
      const { data: recetaData, error: recetaError } = await supabase
        .from('recetas')
        .insert({
          nombre: payload.nombre,
          categoria: payload.categoria,
          instrucciones: payload.instrucciones,
          total_items: totalItems,
          fecha_creacion: payload.fechaCreacion || new Date().toISOString()
        })
        .select()
        .single();

      if (recetaError) throw recetaError;

      const recetaId = recetaData.id;

      // 2. Insertar los materiales del detalle
      if (payload.materiales && payload.materiales.length > 0) {
        const recetaMaterialesInsert = payload.materiales.map(m => ({
          receta_id: recetaId,
          material_id: m.id,
          cantidad: m.cantidad
        }));

        const { error: matError } = await supabase
          .from('receta_materiales')
          .insert(recetaMaterialesInsert);

        if (matError) throw matError;
      }

      // 3. Insertar la materia prima (flores) del detalle
      if (payload.materiaPrima && payload.materiaPrima.length > 0) {
        const recetaMateriaPrimaInsert = payload.materiaPrima.map(mp => ({
          receta_id: recetaId,
          materia_prima_id: mp.id,
          cantidad: mp.cantidad
        }));

        const { error: mpError } = await supabase
          .from('receta_materia_prima')
          .insert(recetaMateriaPrimaInsert);

        if (mpError) throw mpError;
      }

      return { success: true, data: {
        id: recetaId,
        nombre: recetaData.nombre,
        categoria: recetaData.categoria,
        instrucciones: recetaData.instrucciones,
        // Mapeo snake_case a camelCase
        totalItems: recetaData.total_items,
        fechaCreacion: recetaData.fecha_creacion,
        materiales: payload.materiales || [],
        materiaPrima: payload.materiaPrima || []
      }};
    } catch (error) {
      console.error("Error al agregar receta en Supabase:", error);
      return { success: false, error };
    }
  },

  async editarReceta(id, payload) {
    try {
      const { data: recetaData, error: recetaError } = await supabase
        .from('recetas')
        .update({
          nombre: payload.nombre,
          categoria: payload.categoria,
          instrucciones: payload.instrucciones,
          total_items: (payload.materiales?.length || 0) + (payload.materiaPrima?.length || 0)
        })
        .eq('id', id)
        .select()
        .single();

      if (recetaError) throw recetaError;

      // Borrar materiales existentes y re-insertar
      await supabase.from('receta_materiales').delete().eq('receta_id', id);
      if (payload.materiales && payload.materiales.length > 0) {
        const recetaMaterialesInsert = payload.materiales.map(mat => ({
          receta_id: id,
          material_id: mat.id,
          cantidad: mat.cantidad
        }));
        const { error: matError } = await supabase.from('receta_materiales').insert(recetaMaterialesInsert);
        if (matError) throw matError;
      }

      // Borrar materia prima existente y re-insertar
      await supabase.from('receta_materia_prima').delete().eq('receta_id', id);
      if (payload.materiaPrima && payload.materiaPrima.length > 0) {
        const recetaMateriaPrimaInsert = payload.materiaPrima.map(mp => ({
          receta_id: id,
          materia_prima_id: mp.id,
          cantidad: mp.cantidad
        }));
        const { error: mpError } = await supabase.from('receta_materia_prima').insert(recetaMateriaPrimaInsert);
        if (mpError) throw mpError;
      }

      return { success: true, data: {
        id,
        nombre: recetaData.nombre,
        categoria: recetaData.categoria,
        instrucciones: recetaData.instrucciones,
        totalItems: recetaData.total_items,
        fechaCreacion: recetaData.fecha_creacion,
        materiales: payload.materiales || [],
        materiaPrima: payload.materiaPrima || []
      }};
    } catch (error) {
      console.error("Error al editar receta en Supabase:", error);
      return { success: false, error };
    }
  },

  async eliminarReceta(id) {
    try {
      // Por cascade delete (si está configurado) se borran los detalles.
      // Pero para asegurar, borramos manualmente
      await supabase.from('receta_materiales').delete().eq('receta_id', id);
      await supabase.from('receta_materia_prima').delete().eq('receta_id', id);
      
      const { error } = await supabase.from('recetas').delete().eq('id', id);
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error("Error al eliminar receta en Supabase:", error);
      return { success: false, error };
    }
  }

}