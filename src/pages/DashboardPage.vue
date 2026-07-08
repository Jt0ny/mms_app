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
import DashboardClient from '../client/DashboardClient.js'
import Alertas from '../components/Alertas.vue'
import DashboardKPIs from '../components/dashboard/DashboardKPIs.vue'
import DashboardAvanceOperador from '../components/dashboard/DashboardAvanceOperador.vue'
import DashboardDistribucionMermas from '../components/dashboard/DashboardDistribucionMermas.vue'

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

            try {
                const today = new Date().toISOString().split('T')[0]
                const datos = await DashboardClient.obtenerDatosDashboard(today)

                this.kpis = datos.kpis
                this.avanceOperadores = datos.avanceOperadores
                this.mermasMotivos = datos.mermasMotivos
                this.topMermasInsumos = datos.topMermasInsumos
                this.alertasStock = datos.alertasStock
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
