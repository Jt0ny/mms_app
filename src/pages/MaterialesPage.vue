<template>
    <div class="page-container materiales-page">

        <div class="page-content-wrap">

            <!-- TÍTULO -->
            <h1 class="page-title">Carga de Materiales</h1>

            <!-- ALERTAS -->
            <Alertas :mensaje="mensaje" />

            <!-- LAYOUT -->
            <div class="main-layout-split" :class="{ 'with-preview': datosProcesados.length > 0 }">

                <!-- PANEL IZQUIERDO -->
                <div class="panel-column">

                    <!-- UPLOAD -->
                    <CargaArchivo nombreModulo="Materiales" :cargando="cargando"
                        @archivo-seleccionado="procesarArchivo" />

                    <!-- INVENTARIO -->
                    <InventoryTable title="📦 Inventario Actual" :items="inventarioActual" :loading="cargandoInventario"
                        item-label="materiales registrados" empty-text="📭 No hay materiales registrados"
                        @actualizar="cargarInventario" @sincronizar="sincronizarAPI">
                        <template #header>
                            <th>Nombre</th>
                            <th>Cantidad</th>
                            <th>Descripción</th>
                            <th>Acciones</th>
                        </template>
                        <template #row="{ item }">
                            <td class="text-variety">{{ item.nombre }}</td>
                            <td class="text-quantity">{{ item.cantidad }}</td>
                            <td>{{ item.descripcion || '-' }}</td>
                            <td class="actions-column">
                                <button class="btn-action btn-action-delete" @click="eliminarMaterial(item.id)">🗑️</button>
                            </td>
                        </template>
                    </InventoryTable>

                </div>

                <!-- PANEL DERECHO: Preview Excel -->
                <PreviewTable :items="datosProcesados" :loading="cargando" item-label="materiales encontrados"
                    confirm-text="Guardar Materiales" loading-text="Guardando..." @cancelar="limpiarDatos"
                    @confirmar="confirmarYSubir">
                    <template #header>
                        <th>Nombre</th>
                        <th>Cantidad</th>
                        <th>Descripción</th>
                    </template>
                    <template #row="{ item }">
                        <td class="text-variety" data-label="Nombre">{{ item.nombre }}</td>
                        <td class="text-quantity" data-label="Cantidad">{{ item.cantidad }}</td>
                        <td class="text-date" data-label="Descripción">{{ item.descripcion || '-' }}</td>
                    </template>
                </PreviewTable>

            </div>

            <!-- FORMULARIO MANUAL (debajo del layout principal) -->
            <MaterialForm :material="nuevoMaterial" :cargando="cargando" @guardar="guardarMaterial" />

        </div>

    </div>
</template>

<script>
import { useExcel } from '../composables/useExcel.js'
import MaterialClient from '../client/MaterialClient.js'
import { useCatalogos } from '../composables/useCatalogos.js'

import CargaArchivo from '../components/CargaArchivo.vue'
import Alertas from '../components/Alertas.vue'
import MaterialForm from '../components/materiales/MaterialForm.vue'
import InventoryTable from '../components/shared/InventoryTable.vue'
import PreviewTable from '../components/shared/PreviewTable.vue'
import { useMensajes } from '../composables/useMensajes.js'

export default {

    components: {
        MaterialForm,
        CargaArchivo,
        Alertas,
        InventoryTable,
        PreviewTable
    },

    setup() {
        const { mensaje, mostrarMensaje } = useMensajes()
        const { leerExcel } = useExcel()
        const catalogos = useCatalogos()
        return { mensaje, mostrarMensaje, leerExcel, catalogos }
    },

    data() {
        return {
            datosProcesados: [],
            inventarioActual: [],
            cargando: false,
            cargandoInventario: false,
            nuevoMaterial: {
                nombre: '',
                cantidad: null,
                descripcion: ''
            }
        }
    },

    mounted() {
        this.cargarInventario()
    },

    methods: {
        /* ================= INVENTARIO ================= */
        async cargarInventario(forceRefresh = false) {
            this.cargandoInventario = true
            try {
                // Cargar los datos locales
                const datos = await this.catalogos.obtenerMateriales(forceRefresh)
                this.inventarioActual = datos ?? []
            } catch (error) {
                console.error(error)
                this.mostrarMensaje('error', '❌ Error al cargar materiales', 0)
            } finally {
                this.cargandoInventario = false
            }
        },

        async sincronizarAPI() {
            this.cargandoInventario = true
            try {
                this.mostrarMensaje('info', '⚡ Sincronizando con la API externa...', 0)
                await MaterialClient.sincronizarConSupabase()
                this.mostrarMensaje('exito', '✓ Sincronización exitosa con la API externa')
                await this.cargarInventario(true)
            } catch (error) {
                console.error(error)
                this.mostrarMensaje('error', '❌ Error al sincronizar con la API externa')
                this.cargandoInventario = false
            }
        },

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

                this.mostrarMensaje('exito', `✓ ${this.datosProcesados.length} materiales cargados`)
            } catch (error) {
                console.error(error)
                this.mostrarMensaje('error', `❌ ${error.message || 'Error al leer archivo Excel'}`)
            }
        },

        /* ================= PROCESAMIENTO EXCEL ================= */
        procesarDatos(data) {
            return data
                .map(fila => {
                    // Normalizar claves del Excel (quitar espacios, minúsculas)
                    const norm = {}
                    Object.keys(fila).forEach(key => {
                        norm[key.toLowerCase().replace(/\s+/g, '')] = fila[key]
                    })

                    const nombre = String(norm.nombre || norm.name || norm.material || '').trim()
                    const cantidad = parseInt(norm.cantidad || norm.quantity || norm.qty || 0) || 0
                    const descripcion = String(norm.descripcion || norm.description || norm.desc || '').trim() || null

                    if (!nombre) return null

                    return { nombre, cantidad, descripcion }
                })
                .filter(Boolean)
        },

        /* ================= LIMPIAR ================= */
        limpiarDatos() {
            this.datosProcesados = []
            this.mensaje = { tipo: null, texto: '' }
        },

        /* ================= CONFIRMAR EXCEL ================= */
        async confirmarYSubir() {
            this.cargando = true
            try {
                await MaterialClient.cargarMateriales(this.datosProcesados)
                this.mostrarMensaje('exito', `✓ ${this.datosProcesados.length} materiales guardados`)
                this.datosProcesados = []
                await this.cargarInventario(true)
            } catch (error) {
                console.error(error)
                this.mostrarMensaje('error', '❌ Error al guardar materiales', 0)
            } finally {
                this.cargando = false
            }
        },

        /* ================= GUARDAR MANUAL ================= */
        async guardarMaterial(material) {
            this.cargando = true
            try {
                await MaterialClient.agregarMaterial(material)
                this.mostrarMensaje('exito', '✓ Material agregado')
                this.resetForm()
                await this.cargarInventario(true)
            } catch (error) {
                console.error(error)
                this.mostrarMensaje('error', '❌ Error al guardar material')
            } finally {
                this.cargando = false
            }
        },

        /* ================= ELIMINAR ================= */
        async eliminarMaterial(id) {
            try {
                await MaterialClient.eliminarMaterial(id)
                this.mostrarMensaje('exito', '✓ Material eliminado')
                await this.cargarInventario(true)
            } catch (error) {
                console.error(error)
                this.mostrarMensaje('error', '❌ Error al eliminar')
            }
        },

        /* ================= RESET ================= */
        resetForm() {
            this.nuevoMaterial = {
                nombre: '',
                cantidad: null,
                descripcion: ''
            }
        }
    }
}
</script>

<style scoped>
.actions-column {
    display: flex;
    gap: 8px;
}
</style>