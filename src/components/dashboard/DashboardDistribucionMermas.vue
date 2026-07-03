<template>
    <div class="mermas-analysis-card">
        <div class="card-header">
            <h3>🌸 Análisis de Mermas de Hoy</h3>
        </div>

        <div v-if="cargando" class="loading-state">
            <p>Cargando análisis de mermas...</p>
        </div>

        <div v-else-if="mermasMotivos.length === 0 && topMermasInsumos.length === 0" class="empty-state">
            <p>📭 No se han registrado mermas el día de hoy.</p>
        </div>

        <div v-else class="analysis-layout">
            <!-- Mermas por motivo -->
            <div class="analysis-section" v-if="mermasMotivos.length > 0">
                <h4>Porcentaje por Motivo</h4>
                <div class="motivos-list">
                    <div v-for="item in mermasMotivos" :key="item.motivo" class="motivo-item">
                        <div class="motivo-info">
                            <span class="motivo-name">📍 {{ item.motivo }}</span>
                            <span class="motivo-pct">{{ item.porcentaje }}%</span>
                        </div>
                        <div class="motivo-bar-wrap">
                            <div class="motivo-bar-fill" :style="{ width: `${item.porcentaje}%` }"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Top Insumos Mermados -->
            <div class="analysis-section" v-if="topMermasInsumos.length > 0">
                <h4>Top Insumos más Mermados</h4>
                <ul class="top-insumos-list">
                    <li v-for="(ins, idx) in topMermasInsumos" :key="idx" class="insumo-item">
                        <span class="insumo-rank">#{{ idx + 1 }}</span>
                        <div class="insumo-detail">
                            <span class="insumo-name">{{ ins.nombre }}</span>
                            <span class="insumo-qty">{{ ins.cantidad }} <small>{{ ins.unidad }}</small></span>
                        </div>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'DashboardDistribucionMermas',
    props: {
        mermasMotivos: {
            type: Array,
            default: () => []
        },
        topMermasInsumos: {
            type: Array,
            default: () => []
        },
        cargando: {
            type: Boolean,
            default: false
        }
    }
}
</script>

<style scoped>
.mermas-analysis-card {
    background: var(--bg);
    border: 1px solid var(--border-light);
    border-radius: 12px;
    padding: 24px;
    box-shadow: var(--shadow);
}

.card-header h3 {
    margin: 0 0 20px;
    font-size: 18px;
    color: var(--text-h);
    font-weight: 700;
}

.loading-state,
.empty-state {
    text-align: center;
    padding: 30px;
    color: var(--text-light);
    font-size: 14px;
}

.analysis-layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
}

@media (max-width: 768px) {
    .analysis-layout {
        grid-template-columns: 1fr;
        gap: 20px;
    }
}

.analysis-section h4 {
    margin: 0 0 14px;
    font-size: 14px;
    color: var(--text-h);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-left: 3px solid var(--primary);
    padding-left: 8px;
}

.motivos-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.motivo-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.motivo-info {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    font-weight: 500;
}

.motivo-name {
    color: var(--text);
}

.motivo-pct {
    color: var(--text-h);
    font-weight: 600;
}

.motivo-bar-wrap {
    width: 100%;
    height: 6px;
    background: var(--border-light);
    border-radius: 999px;
    overflow: hidden;
}

.motivo-bar-fill {
    height: 100%;
    background: var(--primary);
    border-radius: 999px;
}

.top-insumos-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.insumo-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px;
    background: var(--bg-hover);
    border-radius: 8px;
}

.insumo-rank {
    font-size: 14px;
    font-weight: 700;
    color: var(--primary);
    width: 24px;
    height: 24px;
    background: rgba(var(--primary-rgb, 219, 39, 119), 0.1);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.insumo-detail {
    display: flex;
    flex-grow: 1;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
}

.insumo-name {
    font-weight: 600;
    color: var(--text-h);
}

.insumo-qty {
    font-weight: 700;
    color: var(--text-light);
}
</style>
