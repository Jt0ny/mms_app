<template>
    <div class="avance-card">
        <div class="section-header">
            <h3 class="section-title">Avance de Operadores</h3>
        </div>

        <div v-if="cargando" class="loading-state">
            <p>Cargando avance de operadores...</p>
        </div>

        <div v-else-if="operadoresAvance.length === 0" class="empty-state">
            <p>📭 No hay planificación o avance de producción registrado hoy.</p>
        </div>

        <div v-else class="operadores-list">
            <div v-for="op in operadoresAvance" :key="op.operadorId" class="operador-item">
                <div class="op-info">
                    <span class="op-nombre">👤 {{ op.nombre }}</span>
                    <span class="op-stems">
                        <strong>{{ op.producido }}</strong> / {{ op.planificado }} <small>tallos</small>
                    </span>
                </div>

                <div class="progress-bar-wrap">
                    <div class="progress-bar-fill" :style="{ width: `${op.porcentaje}%`, background: getProgressColor(op.porcentaje) }"></div>
                </div>

                <div class="op-status">
                    <span :style="{ color: getProgressColor(op.porcentaje) }">
                        {{ op.porcentaje }}% completado
                    </span>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'DashboardAvanceOperador',
    props: {
        operadoresAvance: {
            type: Array,
            default: () => []
        },
        cargando: {
            type: Boolean,
            default: false
        }
    },
    methods: {
        getProgressColor(percentage) {
            if (percentage >= 100) return '#16a34a' // Verde
            if (percentage >= 70) return '#2563eb'  // Azul
            if (percentage >= 35) return '#d97706'  // Naranja
            return '#dc2626' // Rojo
        }
    }
}
</script>

<style scoped>
.avance-card {
    background: var(--bg);
    border: 1px solid var(--border-light);
    border-radius: 12px;
    padding: 24px;
    box-shadow: var(--shadow);
}


.loading-state, .empty-state {
    text-align: center;
    padding: 30px;
    color: var(--text-light);
    font-size: 14px;
}

.operadores-list {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.operador-item {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.op-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
}

.op-nombre {
    font-weight: 600;
    color: var(--text-h);
}

.op-stems {
    color: var(--text-light);
}

.op-stems strong {
    color: var(--text-h);
}

.progress-bar-wrap {
    width: 100%;
    height: 10px;
    background: var(--border-light);
    border-radius: 999px;
    overflow: hidden;
}

.progress-bar-fill {
    height: 100%;
    border-radius: 999px;
    transition: width 0.4s ease;
}

.op-status {
    display: flex;
    justify-content: flex-end;
    font-size: 12px;
    font-weight: 600;
}
</style>
