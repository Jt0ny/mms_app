import { supabase } from './supabase'

export default {
    async obtenerProducciones() {
        try {
            const { data, error } = await supabase
                .from('producciones')
                .select(`
                    id,
                    fecha,
                    total,
                    operador_id,
                    creado_en,
                    usuarios ( nombre ),
                    detalle:produccion_detalle (
                        categoria,
                        cantidad
                    )
                `)
                .order('fecha', { ascending: false });

            if (error) throw error;

            return { success: true, data: (data || []).map(p => ({
                id: p.id,
                fecha: p.fecha,
                total: p.total,
                operadorId: p.operador_id,
                operadorNombre: p.usuarios?.nombre || '',
                creadoEn: p.creado_en,
                detalle: p.detalle || []
            }))};
        } catch (error) {
            console.error('Error al obtener producciones:', error);
            return { success: false, error };
        }
    },

    // Registra una nueva producción y descuenta materias primas atómicamente
    async agregarProduccion(payload) {
        try {
            const { data, error } = await supabase.rpc('rpc_registrar_produccion', { 
                payload_produccion: payload 
            });

            if (error) throw error;

            return { success: true, data: { id: data.produccion_id } };
        } catch (error) {
            console.error('Error al agregar producción con RPC:', error);
            return { success: false, error };
        }
    },

    async editarProduccion(id, payload) {
        try {
            // 1. Actualizar la cabecera
            const { error: prodError } = await supabase
                .from('producciones')
                .update({
                    fecha: payload.fecha,
                    total: payload.total
                })
                .eq('id', id);

            if (prodError) throw prodError;

            // 2. Borrar detalles viejos
            const { error: delError } = await supabase
                .from('produccion_detalle')
                .delete()
                .eq('produccion_id', id);

            if (delError) throw delError;

            // 3. Insertar detalles nuevos
            const detallesPayload = payload.detalle.map(d => ({
                produccion_id: id,
                categoria: d.categoria,
                cantidad: d.cantidad
            }));

            const { error: insError } = await supabase
                .from('produccion_detalle')
                .insert(detallesPayload);

            if (insError) throw insError;

            return { success: true, data: { id } };
        } catch (error) {
            console.error('Error al editar producción:', error);
            return { success: false, error };
        }
    },

    async eliminarProduccion(id) {
        try {
            const { error } = await supabase
                .from('producciones')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error al eliminar producción:', error);
            return { success: false, error };
        }
    }
}