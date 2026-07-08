<template>
    <form class="usuarios-form" @submit.prevent="guardar">

        <div class="form-header">
            <span class="form-icon">👤</span>
            <div>
                <h2>Agregar Usuario</h2>
                <p>Completa los campos para registrar un nuevo acceso</p>
            </div>
        </div>

        <div class="form-body">
            <label>Nombre<input v-model.trim="nombre" type="text" autocomplete="username"
                    placeholder="Nombre de usuario" />
            </label>

            <label>Contraseña<input v-model="contrasena" type="password" autocomplete="new-password"
                    placeholder="Contraseña segura" />
            </label>

            <UsuarioRol v-model="rol" :roles="roles" />

            <Alertas :mensaje="mensaje" />

            <button type="submit" :disabled="guardando">
                {{ guardando ? 'Guardando...' : '✓ Guardar usuario' }}
            </button>
        </div>
    </form>
</template>

<script>
import Alertas from '../Alertas.vue'
import UsuarioRol from './UsuarioRol.vue'
import UsuarioClient from '../../client/UsuarioClient.js'
import { generarSHA256 } from '../../utils/crypto.js'

export default {
    components: {
        Alertas,
        UsuarioRol
    },

    data() {
        return {
            nombre: '',
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
        async guardar() {
            if (this.nombre.trim() === '' || this.contrasena.trim() === '') {
                this.mensaje = { tipo: 'error', texto: 'Por favor, complete todos los campos.' }
                return
            }

            if (!this.rol) {
                this.mensaje = { tipo: 'error', texto: 'Selecciona un rol para el usuario.' }
                return
            }

            this.guardando = true

            try {
                const contrasenaEncriptada = await generarSHA256(this.contrasena)

                await UsuarioClient.agregarUsuario({
                    nombre: this.nombre.trim(),
                    contrasena: contrasenaEncriptada,
                    rol: this.rol.toLowerCase()
                })

                this.mensaje = { tipo: 'exito', texto: 'Usuario guardado exitosamente.' }
                this.$emit('guardado')
                this.nombre = ''
                this.contrasena = ''
                this.rol = ''
            } catch (error) {
                this.mensaje = { tipo: 'error', texto: 'No se pudo guardar el usuario. Intenta nuevamente.' }
            } finally {
                this.guardando = false
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

.form-body input {
    width: 100%;
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 11px 14px;
    font: inherit;
    background: var(--bg);
    color: var(--text);
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.form-body input:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.12);
}

.form-body button[type="submit"] {
    justify-self: start;
    border: none;
    border-radius: 10px;
    padding: 12px 20px;
    background: var(--primary);
    color: white;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    transition: background 0.15s ease, transform 0.15s ease;
}

.form-body button[type="submit"]:hover:not(:disabled) {
    background: var(--primary-dark);
    transform: translateY(-1px);
}

.form-body button[type="submit"]:disabled {
    cursor: progress;
    opacity: 0.75;
}
</style>