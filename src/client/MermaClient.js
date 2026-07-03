import { supabase } from '../supabase'

/**
 * Función auxiliar para verificar si un ID de operador es un UUID válido de Supabase
 */
const isValidUUID = (str) => {
    if (!str) return false;
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return regex.test(str);
};

export default {
    /**
     * Obtiene la lista completa de mermas desde Supabase resolviendo los nombres mediante joins
     */
    async obtenerMermas() {
        try {
            const { data, error } = await supabase
                .from('mermas')
                .select(`
                    id,
                    fecha,
                    tipo,
                    material_id,
                    materia_prima_id,
                    receta_id,
                    cantidad,
                    motivo,
                    operador_id,
                    creado_en,
                    usuarios ( nombre ),
                    materiales ( nombre ),
                    materia_prima ( variedad ),
                    recetas ( nombre )
                `)
                .order('creado_en', { ascending: false });

            if (error) throw error;

            // Transformar las uniones relacionales a la estructura plana original que consume Vue
            return (data || []).map(item => {
                let nombre = 'Desconocido';
                let referenciaId = null;

                if (item.tipo === 'material') {
                    nombre = item.materiales?.nombre || '';
                    referenciaId = item.material_id;
                } else if (item.tipo === 'materia_prima') {
                    nombre = item.materia_prima?.variedad || '';
                    referenciaId = item.materia_prima_id;
                } else if (item.tipo === 'producto_terminado') {
                    nombre = item.recetas?.nombre || '';
                    referenciaId = item.receta_id;
                }

                return {
                    id: item.id,
                    fecha: item.fecha,
                    tipo: item.tipo,
                    referenciaId: referenciaId,
                    nombre: nombre,
                    cantidad: item.cantidad,
                    motivo: item.motivo,
                    creado_en: item.creado_en,
                    operadorId: item.operador_id,
                    operadorNombre: item.usuarios?.nombre || 'sistema'
                };
            });
        } catch (error) {
            console.error('Error al obtener mermas desde Supabase:', error);
            throw error;
        }
    },

    /**
     * Registra una nueva merma en la tabla relacional de Supabase
     */
    async agregarMerma(data) {
        try {
            // Validar que el operadorId tenga estructura de UUID, sino usar null (por ejemplo, si es "sistema")
            const operadorId = isValidUUID(data.operadorId) ? data.operadorId : null;

            // Mapear la referencia genérica a la columna foránea correspondiente en Supabase
            const insertData = {
                fecha: data.fecha,
                tipo: data.tipo,
                cantidad: parseInt(data.cantidad) || 0,
                motivo: data.motivo,
                operador_id: operadorId,
                creado_en: data.creado_en || new Date().toISOString(),
                material_id: data.tipo === 'material' ? data.referenciaId : null,
                materia_prima_id: data.tipo === 'materia_prima' ? String(data.referenciaId) : null,
                receta_id: data.tipo === 'producto_terminado' ? data.referenciaId : null
            };

            const { data: resData, error } = await supabase
                .from('mermas')
                .insert([insertData])
                .select(`
                    id,
                    fecha,
                    tipo,
                    material_id,
                    materia_prima_id,
                    receta_id,
                    cantidad,
                    motivo,
                    operador_id,
                    creado_en,
                    usuarios ( nombre ),
                    materiales ( nombre ),
                    materia_prima ( variedad ),
                    recetas ( nombre )
                `)
                .single();

            if (error) throw error;

            // Devolver el objeto mapeado en formato plano para mantener compatibilidad
            let nombre = 'Desconocido';
            let referenciaId = null;

            if (resData.tipo === 'material') {
                nombre = resData.materiales?.nombre || '';
                referenciaId = resData.material_id;
            } else if (resData.tipo === 'materia_prima') {
                nombre = resData.materia_prima?.variedad || '';
                referenciaId = resData.materia_prima_id;
            } else if (resData.tipo === 'producto_terminado') {
                nombre = resData.recetas?.nombre || '';
                referenciaId = resData.receta_id;
            }

            return {
                id: resData.id,
                fecha: resData.fecha,
                tipo: resData.tipo,
                referenciaId: referenciaId,
                nombre: nombre,
                cantidad: resData.cantidad,
                motivo: resData.motivo,
                creado_en: resData.creado_en,
                operadorId: resData.operador_id,
                operadorNombre: resData.usuarios?.nombre || 'sistema'
            };
        } catch (error) {
            console.error('Error al agregar merma en Supabase:', error);
            throw error;
        }
    },

    /**
     * Elimina un registro de merma por ID
     */
    async eliminarMerma(id) {
        try {
            const { error } = await supabase
                .from('mermas')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error(`Error al eliminar merma con ID ${id} en Supabase:`, error);
            throw error;
        }
    }
}
