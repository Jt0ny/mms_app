<template>
    <section class="dashboard-section">
        <header class="section-header">
            <h2 class="section-title">Pedidos de Hoy</h2>
            <p class="section-subtitle">Estado en tiempo real de los despachos</p>
        </header>

        <div class="estado-pedidos-card">
            <div v-if="cargando" class="loading-state">
                Cargando estado de pedidos...
            </div>
            <div v-else-if="pedidos.length === 0" class="empty-state">
                <p>No hay pedidos registrados el día de hoy.</p>
            </div>
            <div v-else class="tables-wrapper">
                <!-- Pedidos Pendientes -->
                <div class="table-column">
                    <h3 class="column-title">Pendientes <span class="badge badge-warning count-badge">{{ pedidosPendientes.length }}</span></h3>
                    <div v-if="pedidosPendientes.length === 0" class="empty-state small">
                        <p>No hay pedidos pendientes.</p>
                    </div>
                    <div v-else class="table-container with-scroll">
                        <table class="mms-table">
                            <thead>
                                <tr>
                                    <th>Cliente</th>
                                    <th>Tallos</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="pedido in pedidosPendientes" :key="pedido.id">
                                    <td class="font-medium">{{ pedido.clienteFacturacion }}</td>
                                    <td class="quantity">{{ pedido.stems }}</td>
                                    <td>
                                        <span class="badge" :class="pedido.estado === 'Atrasado' ? 'badge-danger' : 'badge-warning'">
                                            {{ pedido.estado }}
                                        </span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Pedidos Completados -->
                <div class="table-column">
                    <h3 class="column-title">Completados <span class="badge badge-success count-badge">{{ pedidosCompletados.length }}</span></h3>
                    <div v-if="pedidosCompletados.length === 0" class="empty-state small">
                        <p>No hay pedidos completados.</p>
                    </div>
                    <div v-else class="table-container with-scroll">
                        <table class="mms-table">
                            <thead>
                                <tr>
                                    <th>Cliente</th>
                                    <th>Tallos</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="pedido in pedidosCompletados" :key="pedido.id">
                                    <td class="font-medium">{{ pedido.clienteFacturacion }}</td>
                                    <td class="quantity">{{ pedido.stems }}</td>
                                    <td>
                                        <span class="badge badge-success">
                                            {{ pedido.estado }}
                                        </span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>

<script>
export default {
    name: 'DashboardEstadoPedidos',
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
    computed: {
        pedidosPendientes() {
            return this.pedidos.filter(p => p.estado === 'Pendiente' || p.estado === 'Atrasado')
        },
        pedidosCompletados() {
            return this.pedidos.filter(p => p.estado === 'Completado')
        }
    }
}
</script>

<style scoped>
.dashboard-section {
    background: var(--bg);
    border: 1px solid var(--border-light);
    border-radius: 12px;
    padding: 24px;
    box-shadow: var(--shadow);
    height: 100%;
}



.estado-pedidos-card {
    min-height: 200px;
    display: flex;
    flex-direction: column;
}

.loading-state,
.empty-state {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-light);
    font-size: 0.9rem;
    text-align: center;
    padding: 32px;
    background: var(--bg-alt);
    border-radius: 8px;
    border: 1px dashed var(--border);
}

.tables-wrapper {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    width: 100%;
}

@media (max-width: 1024px) {
    .tables-wrapper {
        grid-template-columns: 1fr;
    }
}

.table-column {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.column-title {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--text-main);
    margin: 0;
    padding-bottom: 8px;
    border-bottom: 2px solid var(--border-light);
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.count-badge {
    font-size: 0.7rem;
    padding: 2px 8px;
}

.empty-state.small {
    padding: 20px;
    min-height: 100px;
}

.table-container {
    overflow-x: auto;
    border: none;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    background: var(--bg);
}

.table-container.with-scroll {
    max-height: 350px;
    overflow-y: auto;
}

.table-container.with-scroll::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}
.table-container.with-scroll::-webkit-scrollbar-track {
    background: transparent;
}
.table-container.with-scroll::-webkit-scrollbar-thumb {
    background: var(--border-light);
    border-radius: 4px;
}
.table-container.with-scroll::-webkit-scrollbar-thumb:hover {
    background: var(--border);
}

.mms-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
    text-align: left;
}

.mms-table th {
    background: #1eab55;
    color: #ffffff;
    font-weight: 700;
    padding: 14px 16px;
    text-transform: uppercase;
    font-size: 0.75rem;
    letter-spacing: 0.05em;
    border-bottom: none;
    white-space: nowrap;
}

.mms-table td {
    padding: 14px 16px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.04);
    color: var(--text-main);
}

.mms-table tbody tr:last-child td {
    border-bottom: none;
}

.mms-table tbody tr:hover {
    background: var(--bg-hover);
}

.font-medium {
    font-weight: 500;
}

.quantity {
    font-variant-numeric: tabular-nums;
    color: var(--primary);
    font-weight: 500;
}


</style>
