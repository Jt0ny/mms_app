<template>
  <div class="public-home">
    <NavBar @ingresar="mostrarLogin = true" @logout="salirSistema" />
    <h1>Bienvenido a Nuestra Aplicación</h1>

    <main class="hero">
      <transition name="fade">
        <div v-if="mostrarLogin" class="login-overlay" @click.self="mostrarLogin = false">
          <LoginForm @ingresar="ingresarSistema" />
        </div>
      </transition>
    </main>
  </div>
</template>

<script>
import NavBar from '../components/layout/NavBar.vue'
import LoginForm from '../components/login/LoginForm.vue'

export default {
  name: 'PublicHomePage',

  components: {
    NavBar,
    LoginForm
  },

  data() {
    return {
      mostrarLogin: false
    }
  },

  methods: {
    ingresarSistema(usuario) {
      const rol = (usuario.rol || '').toLowerCase()
      localStorage.setItem('rol', rol)
      localStorage.setItem('usuarioId', usuario.id ?? '')
      localStorage.setItem('usuarioNombre', usuario.nombre ?? '')
      this.mostrarLogin = false

      const rutaInicial = rol === 'operador' ? '/app/produccion' : '/app/pedidos'
      this.$router.push(rutaInicial)
    },

    salirSistema() {
      localStorage.removeItem('rol')
      this.mostrarLogin = false
    }
  }
}
</script>

<style scoped>
.public-home {
  min-height: 100dvh;
  background:
    radial-gradient(circle at top left, rgba(22, 163, 74, 0.12), transparent 36%),
    radial-gradient(circle at bottom right, rgba(42, 93, 28, 0.08), transparent 32%),
    var(--bg-secondary);
}

.hero {
  position: relative;
  min-height: calc(100dvh - 76px);
  padding: 24px;
}

.login-overlay {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(17, 24, 39, 0.24);
  backdrop-filter: blur(4px);
  z-index: 30;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>