<template>
    <div class="inventory-card">
        <div class="inventory-header">
            <h2>{{ title }}</h2>
            <div class="header-actions">
                <button v-if="showSync" @click="$emit('sincronizar')" :disabled="loading" class="btn-sync">
                    ⚡ Sincronizar API
                </button>
                <button @click="$emit('actualizar')" :disabled="loading" class="btn-refresh">
                    {{ loading ? '⟳ Cargando...' : '↻ Actualizar' }}
                </button>
            </div>
        </div>

        <div v-if="loading" class="loading-state">
            <p>Cargando inventario...</p>
        </div>

        <div v-else-if="items.length > 0" class="content-table">
            <div class="inventory-info">
                <p><strong>{{ items.length }}</strong> {{ itemLabel }}</p>
            </div>
            <table class="inventory-table">
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
export default {
    name: 'InventoryTable',
    props: {
        title: { type: String, required: true },
        items: { type: Array, default: () => [] },
        loading: { type: Boolean, default: false },
        itemLabel: { type: String, default: 'registros' },
        emptyText: { type: String, default: '📭 No hay datos' },
        showSync: { type: Boolean, default: true }
    },
    emits: ['actualizar', 'sincronizar']
}
</script>

<style scoped>
.inventory-card {
    background: var(--bg);
    border-radius: 12px;
    box-shadow: var(--shadow);
    border: 1px solid var(--border-light);
    overflow: hidden;
}

.inventory-header {
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
    color: white;
    padding: 16px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
}

.inventory-header h2 {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
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
}

.loading-state,
.empty-state {
    padding: 40px 20px;
    text-align: center;
    color: var(--text-light);
}

.content-table {
    padding: 20px;
    overflow-y: auto;
    max-height: 450px;
}

.inventory-info {
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--border);
}

.inventory-info p {
    margin: 0;
    color: var(--text-h);
    font-weight: 600;
}

.inventory-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
}

.inventory-table :deep(thead) {
    background: var(--primary);
    color: white;
}

.inventory-table :deep(th) {
    padding: 14px 16px;
    text-align: left;
    text-transform: uppercase;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.8px;
}

.inventory-table :deep(td) {
    padding: 14px 16px;
    border-bottom: 1px solid var(--border);
    color: var(--text);
}

.inventory-table :deep(tbody tr:hover) {
    background: var(--bg-secondary);
}

@media (max-width: 768px) {
    .inventory-header {
        flex-direction: column;
        align-items: flex-start;
    }

    .btn-refresh {
        width: 100%;
    }

    .inventory-table {
        font-size: 12px;
    }

    .inventory-table :deep(th),
    .inventory-table :deep(td) {
        padding: 10px 8px;
    }
}
</style>
