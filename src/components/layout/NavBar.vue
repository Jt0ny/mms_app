<template>
  <div class="container-nav">
    <nav class="navbar">

      <!-- Logo -->
      <div class="logo" aria-label="Gestión de manufactura">
        <img src="../../assets/logo.png" alt="Logo Florícola" class="logo-img" />
        <div class="logo-copy">
          <span>Florícola</span>
          <strong>Sistema MMS</strong>
        </div>
      </div>

      <!-- Menú-->
      <ul class="menu">
        <li class="active">Gestion de manufactura</li>
      </ul>

      <!-- Acciones / Usuario -->
      <div class="acciones">
        <!-- Usuario Logueado (Bloque Fijo) -->
        <div v-if="isLogged" class="user-profile-block">
          <div class="user-profile-info">
            <span class="user-profile-name">{{ usuarioNombre }}</span>
            <span class="user-profile-role">{{ rol }}</span>
          </div>
          <button class="logout-icon-btn" @click="onAction" title="Salir del sistema">
            <ArrowRightOnRectangleIcon class="icon-lg" />
          </button>
        </div>

        <!-- Usuario No Logueado -->
        <div v-else class="user-profile-block">
          <div class="user-profile-info">
            <span class="user-profile-name">Identificarse</span>
            <!--<span class="user-profile-role">Iniciar sesión</span>-->
          </div>
          <button class="login-icon-btn" @click="onAction" title="Ingresar">
            <ArrowLeftOnRectangleIcon class="icon-lg" />
          </button>
        </div>
      </div>

    </nav>
  </div>
</template>

<script>
import { useAuth } from '../../composables/useAuth.js'
import { ArrowRightOnRectangleIcon, ArrowLeftOnRectangleIcon } from '@heroicons/vue/24/outline'

export default {
  name: "Navbar",
  components: {
    ArrowRightOnRectangleIcon,
    ArrowLeftOnRectangleIcon
  },
  emits: ['ingresar', 'logout'],

  setup() {
    const { rol, isLogged, usuarioNombre } = useAuth()
    return { rol, isLogged, usuarioNombre }
  },

  methods: {
    onAction() {
      if (this.isLogged) {
        this.$emit('logout')
      } else {
        this.$emit('ingresar')
      }
    }
  }
}
</script>

<style scoped>
/* User Profile Block Styles */
.user-profile-block {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-profile-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.user-profile-name {
  color: white;
  font-weight: 600;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  line-height: 1.2;
}

.user-profile-role {
  color: rgba(255, 255, 255, 0.7);
  font-size: 11px;
  text-transform: capitalize;
  line-height: 1.2;
}

.logout-icon-btn,
.login-icon-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  margin-left: 4px;
  border: 1px solid transparent;
}

.logout-icon-btn:hover {
  background: rgba(239, 68, 68, 0.15);
  /* bg-red-500 tint */
  color: var(--color-logout-hover);
  /* text-red-300 */
  border-color: rgba(239, 68, 68, 0.3);
}

.login-icon-btn:hover {
  background: rgba(16, 185, 129, 0.15);
  /* bg-green-500 tint */
  color: var(--color-login-hover);
  /* text-green-300 */
  border-color: rgba(16, 185, 129, 0.3);
}

.container-nav {
  width: 100%;
  background: var(--secondary);
  padding: 12px clamp(16px, 3vw, 30px);
  display: flex;
  align-items: center;
  box-sizing: border-box;
  box-shadow: var(--shadow-sm);
}

.navbar {
  display: grid;
  grid-template-columns: auto 1fr auto;
  grid-template-areas: 'logo menu acciones';
  align-items: center;
  gap: 20px;
  min-width: 0;
  width: 100%;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 0 0 auto;
  grid-area: logo;
}

.logo-img {
  width: 52px;
  height: 52px;
  object-fit: contain;
}

.logo-copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
  line-height: 1;
}

.logo-copy span {
  color: rgba(255, 255, 255, 0.75);
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.logo-copy strong {
  color: white;
  font-size: 15px;
  letter-spacing: 0.01em;
}

.menu {
  list-style: none;
  display: flex;
  gap: 30px;
  margin: 0;
  padding: 0;
  justify-content: center;
  min-width: 0;
  grid-area: menu;
}

.menu li {
  color: var(--primary-light);
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
  letter-spacing: 0.5px;
  transition: color 0.3s ease;
  padding: 8px 0;
  border-bottom: 2px solid transparent;
}

.menu li.active {
  color: white;
  border-bottom-color: var(--primary-light);
}

.menu li:hover {
  color: white;
}

.acciones {
  display: flex;
  gap: 10px;
  margin-left: auto;
  grid-area: acciones;
}



@media (max-width: 768px) {
  .container-nav {
    flex-shrink: 0;
    padding: 8px 16px;
    min-height: auto;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .navbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    width: 100%;
  }

  .menu {
    display: none; /* Hide redundant label on mobile/tablet */
  }

  .logo {
    gap: 10px;
  }

  .logo-img {
    width: 40px;
    height: 40px;
  }

  .logo-copy span {
    font-size: 10px;
    letter-spacing: 0.06em;
  }

  .logo-copy strong {
    font-size: 13.5px;
  }

  .acciones {
    margin-left: 0;
    width: auto;
  }

  .user-profile-block {
    gap: 10px;
  }

  .user-profile-name {
    font-size: 12px;
  }

  .user-profile-role {
    font-size: 10px;
  }
}

@media (max-width: 480px) {
  .container-nav {
    padding: 8px 12px;
  }

  .logo-img {
    width: 36px;
    height: 36px;
  }

  .logo-copy span {
    display: none;
  }

  .logo-copy strong {
    font-size: 13px;
  }

  .user-profile-role {
    display: none;
  }
}
</style>