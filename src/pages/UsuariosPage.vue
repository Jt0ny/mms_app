<template>
    <div class="usuarios-page">
        <div class="page-copy">
            <h1>Mantenimiento de Usuarios</h1>
            <p>Registra usuarios nuevos y revisa los que ya existen en el sistema.</p>
        </div>

        <Alertas :mensaje="mensaje" />

        <div class="main-layout">
            <UsuarioForm @guardado="cargarUsuarios" />

            <UsuarioTablaActual
                :usuarios="usuarios"
                :cargando="cargandoUsuarios"
                @actualizar="cargarUsuarios"
                @eliminar="eliminarUsuario"
            />
        </div>
    </div>
</template>
<script>
import Alertas from '../components/Alertas.vue'
import UsuarioClient from '../client/UsuarioClient.js'
import UsuarioForm from '../components/Usuarios/UsuarioForm.vue'
import UsuarioTablaActual from '../components/Usuarios/UsuarioTablaActual.vue'

export default {
    components: {
        Alertas,
        UsuarioForm,
        UsuarioTablaActual
    },

    data() {
        return {
            usuarios: [],
            cargandoUsuarios: false,
            mensaje: {
                tipo: null,
                texto: ''
            }
        }
    },

    mounted() {
        this.cargarUsuarios()
    },

    methods: {
        mostrarMensaje(tipo, texto, duracion = 3000) {
            this.mensaje = { tipo, texto }

            if (duracion > 0) {
                setTimeout(() => {
                    this.mensaje = { tipo: null, texto: '' }
                }, duracion)
            }
        },

        async cargarUsuarios() {
            this.cargandoUsuarios = true
            try {
                const datos = await UsuarioClient.obtenerUsuarios()
                this.usuarios = datos ?? []
            } catch (error) {
                console.error(error)
                this.mostrarMensaje('error', 'No se pudieron cargar los usuarios.')
            } finally {
                this.cargandoUsuarios = false
            }
        },

        async eliminarUsuario(id) {
            const confirmado = window.confirm('¿Seguro que deseas eliminar este usuario?')

            if (!confirmado) return

            try {
                await UsuarioClient.eliminarUsuario(id)
                this.mostrarMensaje('exito', 'Usuario eliminado correctamente.')
                await this.cargarUsuarios()
            } catch (error) {
                console.error(error)
                this.mostrarMensaje('error', 'No se pudo eliminar el usuario.')
            }
        }
    }
}
</script>

<style scoped>
.usuarios-page {
    display: grid;
    gap: 20px;
    padding: 24px;
    background: var(--bg-secondary);
    min-height: 100%;
}

.page-copy h1 {
    margin: 0;
    font-size: 32px;
}

.page-copy p {
    margin: 8px 0 0;
    color: #64748b;
    max-width: 60ch;
}

.main-layout {
    display: grid;
    gap: 24px;
}

@media (min-width: 1100px) {
    .main-layout {
        grid-template-columns: minmax(320px, 560px) 1fr;
        align-items: start;
    }
}
</style>