<template>
    <form class="usuarios-form" @submit.prevent="guardar">

        <div class="form-header">
            <span class="form-icon flex-align-center"><UserIcon class="icon-lg text-white" /></span>
            <div>
                <h2>Agregar Usuario</h2>
                <p>Completa los campos para registrar un nuevo acceso</p>
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
import Alertas from '../Alertas.vue'
import UsuarioRol from './UsuarioRol.vue'
import UsuarioClient from '../../client/UsuarioClient.js'
import { UserIcon } from '@heroicons/vue/24/outline'

export default {
    components: {
        Alertas,
        UsuarioRol,
        UserIcon
    },

    data() {
        return {
            nombre: '',
            email: '',
            contrasena: '',
            rol: '',
            guardando: false,
            roles: ['Supervisor', 'Operador'],
            mensaje: {
                tipo: null,
                texto: ''
            }
        }
    },

    methods: {
        mostrarMensaje(tipo, texto, duracion = 4000) {
            this.mensaje = { tipo, texto }
            if (duracion > 0) {
                clearTimeout(this._mensajeTimer)
                this._mensajeTimer = setTimeout(() => {
                    this.mensaje = { tipo: null, texto: '' }
                }, duracion)
            }
        },

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
.usuarios-form {
    width: 100%;
    border-radius: 16px;
    overflow: hidden;
    background: var(--bg);
    box-shadow: var(--shadow);
    border: 1px solid var(--border-light);
    display: flex;
    flex-direction: column;
}

/* ── Header verde con ícono ── */
.form-header {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 20px 24px;
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
    color: white;
}

.form-icon {
    font-size: 28px;
    line-height: 1;
    flex-shrink: 0;
}

.form-header h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: white;
    letter-spacing: -0.01em;
}

.form-header p {
    margin: 4px 0 0;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.8);
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