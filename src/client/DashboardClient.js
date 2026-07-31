import { supabase } from './supabase'
import { useCatalogos } from '../composables/useCatalogos.js'

export default {
    /**
     * Obtiene los datos completos del dashboard para una fecha dada.
     * Centraliza todas las queries que antes estaban dispersas en DashboardPage.vue.
     * @param {string} fecha — formato 'YYYY-MM-DD'
     */
    async obtenerDatosDashboard(fecha) {
        // 1. Obtener Pedidos del Día y Atrasados (con categorías de recetas para la evaluación)
        const { data: pedidosHoy, error: pedErr } = await supabase
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

        let totalStemsPedidos = 0
        const estadoPedidos = []

        if (!pedErr && pedidosHoy) {
            pedidosHoy.forEach(p => {
                let stemsPedido = 0
                if (p.pedido_detalles) {
                    p.pedido_detalles.forEach(d => {
                        const val = parseInt(d.stems) || 0
                        totalStemsPedidos += val
                        stemsPedido += val
                    })
                }

                let estadoVisual = p.estado
                if (p.estado === 'Pendiente' && p.fecha_pedido < fecha) {
                    estadoVisual = 'Atrasado'
                }

                estadoPedidos.push({
                    id: p.id,
                    clienteFacturacion: p.cliente_facturacion?.nombre || 'Desconocido',
                    estado: estadoVisual,
                    stems: stemsPedido
                })
            })

            // Ordenar: Pendientes primero
            const prioridadEstado = { 'Atrasado': 0, 'Pendiente': 1, 'Completado': 2 }
            estadoPedidos.sort((a, b) => {
                return (prioridadEstado[a.estado] ?? 3) - (prioridadEstado[b.estado] ?? 3)
            })
        }

        // 2. Obtener Planificación del Día
        const { data: planificacionesHoy, error: planErr } = await supabase
            .from('planificaciones')
            .select(`
                id,
                operador_id,
                usuarios ( nombre ),
                planificacion_recetas (
                    cantidad,
                    receta_id
                )
            `)
            .eq('fecha', fecha)

        // 3. Obtener Producción del Día (cabeceras + detalle por categoría)
        const { data: produccionesHoy, error: prodErr } = await supabase
            .from('producciones')
            .select(`
                id,
                total,
                operador_id,
                produccion_detalle(categoria, cantidad)
            `)
            .eq('fecha', fecha)

        // Calcular avance y eficiencia por operador
        const mapAvance = new Map()

        if (!planErr && planificacionesHoy) {
            planificacionesHoy.forEach(plan => {
                const opId = plan.operador_id
                const opNombre = plan.usuarios?.nombre || 'Operador'
                let stemsPlanificados = 0

                if (plan.planificacion_recetas) {
                    plan.planificacion_recetas.forEach(pr => {
                        stemsPlanificados += parseInt(pr.cantidad) || 0
                    })
                }

                mapAvance.set(opId, {
                    operadorId: opId,
                    nombre: opNombre,
                    planificado: stemsPlanificados,
                    producido: 0,
                    porcentaje: 0
                })
            })
        }

        if (!prodErr && produccionesHoy) {
            produccionesHoy.forEach(prod => {
                const opId = prod.operador_id
                const producedStems = parseInt(prod.total) || 0

                if (mapAvance.has(opId)) {
                    const entry = mapAvance.get(opId)
                    entry.producido += producedStems
                } else {
                    mapAvance.set(opId, {
                        operadorId: opId,
                        nombre: 'Operador Extra',
                        planificado: 0,
                        producido: producedStems,
                        porcentaje: 100
                    })
                }
            })
        }

        // Calcular porcentajes individuales
        let totalPlanificadosGlobal = 0
        let totalProducidosGlobal = 0

        // Calcular eficiencia de operadores (lo mantenemos para el gráfico de barras)
        const avanceOperadores = []
        mapAvance.forEach(val => {
            if (val.planificado > 0) {
                val.porcentaje = Math.min(100, Math.round((val.producido / val.planificado) * 100))
            } else if (val.producido > 0) {
                val.porcentaje = 100
            }
            avanceOperadores.push(val)
        })


        // 4. Obtener Mermas del Día
        const { data: mermasHoy, error: mermaErr } = await supabase
            .from('mermas')
            .select(`
                id,
                tipo,
                cantidad,
                motivo,
                materiales ( nombre ),
                materia_prima ( variedad ),
                recetas ( nombre )
            `)
            .eq('fecha', fecha)

        let totalMermasStems = 0
        const mapaMotivos = new Map()
        const mapaInsumos = new Map()

        if (!mermaErr && mermasHoy) {
            mermasHoy.forEach(m => {
                const cant = parseInt(m.cantidad) || 0

                if (m.tipo === 'materia_prima') {
                    totalMermasStems += cant
                }

                const motivo = m.motivo || 'Otro'
                mapaMotivos.set(motivo, (mapaMotivos.get(motivo) || 0) + cant)

                let keyName = ''
                let unidad = 'u'
                if (m.tipo === 'materia_prima') {
                    keyName = m.materia_prima?.variedad || 'Flor Desconocida'
                    unidad = 'tallos'
                } else if (m.tipo === 'material') {
                    keyName = m.materiales?.nombre || 'Material Desconocido'
                    unidad = 'unidades'
                } else if (m.tipo === 'producto_terminado') {
                    keyName = m.recetas?.nombre || 'Producto Desconocido'
                    unidad = 'ramos'
                }

                if (keyName) {
                    if (mapaInsumos.has(keyName)) {
                        mapaInsumos.get(keyName).cantidad += cant
                    } else {
                        mapaInsumos.set(keyName, { nombre: keyName, cantidad: cant, unidad })
                    }
                }
            })
        }

        // Calcular porcentajes de motivos
        const totalMermadoGlobal = Array.from(mapaMotivos.values()).reduce((a, b) => a + b, 0)
        const mermasMotivos = []
        mapaMotivos.forEach((val, key) => {
            const pct = totalMermadoGlobal > 0 ? Math.round((val / totalMermadoGlobal) * 100) : 0
            mermasMotivos.push({ motivo: key, porcentaje: pct })
        })
        mermasMotivos.sort((a, b) => b.porcentaje - a.porcentaje)

        const topMermasInsumos = Array.from(mapaInsumos.values())
            .sort((a, b) => b.cantidad - a.cantidad)
            .slice(0, 5)

        // 5. Cargar stocks para verificar alertas
        const [mpStockRes, matStockRes, recetasCompletas] = await Promise.all([
            supabase.from('materia_prima').select('id, variedad, cantidad_total'),
            supabase.from('materiales').select('id, nombre, cantidad'),
            useCatalogos().obtenerRecetas()
        ])

        const mapMPStock = new Map(mpStockRes.data?.map(m => [m.id, m]) || [])
        const mapMatStock = new Map(matStockRes.data?.map(m => [m.id, m]) || [])

        // Calcular demanda por planificación
        const demandaMP = new Map()
        const demandaMat = new Map()

        if (!planErr && planificacionesHoy) {
            planificacionesHoy.forEach(plan => {
                if (plan.planificacion_recetas) {
                    plan.planificacion_recetas.forEach(pr => {
                        const receta = recetasCompletas.find(r => r.id === pr.receta_id)
                        const cantRamosPlaneados = pr.cantidad

                        if (receta) {
                            if (receta.materiaPrima) {
                                receta.materiaPrima.forEach(rmp => {
                                    const mpId = rmp.materia_prima_id || rmp.id
                                    if (mpId) {
                                        const totalReq = rmp.cantidad * cantRamosPlaneados
                                        demandaMP.set(mpId, (demandaMP.get(mpId) || 0) + totalReq)
                                    }
                                })
                            }
                            if (receta.materiales) {
                                receta.materiales.forEach(rmat => {
                                    const matId = rmat.material_id || rmat.id
                                    if (matId) {
                                        const totalReq = rmat.cantidad * cantRamosPlaneados
                                        demandaMat.set(matId, (demandaMat.get(matId) || 0) + totalReq)
                                    }
                                })
                            }
                        }
                    })
                }
            })
        }

        // Generar alertas de stock
        const alertasStock = []

        demandaMP.forEach((demand, mpId) => {
            const itemStock = mapMPStock.get(mpId)
            const stockActual = itemStock ? parseInt(itemStock.cantidad_total) || 0 : 0
            if (stockActual < demand) {
                alertasStock.push({
                    tipo: 'error',
                    texto: `⚠️ Inventario Insuficiente: Se requieren ${demand} tallos de flor "${itemStock?.variedad || 'Desconocida'}" para cubrir la planificación de hoy, pero solo cuentas con ${stockActual} tallos en stock (Déficit: ${demand - stockActual} tallos).`
                })
            }
        })

        demandaMat.forEach((demand, matId) => {
            const itemStock = mapMatStock.get(matId)
            const stockActual = itemStock ? parseInt(itemStock.cantidad) || 0 : 0
            if (stockActual < demand) {
                alertasStock.push({
                    tipo: 'error',
                    texto: `⚠️ Inventario Insuficiente: Se requieren ${demand} unidades de "${itemStock?.nombre || 'Desconocido'}" para la producción de hoy, pero solo tienes ${stockActual} en inventario (Déficit: ${demand - stockActual} unidades).`
                })
            }
        })

        if (mpStockRes.data) {
            mpStockRes.data.forEach(mp => {
                const stock = parseInt(mp.cantidad_total) || 0
                const yaAlertado = alertasStock.some(a => a.texto.includes(`"${mp.variedad}"`))
                if (stock < 200 && !yaAlertado) {
                    alertasStock.push({
                        tipo: 'info',
                        texto: `💡 Alerta de Reabastecimiento: La variedad de rosa "${mp.variedad}" cuenta con stock mínimo de ${stock} tallos.`
                    })
                }
            })
        }

        if (matStockRes.data) {
            matStockRes.data.forEach(mat => {
                const stock = parseInt(mat.cantidad) || 0
                const yaAlertado = alertasStock.some(a => a.texto.includes(`"${mat.nombre}"`))
                // Puedes ajustar el límite de stock mínimo para materiales si lo deseas (ej. 200, 500, etc.)
                if (stock < 200 && !yaAlertado) {
                    alertasStock.push({
                        tipo: 'info',
                        texto: `💡 Alerta de Reabastecimiento: El material "${mat.nombre}" cuenta con stock bajo de ${stock} unidades.`
                    })
                }
            })
        }

        return {
            kpis: {
                totalPedidosStems: totalStemsPedidos,
                totalMermasStems
            },
            avanceOperadores,
            mermasMotivos,
            topMermasInsumos,
            alertasStock,
            estadoPedidos
        }
    },

    /**
     * Evalúa la producción del día y completa automáticamente los pedidos pendientes que puedan ser cubiertos.
     * Este método solo ejecuta side-effects (escrituras) en la base de datos.
     * @param {string} fecha — formato 'YYYY-MM-DD'
     */
    async autoCompletarPedidos(fecha) {
        // 1. Obtener Pedidos (igual que en obtenerDatosDashboard)
        const { data: pedidosHoy, error: pedErr } = await supabase
            .from('pedidos')
            .select(`
                id, 
                fecha_pedido,
                estado,
                pedido_detalles(
                    stems,
                    recetas(categoria)
                )
            `)
            .or(`estado.eq.Pendiente,and(fecha_completado.eq.${fecha},estado.eq.Completado),and(fecha_pedido.eq.${fecha},estado.eq.Completado)`);

        // 2. Obtener Producción (cabeceras + detalle por categoría)
        const { data: produccionesHoy, error: prodErr } = await supabase
            .from('producciones')
            .select(`
                id,
                produccion_detalle(categoria, cantidad)
            `)
            .eq('fecha', fecha);

        if (pedErr || prodErr || !pedidosHoy || !produccionesHoy) return;

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
            await supabase
                .from('pedidos')
                .update({ estado: 'Completado', fecha_completado: fecha })
                .in('id', idsParaCompletar);
        }
    }
}

