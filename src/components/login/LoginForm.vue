<template>
    <div class="login-card">
        <h1>Gestión de Manufactura</h1>
        <p type="Nombre:"><input type="text" v-model="nombre" autocomplete="username" /></p>
        <p type="Contraseña:"><input type="password" v-model="contrasena" autocomplete="current-password" @keyup.enter="ingresar" /></p>
        <AlertasLogin :mensaje="mensaje" />
        <button type="button" @click="ingresar">Ingresar</button>
    </div>
</template>

<script>
import AlertasLogin from '../Alertas.vue'

export default {

    emits: ['ingresar'],

    components: {
        AlertasLogin
    },

    data() {

        return {

            nombre: '',
            contrasena: '',

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

        ingresar() {

            const usuariosPermitidos = [
                { nombre: 'operador1', contrasena: 'operador123', rol: 'operador' },
                { nombre: 'operador2', contrasena: 'operador456', rol: 'operador' },
                { nombre: 'supervisor', contrasena: 'supervisor123', rol: 'supervisor' }
            ]

            const usuario = usuariosPermitidos.find(

                (item) => item.nombre === this.nombre.trim().toLowerCase() && item.contrasena === this.contrasena)

            if (!usuario) {
                this.mostrarMensaje('error', 'Usuario o contraseña incorrectos.')
                return
            }

            this.mensaje = { tipo: null, texto: '' }

            this.$emit('ingresar', usuario.rol)
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
    padding: 36px;
    background: white;
    border-radius: 22px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.08);
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

    background: #f3f4f6;

    outline: none;

    font: inherit;

    transition: 0.2s ease;
}

input:focus {
    border-color: var(--primary);

    background: white;

    box-shadow:
        0 0 0 4px rgba(16, 185, 129, 0.12);
}

button {
    width: 100%;

    margin-top: 8px;

    padding: 14px;

    border: none;

    border-radius: 999px;

    background:
        linear-gradient(
            135deg,
            var(--primary),
            var(--primary-dark)
        );

    color: white;

    font-size: 16px;

    font-weight: 700;

    cursor: pointer;

    transition: 0.2s ease;
}

button:hover {
    transform: translateY(-1px);

    opacity: 0.95;
}

button:active {
    transform: scale(0.99);
}

@media (max-width: 480px) {
    .login-card {
        padding: 28px 22px;
        border-radius: 18px;
    }

    button {
        font-size: 15px;
    }
}
</style>