<template>
  <div class="public-home">
    <NavBar @ingresar="mostrarLogin = true" @logout="salirSistema" />

    <!-- Hero Section Corporativo -->
    <main class="hero-section">
      <div class="page-content-wrap">
        <div class="hero-content">
          <h1 class="hero-title">Sistema Integral de Gestión de Manufactura</h1>
          <p class="hero-subtitle">
            Plataforma centralizada para la optimización, control de inventario y planificación de producción en tiempo
            real.
          </p>
        </div>
      </div>
    </main>

    <!-- Módulos / Features -->
    <section class="features-section">
      <div class="page-content-wrap">
        <h2 class="section-title">Módulos Principales</h2>
        <div class="features-grid">

          <div class="feature-card">
            <div class="feature-icon text-primary">
              <CubeIcon class="icon-xl" />
            </div>
            <h3>Inventario </h3>
          </div>

          <div class="feature-card">
            <div class="feature-icon text-success">
              <ClipboardDocumentListIcon class="icon-xl" />
            </div>
            <h3>Planificación</h3>
          </div>

          <div class="feature-card">
            <div class="feature-icon text-warning">
              <Cog6ToothIcon class="icon-xl" />
            </div>
            <h3>Producción</h3>
          </div>

          <div class="feature-card">
            <div class="feature-icon text-danger">
              <ChartBarIcon class="icon-xl" />
            </div>
            <h3>Control de Mermas</h3>
          </div>

        </div>
      </div>
    </section>

    <!-- Footer Corporativo -->
    <footer class="corporate-footer">
      <div class="page-content-wrap footer-content">
        <p>&copy; 2026 Sistema MMS - Universidad Central del Ecuador.</p>
      </div>
    </footer>

    <!-- Modal Login -->
    <transition name="fade">
      <div v-if="mostrarLogin" class="login-overlay" @click.self="mostrarLogin = false">
        <LoginForm @ingresar="ingresarSistema" />
      </div>
    </transition>
  </div>
</template>

<script>
import NavBar from '../components/layout/NavBar.vue'
import LoginForm from '../components/login/LoginForm.vue'
import { useAuth } from '../composables/useAuth.js'
import {
  CubeIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  ChartBarIcon
} from '@heroicons/vue/24/outline'

export default {
  name: 'PublicHomePage',

  components: {
    NavBar,
    LoginForm,
    CubeIcon,
    ClipboardDocumentListIcon,
    Cog6ToothIcon,
    ChartBarIcon
  },

  setup() {
    const { login, logout } = useAuth()
    return { login, logout }
  },

  data() {
    return {
      mostrarLogin: false
    }
  },

  methods: {
    ingresarSistema(usuario) {
      this.login(usuario)
      this.mostrarLogin = false

      const rol = (usuario.rol || '').toLowerCase()
      const rutaInicial = rol === 'operador' ? '/app/produccion' : '/app/dashboard'
      this.$router.push(rutaInicial)
    },

    async salirSistema() {
      await this.logout()
      this.mostrarLogin = false
    }
  }
}
</script>

<style scoped>
.public-home {
  position: relative;
  min-height: 100dvh;
  background-image: url('../assets/fondo.png');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  display: flex;
  flex-direction: column;
}

.public-home::before {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(17, 24, 39, 0.75);
  z-index: 0;
}

.public-home>* {
  position: relative;
  z-index: 1;
}

/*  Hero Section */
.hero-section {
  padding: 10px 24px 10px;
  text-align: center;
}

.hero-content {
  max-width: 800px;
  margin: 0 auto;
}

.hero-title {
  font-size: 45px;
  font-weight: 800;
  color: white;
  margin-bottom: 24px;
  line-height: 1.2;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.hero-subtitle {
  font-size: 20px;
  color: rgba(255, 255, 255, 0.95);
  margin-bottom: 40px;
  line-height: 1.6;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

/* ── Features Section ───────────────────────── */
.features-section {
  padding: 10px 24px 10px;
  flex: 1;
}

.section-title {
  text-align: center;
  font-size: 32px;
  font-weight: 700;
  color: white;
  margin-bottom: 48px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
}

.feature-card {
  padding: 10px;
  text-align: center;
}

.feature-icon {
  margin-bottom: 20px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 64px;
  height: 64px;
  color: white !important;
}

.feature-card h3 {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 12px;
  color: white;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
}

.feature-card p {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.5;
  margin: 0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}

/*  Footer */
.corporate-footer {
  background-color: var(--secondary);
  padding: 24px;
  margin-top: auto;
}

.footer-content {
  text-align: center;
  color: white;
  font-size: 14px;
}

/*Modal Login */
.login-overlay {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(17, 24, 39, 0.4);
  backdrop-filter: blur(4px);
  z-index: 50;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 32px;
  }
}
</style>