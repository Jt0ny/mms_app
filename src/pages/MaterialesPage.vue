<template>
    <div class="container materiales-page">

        <div class="content-wrap">

            <!-- TÍTULO -->
            <h1 class="page-title">Carga de Materiales</h1>

            <!-- ALERTAS -->
            <Alertas :mensaje="mensaje" />

            <!-- LAYOUT -->
            <div class="main-layout" :class="{ 'with-preview': datosProcesados.length > 0 }">

                <!-- PANEL IZQUIERDO -->
                <div class="left-panel">

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
                            <td class="variety">{{ item.nombre }}</td>
                            <td class="quantity">{{ item.cantidad }}</td>
                            <td>{{ item.descripcion || '-' }}</td>
                            <td class="actions-column">
                                <button class="btn-action btn-edit" @click="editarMaterial(item)">✏️</button>
                                <button class="btn-action btn-delete" @click="eliminarMaterial(item.id)">🗑️</button>
                            </td>
                        </template>
                    </InventoryTable>

                </div>

                <!-- PANEL DERECHO: Preview Excel -->
                <PreviewTable :items="datosProcesados" :loading="cargando" item-label="materiales encontrados"
                    confirm-text="Guardar Materiales" loading-text="Guardando..."
                    @cancelar="limpiarDatos" @confirmar="confirmarYSubir">
                    <template #header>
                        <th>Nombre</th>
                        <th>Cantidad</th>
                        <th>Descripción</th>
                    </template>
                    <template #row="{ item }">
                        <td class="nombre" data-label="Nombre">{{ item.nombre }}</td>
                        <td class="quantity" data-label="Cantidad">{{ item.cantidad }}</td>
                        <td class="descripcion" data-label="Descripción">{{ item.descripcion || '-' }}</td>
                    </template>
                </PreviewTable>

            </div>

            <!-- FORMULARIO MANUAL (debajo del layout principal) -->
            <MaterialForm :material="nuevoMaterial" :modoEdicion="modoEdicion" :cargando="cargando"
                @guardar="guardarMaterial" @actualizar="actualizarMaterial" @cancelar="resetForm" />

        </div>

    </div>
</template>

<script>
import * as XLSX from 'xlsx'
import MaterialClient from '../client/MaterialClient.js'

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

    data() {
        const { state, mostrarMensaje } = useMensajes()
        return {
            mensaje: state,
            mostrarMensaje,
            datosProcesados: [],
            inventarioActual: [],
            cargando: false,
            cargandoInventario: false,
            modoEdicion: false,
            idEditando: null,
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
        async cargarInventario() {
            this.cargandoInventario = true
            try {
                // Cargar los datos locales de Supabase (sin disparar sincronización externa automática)
                const datos = await MaterialClient.obtenerMateriales()
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
                await MaterialClient.sincronizarConSupabase(true) // forceOverwrite = true
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
                const data = await file.arrayBuffer()
                const workbook = XLSX.read(data, { type: 'array' })
                const sheet = workbook.Sheets[workbook.SheetNames[0]]
                const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: '' })

                if (!jsonData.length) {
                    this.mostrarMensaje('error', '❌ Archivo vacío')
                    return
                }

                this.datosProcesados = this.procesarDatos(jsonData)

                if (!this.datosProcesados.length) {
                    this.mostrarMensaje('error', '❌ No se encontraron datos válidos')
                    return
                }

                this.mostrarMensaje('exito', `✓ ${this.datosProcesados.length} materiales cargados`)

            } catch (error) {
                console.error(error)
                this.mostrarMensaje('error', '❌ Error al leer archivo Excel')
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
                await this.cargarInventario()
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
                await this.cargarInventario()
            } catch (error) {
                console.error(error)
                this.mostrarMensaje('error', '❌ Error al guardar material')
            } finally {
                this.cargando = false
            }
        },

        /* ================= EDITAR ================= */
        editarMaterial(material) {
            this.modoEdicion = true
            this.idEditando = material.id
            this.nuevoMaterial = { ...material }
        },

        /* ================= ACTUALIZAR ================= */
        async actualizarMaterial(material) {
            this.cargando = true
            try {
                await MaterialClient.actualizarMaterial(this.idEditando, material)
                this.mostrarMensaje('exito', '✓ Material actualizado')
                this.resetForm()
                await this.cargarInventario()
            } catch (error) {
                console.error(error)
                this.mostrarMensaje('error', '❌ Error al actualizar')
            } finally {
                this.cargando = false
            }
        },

        /* ================= ELIMINAR ================= */
        async eliminarMaterial(id) {
            try {
                await MaterialClient.eliminarMaterial(id)
                this.mostrarMensaje('exito', '✓ Material eliminado')
                await this.cargarInventario()
            } catch (error) {
                console.error(error)
                this.mostrarMensaje('error', '❌ Error al eliminar')
            }
        },

        /* ================= RESET ================= */
        resetForm() {
            this.modoEdicion = false
            this.idEditando = null
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
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.page-title {
    margin: 0;
}

.main-layout {
    display: grid;
    grid-template-columns: 1fr;
    gap: 24px;
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

.nombre {
    color: var(--text-h);
    font-weight: 600;
}

.descripcion {
    color: var(--text-light);
    font-size: 13px;
}

.actions-column {
    display: flex;
    gap: 8px;
}

.btn-action {
    border: none;
    border-radius: 6px;
    padding: 8px 10px;
    cursor: pointer;
    transition: 0.3s ease;
}

.btn-edit {
    background: #dbeafe;
}

.btn-delete {
    background: #fee2e2;
}

.btn-action:hover {
    transform: scale(1.05);
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