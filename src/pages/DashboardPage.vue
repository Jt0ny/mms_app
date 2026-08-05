<template>
    <div class="page-container dashboard-page">
        <div class="page-content-wrap">
            <!-- Encabezado -->
            <header class="page-header">
                <div>
                    <h1 class="page-title">Panel de Control</h1>
                    <p class="page-subtitle">Monitoreo de producción, inventarios y mermas en tiempo real</p>
                </div>
                <div class="header-actions">
                    <button @click="cargarDatosDashboard" :disabled="cargando" class="btn btn-primary">
                        {{ cargando ? '⟳ Cargando...' : '↻ Actualizar Panel' }}
                    </button>
                </div>
            </header>

            <Alertas :mensaje="mensaje" />

            <!-- Alertas Críticas de Stock Reutilizando el Componente Alertas -->
            <div class="alertas-stock-wrap" v-if="alertasStock.length > 0">
                <Alertas v-for="(alerta, index) in alertasStock" :key="index" :mensaje="alerta"
                    class="dashboard-alerta-item" />
            </div>

            <!-- KPIs Principales -->
            <DashboardKPIs :totalPedidosStems="kpis.totalPedidosStems"
                :totalMermasStems="kpis.totalMermasStems" :totalAlertasStock="alertasStock.length" />

            <!-- Layout de Gráficos e Indicadores -->
            <div class="dashboard-layout">
                <!-- Avance de Operadores -->
                <DashboardAvanceOperador :operadoresAvance="avanceOperadores" :cargando="cargando" />

                <!-- Distribución y Análisis de Mermas -->
                <DashboardDistribucionMermas :mermasMotivos="mermasMotivos" :topMermasInsumos="topMermasInsumos"
                    :cargando="cargando" />

                <!-- Estado de Pedidos de Hoy -->
                <DashboardEstadoPedidos :pedidos="estadoPedidos" :cargando="cargando" class="pedidos-widget" />
            </div>
        </div>
    </div>
</template>

<script>
import DashboardClient from '../client/DashboardClient.js'
import Alertas from '../components/Alertas.vue'
import DashboardKPIs from '../components/dashboard/DashboardKPIs.vue'
import DashboardAvanceOperador from '../components/dashboard/DashboardAvanceOperador.vue'
import DashboardDistribucionMermas from '../components/dashboard/DashboardDistribucionMermas.vue'
import DashboardEstadoPedidos from '../components/dashboard/DashboardEstadoPedidos.vue'
import { obtenerFechaHoy } from '../utils/date.js'
import { useMensajes } from '../composables/useMensajes.js'

export default {
    name: 'DashboardPage',
    components: {
        Alertas,
        DashboardKPIs,
        DashboardAvanceOperador,
        DashboardDistribucionMermas,
        DashboardEstadoPedidos
    },
    setup() {
        const { mensaje, mostrarMensaje } = useMensajes()
        return { mensaje, mostrarMensaje }
    },
    data() {
        return {
            cargando: false,
            alertasStock: [],
            kpis: {
                totalPedidosStems: 0,
                totalMermasStems: 0
            },
            avanceOperadores: [],
            mermasMotivos: [],
            topMermasInsumos: [],
            estadoPedidos: []
        }
    },
    mounted() {
        this.cargarDatosDashboard()
    },
    methods: {
        async cargarDatosDashboard() {
            this.cargando = true
            this.alertasStock = []

            const hoy = obtenerFechaHoy()
            
            // 1. Ejecutar las reglas de negocio de auto-completar primero (Side-effects)
            const autoRes = await DashboardClient.autoCompletarPedidos(hoy)
            if (autoRes && !autoRes.success) {
                console.error("Error al auto-completar pedidos:", autoRes.error)
            }
            
            // 2. Traer la información puramente para lectura (Read-only)
            const response = await DashboardClient.obtenerDatosDashboard(hoy)

            if (response.success) {
                const datos = response.data
                this.kpis = datos.kpis
                this.avanceOperadores = datos.avanceOperadores
                this.mermasMotivos = datos.mermasMotivos
                this.topMermasInsumos = datos.topMermasInsumos
                this.alertasStock = datos.alertasStock
                this.estadoPedidos = datos.estadoPedidos
            } else {
                this.mostrarMensaje('error', '❌ Error al cargar los datos del panel de control.')
            }

            this.cargando = false
        }
    }
}
</script>

<style scoped>
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

.pedidos-widget {
    grid-column: 1 / -1;
}

@media (max-width: 1024px) {
    .dashboard-layout {
        grid-template-columns: 1fr;
    }
}
</style>
