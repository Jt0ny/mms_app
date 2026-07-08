<template>
    <div class="container materia-prima-page">

        <div class="content-wrap">

            <!-- TÍTULO -->
            <h1 class="page-title">Carga de Materia Prima</h1>

            <!-- ALERTAS -->
            <Alertas :mensaje="mensaje" />

            <!-- LAYOUT -->
            <div class="main-layout" :class="{ 'with-preview': datosProcesados.length > 0 }">

                <!-- PANEL IZQUIERDO -->
                <div class="left-panel">

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
                            <td class="variety">{{ item.variedad }}</td>
                            <td class="quantity">{{ item.cantidadTotal }}</td>
                            <td class="date">{{ formatearFecha(item.fecha) }}</td>
                        </template>
                    </InventoryTable>

                </div>

                <!-- PANEL DERECHO -->
                <PreviewTable :items="datosProcesados" :loading="cargando" item-label="variedades encontradas"
                    confirm-text="Guardar Inventario" loading-text="Guardando..."
                    @cancelar="limpiarDatos" @confirmar="confirmarYSubir">
                    <template #header>
                        <th>Variedad</th>
                        <th>Cantidad (Tallos)</th>
                        <th>Fecha Ingreso</th>
                    </template>
                    <template #row="{ item }">
                        <td class="variety" data-label="Variedad">{{ item.variedad }}</td>
                        <td class="quantity" data-label="Cantidad (Tallos)">{{ item.cantidad_total }}</td>
                        <td class="date" data-label="Fecha Ingreso">{{ item.fecha_ingreso }}</td>
                    </template>
                </PreviewTable>

            </div>

        </div>

    </div>
</template>

<script>
import * as XLSX from 'xlsx'
import materiaPrimaClient from '../client/MateriaPrimaClient'

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

    data() {
        const { state, mostrarMensaje } = useMensajes()
        return {
            mensaje: state,
            mostrarMensaje,
            datosProcesados: [],
            inventarioActual: [],
            cargando: false,
            cargandoInventario: false
        }
    },

    mounted() {
        this.cargarInventario()
    },

    methods: {
        formatearFecha(fecha) {
            if (!fecha) return '-'
            try {
                return new Date(fecha).toLocaleDateString('es-EC')
            } catch {
                return fecha
            }
        },
        /* ================= INVENTARIO ================= */
        async cargarInventario() {
            this.cargandoInventario = true
            try {
                // Cargar los datos locales de Supabase (sin disparar sincronización externa automática)
                const datos = await materiaPrimaClient.obtenerMateriaPrima()
                this.inventarioActual = datos ?? []
            } catch (error) {
                console.error(error)
                this.mostrarMensaje('error', '❌ Error al cargar inventario', 0)
            } finally {
                this.cargandoInventario = false
            }
        },

        async sincronizarAPI() {
            this.cargandoInventario = true
            try {
                this.mostrarMensaje('info', '⚡ Sincronizando con la API externa...', 0)
                await materiaPrimaClient.sincronizarConSupabase(true) // forceOverwrite = true
                this.mostrarMensaje('exito', '✓ Sincronización exitosa con la API externa')
                await this.cargarInventario()
            } catch (error) {
                console.error(error)
                this.mostrarMensaje('error', '❌ Error al sincronizar con la API externa')
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
                await materiaPrimaClient.cargarMateriaPrima(this.datosProcesados)

                this.mostrarMensaje(
                    'exito',
                    `✓ ${this.datosProcesados.length} registros guardados`
                )

                this.datosProcesados = []

                await this.cargarInventario()

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