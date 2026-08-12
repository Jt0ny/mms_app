<template>
    <div class="data-card">
        <div class="data-card-header">
            <h2 class="flex-align-center gap-8">
                <slot name="title-icon" />
                {{ title }}
            </h2>
            <div class="header-actions">
                <button v-if="showSync" @click="$emit('sincronizar')" :disabled="loading" class="btn-sync">
                    <BoltIcon class="icon-sm icon-inline" /> Sincronizar API
                </button>
                <button @click="$emit('actualizar')" :disabled="loading" class="btn-refresh">
                    <ArrowPathIcon class="icon-sm icon-inline" :class="{ 'spin': loading }" /> {{ loading ? 'Cargando...' : 'Actualizar' }}
                </button>
            </div>
        </div>

        <div v-if="loading" class="loading-state">
            <p>Cargando inventario...</p>
        </div>

        <div v-else-if="items.length > 0" class="data-card-content">
            <div class="data-card-info">
                <p><strong>{{ items.length }}</strong> {{ itemLabel }}</p>
            </div>
            <table class="data-card-table">
                <thead>
                    <tr>
                        <slot name="header" />
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(item, index) in items" :key="index">
                        <slot name="row" :item="item" :index="index" />
                    </tr>
                </tbody>
            </table>
        </div>

        <div v-else class="empty-state">
            <p>{{ emptyText }}</p>
        </div>
    </div>
</template>

<script>
import { BoltIcon, ArrowPathIcon } from '@heroicons/vue/24/outline'

export default {
    name: 'InventoryTable',
    components: { BoltIcon, ArrowPathIcon },
    props: {
        title: { type: String, required: true },
        items: { type: Array, default: () => [] },
        loading: { type: Boolean, default: false },
        itemLabel: { type: String, default: 'registros' },
        emptyText: { type: String, default: 'No hay datos' },
        showSync: { type: Boolean, default: true }
    },
    emits: ['actualizar', 'sincronizar']
}
</script>

<style scoped>
.spin {
    animation: spin 1s linear infinite;
}
@keyframes spin {
    100% { transform: rotate(360deg); }
}

.btn-refresh {
    background: rgba(255, 255, 255, 0.2);
    color: white;
    padding: 8px 14px;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    transition: all 0.25s ease;
    display: inline-flex;
    align-items: center;
    gap: 6px;
}

.btn-refresh:hover {
    background: rgba(255, 255, 255, 0.3);
}

.btn-refresh:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.btn-sync {
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.25);
    color: white;
    padding: 8px 14px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    transition: all 0.25s ease;
    display: inline-flex;
    align-items: center;
    gap: 6px;
}

.loading-state,
.empty-state {
    padding: 40px 20px;
    text-align: center;
    color: var(--text-light);
}


@media (max-width: 768px) {
    .data-card-header {
        flex-direction: column;
        align-items: flex-start;
    }

    .btn-refresh, .btn-sync {
        width: 100%;
    }
}
</style>
