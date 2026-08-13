<template>
    <div class="login-card">
        <h1>Gestión de Manufactura</h1>
        <p type="Email:"><input type="email" v-model="email" autocomplete="email" /></p>
        <p type="Contraseña:"><input type="password" v-model="contrasena" autocomplete="current-password"
                @keyup.enter="ingresar" /></p>
        <Alertas :mensaje="mensaje" />
        <button type="button" @click="ingresar" :disabled="cargando">
            {{ cargando ? 'Ingresando...' : 'Ingresar' }}
        </button>
    </div>
</template>

<script>
import Alertas from '../Alertas.vue'
import UsuarioClient from '../../client/UsuarioClient.js'

export default {

    emits: ['ingresar'],

    components: {
        Alertas
    },

    data() {

        return {

            email: '',
            contrasena: '',
            cargando: false,
            mensaje: {
                tipo: null,
                texto: ''
            }
        }
    },

    methods: {

        mostrarMensaje(tipo, texto, duracion = 3000) {

            this.mensaje = { tipo, texto }

            if (duracion > 0) {
                setTimeout(() => { this.mensaje = { tipo: null, texto: '' } }, duracion)
            }
        },

        async ingresar() {

            const emailIngresado = this.email.trim().toLowerCase()
            const contrasenaIngresada = this.contrasena

            if (!emailIngresado || !contrasenaIngresada) {
                this.mostrarMensaje('error', 'Ingresa email y contraseña.')
                return
            }

            this.cargando = true

            const response = await UsuarioClient.login(emailIngresado, contrasenaIngresada)

            this.cargando = false

            if (response.success) {
                if (response.data) {
                    this.mensaje = { tipo: null, texto: '' }
                    this.$emit('ingresar', response.data)
                } else {
                    this.mostrarMensaje('error', 'Email o contraseña incorrectos.')
                }
            } else {
                this.mostrarMensaje('error', 'No se pudo validar el usuario. Revisa la conexion con la API.')
            }
        }
    }
}
</script>
<style scoped>
.login-card {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    gap: 18px;
    width: min(420px, 100%);
    margin: auto;
    padding: 36px;
    background: var(--bg);
    border-radius: 22px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
}

h1 {
    text-align: center;
    font-size: clamp(1.8rem, 4vw, 2.3rem);
    color: var(--text-h);
    margin-bottom: 8px;
}

p {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 0;
}

p::before {
    content: attr(type);
    color: var(--text-light);
    font-size: 14px;
    font-weight: 600;
}

input {
    width: 100%;
    padding: 14px 18px;
    border: 1px solid var(--border);
    border-radius: 999px;
    background: var(--bg-secondary);
    outline: none;
    font: inherit;
    transition: 0.2s ease;
}

input:focus {
    border-color: var(--primary);
    background: var(--bg);
    box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.12);
}

button {
    width: 100%;
    margin-top: 8px;
    padding: 14px;
    border: none;
    border-radius: 999px;
    background: linear-gradient(135deg, var(--primary), var(--primary-dark));
    color: white;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    transition: 0.2s ease;
}

button:disabled {
    cursor: progress;
    opacity: 0.75;
    transform: none;
}

button:hover {
    transform: translateY(-1px);
    opacity: 0.95;
}

button:active {
    transform: scale(0.99);
}

@media (max-width: 480px),
(max-height: 600px) {
    .login-card {
        padding: 20px 22px;
        border-radius: 18px;
        gap: 12px;
    }

    h1 {
        font-size: clamp(1.5rem, 3.5vw, 1.8rem);
    }

    input {
        padding: 10px 14px;
    }

    button {
        font-size: 15px;
        padding: 12px;
        margin-top: 4px;
    }
}
</style>