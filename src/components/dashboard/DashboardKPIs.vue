<template>
    <div class="stats-grid">
        <article class="stat-card">
            <div class="stat-icon blue"><ClipboardDocumentListIcon class="icon-md" /></div>
            <div class="stat-info">
                <span>Pedidos de Hoy</span>
                <strong>{{ totalPedidosStems }} <small>tallos</small></strong>
            </div>
        </article>

        <article class="stat-card">
            <div class="stat-icon pink"><SunIcon class="icon-md" /></div>
            <div class="stat-info">
                <span>Merma de Hoy</span>
                <strong>{{ totalMermasStems }} <small>tallos</small></strong>
            </div>
        </article>

        <article class="stat-card">
            <div class="stat-icon orange"><ExclamationTriangleIcon class="icon-md" /></div>
            <div class="stat-info">
                <span>Alertas de Stock</span>
                <strong>{{ totalAlertasStock }} <small>insumos</small></strong>
            </div>
        </article>
    </div>
</template>

<script>
import { ClipboardDocumentListIcon, SunIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline'

export default {
    name: 'DashboardKPIs',
    components: {
        ClipboardDocumentListIcon,
        SunIcon,
        ExclamationTriangleIcon
    },
    props: {
        totalPedidosStems: {
            type: Number,
            default: 0
        },
        totalMermasStems: {
            type: Number,
            default: 0
        },
        totalAlertasStock: {
            type: Number,
            default: 0
        }
    }
}
</script>
