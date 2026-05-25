<template>
    <div class="container materiales-page">

        <h1 class="page-title">Carga de Materiales</h1>

        <!-- ALERTAS -->
        <MaterialesAlerts :mensaje="mensaje" />

        <div class="main-layout">
            <!-- FORM -->
            <MaterialForm :material="nuevoMaterial" :modoEdicion="modoEdicion" :cargando="cargando"
                @guardar="guardarMaterial" @actualizar="actualizarMaterial" @cancelar="resetForm" />
            <!-- TABLA -->
            <MaterialesInventarioActual :materiales="inventarioActual" :cargando="cargandoInventario"
                @actualizar="cargarInventario" @editar="editarMaterial" @eliminar="eliminarMaterial" />
        </div>

    </div>
</template>

<script>
import MaterialClient from '../client/MaterialClient.js'

import MaterialesAlerts from '../components/Alertas.vue'
import MaterialesInventarioActual from '../components/materiales/MaterialesInventarioActual.vue'
import MaterialForm from '../components/materiales/MaterialForm.vue'

export default {

    components: {
        MaterialesInventarioActual,
        MaterialForm,
        MaterialesAlerts
    },

    data() {

        return {

            inventarioActual: [],
            cargando: false,
            cargandoInventario: false,
            modoEdicion: false,
            idEditando: null,
            nuevoMaterial: {
                nombre: '',
                cantidad: null,
                descripcion: ''
            },
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
        mostrarMensaje(tipo, texto, duracion = 3000) {
            this.mensaje = { tipo, texto }
            if (duracion > 0) {
                setTimeout(() => { this.mensaje = { tipo: null, texto: '' } }, duracion)
            }
        },

        /* ================= INVENTARIO ================= */
        async cargarInventario() {
            this.cargandoInventario = true
            try {
                const data = await MaterialClient.obtenerMateriales()
                this.inventarioActual = data ?? []
            } catch (error) {
                console.error(error)
                this.mostrarMensaje('error', '❌ Error al cargar materiales'
                )
            } finally {
                this.cargandoInventario = false
            }
        },

        /* ================= GUARDAR ================= */
        async guardarMaterial(material) {
            this.cargando = true
            try {
                await MaterialClient.agregarMaterial(material)
                this.mostrarMensaje('exito', '✓ Material agregado')
                this.resetForm()
                await this.cargarInventario()
            } catch (error) {
                console.error(error)
                this.mostrarMensaje('error', '❌ Error al guardar material'
                )

            } finally {
                this.cargando = false
            }
        },

        /* ================= EDITAR ================= */
        editarMaterial(material) {
            this.modoEdicion = true
            this.idEditando = material.id
            this.nuevoMaterial = {
                ...material
            }
        },

        /* ================= ACTUALIZAR ================= */
        async actualizarMaterial(material) {
            this.cargando = true
            try {
                await MaterialClient.actualizarMaterial(this.idEditando, material)
                this.mostrarMensaje('exito', '✓ Material actualizado'
                )
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
    padding: 24px;
}

.page-title {
    margin-bottom: 24px;
}

.main-layout {
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