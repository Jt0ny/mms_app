import { supabase } from './supabase'
import { UMBRAL_MINIMO_TALLOS, UMBRAL_MINIMO_MATERIALES } from '../utils/stockAlerts.js'


// --- FUNCIONES PRIVADAS COMPARTIDAS ---

async function _queryPedidos(fecha) {
    const { data: pedidosHoy, error } = await supabase
        .from('pedidos')
        .select(`
            id, 
            fecha_pedido,
            estado,
            cliente_facturacion:cliente_facturacion_id(nombre),
            pedido_detalles(
                stems,
                recetas(categoria)
            )
        `)
        .or(`estado.eq.Pendiente,and(fecha_completado.eq.${fecha},estado.eq.Completado),and(fecha_pedido.eq.${fecha},estado.eq.Completado)`)
        .order('fecha_creacion', { ascending: false })

    if (error) throw error
    return pedidosHoy || []
}

async function _queryProduccion(fecha) {
    const { data: produccionesHoy, error } = await supabase
        .from('producciones')
        .select(`
            id,
            total,
            operador_id,
            produccion_detalle(categoria, cantidad)
        `)
        .eq('fecha', fecha)

    if (error) throw error
    return produccionesHoy || []
}

export default {
    // Obtiene los datos completos del dashboard para una fecha dada.
    async obtenerDatosDashboard(fecha) {
        try {
            const { data, error } = await supabase.rpc('rpc_obtener_kpis_dashboard', {
                p_fecha: fecha,
                p_umbral_tallos: UMBRAL_MINIMO_TALLOS,
                p_umbral_materiales: UMBRAL_MINIMO_MATERIALES
            })

            if (error) throw error

            return {
                success: true,
                data: data
            }
        } catch (error) {
            console.error('Error al obtener datos del dashboard:', error)
            return { success: false, error }
        }
    },

    // Evalúa la producción del día y completa automáticamente los pedidos pendientes que puedan ser cubiertos.
    // Este método solo ejecuta side-effects (escrituras) en la base de datos.
    async autoCompletarPedidos(fecha) {
        try {
            // Reutilizar queries compartidas
            const [pedidosHoy, produccionesHoy] = await Promise.all([
                _queryPedidos(fecha),
                _queryProduccion(fecha)
            ]);

            if (!pedidosHoy || !produccionesHoy) return { success: true };

            // Sumar producción total del día agrupada por categoría
            const produccionPorCategoria = new Map();
            produccionesHoy.forEach(prod => {
                if (prod.produccion_detalle) {
                    prod.produccion_detalle.forEach(det => {
                        const cat = (det.categoria || '').toUpperCase().trim();
                        if (cat) {
                            produccionPorCategoria.set(
                                cat,
                                (produccionPorCategoria.get(cat) || 0) + (parseInt(det.cantidad) || 0)
                            );
                        }
                    });
                }
            });

            // Restar la producción ya consumida por pedidos que YA están completados
            const pedidosCompletadosHoy = pedidosHoy.filter(p => p.estado === 'Completado');
            for (const pedido of pedidosCompletadosHoy) {
                for (const det of (pedido.pedido_detalles || [])) {
                    const cat = (det.recetas?.categoria || '').toUpperCase().trim();
                    if (cat) {
                        const actual = produccionPorCategoria.get(cat) || 0;
                        produccionPorCategoria.set(cat, Math.max(0, actual - (parseInt(det.stems) || 0)));
                    }
                }
            }

            // Evaluar pedidos pendientes
            const pedidosPendientes = pedidosHoy.filter(p => p.estado === 'Pendiente');
            const idsParaCompletar = [];

            for (const pedido of pedidosPendientes) {
                const pedidoPorCategoria = new Map();
                for (const det of (pedido.pedido_detalles || [])) {
                    const cat = (det.recetas?.categoria || '').toUpperCase().trim();
                    if (cat) {
                        pedidoPorCategoria.set(
                            cat,
                            (pedidoPorCategoria.get(cat) || 0) + (parseInt(det.stems) || 0)
                        );
                    }
                }

                if (pedidoPorCategoria.size > 0) {
                    let todoCubierto = true;
                    pedidoPorCategoria.forEach((stemsPedidos, cat) => {
                        const stemsProducidos = produccionPorCategoria.get(cat) || 0;
                        if (stemsProducidos < stemsPedidos) {
                            todoCubierto = false;
                        }
                    });

                    if (todoCubierto) {
                        idsParaCompletar.push(pedido.id);
                        // Descontar la producción utilizada para este pedido de la "bolsa"
                        pedidoPorCategoria.forEach((stemsPedidos, cat) => {
                            const stemsActuales = produccionPorCategoria.get(cat) || 0;
                            produccionPorCategoria.set(cat, Math.max(0, stemsActuales - stemsPedidos));
                        });
                    }
                }
            }

            // Actualizar en Supabase los pedidos que ya están cubiertos
            if (idsParaCompletar.length > 0) {
                const { error } = await supabase
                    .from('pedidos')
                    .update({ estado: 'Completado', fecha_completado: fecha })
                    .in('id', idsParaCompletar);
                if (error) throw error;
            }

            return { success: true };
        } catch (error) {
            console.error('Error al auto-completar pedidos:', error);
            return { success: false, error };
        }
    }
}

