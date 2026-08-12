<template>
    <section class="data-card h-full">
        <header class="data-card-header">
            <div>
                <h2>Pedidos de Hoy</h2>
                <p class="data-card-subtitle">Estado en tiempo real de los despachos</p>
            </div>
        </header>

        <div class="data-card-content flex-col">
            <div v-if="cargando" class="loading-state">
                <div class="spinner"></div>
                <p>Cargando estado de pedidos...</p>
            </div>
            <div v-else-if="pedidos.length === 0" class="empty-state-card m-5">
                <p>No hay pedidos registrados el día de hoy.</p>
            </div>
            <div v-else class="grid-halves">
                <!-- Pedidos Pendientes -->
                <div class="table-column">
                    <h3 class="column-title">Pendientes <span class="badge badge-warning count-badge">{{ pedidosPendientes.length }}</span></h3>
                    <div v-if="pedidosPendientes.length === 0" class="empty-state-card p-5">
                        <p>No hay pedidos pendientes.</p>
                    </div>
                    <div v-else class="table-container with-scroll">
                        <table class="data-card-table">
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
                    <div v-if="pedidosCompletados.length === 0" class="empty-state-card p-5">
                        <p>No hay pedidos completados.</p>
                    </div>
                    <div v-else class="table-container with-scroll">
                        <table class="data-card-table">
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

.font-medium {
    font-weight: 500;
}

.quantity {
    font-variant-numeric: tabular-nums;
    color: var(--primary);
    font-weight: 500;
}


</style>
