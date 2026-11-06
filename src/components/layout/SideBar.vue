<template>
  <aside :class="['sidebar', { collapsed: isCollapsed }]">
    <div class="top">
      <h2 :class="{ 'hidden-text': isCollapsed }">MMS</h2>
      <button class="toggle" @click="toggleSidebar">
        <Bars3Icon class="icon-lg text-white" />
      </button>
    </div>

    <nav class="menu no-scrollbar">
      <router-link v-if="esSupervisor" to="/app/dashboard" class="menu-item" active-class="active">
        <ChartBarIcon class="sidebar-icon" />
        <span :class="{ 'hidden-text': isCollapsed }">Dashboard</span>
      </router-link>

      <router-link v-if="esSupervisor" to="/app/pedidos" class="menu-item" active-class="active">
        <ClipboardDocumentCheckIcon class="sidebar-icon" />
        <span :class="{ 'hidden-text': isCollapsed }">Pedidos</span>
      </router-link>

      <router-link v-if="esSupervisor" to="/app/clientes" class="menu-item" active-class="active">
        <BuildingOfficeIcon class="sidebar-icon" />
        <span :class="{ 'hidden-text': isCollapsed }">Clientes</span>
      </router-link>

      <router-link v-if="esSupervisor" to="/app/materia-prima" class="menu-item" active-class="active">
        <InboxStackIcon class="sidebar-icon" />
        <span :class="{ 'hidden-text': isCollapsed }">Inventario MP</span>
      </router-link>

      <router-link v-if="esSupervisor" to="/app/materiales" class="menu-item" active-class="active">
        <CubeIcon class="sidebar-icon" />
        <span :class="{ 'hidden-text': isCollapsed }">Inventario M</span>
      </router-link>

      <router-link v-if="esSupervisor" to="/app/recetas" class="menu-item" active-class="active">
        <ClipboardDocumentListIcon class="sidebar-icon" />
        <span :class="{ 'hidden-text': isCollapsed }">Crear Receta</span>
      </router-link>

      <router-link v-if="esSupervisor" to="/app/planificacion" class="menu-item" active-class="active">
        <CalendarDaysIcon class="sidebar-icon" />
        <span :class="{ 'hidden-text': isCollapsed }">Planificación</span>
      </router-link>

      <router-link v-if="esSupervisor" to="/app/usuarios" class="menu-item" active-class="active">
        <UsersIcon class="sidebar-icon" />
        <span :class="{ 'hidden-text': isCollapsed }">Usuarios</span>
      </router-link>

      <router-link v-if="esSupervisor" to="/app/mermas" class="menu-item" active-class="active">
        <ExclamationTriangleIcon class="sidebar-icon" />
        <span :class="{ 'hidden-text': isCollapsed }">Mermas</span>
      </router-link>

      <router-link v-if="esOperador" to="/app/produccion" class="menu-item" active-class="active">
        <DocumentTextIcon class="sidebar-icon" />
        <span :class="{ 'hidden-text': isCollapsed }">Producción diaria</span>
      </router-link>
    </nav>
  </aside>
</template>

<script>
import { useAuth } from '../../composables/useAuth.js'
import {
  ChartBarIcon, ClipboardDocumentCheckIcon, BuildingOfficeIcon,
  InboxStackIcon, CubeIcon, ClipboardDocumentListIcon,
  CalendarDaysIcon, UsersIcon, ExclamationTriangleIcon,
  DocumentTextIcon, Bars3Icon
} from '@heroicons/vue/24/outline'

export default {
  name: "SidebarLayout",
  components: {
    ChartBarIcon, ClipboardDocumentCheckIcon, BuildingOfficeIcon,
    InboxStackIcon, CubeIcon, ClipboardDocumentListIcon,
    CalendarDaysIcon, UsersIcon, ExclamationTriangleIcon,
    DocumentTextIcon, Bars3Icon
  },
  setup() {
    const { rol } = useAuth()
    return { rol }
  },

  data() {
    return {
      isCollapsed: false
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
  watch: {
    '$route'() {
      this.scrollActiveTab()
    }
  },
  mounted() {
    this.scrollActiveTab()
  },
  methods: {
    toggleSidebar() {
      this.isCollapsed = !this.isCollapsed
    },
    scrollActiveTab() {
      this.$nextTick(() => {
        if (window.innerWidth <= 768 && this.$el) {
          const activeEl = this.$el.querySelector('.menu-item.active')
          if (activeEl) {
            activeEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
          }
        }
      })
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
  overflow-x: hidden;
  flex-shrink: 0;
  box-shadow: var(--shadow-sm);
  white-space: nowrap;
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
  max-width: 200px;
  transition: max-width 0.3s ease, opacity 0.2s ease;
  opacity: 1;
  white-space: nowrap;
}

h2.hidden-text,
span.hidden-text {
  max-width: 0 !important;
  opacity: 0;
  margin: 0;
  padding: 0;
  overflow: hidden;
  pointer-events: none;
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

.menu-item :deep(svg) {
  width: 24px;
  height: 24px;
  min-width: 24px;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

/* Colapsado: centra el ícono */
.sidebar.collapsed .menu-item {
  justify-content: center;
  padding: 12px 8px;
  gap: 0;
}

.menu-item span {
  font-size: clamp(12px, 1vw, 14px);
  max-width: 200px;
  transition: max-width 0.3s ease, opacity 0.2s ease;
  opacity: 1;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .sidebar {
    flex-shrink: 0;
    width: 100%;
    height: auto;
    padding: 8px 12px;
    overflow-x: hidden;
    overflow-y: hidden;
    background: var(--secondary);
    border-bottom: 1px solid rgba(0, 0, 0, 0.12);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  .sidebar.collapsed {
    width: 100%;
  }

  .top {
    display: none;
  }

  .menu {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 2px 2px 4px 2px;
    -webkit-overflow-scrolling: touch;
  }

  .menu-item {
    flex-shrink: 0;
    width: auto;
    white-space: nowrap;
    padding: 7px 14px;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.85);
    font-size: 13px;
    font-weight: 500;
  }

  .menu-item:hover:not(.disabled) {
    background: rgba(255, 255, 255, 0.16);
    color: #ffffff;
    border-color: rgba(255, 255, 255, 0.2);
  }

  .menu-item.active {
    background: var(--primary);
    color: #ffffff;
    font-weight: 600;
    border-color: rgba(255, 255, 255, 0.25);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
  }

  .menu-item :deep(svg) {
    width: 18px;
    height: 18px;
    min-width: 18px;
  }

  .menu-item span {
    max-width: none !important;
    opacity: 1 !important;
    font-size: 12.5px;
  }
}

@media (max-width: 480px) {
  .sidebar {
    padding: 6px 10px;
  }

  .menu {
    gap: 6px;
  }

  .menu-item {
    padding: 6px 11px;
    font-size: 12px;
    gap: 6px;
  }

  .menu-item :deep(svg) {
    width: 16px;
    height: 16px;
    min-width: 16px;
  }

  .menu-item span {
    font-size: 12px;
  }
}
</style>