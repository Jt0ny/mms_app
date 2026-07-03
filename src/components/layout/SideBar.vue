<template>
  <aside :class="['sidebar', { collapsed: isCollapsed }]">
    <div class="top">
      <h2 v-if="!isCollapsed">MMS</h2>
      <button class="toggle" @click="toggleSidebar">☰</button>
    </div>

    <nav class="menu">
      <router-link v-if="esSupervisor" to="/app/dashboard" class="menu-item" active-class="active">
        <span>📊</span>
        <span v-if="!isCollapsed">Dashboard</span>
      </router-link>

      <router-link v-if="esSupervisor" to="/app/pedidos" class="menu-item" active-class="active">
        <span>📦</span>
        <span v-if="!isCollapsed">Pedidos</span>
      </router-link>

      <router-link v-if="esSupervisor" to="/app/clientes" class="menu-item" active-class="active">
        <span>👥</span>
        <span v-if="!isCollapsed">Clientes</span>
      </router-link>

      <router-link v-if="esSupervisor" to="/app/materia-prima" class="menu-item" active-class="active">
        <span>👤</span>
        <span v-if="!isCollapsed">Inventario MP</span>
      </router-link>

      <router-link v-if="esSupervisor" to="/app/materiales" class="menu-item" active-class="active">
        <span>📊</span>
        <span v-if="!isCollapsed">Inventario M</span>
      </router-link>

      <router-link v-if="esSupervisor" to="/app/recetas" class="menu-item" active-class="active">
        <span>⚙️</span>
        <span v-if="!isCollapsed">Crear Receta</span>
      </router-link>

      <router-link v-if="esSupervisor" to="/app/planificacion" class="menu-item" active-class="active">
        <span>🗂️</span>
        <span v-if="!isCollapsed">Planificación</span>
      </router-link>

      <router-link v-if="esSupervisor" to="/app/usuarios" class="menu-item" active-class="active">
        <span>⚙️</span>
        <span v-if="!isCollapsed">Usuarios</span>
      </router-link>

      <router-link v-if="esSupervisor" to="/app/mermas" class="menu-item" active-class="active">
        <span>⚠️</span>
        <span v-if="!isCollapsed">Mermas</span>
      </router-link>

      <router-link v-if="esOperador" to="/app/produccion" class="menu-item" active-class="active">
        <span>📝</span>
        <span v-if="!isCollapsed">Producción diaria</span>
      </router-link>
    </nav>
  </aside>
</template>

<script>
export default {
  name: "SidebarLayout",

  data() {
    return {
      isCollapsed: false,
      rol: localStorage.getItem('rol')
    }
  },

  watch: {
    // Re-leer el rol cuando cambia la ruta (ej. después de login/logout)
    $route() {
      this.rol = localStorage.getItem('rol')
    }
  },

  computed: {
    esOperador() {
      return this.rol === 'operador'
    },

    esSupervisor() {
      return this.rol === 'supervisor'
    }
  },
  methods: {
    toggleSidebar() {
      this.isCollapsed = !this.isCollapsed
    }
  }
}
</script>

<style scoped>
.sidebar {
  width: clamp(var(--sidebar-min, 70px), 18vw, var(--sidebar-max, 250px));
  background: var(--secondary);
  color: white;
  transition: width 0.3s ease;
  padding: 20px;
  overflow-y: auto;
  flex-shrink: 0;
  box-shadow: var(--shadow-sm);
}

.sidebar.collapsed {
  width: clamp(56px, 12vw, 70px);
}

/* Tablet portrait: ancho fijo cómodo */
@media (min-width: 769px) and (max-width: 1024px) {
  .sidebar {
    width: 200px;
  }

  .sidebar.collapsed {
    width: 64px;
  }
}

.top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.top h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 1px;
  color: var(--primary-light);
}

.toggle {
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: background 0.3s ease;
}

.toggle:hover {
  background: rgba(255, 255, 255, 0.1);
}

.menu {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.menu-item {
  appearance: none;
  border: none;
  background: transparent;
  text-decoration: none;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.3s ease;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
  font-size: clamp(12px, 1vw, 14px);
  letter-spacing: 0.3px;
  text-align: left;
}

.menu-item:hover:not(.disabled) {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.menu-item.active {
  background: var(--primary);
  color: white;
  box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);
}

.menu-item.disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.menu-item span:first-child {
  font-size: clamp(18px, 1.4vw, 20px);
  min-width: 24px;
  text-align: center;
}

/* Colapsado: centra el ícono */
.sidebar.collapsed .menu-item {
  justify-content: center;
  padding: 12px 8px;
}

.sidebar.collapsed .menu-item span:not(:first-child) {
  display: none;
}

@media (max-width: 768px) {
  .sidebar {
    width: 100%;
    height: auto;
    padding: 12px;
    overflow-x: hidden;
  }

  .sidebar.collapsed {
    width: 100%;
  }

  .top {
    margin-bottom: 12px;
  }

  .top h2 {
    display: none;
  }

  .menu {
    display: flex;
    flex-direction: row;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 4px;
    scrollbar-width: thin;
  }

  .menu-item {
    white-space: nowrap;
    padding: 8px 10px;
    width: auto;
  }

  .menu-item span:first-child {
    min-width: 0;
  }
}

@media (max-width: 480px) {
  .sidebar {
    padding: 10px;
  }

  .top {
    margin-bottom: 10px;
    padding-bottom: 12px;
  }

  .toggle {
    font-size: 18px;
    padding: 6px;
  }

  .menu {
    flex-direction: column;
    overflow-x: visible;
  }

  .menu-item {
    width: 100%;
  }
}
</style>