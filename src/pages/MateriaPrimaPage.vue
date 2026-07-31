<template>
    <div class="page-container materia-prima-page">

        <div class="page-content-wrap">

            <!-- TÍTULO -->
            <h1 class="page-title">Carga de Materia Prima</h1>

            <!-- ALERTAS -->
            <Alertas :mensaje="mensaje" />

            <!-- LAYOUT -->
            <div class="main-layout-split" :class="{ 'with-preview': datosProcesados.length > 0 }">

                <!-- PANEL IZQUIERDO -->
                <div class="panel-column">

                    <!-- UPLOAD -->
                    <CargaArchivo nombreModulo="Producción" :cargando="cargando"
                        @archivo-seleccionado="procesarArchivo" />

                    <!-- INVENTARIO -->
                    <InventoryTable title="📦 Inventario Actual" :items="inventarioActual" :loading="cargandoInventario"
                        item-label="variedades en inventario" empty-text="📭 No hay datos en el inventario"
                        @actualizar="cargarInventario" @sincronizar="sincronizarAPI">
                        <template #header>
                            <th>Variedad</th>
                            <th>Cantidad (Tallos)</th>
                            <th>Fecha Ingreso</th>
                        </template>
                        <template #row="{ item }">
                            <td class="text-variety">{{ item.variedad }}</td>
                            <td class="text-quantity">{{ item.cantidadTotal }}</td>
                            <td class="text-date">{{ formatearFecha(item.fechaIngreso) }}</td>
                        </template>
                    </InventoryTable>

                </div>

                <!-- PANEL DERECHO -->
                <PreviewTable :items="datosProcesados" :loading="cargando" item-label="variedades encontradas"
                    confirm-text="Guardar Inventario" loading-text="Guardando..." @cancelar="limpiarDatos"
                    @confirmar="confirmarYSubir">
                    <template #header>
                        <th>Variedad</th>
                        <th>Cantidad (Tallos)</th>
                        <th>Fecha Ingreso</th>
                    </template>
                    <template #row="{ item }">
                        <td class="text-variety" data-label="Variedad">{{ item.variedad }}</td>
                        <td class="text-quantity" data-label="Cantidad (Tallos)">{{ item.cantidadTotal }}</td>
                        <td class="text-date" data-label="Fecha Ingreso">{{ item.fechaIngreso }}</td>
                    </template>
                </PreviewTable>

            </div>

        </div>

    </div>
</template>

<script>
import { useExcel } from '../composables/useExcel.js'
import { useInventario } from '../composables/useInventario.js'
import materiaPrimaClient from '../client/MateriaPrimaClient'
import { useCatalogos } from '../composables/useCatalogos.js'

import CargaArchivo from '../components/CargaArchivo.vue'
import Alertas from '../components/Alertas.vue'
import InventoryTable from '../components/shared/InventoryTable.vue'
import PreviewTable from '../components/shared/PreviewTable.vue'
import { useMensajes } from '../composables/useMensajes.js'
import { obtenerFechaHoy, formatearFecha } from '../utils/date.js'

export default {

    components: {
        CargaArchivo,
        Alertas,
        InventoryTable,
        PreviewTable
    },

    setup() {
        const { mensaje, mostrarMensaje } = useMensajes()
        const { leerExcel, normalizarClaves } = useExcel()
        const catalogos = useCatalogos()

        const { inventarioActual, cargandoInventario, cargarInventario, sincronizarAPI } = useInventario({
            obtenerDatos: (force) => catalogos.obtenerMateriaPrima(force),
            sincronizar: () => materiaPrimaClient.sincronizarConSupabase(),
            nombreModulo: 'Materia prima'
        })

        return {
            mensaje, mostrarMensaje, leerExcel, normalizarClaves, catalogos, formatearFecha,
            inventarioActual, cargandoInventario, cargarInventario, sincronizarAPI
        }
    },

    data() {
        return {
            datosProcesados: [],
            cargando: false
        }
    },

    mounted() {
        this.cargarInventario(true)
    },

    methods: {
        /* ================= EXCEL ================= */

        async procesarArchivo(file) {
            try {
                if (!file) return
                const jsonData = await this.leerExcel(file)
                this.datosProcesados = this.procesarDatos(jsonData)

                if (!this.datosProcesados.length) {
                    this.mostrarMensaje('error', '❌ No se encontraron datos válidos')
                    return
                }

                this.mostrarMensaje('exito', `✓ ${this.datosProcesados.length} variedades cargadas`)
            } catch (error) {
                console.error(error)
                this.mostrarMensaje('error', `❌ ${error.message || 'Error al leer archivo Excel'}`)
            }
        },

        /* ================= PROCESAMIENTO ================= */
        procesarDatos(data) {
            const resumen = {}
            data.forEach((fila) => {
                const filaNormalizada = this.normalizarClaves(fila)

                const variedad = filaNormalizada.variety || filaNormalizada.variedad

                const tallos =
                    parseInt(filaNormalizada.totalstems || filaNormalizada.tallos || filaNormalizada.cantidad) || 0

                if (!variedad || tallos <= 0) return

                if (!resumen[variedad]) {
                    resumen[variedad] = {
                        variedad: String(variedad).trim(),
                        cantidadTotal: 0,
                        fechaIngreso: obtenerFechaHoy()
                    }
                }
                resumen[variedad].cantidadTotal += tallos
            })
            return Object.values(resumen)
        },

        /* ================= LIMPIAR ================= */
        limpiarDatos() {
            this.datosProcesados = []
            this.mensaje = {
                tipo: null, texto: ''
            }
        },

        /* ================= GUARDAR ================= */
        async confirmarYSubir() {
            this.cargando = true

            try {
                await materiaPrimaClient.cargarMateriaPrima(this.datosProcesados)

                this.mostrarMensaje(
                    'exito',
                    `✓ ${this.datosProcesados.length} registros guardados`
                )

                this.datosProcesados = []
                await this.cargarInventario(true)

            } catch (error) {
                console.error(error)
                this.mostrarMensaje('error', '❌ Error al guardar registros', 0)
            } finally {
                this.cargando = false
            }
        }
    }
}
</script>
