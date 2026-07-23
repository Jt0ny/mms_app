import { supabase } from './supabase'

export default {
    /**
     * Obtiene todas las planificaciones desde Supabase con sus relaciones resueltas
     */
    async obtenerPlanificaciones() {
        try {
            const { data, error } = await supabase
                .from('planificaciones')
                .select(`
                    id,
                    operador_id,
                    fecha,
                    creado_en,
                    usuarios (
                        nombre
                    ),
                    planificacion_recetas (
                        cantidad,
                        recetas (
                            id,
                            nombre
                        )
                    )
                `)
                .order('creado_en', { ascending: false });

            if (error) throw error;

            return (data || []).map(item => ({
                id: item.id,
                operadorId: item.operador_id,
                operadorNombre: item.usuarios?.nombre || 'Operador Desconocido',
                fecha: item.fecha,
                creado_en: item.creado_en,
                recetas: (item.planificacion_recetas || []).map(pr => ({
                    recetaId: pr.recetas?.id,
                    nombre: pr.recetas?.nombre || 'Receta Desconocida',
                    cantidad: pr.cantidad
                }))
            }));
        } catch (error) {
            console.error('Error al obtener planificaciones desde Supabase:', error);
            throw error;
        }
    },

    /**
     * Obtiene las planificaciones de una fecha específica
     */
    async obtenerPlanificacionesPorFecha(fecha) {
        try {
            const { data, error } = await supabase
                .from('planificaciones')
                .select(`
                    id,
                    operador_id,
                    fecha,
                    creado_en,
                    usuarios (nombre),
                    planificacion_recetas (
                        cantidad,
                        recetas (
                            id,
                            nombre,
                            categoria
                        )
                    )
                `)
                .eq('fecha', fecha)
                .order('creado_en', { ascending: false });

            if (error) throw error;

            return (data || []).map(item => ({
                id: item.id,
                operadorId: item.operador_id,
                operadorNombre: item.usuarios?.nombre || 'Operador Desconocido',
                fecha: item.fecha,
                creado_en: item.creado_en,
                recetas: (item.planificacion_recetas || []).map(pr => ({
                    recetaId: pr.recetas?.id,
                    nombre: pr.recetas?.nombre || 'Receta Desconocida',
                    categoria: pr.recetas?.categoria || '',
                    cantidad: pr.cantidad
                }))
            }));
        } catch (error) {
            console.error('Error al obtener planificaciones por fecha desde Supabase:', error);
            throw error;
        }
    },

    /**
     * Elimina TODAS las planificaciones de una fecha específica
     */
    async eliminarPlanificacionesPorFecha(fecha) {
        try {
            const { error } = await supabase
                .from('planificaciones')
                .delete()
                .eq('fecha', fecha);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error al eliminar planificaciones por fecha en Supabase:', error);
            throw error;
        }
    },

    /**
     * Obtiene las planificaciones de un operador específico
     */
    async obtenerPlanificacionesPorOperador(operadorId) {
        try {
            const { data, error } = await supabase
                .from('planificaciones')
                .select(`
                    id,
                    operador_id,
                    fecha,
                    creado_en,
                    usuarios (
                        nombre
                    ),
                    planificacion_recetas (
                        cantidad,
                        recetas (
                            id,
                            nombre
                        )
                    )
                `)
                .eq('operador_id', operadorId)
                .order('creado_en', { ascending: false });

            if (error) throw error;

            return (data || []).map(item => ({
                id: item.id,
                operadorId: item.operador_id,
                operadorNombre: item.usuarios?.nombre || 'Operador Desconocido',
                fecha: item.fecha,
                creado_en: item.creado_en,
                recetas: (item.planificacion_recetas || []).map(pr => ({
                    recetaId: pr.recetas?.id,
                    nombre: pr.recetas?.nombre || 'Receta Desconocida',
                    cantidad: pr.cantidad
                }))
            }));
        } catch (error) {
            console.error('Error al obtener planificaciones del operador desde Supabase:', error);
            throw error;
        }
    },

    /**
     * Crea una nueva planificación y sus relaciones en Supabase.
     * Con la Migración B activa, lanzará un error si el operador ya tiene
     * planificación para esa fecha (UNIQUE constraint).
     * @param {{ operadorId: string, operadorNombre: string, fecha: string, recetas: Array<{ recetaId: string, nombre: string, cantidad: number }> }} data
     */
    async crearPlanificacion(data) {
        try {
            const { data: planData, error: planError } = await supabase
                .from('planificaciones')
                .insert({
                    operador_id: data.operadorId,
                    fecha: data.fecha,
                    creado_en: data.creado_en || new Date().toISOString()
                })
                .select()
                .single();

            if (planError) throw planError;

            const planId = planData.id;

            if (data.recetas && data.recetas.length > 0) {
                const insertRecetas = data.recetas.map(r => ({
                    planificacion_id: planId,
                    receta_id: r.recetaId,
                    cantidad: parseInt(r.cantidad) || 0
                }));

                const { error: relError } = await supabase
                    .from('planificacion_recetas')
                    .insert(insertRecetas);

                if (relError) throw relError;
            }

            return {
                id: planId,
                operadorId: planData.operador_id,
                operadorNombre: data.operadorNombre,
                fecha: planData.fecha,
                creado_en: planData.creado_en,
                recetas: data.recetas || []
            };
        } catch (error) {
            console.error('Error al crear planificación en Supabase:', error);
            throw error;
        }
    },

    /**
     * Elimina una planificación por ID (ON DELETE CASCADE se encarga de los detalles)
     */
    async eliminarPlanificacion(id) {
        try {
            const { error } = await supabase
                .from('planificaciones')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error al eliminar planificación en Supabase:', error);
            throw error;
        }
    },

}
