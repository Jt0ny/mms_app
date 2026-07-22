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
.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 20px;
    width: 100%;
}

.stat-card {
    background: var(--bg);
    border: 1px solid var(--border-light);
    border-radius: 12px;
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: var(--shadow);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
}

.stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
}

.stat-icon.blue {
    background: rgba(37, 99, 235, 0.1);
}

.stat-icon.green {
    background: rgba(22, 163, 74, 0.1);
}

.stat-icon.pink {
    background: rgba(219, 39, 119, 0.1);
}

.stat-icon.orange {
    background: rgba(245, 158, 11, 0.1);
}

.stat-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.stat-info span {
    font-size: 13px;
    color: var(--text-light);
    font-weight: 500;
}

.stat-info strong {
    font-size: 22px;
    color: var(--text-h);
    font-weight: 700;
}

.stat-info strong small {
    font-size: 12px;
    color: var(--text-light);
    font-weight: 400;
}
</style>
