<template>
    <form class="usuarios-form" @submit.prevent="guardar">
        <div class="header">
            <h1>Agregar Usuario</h1>
        </div>

        <label>Nombre<input v-model.trim="nombre" type="text" autocomplete="username"
                placeholder="Nombre de usuario" /></label>

        <label> Contraseña <input v-model="contrasena" type="password" autocomplete="new-password"
                placeholder="Contraseña segura" /></label>

        <UsuarioRol v-model="rol" :roles="roles" />

        <Alertas :mensaje="mensaje" />

        <button type="submit" :disabled="guardando">
            {{ guardando ? 'Guardando...' : 'Guardar' }}
        </button>
    </form>
</template>
<script>
import Alertas from '../Alertas.vue'
import UsuarioRol from './UsuarioRol.vue'
import UsuarioClient from '../../client/UsuarioClient.js'

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
        async generarSHA256(texto) {
            const encoder = new TextEncoder()
            const data = encoder.encode(texto)
            const hashBuffer = await crypto.subtle.digest('SHA-256', data)
            const hashArray = Array.from(new Uint8Array(hashBuffer))
            return hashArray.map((byte) => byte.toString(16).padStart(2, '0')).join('')
        },

        async guardar() {
            if (this.nombre.trim() === '' || this.contrasena.trim() === '') {
                this.mensaje = {
                    tipo: 'error',
                    texto: 'Por favor, complete todos los campos.'
                }
                return
            }

            if (!this.rol) {
                this.mensaje = {
                    tipo: 'error',
                    texto: 'Selecciona un rol para el usuario.'
                }
                return
            }

            this.guardando = true

            try {
                const contrasenaEncriptada = await this.generarSHA256(this.contrasena)

                await UsuarioClient.agregarUsuario({
                    nombre: this.nombre.trim(),
                    contrasena: contrasenaEncriptada,
                    rol: this.rol.toLowerCase()
                })

                this.mensaje = {
                    tipo: 'exito',
                    texto: 'Usuario guardado exitosamente.'
                }
                this.$emit('guardado')
                this.nombre = ''
                this.contrasena = ''
                this.rol = ''
            } catch (error) {
                this.mensaje = {
                    tipo: 'error',
                    texto: 'No se pudo guardar el usuario. Intenta nuevamente.'
                }
            } finally {
                this.guardando = false
            }
        }
    }
}

</script>

<style scoped>
.usuarios-form {
    display: grid;
    gap: 18px;
    max-width: 560px;
    padding: 28px;
    border-radius: 20px;
    background: #ffffff;
    box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
}

.header h1 {
    margin: 0;
    font-size: 28px;
}

.header p {
    margin: 8px 0 0;
    color: #64748b;
}

.usuarios-form label {
    display: grid;
    gap: 8px;
    font-weight: 600;
    color: #1e293b;
}

.usuarios-form input {
    width: 100%;
    border: 1px solid #cbd5e1;
    border-radius: 12px;
    padding: 12px 14px;
    font: inherit;
    background: #fff;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.usuarios-form input:focus {
    outline: none;
    border-color: #16a34a;
    box-shadow: 0 0 0 4px rgba(22, 163, 74, 0.12);
}

.usuarios-form button {
    justify-self: start;
    border: none;
    border-radius: 12px;
    padding: 12px 18px;
    background: #16a34a;
    color: white;
    font-weight: 700;
    cursor: pointer;
    transition: transform 0.15s ease, opacity 0.15s ease, background 0.15s ease;
}

.usuarios-form button:hover:not(:disabled) {
    background: #15803d;
    transform: translateY(-1px);
}

.usuarios-form button:disabled {
    cursor: progress;
    opacity: 0.75;
}
</style>