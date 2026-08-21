<template>
    <div class="page-container materia-prima-page">

        <div class="page-content-wrap">

            <h1 class="page-title">Carga de Materia Prima</h1>

            <Alertas :mensaje="mensaje" />

            <div class="main-layout-split" :class="{ 'with-preview': datosProcesados.length > 0 }">

                <!-- PANEL IZQUIERDO -->
                <div class="panel-column">

                    <!-- UPLOAD -->
                    <CargaArchivo nombreModulo="Producción" :cargando="cargando"
                        @archivo-seleccionado="procesarArchivo" />

                    <!-- INVENTARIO -->
                    <InventarioTable titulo="Inventario Actual" :items="inventarioActual" :cargando="cargandoInventario"
                        etiqueta-item="insumos" texto-vacio="No hay materia prima registrada"
                        @actualizar="cargarInventario(true)" @sincronizar="sincronizarAPI">
                        <template #title-icon><SunIcon class="icon-lg text-white" /></template>
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
                    </InventarioTable>

                </div>

                <!-- PANEL DERECHO -->
                <VistaPreviaTable :items="datosProcesados" :cargando="cargando" etiqueta-item="variedades encontradas"
                    texto-confirmar="Actualizar Inventario" texto-cargando="Actualizando..." @cancelar="limpiarDatos"
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
                </VistaPreviaTable>

            </div>

        </div>

    </div>
</template>

<script>
import { useExcel } from '../composables/useExcel.js'
import { useInventario } from '../composables/useInventario.js'
import MateriaPrimaClient from '../client/MateriaPrimaClient'
import { useCatalogos } from '../composables/useCatalogos.js'

import CargaArchivo from '../components/shared/CargaArchivo.vue'
import Alertas from '../components/shared/Alertas.vue'
import InventarioTable from '../components/shared/InventarioTable.vue'
import VistaPreviaTable from '../components/shared/VistaPreviaTable.vue'
import { useMensajes } from '../composables/useMensajes.js'
import { obtenerFechaHoy, formatearFecha } from '../utils/date.js'
import { SunIcon } from '@heroicons/vue/24/outline'

export default {

    components: {
        CargaArchivo,
        Alertas,
        InventarioTable,
        VistaPreviaTable,
        SunIcon
    },

    setup() {
        const { mensaje, mostrarMensaje } = useMensajes()
        const { leerExcel, normalizarClaves } = useExcel()
        const catalogos = useCatalogos()

        const { inventarioActual, cargandoInventario, cargarInventario, sincronizarAPI } = useInventario({
            obtenerDatos: (force) => catalogos.obtenerMateriaPrima(force),
            sincronizar: () => MateriaPrimaClient.sincronizarConSupabase(),
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
        // ── Excel ──

        async procesarArchivo(file) {
            try {
                if (!file) return
                const jsonData = await this.leerExcel(file)
                this.datosProcesados = this.procesarDatos(jsonData)

                if (!this.datosProcesados.length) {
                    this.mostrarMensaje('error', 'No se encontraron datos válidos')
                    return
                }

                this.mostrarMensaje('exito', `${this.datosProcesados.length} variedades cargadas`)
            } catch (error) {
                console.error(error)
                this.mostrarMensaje('error', `${error.message || 'Error al leer archivo Excel'}`)
            }
        },

        // ── Procesamiento ──
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

        // ── Limpiar ──
        limpiarDatos() {
            this.datosProcesados = []
            this.mensaje.tipo = null
            this.mensaje.texto = ''
        },

        // ── Guardar ──
        async confirmarYSubir() {
            this.cargando = true
            
            const response = await MateriaPrimaClient.cargarMateriaPrima(this.datosProcesados)
            this.cargando = false

            if (response.success) {
                this.mostrarMensaje('exito', `${this.datosProcesados.length} registros guardados`)
                this.datosProcesados = []
                await this.cargarInventario(true)
            } else {
                this.mostrarMensaje('error', 'Error al guardar registros', 0)
            }
        }
    }
}
</script>
