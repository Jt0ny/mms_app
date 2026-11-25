<template>
    <div class="page-container usuarios-page">
        <div class="page-content-wrap">
            <div class="page-header">
                <div>
                    <h1 class="page-title">Mantenimiento de Usuarios</h1>
                    <p class="page-subtitle">Registra usuarios nuevos y revisa los que ya existen en el sistema.</p>
                </div>
            </div>

            <Alertas :mensaje="mensaje" />

            <div class="page-grid">
                <UsuarioForm :usuarioSeleccionado="usuarioSeleccionado" @guardado="cargarUsuarios(true)"
                    @cancelar="usuarioSeleccionado = null" />

                <UsuarioList :usuarios="usuarios" :cargando="cargandoUsuarios" @actualizar="cargarUsuarios(true)"
                    @cambiar-contrasena="seleccionarUsuario" @eliminar="eliminarUsuario" />
            </div>
        </div>
    </div>
</template>
<script>
import Alertas from '../components/shared/Alertas.vue'
import UsuarioClient from '../client/UsuarioClient.js'
import UsuarioForm from '../components/usuarios/UsuarioForm.vue'
import UsuarioList from '../components/usuarios/UsuarioList.vue'
import { useMensajes } from '../composables/useMensajes.js'
import { useCatalogos } from '../composables/useCatalogos.js'

export default {
    components: {
        Alertas,
        UsuarioForm,
        UsuarioList
    },

    setup() {
        const { mensaje, mostrarMensaje } = useMensajes()
        const catalogos = useCatalogos()
        return { mensaje, mostrarMensaje, catalogos }
    },

    data() {
        return {
            usuarios: [],
            cargandoUsuarios: false,
            usuarioSeleccionado: null
        }
    },

    mounted() {
        this.cargarUsuarios()
    },

    methods: {
        seleccionarUsuario(usuario) {
            this.usuarioSeleccionado = { ...usuario }
        },

        async cargarUsuarios(forceRefresh = false) {
            this.cargandoUsuarios = true
            const response = await this.catalogos.obtenerUsuarios(forceRefresh)

            if (response && response.success === false) {
                this.usuarios = []
                this.mostrarMensaje('error', 'Error al cargar los usuarios')
            } else {
                this.usuarios = response?.success ? response.data : (response ?? [])
            }

            this.cargandoUsuarios = false
        },

        async eliminarUsuario(id) {
            const response = await UsuarioClient.eliminarUsuario(id)
            if (response.success) {
                if (this.usuarioSeleccionado?.id === id) {
                    this.usuarioSeleccionado = null
                }
                this.mostrarMensaje('exito', 'Usuario eliminado correctamente.')
                await this.cargarUsuarios(true)
            } else {
                this.mostrarMensaje('error', 'No se pudo eliminar el usuario.')
            }
        }
    }
}
</script>
