<template>
    <div class="page-container materia-prima-page">

        <div class="page-content-wrap">

            <!-- TÍTULO -->
            <h1 class="page-title">Carga de Pedidos</h1>

            <!-- ALERTAS -->
            <Alertas :mensaje="mensaje" />

            <!-- LAYOUT -->
            <div class="main-layout" :class="{ 'with-preview': datosProcesados.length > 0 }">

                <!-- PANEL IZQUIERDO -->
                <div class="left-panel">

                    <!-- UPLOAD -->
                    <CargaArchivo nombreModulo="Ventas" :cargando="cargando" @archivo-seleccionado="procesarArchivo" />

                    <!-- INVENTARIO -->
                    <InventoryTable title="📦 Pedidos Pendientes" :items="pedidosPendientes" :loading="cargandoPedidos"
                        item-label="pedidos en curso" empty-text="📭 No hay datos en los pedidos"
                        @actualizar="cargarPedidos" @sincronizar="sincronizarAPI">
                        <template #header>
                            <th>Cliente</th>
                            <th>Categoría</th>
                            <th>Tallos</th>

                        </template>
                        <template #row="{ item }">
                            <td class="variety">{{ item.clienteFacturacion }}</td>
                            <td>{{ item.categoria }}</td>
                            <td class="quantity">{{ item.stems }}</td>

                        </template>
                    </InventoryTable>

                </div>

                <!-- PANEL DERECHO -->
                <PreviewTable :items="datosProcesados" :loading="cargando" item-label="líneas de pedido encontradas"
                    confirm-text="Guardar Inventario" loading-text="Guardando..." @cancelar="limpiarDatos"
                    @confirmar="confirmarYSubir">
                    <template #header>
                        <th>Cliente (Bill)</th>
                        <th>Destino (Ship)</th>
                        <th>Categoría</th>
                        <th>Tallos</th>

                    </template>
                    <template #row="{ item }">
                        <td class="variety" data-label="Cliente (Bill)" :title="item.cliente_facturacion">{{
                            item.cliente_facturacion }}</td>
                        <td class="variety" data-label="Destino (Ship)" :title="item.cliente_envio">{{
                            item.cliente_envio }}</td>
                        <td class="category" data-label="Categoría">{{ item.categoria }}</td>
                        <td class="quantity" data-label="Tallos">{{ item.stems }}</td>

                    </template>
                </PreviewTable>

            </div>

        </div>

    </div>
</template>
<script>
import PedidoClient from '../client/PedidoClient'
import { useExcel } from '../composables/useExcel.js'
import { usePedidoExcel } from '../composables/usePedidoExcel.js'

import CargaArchivo from '../components/CargaArchivo.vue'
import Alertas from '../components/Alertas.vue'
import InventoryTable from '../components/shared/InventoryTable.vue'
import PreviewTable from '../components/shared/PreviewTable.vue'
import { useMensajes } from '../composables/useMensajes.js'

export default {

    components: {
        CargaArchivo,
        Alertas,
        InventoryTable,
        PreviewTable
    },

    setup() {
        const { mensaje, mostrarMensaje } = useMensajes()
        const { leerExcel, cargandoExcel } = useExcel()
        const { procesarDatosVentas, sincronizarClientes } = usePedidoExcel()
        return { mensaje, mostrarMensaje, leerExcel, cargandoExcel, procesarDatosVentas, sincronizarClientes }
    },

    data() {
        return {
            datosProcesados: [],
            pedidosActual: [],
            cargando: false,
            cargandoPedidos: false
        }
    },

    computed: {
        pedidosPendientes() {
            return this.pedidosActual.filter(p => p.estado !== 'Completado');
        }
    },

    mounted() {
        this.cargarPedidos()
    },

    methods: {
        /* ================= PEDIDOS ================= */
        async cargarPedidos() {
            this.cargandoPedidos = true
            try {
                // Cargar inmediatamente los pedidos locales de Supabase
                const datos = await PedidoClient.obtenerPedidos()
                this.pedidosActual = datos ?? []
            } catch (error) {
                console.error(error)
                this.mostrarMensaje('error', '❌ Error al cargar pedidos', 0)
            } finally {
                this.cargandoPedidos = false
            }
        },

        async sincronizarAPI() {
            this.cargandoPedidos = true
            try {
                this.mostrarMensaje('info', '⚡ Sincronizando pedidos con la API externa...', 0)
                await PedidoClient.sincronizarConSupabase()
                this.mostrarMensaje('exito', '✓ Sincronización exitosa con la API externa')
                await this.cargarPedidos()
            } catch (error) {
                console.error(error)
                this.mostrarMensaje('error', '❌ Error al sincronizar con la API externa')
                this.cargandoPedidos = false
            }
        },

        /* ================= ARCHIVO ================= */
        async procesarArchivo(file) {
            if (!file) return
            try {
                const matrizDatos = await this.leerExcel(file, { header: 1 })
                this.datosProcesados = this.procesarDatosVentas(matrizDatos)

                if (!this.datosProcesados || !this.datosProcesados.length) {
                    this.mostrarMensaje('error', '❌ Datos inválidos o sin registros')
                    return
                }
                this.mostrarMensaje('exito', `✓ ${this.datosProcesados.length} líneas de pedido cargadas`)
            } catch (error) {
                console.error(error)
                this.mostrarMensaje('error', `❌ ${error.message || 'Error al leer Excel'}`)
            }
        },



        /* ================= LIMPIAR ================= */
        limpiarDatos() {
            this.datosProcesados = []
            this.mostrarMensaje('exito', 'Vista previa limpiada')
        },

        /* ================= GUARDAR ================= */
        async confirmarYSubir() {
            if (!this.datosProcesados.length) {
                return
            }

            this.cargando = true

            try {
                await PedidoClient.agregarPedido(this.datosProcesados)

                // Sincronizar nuevos clientes en la base de datos local
                await this.sincronizarClientes(this.datosProcesados)

                this.mostrarMensaje('exito', '✓ Pedidos guardados correctamente')
                this.datosProcesados = []
                await this.cargarPedidos()

            } catch (error) {
                console.error(error)
                this.mostrarMensaje('error', '❌ Error al guardar pedidos', 0)
            } finally {
                this.cargando = false
            }
        }
    }
}
</script>
<style scoped>
.main-layout {
    display: grid;
    grid-template-columns: 1fr;
    gap: 24px;
    margin-top: 24px;
}

.main-layout.with-preview {
    grid-template-columns: minmax(220px, 360px) 1fr;
}

.left-panel {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.variety {
    color: var(--text-h);
    font-weight: 600;
}

.category {
    color: var(--text-h);
    font-weight: 600;
    text-transform: uppercase;
    font-size: 13px;
}

.quantity {
    color: var(--primary);
    font-weight: 700;
}

@media (max-width: 768px) {

    .main-layout,
    .main-layout.with-preview {
        grid-template-columns: 1fr;
    }

    .page-container {
        padding: 12px;
    }
}
</style>