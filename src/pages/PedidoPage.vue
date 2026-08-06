<template>
    <div class="page-container pedido-page">

        <div class="page-content-wrap">


            <h1 class="page-title">Carga de Pedidos</h1>


            <Alertas :mensaje="mensaje" />

            <!-- LAYOUT -->
            <div class="main-layout-split" :class="{ 'with-preview': datosProcesados.length > 0 }">

                <!-- PANEL IZQUIERDO -->
                <div class="panel-column">

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
                            <td class="text-variety">{{ item.clienteFacturacion }}</td>
                            <td class="text-category">{{ item.categoria }}</td>
                            <td class="text-quantity">{{ item.stems }}</td>

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
                        <td class="text-variety" data-label="Cliente (Bill)" :title="item.clienteFacturacion">{{
                            item.clienteFacturacion }}</td>
                        <td class="text-variety" data-label="Destino (Ship)" :title="item.clienteEnvio">{{
                            item.clienteEnvio }}</td>
                        <td class="text-category" data-label="Categoría">{{ item.categoria }}</td>
                        <td class="text-quantity" data-label="Tallos">{{ item.stems }}</td>

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
        const { leerExcel } = useExcel()
        const { procesarDatosVentas, sincronizarClientes } = usePedidoExcel()
        return { mensaje, mostrarMensaje, leerExcel, procesarDatosVentas, sincronizarClientes }
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
        // -- Pedidos --
        async cargarPedidos() {
            this.cargandoPedidos = true
            const response = await PedidoClient.obtenerPedidos()
            
            if (response?.success === false) {
                this.pedidosActual = []
                this.mostrarMensaje('error', '❌ Error al cargar pedidos', 0)
            } else {
                this.pedidosActual = response?.data ?? []
            }
            this.cargandoPedidos = false
        },

        async sincronizarAPI() {
            this.cargandoPedidos = true
            this.mostrarMensaje('info', '⚡ Sincronizando pedidos con la API externa...', 0)
            
            const response = await PedidoClient.sincronizarConSupabase()
            
            if (response?.success === false) {
                this.mostrarMensaje('error', '❌ Error al sincronizar con la API externa')
                this.cargandoPedidos = false
                return
            }

            this.mostrarMensaje('exito', '✓ Sincronización exitosa con la API externa')
            await this.cargarPedidos()
        },

        // -- Archivo --
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



        // -- Limpiar --
        limpiarDatos() {
            this.datosProcesados = []
            this.mostrarMensaje('exito', 'Vista previa limpiada')
        },

        // -- Guardar --
        async confirmarYSubir() {
            if (!this.datosProcesados.length) {
                return
            }

            this.cargando = true

            const response = await PedidoClient.agregarPedido(this.datosProcesados)

            this.cargando = false

            if (response.success) {
                // Sincronizar nuevos clientes en la base de datos local
                await this.sincronizarClientes(this.datosProcesados)

                this.mostrarMensaje('exito', '✓ Pedidos guardados correctamente')
                this.datosProcesados = []
                await this.cargarPedidos()
            } else {
                this.mostrarMensaje('error', '❌ Error al guardar pedidos', 0)
            }
        }
    }
}
</script>