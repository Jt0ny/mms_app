<template>
    <div class="page-container dashboard-page">
        <div class="page-content-wrap">
            <!-- Encabezado con selector de fecha histórica -->
            <div class="page-header">
                <div>
                    <h1 class="page-title">Panel de Control</h1>
                    <p class="page-subtitle">
                        <span v-if="esHoy">Monitoreo de producción, inventarios y mermas en tiempo real</span>
                        <span v-else class="subtitle-historico">
                            Visualizando datos históricos del <strong>{{ formatearFechaVisual(fechaSeleccionada)
                                }}</strong>
                        </span>
                    </p>
                </div>
                <div class="header-actions filter-bar">
                    <input type="date" v-model="fechaSeleccionada" @change="cargarDatosDashboard"
                        class="filter-input filter-date" title="Seleccionar fecha a consultar" />
                    <button v-if="!esHoy" @click="volverAHoy" class="btn btn-secondary"
                        title="Volver a la fecha actual">
                        Hoy
                    </button>
                    <button @click="cargarDatosDashboard" :disabled="cargando"
                        class="btn btn-primary inline-flex-center gap-6">
                        <ArrowPathIcon class="icon-sm" :class="{ 'spin': cargando }" />
                        {{ cargando ? 'Cargando...' : 'Actualizar Panel' }}
                    </button>
                </div>
            </div>

            <Alertas :mensaje="mensaje" />

            <!-- Alertas Críticas de Stock Reutilizando el Componente Alertas -->
            <div class="alertas-stock-wrap" v-if="alertasStock.length > 0">
                <Alertas v-for="(alerta, index) in alertasStock" :key="index" :mensaje="alerta"
                    class="dashboard-alerta-item" />
            </div>

            <!-- KPIs Principales -->
            <DashboardKPIs :totalProcesadoStems="kpis.totalProcesadoStems || 0"
                :totalPlanificadoStems="kpis.totalPlanificadoStems || 0"
                :demandaStems="kpis.demandaStems || kpis.totalPedidosStems || 0"
                :demandaPedidosCount="kpis.demandaPedidosCount || 0" :totalAlertasStock="alertasStock.length" />

            <!-- Layout de Gráficos e Indicadores -->
            <div class="grid-halves">
                <!-- Avance de Operadores -->
                <DashboardAvanceOperador :operadoresAvance="avanceOperadores" :cargando="cargando" />

                <!-- Distribución y Análisis de Mermas -->
                <DashboardDistribucionMermas :mermasMotivos="mermasMotivos" :topMermasInsumos="topMermasInsumos"
                    :cargando="cargando" />

                <!-- Estado de Pedidos de la Fecha -->
                <DashboardEstadoPedidos :pedidos="estadoPedidos" :cargando="cargando" class="pedidos-widget" />
            </div>
        </div>
    </div>
</template>

<script>
import DashboardClient from '../client/DashboardClient.js'
import Alertas from '../components/shared/Alertas.vue'
import DashboardKPIs from '../components/dashboard/DashboardKPIs.vue'
import DashboardAvanceOperador from '../components/dashboard/DashboardAvanceOperador.vue'
import DashboardDistribucionMermas from '../components/dashboard/DashboardDistribucionMermas.vue'
import DashboardEstadoPedidos from '../components/dashboard/DashboardEstadoPedidos.vue'
import { obtenerFechaHoy } from '../utils/date.js'
import { useMensajes } from '../composables/useMensajes.js'
import { ArrowPathIcon } from '@heroicons/vue/24/outline'

export default {
    name: 'DashboardPage',
    components: {
        Alertas,
        DashboardKPIs,
        DashboardAvanceOperador,
        DashboardDistribucionMermas,
        DashboardEstadoPedidos,
        ArrowPathIcon
    },
    setup() {
        const { mensaje, mostrarMensaje } = useMensajes()
        return { mensaje, mostrarMensaje }
    },
    data() {
        const hoy = obtenerFechaHoy()
        return {
            fechaHoy: hoy,
            fechaSeleccionada: hoy,
            cargando: false,
            alertasStock: [],
            kpis: {
                totalProcesadoStems: 0,
                totalPlanificadoStems: 0,
                demandaStems: 0,
                demandaPedidosCount: 0
            },
            avanceOperadores: [],
            mermasMotivos: [],
            topMermasInsumos: [],
            estadoPedidos: []
        }
    },
    computed: {
        esHoy() {
            return this.fechaSeleccionada === this.fechaHoy
        }
    },
    mounted() {
        this.cargarDatosDashboard()
    },
    methods: {
        async cargarDatosDashboard() {
            this.cargando = true
            this.alertasStock = []

            const fechaConsulta = this.fechaSeleccionada || this.fechaHoy

            // 1. Ejecutar las reglas de negocio de auto-completar solo si se consulta el día de hoy
            if (fechaConsulta === this.fechaHoy) {
                const autoRes = await DashboardClient.autoCompletarPedidos(fechaConsulta)
                if (autoRes && !autoRes.success) {
                    console.error("Error al auto-completar pedidos:", autoRes.error)
                }
            }

            // 2. Traer la información puramente para lectura (Read-only) para la fecha seleccionada
            const response = await DashboardClient.obtenerDatosDashboard(fechaConsulta)

            if (response.success) {
                const datos = response.data
                this.kpis = datos.kpis
                this.avanceOperadores = datos.avanceOperadores
                this.mermasMotivos = datos.mermasMotivos
                this.topMermasInsumos = datos.topMermasInsumos
                this.alertasStock = datos.alertasStock
                this.estadoPedidos = datos.estadoPedidos
            } else {
                this.mostrarMensaje('error', 'Error al cargar los datos del panel de control.')
            }

            this.cargando = false
        },
        volverAHoy() {
            this.fechaSeleccionada = this.fechaHoy
            this.cargarDatosDashboard()
        },
        formatearFechaVisual(fechaStr) {
            if (!fechaStr) return ''
            const parts = fechaStr.split('-')
            if (parts.length === 3) {
                return `${parts[2]}/${parts[1]}/${parts[0]}`
            }
            return fechaStr
        }
    }
}
</script>

<style scoped>
.filter-date {
    max-width: 150px;
}

.subtitle-historico {
    color: var(--primary);
    font-weight: 500;
}

.subtitle-historico strong {
    color: var(--text-h);
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
.pedidos-widget {
    grid-column: 1 / -1;
}
</style>
