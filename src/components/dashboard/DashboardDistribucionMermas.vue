<template>
  <div class="data-card h-full">
      <div class="data-card-header">
          <div class="flex-align-center gap-8">
              <SunIcon class="icon-lg text-primary" />
              <h2 style="margin: 0;">Análisis de Mermas de Hoy</h2>
          </div>
      </div>

      <div class="data-card-content p-6">
          <div v-if="cargando" class="loading-state">
              <div class="spinner"></div>
              <p>Cargando análisis de mermas...</p>
          </div>

          <div v-else-if="mermasMotivos.length === 0 && topMermasInsumos.length === 0" class="empty-state-card m-5">
              <p>No se han registrado mermas el día de hoy.</p>
          </div>

          <div v-else class="grid-halves">
            <!-- Mermas por motivo -->
            <div class="analysis-section" v-if="mermasMotivos.length > 0">
                <h4>Porcentaje por Motivo</h4>
                <div class="motivos-list">
                    <div v-for="item in mermasMotivos" :key="item.motivo" class="motivo-item">
                        <div class="motivo-info">
                            <span class="motivo-name">{{ item.motivo }}</span>
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
  </div>
</template>

<script>
import { SunIcon } from '@heroicons/vue/24/outline'

export default {
    name: 'DashboardDistribucionMermas',
    components: { SunIcon },
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
