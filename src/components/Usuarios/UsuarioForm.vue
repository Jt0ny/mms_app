<template>
    <form class="data-card" @submit.prevent="guardar">

        <div class="data-card-header">
            <div class="flex-align-center" style="gap: 14px;">
                <span class="form-icon flex-align-center"><UserIcon class="icon-lg text-white" /></span>
                <div>
                    <h2>Agregar Usuario</h2>
                    <p class="data-card-subtitle">Completa los campos para registrar un nuevo acceso</p>
                </div>
            </div>
        </div>

        <div class="form-body">
            <label>Nombre<input class="form-input" v-model.trim="nombre" type="text" autocomplete="username"
                    placeholder="Nombre de usuario" />
            </label>

            <label>Email<input class="form-input" v-model.trim="email" type="email" autocomplete="email"
                    placeholder="correo@ejemplo.com" />
            </label>

            <label>Contraseña<input class="form-input" v-model="contrasena" type="password" autocomplete="new-password"
                    placeholder="Contraseña segura" />
            </label>

            <UsuarioRol v-model="rol" :roles="roles" />

            <Alertas :mensaje="mensaje" />

            <button type="submit" class="btn btn-primary" :disabled="guardando">
                {{ guardando ? 'Guardando...' : 'Guardar usuario' }}
            </button>
        </div>
    </form>
</template>

<script>
import Alertas from '../shared/Alertas.vue'
import UsuarioRol from './UsuarioRol.vue'
import UsuarioClient from '../../client/UsuarioClient.js'
import { UserIcon } from '@heroicons/vue/24/outline'
import { useMensajes } from '../../composables/useMensajes'

export default {
    components: {
        Alertas,
        UsuarioRol,
        UserIcon
    },

    setup() {
        const { mensaje, mostrarMensaje } = useMensajes()
        return { mensaje, mostrarMensaje }
    },

    data() {
        return {
            nombre: '',
            email: '',
            contrasena: '',
            rol: '',
            guardando: false,
            roles: ['Supervisor', 'Operador']
        }
    },

    methods: {
        async guardar() {
            if (!this.nombre.trim() || !this.email.trim() || !this.contrasena.trim()) {
                this.mostrarMensaje('error', 'Por favor, complete todos los campos.')
                return
            }

            if (!this.rol) {
                this.mostrarMensaje('error', 'Selecciona un rol para el usuario.')
                return
            }

            this.guardando = true

            const response = await UsuarioClient.agregarUsuario({
                nombre: this.nombre.trim(),
                email: this.email.trim().toLowerCase(),
                password: this.contrasena,
                rol: this.rol.toLowerCase()
            })

            this.guardando = false

            if (response.success) {
                this.mostrarMensaje('exito', 'Usuario guardado exitosamente.')
                this.$emit('guardado')
                this.nombre = ''
                this.email = ''
                this.contrasena = ''
                this.rol = ''
            } else {
                this.mostrarMensaje('error', 'No se pudo guardar el usuario. Intenta nuevamente.')
            }
        }
    }
}
</script>

<style scoped>

.form-icon {
    font-size: 28px;
    line-height: 1;
    flex-shrink: 0;
}


/* ── Cuerpo del formulario ── */
.form-body {
    display: grid;
    gap: 16px;
    padding: 24px;
}

.form-body label {
    display: grid;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-h);
}



</style>