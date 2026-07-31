<template>
    <div class="stats-grid">
        <article class="stat-card">
            <div class="stat-icon blue">📋</div>
            <div class="stat-info">
                <span>Pedidos de Hoy</span>
                <strong>{{ totalPedidosStems }} <small>tallos</small></strong>
            </div>
        </article>

        <article class="stat-card">
            <div class="stat-icon pink">🌸</div>
            <div class="stat-info">
                <span>Merma de Hoy</span>
                <strong>{{ totalMermasStems }} <small>tallos</small></strong>
            </div>
        </article>

        <article class="stat-card">
            <div class="stat-icon orange">⚠️</div>
            <div class="stat-info">
                <span>Alertas de Stock</span>
                <strong>{{ totalAlertasStock }} <small>insumos</small></strong>
            </div>
        </article>
    </div>
</template>

<script>
export default {
    name: 'DashboardKPIs',
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

<style scoped>

</style>
