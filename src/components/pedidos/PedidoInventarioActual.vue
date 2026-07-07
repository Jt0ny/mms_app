<template>
    <div class="inventory-card">
        <div class="inventory-header">
            <h2>📦 Pedidos Actuales</h2>
            <div style="display: flex; gap: 8px; align-items: center;">
                <button @click="$emit('sincronizar')" :disabled="cargando" class="btn-sync">
                    ⚡ Sincronizar API
                </button>
                <button @click="$emit('actualizar')" :disabled="cargando" class="btn-refresh">
                    {{ cargando ? '⟳ Cargando...' : '↻ Actualizar' }}
                </button>
            </div>
        </div>

        <!-- LOADING -->
        <div v-if="cargando" class="loading-state">
            <p>Cargando pedidos...</p>
        </div>

        <!-- TABLA -->
        <div v-else-if="pedidos.length > 0" class="content-table">
            <div class="inventory-info">
                <p><strong>{{ pedidos.length }}</strong> pedidos en curso</p>
            </div>
            <table class="inventory-table">
                <thead>
                    <tr>
                        <th>Cliente</th>
                        <th>Categoría</th>
                        <th>Tallos</th>

                    </tr>
                </thead>
                <tbody>
                    <tr v-for="item in pedidos" :key="`${item.id}-${item.categoria}`">
                        <td class="variety">{{ item.clienteFacturacion }}</td>
                        <td>{{ item.categoria }}</td>
                        <td class="quantity">{{ item.stems }}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div v-else class="empty-state">
            <p>📭 No hay datos en los pedidos </p>
        </div>
    </div>
</template>
<script>
export default {
    props: {
        pedidos: {
            type: Array,
            default: () => []
        },
        cargando: {
            type: Boolean,
            default: false
        }
    },
    emits: ['actualizar', 'sincronizar'],

    methods: {

    }
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
    background: linear-gradient(135deg,
            var(--primary) 0%,
            var(--primary-dark) 100%);

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


/* ================= ESTADOS ================= */

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

/* ================= INFO ================= */

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

/* ================= TABLA ================= */

.inventory-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
}

.inventory-table thead {
    background: var(--primary);
    color: white;
}

.inventory-table th {
    padding: 14px 16px;

    text-align: left;

    text-transform: uppercase;

    font-size: 12px;
    font-weight: 700;

    letter-spacing: 0.8px;
}

.inventory-table td {
    padding: 14px 16px;
    border-bottom: 1px solid var(--border);
    color: var(--text);
}

.inventory-table tbody tr:hover {
    background: var(--bg-secondary);
}

.variety {
    color: var(--text-h);
    font-weight: 600;
}

.quantity {
    color: var(--primary);
    font-weight: 700;
}

.date {
    color: var(--text-light);
    font-size: 13px;
}

/* ================= RESPONSIVE ================= */

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

    .inventory-table th,
    .inventory-table td {
        padding: 10px 8px;
    }
}
</style>