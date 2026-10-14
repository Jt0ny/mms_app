<template>
    <div class="stats-grid">
        <!-- Tarjeta 1: Total Procesado (Lo que la planta produjo hoy) -->
        <article class="stat-card">
            <div class="stat-icon green">
                <CheckCircleIcon class="icon-md" />
            </div>
            <div class="stat-info">
                <span>Total Procesado</span>
                <strong>{{ formatearNumero(totalProcesadoStems) }} <small>tallos</small></strong>
                <p class="stat-subtext">{{ subtextoProcesado }}</p>
            </div>
        </article>

        <!-- Tarjeta 2: Demanda del Día (Volumen de pedidos a despachar) -->
        <article class="stat-card">
            <div class="stat-icon blue">
                <ClipboardDocumentListIcon class="icon-md" />
            </div>
            <div class="stat-info">
                <span>Demanda del Día</span>
                <strong>{{ formatearNumero(demandaStems) }} <small>tallos</small></strong>
                <p class="stat-subtext">{{ subtextoDemanda }}</p>
            </div>
        </article>

        <!-- Tarjeta 3: Alertas de Stock (Inventario crítico) -->
        <article class="stat-card">
            <div class="stat-icon orange">
                <ExclamationTriangleIcon class="icon-md" />
            </div>
            <div class="stat-info">
                <span>Alertas de Stock</span>
                <strong>{{ totalAlertasStock }} <small>insumos</small></strong>
                <p class="stat-subtext">Inventario bajo mínimo</p>
            </div>
        </article>
    </div>
</template>

<script>
import { CheckCircleIcon, ClipboardDocumentListIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline'

export default {
    name: 'DashboardKPIs',
    components: {
        CheckCircleIcon,
        ClipboardDocumentListIcon,
        ExclamationTriangleIcon
    },
    props: {
        totalProcesadoStems: {
            type: Number,
            default: 0
        },
        totalPlanificadoStems: {
            type: Number,
            default: 0
        },
        demandaStems: {
            type: Number,
            default: 0
        },
        demandaPedidosCount: {
            type: Number,
            default: 0
        },
        totalAlertasStock: {
            type: Number,
            default: 0
        }
    },
    computed: {
        porcentajeAvance() {
            if (!this.totalPlanificadoStems || this.totalPlanificadoStems <= 0) return 0
            return Math.min(100, Math.round((this.totalProcesadoStems * 100) / this.totalPlanificadoStems))
        },
        subtextoProcesado() {
            if (this.totalPlanificadoStems > 0) {
                return `de ${this.formatearNumero(this.totalPlanificadoStems)} planificados (${this.porcentajeAvance}%)`
            }
            return 'Sin planificación asignada'
        },
        subtextoDemanda() {
            if (this.demandaPedidosCount === 1) {
                return '1 pedido a despachar'
            }
            return `${this.demandaPedidosCount} pedidos a despachar`
        }
    },
    methods: {
        formatearNumero(val) {
            return (val || 0).toLocaleString('es-EC')
        }
    }
}
</script>

<style scoped>
.stat-subtext {
    font-size: 12px;
    color: var(--text-light);
    margin: 2px 0 0 0;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
</style>
