import { supabase } from './supabase'
import MaterialClient from './MaterialClient'
import MateriaPrimaClient from './MateriaPrimaClient'

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
                    // Mapeo snake_case a camelCase
                    creadoEn: item.creado_en,
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
                creado_en: data.creadoEn || new Date().toISOString(),
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
                // Mapeo snake_case a camelCase
                creadoEn: resData.creado_en,
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
    },

    /**
     * Registra una merma y actualiza los stocks correspondientes según el tipo.
     * Retorna la nueva merma y un objeto con los stocks actualizados para sincronizar la UI.
     */
    async registrarMermaConDescuento(payload, { materiales, materiaPrima, recetasCompletas }) {
        try {
            // 1. Guardar la merma en la base de datos
            const nuevaMerma = await this.agregarMerma(payload);
            const stocksActualizados = { materiales: [], materiaPrima: [] };
            let mensajeExito = '✓ Merma registrada con éxito.';

            // 2. Descontar del inventario según el tipo
            if (payload.tipo === 'material') {
                const material = materiales.find(m => m.id === payload.referenciaId);
                if (material) {
                    const nuevaCantidad = Math.max(0, (Number(material.cantidad) || 0) - Number(payload.cantidad));
                    
                    try {
                        await MaterialClient.actualizarStockMaterial(material.id, nuevaCantidad);
                        stocksActualizados.materiales.push({ id: material.id, cantidad: nuevaCantidad });
                        mensajeExito = `✓ Merma registrada e inventario de "${material.nombre}" actualizado.`;
                    } catch (e) {
                        console.error('Error al descontar material en merma:', e);
                        mensajeExito = '⚠️ Merma registrada pero hubo un error al descontar inventario de material. Verifica el stock manualmente.';
                    }
                }
            } else if (payload.tipo === 'materia_prima') {
                const mp = materiaPrima.find(m => m.id === payload.referenciaId || m.variedad === payload.referenciaId);
                if (mp) {
                    const nuevaCantidad = Math.max(0, (Number(mp.cantidadTotal) || 0) - Number(payload.cantidad));
                    try {
                        await MateriaPrimaClient.actualizarStockMateriaPrima(mp.id, nuevaCantidad);
                        stocksActualizados.materiaPrima.push({ id: mp.id, cantidadTotal: nuevaCantidad });
                        mensajeExito = `✓ Merma registrada e inventario de "${mp.variedad}" actualizado.`;
                    } catch (e) {
                        console.error('Error al descontar materia prima en merma:', e);
                        mensajeExito = '⚠️ Merma registrada pero hubo un error al descontar inventario de materia prima. Verifica el stock manualmente.';
                    }
                }
            } else if (payload.tipo === 'producto_terminado') {
                const receta = recetasCompletas.find(r => r.id === payload.referenciaId);
                if (receta) {
                    let huboErrorDescuento = false;

                    // Descontar materia prima
                    for (const rmp of (receta.materiaPrima || [])) {
                        const tallosConsumidos = rmp.cantidad * Number(payload.cantidad);
                        const mpItem = materiaPrima.find(m => m.id === rmp.materiaPrimaId);
                        if (mpItem) {
                            const nuevoStock = Math.max(0, (Number(mpItem.cantidadTotal) || 0) - tallosConsumidos);
                            try {
                                await MateriaPrimaClient.actualizarStockMateriaPrima(mpItem.id, nuevoStock);
                                stocksActualizados.materiaPrima.push({ id: mpItem.id, cantidadTotal: nuevoStock });
                            } catch (e) {
                                console.error('Error al descontar materia prima (prod. term.):', e);
                                huboErrorDescuento = true;
                            }
                        }
                    }
                    // Descontar materiales
                    for (const rm of (receta.materiales || [])) {
                        const insumosConsumidos = rm.cantidad * Number(payload.cantidad);
                        const matItem = materiales.find(m => m.id === rm.materialId);
                        if (matItem) {
                            const nuevoStock = Math.max(0, (Number(matItem.cantidad) || 0) - insumosConsumidos);
                            try {
                                await MaterialClient.actualizarStockMaterial(matItem.id, nuevoStock);
                                stocksActualizados.materiales.push({ id: matItem.id, cantidad: nuevoStock });
                            } catch (e) {
                                console.error('Error al descontar material (prod. term.):', e);
                                huboErrorDescuento = true;
                            }
                        }
                    }
                    
                    if (huboErrorDescuento) {
                        mensajeExito = '⚠️ Merma de producto registrada, pero hubo un error descontando algunos componentes del inventario. Verifica el stock manualmente.';
                    } else {
                        mensajeExito = `✓ Merma de producto terminado registrada e inventario ajustado según la receta "${receta.nombre}".`;
                    }
                }
            }

            return { nuevaMerma, stocksActualizados, mensajeExito };
        } catch (error) {
            console.error('Error en registrarMermaConDescuento:', error);
            throw error;
        }
    }
}
