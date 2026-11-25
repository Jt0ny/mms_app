<template>
    <form class="data-card" @submit.prevent="guardar">

        <div class="data-card-header">
            <div class="flex-align-center gap-14">
                <span class="form-icon flex-align-center"><UserIcon class="icon-lg text-white" /></span>
                <div>
                    <h2>{{ modoCambioContrasena ? 'Cambiar Contraseña' : 'Agregar Usuario' }}</h2>
                    <p class="data-card-subtitle">
                        {{ modoCambioContrasena ? 'Ingresa la nueva contraseña para el usuario seleccionado' : 'Completa los campos para registrar un nuevo acceso' }}
                    </p>
                </div>
            </div>
        </div>

        <div class="form-body">
            <label>Nombre<input class="form-input" v-model.trim="nombre" type="text" autocomplete="username"
                    placeholder="Nombre de usuario" :disabled="modoCambioContrasena" />
            </label>

            <label>Email<input class="form-input" v-model.trim="email" type="email" autocomplete="email"
                    placeholder="correo@ejemplo.com" :disabled="modoCambioContrasena" />
            </label>

            <label>{{ modoCambioContrasena ? 'Nueva Contraseña' : 'Contraseña' }}<input ref="inputContrasena"
                    class="form-input" v-model="contrasena" type="password" autocomplete="new-password"
                    :placeholder="modoCambioContrasena ? 'Ingresa la nueva contraseña (mín. 6 caracteres)' : 'Contraseña segura'" />
            </label>

            <UsuarioRol :modelValue="rol" :roles="roles"
                @update:modelValue="!modoCambioContrasena && (rol = $event)" />

            <Alertas :mensaje="mensaje" />

            <button type="submit" class="btn btn-primary" :disabled="guardando">
                {{ guardando ? 'Guardando...' : (modoCambioContrasena ? 'Actualizar contraseña' : 'Guardar usuario') }}
            </button>
            <button v-if="modoCambioContrasena" type="button" class="btn btn-secondary" :disabled="guardando"
                @click="cancelarEdicion">
                Cancelar
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

    props: {
        usuarioSeleccionado: {
            type: Object,
            default: null
        }
    },

    emits: ['guardado', 'cancelar'],

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

    computed: {
        modoCambioContrasena() {
            return !!this.usuarioSeleccionado && !!this.usuarioSeleccionado.id
        }
    },

    watch: {
        usuarioSeleccionado: {
            immediate: true,
            deep: true,
            handler(usuario) {
                if (usuario && usuario.id) {
                    this.nombre = usuario.nombre || ''
                    this.email = usuario.email || ''
                    this.rol = usuario.rol
                        ? String(usuario.rol).charAt(0).toUpperCase() + String(usuario.rol).slice(1).toLowerCase()
                        : ''
                    this.contrasena = ''
                    this.$nextTick(() => {
                        this.$refs.inputContrasena?.focus()
                    })
                } else {
                    this.limpiarFormulario()
                }
            }
        }
    },

    methods: {
        limpiarFormulario() {
            this.nombre = ''
            this.email = ''
            this.contrasena = ''
            this.rol = ''
        },

        cancelarEdicion() {
            this.limpiarFormulario()
            this.$emit('cancelar')
        },

        async guardar() {
            if (this.modoCambioContrasena) {
                if (!this.contrasena || !this.contrasena.trim()) {
                    this.mostrarMensaje('error', 'Por favor, ingresa la nueva contraseña.')
                    return
                }

                if (this.contrasena.trim().length < 6) {
                    this.mostrarMensaje('error', 'La contraseña debe tener al menos 6 caracteres.')
                    return
                }

                this.guardando = true
                const response = await UsuarioClient.cambiarContrasena(
                    this.usuarioSeleccionado.id,
                    this.contrasena
                )
                this.guardando = false

                if (response.success) {
                    this.mostrarMensaje('exito', 'Contraseña actualizada exitosamente.')
                    this.limpiarFormulario()
                    this.$emit('cancelar')
                } else {
                    this.mostrarMensaje('error', response.error?.message || 'No se pudo actualizar la contraseña.')
                }
                return
            }

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
                this.limpiarFormulario()
            } else {
                this.mostrarMensaje('error', 'No se pudo guardar el usuario. Intenta nuevamente.')
            }
        }
    }
}
</script>

<style scoped>

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