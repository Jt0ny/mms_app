<template>
    <div class="page-container materiales-page">

        <div class="page-content-wrap">

            <div class="page-header">
                <div>
                    <h1 class="page-title">Carga de Materiales</h1>
                    <p class="page-subtitle">Registra y gestiona materia prima con tu inventario en tiempo real.</p>
                </div>
            </div>

            <Alertas :mensaje="mensaje" />

            <div class="main-layout-split" :class="{ 'with-preview': datosProcesados.length > 0 }">

                <!-- PANEL IZQUIERDO -->
                <div class="panel-column">

                    <!-- UPLOAD -->
                    <CargaArchivo nombreModulo="Materiales" :cargando="cargando"
                        @archivo-seleccionado="procesarArchivo" />

                    <!-- INVENTARIO -->
                    <InventarioTable titulo="Inventario Actual" :items="inventarioActual" :cargando="cargandoInventario"
                        etiqueta-item="insumos" texto-vacio="No hay materiales registrados"
                        @actualizar="cargarInventario(true)" @sincronizar="sincronizarAPI">
                        <template #title-icon>
                            <ArchiveBoxIcon class="icon-lg text-white" />
                        </template>
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
                            <td class="actions-col">
                                <button class="btn-action-ghost delete" @click="eliminarMaterial(item.id)">
                                    <TrashIcon class="icon-action text-error" />
                                </button>
                            </td>
                        </template>
                    </InventarioTable>

                </div>

                <!-- PANEL DERECHO: Preview Excel -->
                <VistaPreviaTable :items="datosProcesados" :cargando="cargando" etiqueta-item="materiales encontrados"
                    texto-confirmar="Actualizar Inventario" texto-cargando="Actualizando..." @cancelar="limpiarDatos"
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
                </VistaPreviaTable>

            </div>

            <!-- FORMULARIO MANUAL (debajo del layout principal) -->
            <MaterialForm :material="nuevoMaterial" :cargando="cargando" @guardar="guardarMaterial" />

        </div>

    </div>
</template>

<script>
import { useExcel } from '../composables/useExcel.js'
import { useInventario } from '../composables/useInventario.js'
import MaterialClient from '../client/MaterialClient.js'
import { useCatalogos } from '../composables/useCatalogos.js'

import CargaArchivo from '../components/shared/CargaArchivo.vue'
import Alertas from '../components/shared/Alertas.vue'
import MaterialForm from '../components/materiales/MaterialForm.vue'
import InventarioTable from '../components/shared/InventarioTable.vue'
import VistaPreviaTable from '../components/shared/VistaPreviaTable.vue'
import { useMensajes } from '../composables/useMensajes.js'
import { TrashIcon, ArchiveBoxIcon } from '@heroicons/vue/24/outline'

export default {

    components: {
        MaterialForm,
        CargaArchivo,
        Alertas,
        InventarioTable,
        VistaPreviaTable,
        TrashIcon,
        ArchiveBoxIcon
    },

    setup() {
        const { mensaje, mostrarMensaje } = useMensajes()
        const { leerExcel, normalizarClaves } = useExcel()
        const catalogos = useCatalogos()

        const { inventarioActual, cargandoInventario, cargarInventario, sincronizarAPI } = useInventario({
            obtenerDatos: (force) => catalogos.obtenerMateriales(force),
            sincronizar: () => MaterialClient.sincronizarConSupabase(),
            nombreModulo: 'materiales',
            mostrarMensaje
        })

        return {
            mensaje, mostrarMensaje, leerExcel, normalizarClaves, catalogos,
            inventarioActual, cargandoInventario, cargarInventario, sincronizarAPI
        }
    },

    data() {
        return {
            datosProcesados: [],
            cargando: false,
            nuevoMaterial: {
                nombre: '',
                cantidad: null,
                descripcion: ''
            }
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

                this.mostrarMensaje('exito', `${this.datosProcesados.length} materiales cargados`)
            } catch (error) {
                console.error(error)
                this.mostrarMensaje('error', `${error.message || 'Error al leer archivo Excel'}`)
            }
        },

        // ── Procesamiento excel ──
        procesarDatos(data) {
            return data
                .map(fila => {
                    const norm = this.normalizarClaves(fila)

                    const nombre = String(norm.nombre || norm.name || norm.material || '').trim()
                    const cantidad = parseInt(norm.cantidad || norm.quantity || norm.qty || 0) || 0
                    const descripcion = String(norm.descripcion || norm.description || norm.desc || '').trim() || null

                    if (!nombre) return null

                    return { nombre, cantidad, descripcion }
                })
                .filter(Boolean)
        },

        // ── Limpiar ──
        limpiarDatos() {
            this.datosProcesados = []
            this.mostrarMensaje(null, '')
        },

        // ── Confirmar excel ──
        async confirmarYSubir() {
            this.cargando = true
            const response = await MaterialClient.cargarMateriales(this.datosProcesados)
            this.cargando = false

            if (response.success) {
                this.mostrarMensaje('exito', `${this.datosProcesados.length} materiales guardados`)
                this.datosProcesados = []
                await this.cargarInventario(true)
            } else {
                this.mostrarMensaje('error', 'Error al guardar materiales', 0)
            }
        },

        // ── Guardar manual ──
        async guardarMaterial(material) {
            this.cargando = true
            const response = await MaterialClient.agregarMaterial(material)
            this.cargando = false

            if (response.success) {
                this.mostrarMensaje('exito', 'Material agregado')
                this.resetearFormulario()
                await this.cargarInventario(true)
            } else {
                this.mostrarMensaje('error', 'Error al guardar material')
            }
        },

        // ── Eliminar ──
        async eliminarMaterial(id) {
            const response = await MaterialClient.eliminarMaterial(id)
            if (response.success) {
                this.mostrarMensaje('exito', 'Material eliminado')
                await this.cargarInventario(true)
            } else {
                this.mostrarMensaje('error', 'Error al eliminar')
            }
        },

        // ── Reset ──
        resetearFormulario() {
            this.nuevoMaterial = {
                nombre: '',
                cantidad: null,
                descripcion: ''
            }
        }
    }
}
</script>
