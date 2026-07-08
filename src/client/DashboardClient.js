import { supabase } from './supabase'
import RecetaClient from './RecetaClient'

export default {
    /**
     * Obtiene los datos completos del dashboard para una fecha dada.
     * Centraliza todas las queries que antes estaban dispersas en DashboardPage.vue.
     * @param {string} fecha — formato 'YYYY-MM-DD'
     */
    async obtenerDatosDashboard(fecha) {
        // 1. Obtener Pedidos del Día
        const { data: pedidosHoy, error: pedErr } = await supabase
            .from('pedidos')
            .select('id, pedido_detalles(stems)')
            .eq('fecha_pedido', fecha)

        let totalStemsPedidos = 0
        if (!pedErr && pedidosHoy) {
            pedidosHoy.forEach(p => {
                if (p.pedido_detalles) {
                    p.pedido_detalles.forEach(d => {
                        totalStemsPedidos += parseInt(d.stems) || 0
                    })
                }
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

        // 3. Obtener Producción del Día
        const { data: produccionesHoy, error: prodErr } = await supabase
            .from('producciones')
            .select(`
                id,
                total,
                operador_id
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

        const avanceOperadores = []
        mapAvance.forEach(val => {
            totalPlanificadosGlobal += val.planificado
            totalProducidosGlobal += val.producido

            if (val.planificado > 0) {
                val.porcentaje = Math.min(100, Math.round((val.producido / val.planificado) * 100))
            } else if (val.producido > 0) {
                val.porcentaje = 100
            }
            avanceOperadores.push(val)
        })

        // Calcular eficiencia global
        let eficienciaGlobal = 0
        if (totalPlanificadosGlobal > 0) {
            eficienciaGlobal = Math.min(100, Math.round((totalProducidosGlobal / totalPlanificadosGlobal) * 100))
        } else if (totalProducidosGlobal > 0) {
            eficienciaGlobal = 100
        }

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
            RecetaClient.obtenerRecetas()
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
                            if (receta.receta_materia_prima) {
                                receta.receta_materia_prima.forEach(rmp => {
                                    const totalReq = rmp.cantidad * cantRamosPlaneados
                                    demandaMP.set(rmp.materia_prima_id, (demandaMP.get(rmp.materia_prima_id) || 0) + totalReq)
                                })
                            }
                            if (receta.receta_materiales) {
                                receta.receta_materiales.forEach(rmat => {
                                    const totalReq = rmat.cantidad * cantRamosPlaneados
                                    demandaMat.set(rmat.material_id, (demandaMat.get(rmat.material_id) || 0) + totalReq)
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
                    texto: `⚠️ Inventario Insuficiente: Se requieren ${demand} tallos de flor "${itemStock?.variedad || 'Desconocida'}" para cubrir la planificación de hoy, pero solo cuentas con ${stockActual} tallos en stock (Déficit: ${stockActual - demand} tallos).`
                })
            }
        })

        demandaMat.forEach((demand, matId) => {
            const itemStock = mapMatStock.get(matId)
            const stockActual = itemStock ? parseInt(itemStock.cantidad) || 0 : 0
            if (stockActual < demand) {
                alertasStock.push({
                    tipo: 'error',
                    texto: `⚠️ Material Insuficiente: Se requieren ${demand} unidades de "${itemStock?.nombre || 'Desconocido'}" para la producción de hoy, pero solo tienes ${stockActual} en inventario (Déficit: ${stockActual - demand} unidades).`
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

        return {
            kpis: {
                totalPedidosStems: totalStemsPedidos,
                eficienciaGlobal,
                totalMermasStems
            },
            avanceOperadores,
            mermasMotivos,
            topMermasInsumos,
            alertasStock
        }
    },

    /**
     * Actualiza el stock de materia prima (usado por MermasPage para descontar inventario)
     * @param {string} id — UUID de la materia prima
     * @param {number} nuevaCantidad — nueva cantidad total
     */
    async actualizarStockMateriaPrima(id, nuevaCantidad) {
        const { error } = await supabase
            .from('materia_prima')
            .update({ cantidad_total: nuevaCantidad })
            .eq('id', id)

        if (error) throw error
    }
}
