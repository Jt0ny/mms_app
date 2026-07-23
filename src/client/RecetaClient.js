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
      return (data || []).map(item => ({
        id: item.id,
        nombre: item.nombre,
        categoria: item.categoria,
        instrucciones: item.instrucciones || '',
        total_items: item.total_items,
        fecha_creacion: item.fecha_creacion,
        materiales: (item.receta_materiales || []).map(rm => ({
          id: rm.materiales?.id,
          material_id: rm.materiales?.id,
          nombre: rm.materiales?.nombre || rm.materiales?.descripcion || '',
          cantidad: rm.cantidad
        })),
        materiaPrima: (item.receta_materia_prima || []).map(rmp => ({
          id: rmp.materia_prima?.id,
          materia_prima_id: rmp.materia_prima?.id,
          nombre: rmp.materia_prima?.variedad || '',
          variedad: rmp.materia_prima?.variedad || '',
          cantidad: rmp.cantidad
        })),
        receta_materia_prima: item.receta_materia_prima || [],
        receta_materiales: item.receta_materiales || []
      }));
    } catch (error) {
      console.error("Error al obtener recetas desde Supabase:", error);
      throw error;
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
          fecha_creacion: payload.fecha_creacion || new Date().toISOString()
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

      return {
        id: recetaId,
        nombre: recetaData.nombre,
        categoria: recetaData.categoria,
        instrucciones: recetaData.instrucciones,
        total_items: recetaData.total_items,
        fecha_creacion: recetaData.fecha_creacion,
        materiales: payload.materiales || [],
        materiaPrima: payload.materiaPrima || []
      };
    } catch (error) {
      console.error("Error al agregar receta en Supabase:", error);
      throw error;
    }
  },

  /**
   * Actualiza una receta existente y vuelve a asociar sus materiales y materias primas
   */
  async actualizarReceta(id, payload) {
    try {
      const totalItems = (payload.materiales?.length || 0) + (payload.materiaPrima?.length || 0);

      // 1. Actualizar la receta principal
      const { error: recetaError } = await supabase
        .from('recetas')
        .update({
          nombre: payload.nombre,
          categoria: payload.categoria,
          instrucciones: payload.instrucciones,
          total_items: totalItems
        })
        .eq('id', id);

      if (recetaError) throw recetaError;

      // 2. Limpiar materiales y materia prima anteriores
      const { error: delMatError } = await supabase
        .from('receta_materiales')
        .delete()
        .eq('receta_id', id);
      if (delMatError) throw delMatError;

      const { error: delMpError } = await supabase
        .from('receta_materia_prima')
        .delete()
        .eq('receta_id', id);
      if (delMpError) throw delMpError;

      // 3. Insertar nuevos materiales
      if (payload.materiales && payload.materiales.length > 0) {
        const recetaMaterialesInsert = payload.materiales.map(m => ({
          receta_id: id,
          material_id: m.id,
          cantidad: m.cantidad
        }));
        const { error: matError } = await supabase
          .from('receta_materiales')
          .insert(recetaMaterialesInsert);
        if (matError) throw matError;
      }

      // 4. Insertar nueva materia prima
      if (payload.materiaPrima && payload.materiaPrima.length > 0) {
        const recetaMateriaPrimaInsert = payload.materiaPrima.map(mp => ({
          receta_id: id,
          materia_prima_id: mp.id,
          cantidad: mp.cantidad
        }));
        const { error: mpError } = await supabase
          .from('receta_materia_prima')
          .insert(recetaMateriaPrimaInsert);
        if (mpError) throw mpError;
      }

      return {
        id,
        nombre: payload.nombre,
        categoria: payload.categoria,
        instrucciones: payload.instrucciones,
        total_items: totalItems,
        materiales: payload.materiales || [],
        materiaPrima: payload.materiaPrima || []
      };
    } catch (error) {
      console.error(`Error al actualizar receta con ID ${id} en Supabase:`, error);
      throw error;
    }
  },

  /**
   * Elimina una receta de la base de datos (con efecto cascada automático en Supabase)
   */
  async eliminarReceta(id) {
    try {
      const { error } = await supabase
        .from('recetas')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error(`Error al eliminar receta con ID ${id} desde Supabase:`, error);
      throw error;
    }
  }
}