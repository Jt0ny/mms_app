<template>
    <div class="container materia-prima-page">

        <div class="content-wrap">

            <!-- TÍTULO -->
            <h1 class="page-title">Carga de Materia Prima</h1>

            <!-- ALERTAS -->
            <MateriaPrimaAlerts :mensaje="mensaje" />

            <!-- LAYOUT -->
            <div class="main-layout" :class="{ 'with-preview': datosProcesados.length > 0 }">

                <!-- PANEL IZQUIERDO -->
                <div class="left-panel">

                    <!-- UPLOAD -->
                    <CargaArchivo nombreModulo="Producción" :cargando="cargando"
                        @archivo-seleccionado="procesarArchivo" />

                    <!-- INVENTARIO -->
                    <MateriaPrimaInvetarioActual :inventario="inventarioActual" :cargando="cargandoInventario"
                        @actualizar="cargarInventario" />

                </div>

                <!-- PANEL DERECHO -->
                <MateriaPrimaPreview :datosProcesados="datosProcesados" :cargando="cargando" @cancelar="limpiarDatos"
                    @confirmar="confirmarYSubir" />

            </div>

        </div>

    </div>
</template>

<script>
import * as XLSX from 'xlsx'
import materiaPrimaClient from '../Client/MateriaPrimaClient'

import CargaArchivo from '../components/CargaArchivo.vue'

import MateriaPrimaInvetarioActual from '../components/materiaPrima/MateriaPrimaInvetarioActual.vue'
import MateriaPrimaPreview from '../components/materiaPrima/MateriaPrimaPreview.vue'
import MateriaPrimaAlerts from '../components/Alertas.vue'

export default {

    components: {
        MateriaPrimaInvetarioActual,
        MateriaPrimaPreview,
        CargaArchivo,
        MateriaPrimaAlerts
    },

    data() {
        return {
            datosProcesados: [],
            inventarioActual: [],
            cargando: false,
            cargandoInventario: false,
            mensaje: {
                tipo: null,
                texto: ''
            }
        }
    },

    mounted() {
        this.cargarInventario()
    },

    methods: {

        /* ================= MENSAJES ================= */
        mostrarMensaje(tipo, texto, duracion = 4000) {
            this.mensaje = { tipo, texto }
            if (duracion > 0) {
                setTimeout(() => { this.mensaje = { tipo: null, texto: '' } }, duracion)
            }
        },

        /* ================= INVENTARIO ================= */
        async cargarInventario() {
            this.cargandoInventario = true
            try {
                const datos = await materiaPrimaClient.obtenerMateriaPrima()
                this.inventarioActual = datos ?? []
            } catch (error) {

                console.error(error)
                this.mostrarMensaje('error', '❌ Error al cargar inventario', 0)
            } finally {
                this.cargandoInventario = false
            }
        },

        /* ================= EXCEL ================= */

        async procesarArchivo(file) {
            try {
                const data =
                    await file.arrayBuffer()
                const workbook = XLSX.read(data, { type: 'array' })
                const sheet = workbook.Sheets[workbook.SheetNames[0]]
                const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: '' })
                if (!jsonData.length) {
                    this.mostrarMensaje('error', '❌ Archivo vacío')
                    return
                }

                this.datosProcesados =
                    this.procesarDatos(jsonData)

                if (!this.datosProcesados.length) {
                    this.mostrarMensaje('error', '❌ No se encontraron datos válidos')
                    return
                }

                this.mostrarMensaje('exito', `✓ ${this.datosProcesados.length} variedades cargadas`)

            } catch (error) {
                console.error(error)
                this.mostrarMensaje('error', '❌ Error al leer archivo Excel')
            }
        },

        /* ================= PROCESAMIENTO ================= */
        procesarDatos(data) {
            const resumen = {}
            data.forEach((fila) => {
                const filaNormalizada = {}
                Object.keys(fila).forEach((key) => {
                    const keyNorm = key.toLowerCase().replace(/\s+/g, '')
                    filaNormalizada[keyNorm] = fila[key]
                })

                const variedad = filaNormalizada.variety || filaNormalizada.variedad

                const tallos =
                    parseInt(filaNormalizada.totalstems || filaNormalizada.tallos || filaNormalizada.cantidad) || 0

                if (!variedad || tallos <= 0) return

                if (!resumen[variedad]) {

                    resumen[variedad] = { variedad: String(variedad).trim(), cantidad_total: 0, fecha_ingreso: new Date().toISOString().split('T')[0] }
                }
                resumen[variedad].cantidad_total += tallos
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
                let exitos = 0
                for (const item of this.datosProcesados) {
                    try {
                        await materiaPrimaClient.cargarMateriaPrima(item)
                        exitos++
                    } catch (error) {
                        console.error(error)
                    }
                }

                if (exitos === this.datosProcesados.length) {
                    this.mostrarMensaje('exito', `✓ ${exitos} registros guardados`)

                    this.datosProcesados = []

                    await this.cargarInventario()

                } else {
                    this.mostrarMensaje('error', '⚠️ Algunos registros fallaron', 0)
                }

            } catch (error) {
                console.error(error)
                this.mostrarMensaje('error', '❌ Error general al guardar', 0)
            } finally {
                this.cargando = false
            }
        }
    }
}
</script>

<style scoped>
.container {
    width: 100%;
    min-height: 100%;
    padding: 24px;
    background: var(--bg-secondary);
}

.content-wrap {
    width: 100%;
    max-width: 1400px;
    margin: 0 auto;
}

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

@media (max-width: 768px) {

    .main-layout,
    .main-layout.with-preview {
        grid-template-columns: 1fr;
    }

    .container {
        padding: 12px;
    }
}
</style>