<template>
    <div class="data-card h-full">
        <div class="data-card-header">
            <h2>Avance de Operadores</h2>
        </div>

        <div class="data-card-content p-6">
            <div v-if="cargando" class="loading-state">
                <div class="spinner"></div>
                <p>Cargando avance de operadores...</p>
            </div>

            <div v-else-if="operadoresAvance.length === 0" class="empty-state-card m-5">
                <p>No hay planificación o avance de producción registrado hoy.</p>
            </div>

            <div v-else class="operadores-list">
                <div v-for="op in operadoresAvance" :key="op.operadorId" class="operador-item">
                    <div class="op-info">
                        <span class="op-nombre flex-align-center gap-6">
                            <UserIcon class="icon-sm" /> {{ op.nombre }}
                        </span>
                        <span class="op-stems">
                            <strong>{{ op.producido }}</strong> / {{ op.planificado }} <small>tallos</small>
                        </span>
                    </div>

                    <div class="progress-track lg">
                        <div class="progress-fill"
                            :style="{ width: `${op.porcentaje}%`, background: getProgressColor(op.porcentaje) }"></div>
                    </div>

                    <div class="op-status">
                        <span :style="{ color: getProgressColor(op.porcentaje) }">
                            {{ op.porcentaje }}% completado
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { UserIcon } from '@heroicons/vue/24/outline'

export default {
    name: 'DashboardAvanceOperador',
    components: { UserIcon },
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
            if (percentage >= 100) return 'var(--primary)' // Verde
            if (percentage >= 70) return 'var(--alert-info-text)'  // Azul
            if (percentage >= 35) return 'var(--warning)'  // Naranja
            return 'var(--error)' // Rojo
        }
    }
}
</script>

<style scoped>
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

.op-status {
    display: flex;
    justify-content: flex-end;
    font-size: 12px;
    font-weight: 600;
}
</style>
