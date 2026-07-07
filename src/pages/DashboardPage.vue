<template>
    <div class="container dashboard-page">
        <div class="content-wrap">
            <!-- Encabezado -->
            <header class="page-header">
                <div>
                    <h1 class="page-title">Panel de Control</h1>
                    <p class="page-subtitle">Monitoreo de producción, inventarios y mermas en tiempo real</p>
                </div>
                <div class="header-actions">
                    <button @click="cargarDatosDashboard" :disabled="cargando" class="btn-refresh">
                        {{ cargando ? '⟳ Cargando...' : '↻ Actualizar Panel' }}
                    </button>
                </div>
            </header>

            <!-- Alertas Críticas de Stock Reutilizando el Componente Alertas -->
            <div class="alertas-stock-wrap" v-if="alertasStock.length > 0">
                <Alertas v-for="(alerta, index) in alertasStock" :key="index" :mensaje="alerta"
                    class="dashboard-alerta-item" />
            </div>

            <!-- KPIs Principales -->
            <DashboardKPIs :totalPedidosStems="kpis.totalPedidosStems" :eficienciaGlobal="kpis.eficienciaGlobal"
                :totalMermasStems="kpis.totalMermasStems" :totalAlertasStock="alertasStock.length" />

            <!-- Layout de Gráficos e Indicadores -->
            <div class="dashboard-layout">
                <!-- Avance de Operadores -->
                <DashboardAvanceOperador :operadoresAvance="avanceOperadores" :cargando="cargando" />

                <!-- Distribución y Análisis de Mermas -->
                <DashboardDistribucionMermas :mermasMotivos="mermasMotivos" :topMermasInsumos="topMermasInsumos"
                    :cargando="cargando" />
            </div>
        </div>
    </div>
</template>

<script>
import { supabase } from '../supabase'
import Alertas from '../components/Alertas.vue'
import DashboardKPIs from '../components/dashboard/DashboardKPIs.vue'
import DashboardAvanceOperador from '../components/dashboard/DashboardAvanceOperador.vue'
import DashboardDistribucionMermas from '../components/dashboard/DashboardDistribucionMermas.vue'

import RecetaClient from '../client/RecetaClient.js'

export default {
    name: 'DashboardPage',
    components: {
        Alertas,
        DashboardKPIs,
        DashboardAvanceOperador,
        DashboardDistribucionMermas
    },
    data() {
        return {
            cargando: false,
            alertasStock: [],
            kpis: {
                totalPedidosStems: 0,
                eficienciaGlobal: 0,
                totalMermasStems: 0
            },
            avanceOperadores: [],
            mermasMotivos: [],
            topMermasInsumos: []
        }
    },
    mounted() {
        this.cargarDatosDashboard()
    },
    methods: {
        async cargarDatosDashboard() {
            this.cargando = true
            this.alertasStock = []

            const today = new Date().toISOString().split('T')[0]

            try {
                // 1. Obtener Pedidos del Día
                const { data: pedidosHoy, error: pedErr } = await supabase
                    .from('pedidos')
                    .select('id, pedido_detalles(stems)')
                    .eq('fecha_pedido', today)

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
                this.kpis.totalPedidosStems = totalStemsPedidos

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
                    .eq('fecha', today)

                // 3. Obtener Producción del Día
                const { data: produccionesHoy, error: prodErr } = await supabase
                    .from('producciones')
                    .select(`
                        id,
                        total,
                        operador_id
                    `)
                    .eq('fecha', today)

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
                            // Si produjo pero no estaba planificado
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

                const listaAvance = []
                mapAvance.forEach(val => {
                    totalPlanificadosGlobal += val.planificado
                    totalProducidosGlobal += val.producido

                    if (val.planificado > 0) {
                        val.porcentaje = Math.min(100, Math.round((val.producido / val.planificado) * 100))
                    } else if (val.producido > 0) {
                        val.porcentaje = 100
                    }
                    listaAvance.push(val)
                })

                this.avanceOperadores = listaAvance

                // Calcular eficiencia global
                if (totalPlanificadosGlobal > 0) {
                    this.kpis.eficienciaGlobal = Math.min(100, Math.round((totalProducidosGlobal / totalPlanificadosGlobal) * 100))
                } else if (totalProducidosGlobal > 0) {
                    this.kpis.eficienciaGlobal = 100
                } else {
                    this.kpis.eficienciaGlobal = 0
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
                    .eq('fecha', today)

                let totalMermasFlores = 0
                const mapaMotivos = new Map()
                const mapaInsumos = new Map() // llave -> { nombre, cantidad, unidad }

                if (!mermaErr && mermasHoy) {
                    mermasHoy.forEach(m => {
                        const cant = parseInt(m.cantidad) || 0

                        // Solo sumamos flores al KPI principal de mermas
                        if (m.tipo === 'materia_prima') {
                            totalMermasFlores += cant
                        }

                        // Agrupar motivos
                        const motivo = m.motivo || 'Otro'
                        mapaMotivos.set(motivo, (mapaMotivos.get(motivo) || 0) + cant)

                        // Agrupar insumos más mermados
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
                this.kpis.totalMermasStems = totalMermasFlores

                // Calcular porcentajes de motivos
                let totalMermadoGlobal = Array.from(mapaMotivos.values()).reduce((a, b) => a + b, 0)
                const listaMotivos = []
                mapaMotivos.forEach((val, key) => {
                    const pct = totalMermadoGlobal > 0 ? Math.round((val / totalMermadoGlobal) * 100) : 0
                    listaMotivos.push({ motivo: key, porcentaje: pct })
                })
                this.mermasMotivos = listaMotivos.sort((a, b) => b.porcentaje - a.porcentaje)

                // Listar Top 5 insumos mermados
                this.topMermasInsumos = Array.from(mapaInsumos.values())
                    .sort((a, b) => b.cantidad - a.cantidad)
                    .slice(0, 5)

                // 5. Cargar stocks para verificar alertas de stock y planificación
                const [mpStockRes, matStockRes, recetasCompletas] = await Promise.all([
                    supabase.from('materia_prima').select('id, variedad, cantidad_total'),
                    supabase.from('materiales').select('id, nombre, cantidad'),
                    RecetaClient.obtenerRecetas()
                ])

                const mapMPStock = new Map(mpStockRes.data?.map(m => [m.id, m]) || [])
                const mapMatStock = new Map(matStockRes.data?.map(m => [m.id, m]) || [])

                // Calcular la demanda total requerida por la planificación de hoy
                const demandaMP = new Map() // mpId -> cantidad
                const demandaMat = new Map() // matId -> cantidad

                if (!planErr && planificacionesHoy) {
                    planificacionesHoy.forEach(plan => {
                        if (plan.planificacion_recetas) {
                            plan.planificacion_recetas.forEach(pr => {
                                const receta = recetasCompletas.find(r => r.id === pr.receta_id)
                                const cantRamosPlaneados = pr.cantidad // cantidad representa el número de ramos en planificación

                                if (receta) {
                                    // Sumar materias primas necesarias
                                    if (receta.receta_materia_prima) {
                                        receta.receta_materia_prima.forEach(rmp => {
                                            const totalReq = rmp.cantidad * cantRamosPlaneados
                                            demandaMP.set(rmp.materia_prima_id, (demandaMP.get(rmp.materia_prima_id) || 0) + totalReq)
                                        })
                                    }
                                    // Sumar materiales necesarios
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

                // Generar alertas de stock crítico por déficit operativo hoy
                const alertasTemp = []

                demandaMP.forEach((demand, mpId) => {
                    const itemStock = mapMPStock.get(mpId)
                    const stockActual = itemStock ? parseInt(itemStock.cantidad_total) || 0 : 0
                    if (stockActual < demand) {
                        alertasTemp.push({
                            tipo: 'error',
                            texto: `⚠️ Inventario Insuficiente: Se requieren ${demand} tallos de flor "${itemStock?.variedad || 'Desconocida'}" para cubrir la planificación de hoy, pero solo cuentas con ${stockActual} tallos en stock (Déficit: ${stockActual - demand} tallos).`
                        })
                    }
                })

                demandaMat.forEach((demand, matId) => {
                    const itemStock = mapMatStock.get(matId)
                    const stockActual = itemStock ? parseInt(itemStock.cantidad) || 0 : 0
                    if (stockActual < demand) {
                        alertasTemp.push({
                            tipo: 'error',
                            texto: `⚠️ Material Insuficiente: Se requieren ${demand} unidades de "${itemStock?.nombre || 'Desconocido'}" para la producción de hoy, pero solo tienes ${stockActual} en inventario (Déficit: ${stockActual - demand} unidades).`
                        })
                    }
                })

                // Alertas por stock bajo general de materia prima (umbral mínimo de 200 tallos)
                if (mpStockRes.data) {
                    mpStockRes.data.forEach(mp => {
                        const stock = parseInt(mp.cantidad_total) || 0
                        const yaAlertado = alertasTemp.some(a => a.texto.includes(`"${mp.variedad}"`))
                        if (stock < 200 && !yaAlertado) {
                            alertasTemp.push({
                                tipo: 'info',
                                texto: `💡 Alerta de Reabastecimiento: La variedad de rosa "${mp.variedad}" cuenta con stock mínimo de ${stock} tallos.`
                            })
                        }
                    })
                }

                this.alertasStock = alertasTemp

            } catch (err) {
                console.error("Error al cargar dashboard completo:", err)
            } finally {
                this.cargando = false
            }
        }
    }
}
</script>

<style scoped>
.container {
    padding: 24px;
}

.content-wrap {
    max-width: 1400px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 24px;
}

/* Encabezado */
.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.page-title {
    margin: 0 0 6px;
    font-size: clamp(24px, 3vw, 32px);
    font-weight: 800;
    color: var(--text-h);
}

.page-subtitle {
    margin: 0;
    color: var(--text-light);
    font-size: 14px;
}

.btn-refresh {
    background: var(--primary);
    color: white;
    border: none;
    border-radius: 8px;
    padding: 10px 18px;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.25s ease;
    box-shadow: var(--shadow-sm);
}

.btn-refresh:hover:not(:disabled) {
    background: var(--primary-dark);
    transform: translateY(-1px);
}

.btn-refresh:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

/* Alertas */
.alertas-stock-wrap {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
}

.dashboard-alerta-item {
    box-shadow: var(--shadow-sm);
}

/* Layout */
.dashboard-layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    align-items: start;
}

@media (max-width: 1024px) {
    .dashboard-layout {
        grid-template-columns: 1fr;
    }
}
</style>
