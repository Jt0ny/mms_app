<template>
  <div class="container-nav">
    <nav class="navbar">

      <!-- Logo -->
      <div class="logo" aria-label="Gestión de manufactura">
        <div class="logo-mark">GM</div>
        <div class="logo-copy">
          <span>Florícola</span>
          <strong>Sistema MMS</strong>
        </div>
      </div>

      <!-- Menú-->
      <ul class="menu">
        <li class="active">Gestion de manufactura</li>
      </ul>

      <!-- Botón -->
      <div class="acciones">
        <button class="btn btn-primary" type="button" @click="onAction">{{ buttonLabel }}</button>
      </div>

    </nav>
  </div>
</template>

<script>
import { useAuth } from '../../composables/useAuth.js'

export default {
  name: "Navbar",
  emits: ['ingresar', 'logout'],

  setup() {
    const { rol, isLogged, logout } = useAuth()
    return { rol, isLogged, logout }
  },

  computed: {
    buttonLabel() {
      return this.isLogged ? 'Salir del sistema' : 'Ingresar'
    }
  },

  methods: {
    onAction() {
      if (this.isLogged) {
        this.logout()
        this.$emit('logout')
      } else {
        this.$emit('ingresar')
      }
    }
  }
}
</script>

<style scoped>
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

.logo-mark {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(223, 249, 231, 0.88));
  color: var(--secondary);
  font-weight: 800;
  letter-spacing: 0.08em;
  box-shadow: inset 0 0 0 1px rgba(42, 93, 28, 0.08);
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
    padding: 10px 14px;
    min-height: auto;
  }

  .navbar {
    grid-template-columns: auto 1fr;
    grid-template-areas:
      'logo acciones'
      'menu menu';
    gap: 10px 12px;
  }

  .menu {
    flex-basis: 100%;
    justify-content: flex-start;
    gap: 12px;
    overflow-x: auto;
    padding-bottom: 4px;
    white-space: nowrap;
  }

  .acciones {
    margin-left: 0;
    justify-self: end;
    width: 100%;
  }

  .btn {
    padding: 8px 14px;
    font-size: 12px;
    width: 100%;
  }

  .menu li {
    font-size: 12px;
  }

  .logo-copy span {
    font-size: 11px;
  }

  .logo-copy strong {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .container-nav {
    padding: 10px 12px;
  }

  .navbar {
    grid-template-columns: 1fr;
    grid-template-areas:
      'logo'
      'acciones'
      'menu';
    justify-items: start;
  }

  .acciones {
    justify-self: start;
  }

  .btn {
    width: 100%;
    min-width: 0;
  }

  .menu {
    width: 100%;
  }

  .logo-mark {
    width: 46px;
    height: 46px;
    border-radius: 14px;
  }
}
</style>