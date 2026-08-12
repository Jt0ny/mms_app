<template>
  <div class="data-card h-full">
    <div class="data-card-header">
      <div class="title-section">
        <div class="flex-align-center gap-8">
          <ClipboardDocumentListIcon class="icon-lg text-primary" />
          <h2>Historial de Mermas</h2>
        </div>
        <p class="data-card-subtitle" v-if="mermas.length > 0">
          <strong>{{ mermas.length }}</strong> registros encontrados
        </p>
      </div>

      <!-- Filtros -->
      <div class="filters">
        <input v-model="filtros.buscar" placeholder="Buscar por nombre o motivo..."
          class="filter-input filter-search" />
        <div class="select-wrapper">
          <select v-model="filtros.tipo" class="filter-select">
            <option value="">Todos los tipos</option>
            <option value="materia_prima">Materia Prima</option>
            <option value="material">Material</option>
            <option value="producto_terminado">Prod. Terminado</option>
          </select>
        </div>

        <input v-model="filtros.fecha" type="date" class="filter-input filter-date" placeholder="Filtrar por fecha" />
      </div>
    </div>

    <!-- Cargar -->
    <div v-if="cargando" class="loading-state">
      <div class="spinner"></div>
      <p>Cargando registros de mermas...</p>
    </div>

    <!-- Lista Vacía -->
    <div v-else-if="mermasFiltradas.length === 0" class="empty-state-card m-5">
      <p><InboxIcon class="icon-lg icon-inline text-light" /> No se encontraron registros de mermas</p>
    </div>

    <!-- Tabla -->
    <div v-else class="data-card-content no-pad">
      <table class="data-card-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Tipo</th>
            <th>Elemento</th>
            <th>Cantidad</th>
            <th>Motivo</th>
            <th class="actions-header">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in mermasFiltradas" :key="item.id">
            <td class="date-col">{{ formatearFecha(item.fecha) }}</td>
            <td>
              <span :class="['badge', `badge-${item.tipo}`]">
                {{ textoTipo(item.tipo) }}
              </span>
            </td>
            <td class="element-name">{{ item.nombre }}</td>
            <td class="quantity-col">{{ item.cantidad }}</td>
            <td class="reason-col" :title="item.motivo">{{ item.motivo }}</td>
            <td class="actions-col">
              <button class="btn-action-ghost delete" @click="$emit('eliminar', item)" title="Eliminar registro"
                aria-label="Eliminar">
                <TrashIcon class="icon-action text-error" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { ClipboardDocumentListIcon, InboxIcon, TrashIcon } from '@heroicons/vue/24/outline'

export default {
  name: 'MermaList',
  components: {
    ClipboardDocumentListIcon, InboxIcon, TrashIcon
  },
  props: {
    mermas: {
      type: Array,
      default: () => []
    },
    cargando: {
      type: Boolean,
      default: false
    }
  },
  emits: ['eliminar'],
  data() {
    return {
      filtros: {
        buscar: '',
        tipo: '',
        fecha: ''
      }
    }
  },
  computed: {
    mermasFiltradas() {
      return this.mermas.filter(item => {
        const q = String(this.filtros.buscar || '').toLowerCase().trim()
        const nombreMatch = q ? String(item.nombre || '').toLowerCase().includes(q) : true
        const motivoMatch = q ? String(item.motivo || '').toLowerCase().includes(q) : true
        const searchMatch = nombreMatch || motivoMatch
        const tipoMatch = this.filtros.tipo ? item.tipo === this.filtros.tipo : true
        const fechaMatch = this.filtros.fecha ? item.fecha === this.filtros.fecha : true
        return searchMatch && tipoMatch && fechaMatch
      }).sort((a, b) => new Date(b.fecha || b.creadoEn) - new Date(a.fecha || a.creadoEn))
    }
  },
  methods: {
    textoTipo(tipo) {
      switch (tipo) {
        case 'materia_prima': return 'Materia Prima'
        case 'material': return 'Material'
        case 'producto_terminado': return 'Prod. Terminado'
        default: return tipo
      }
    },
    formatearFecha(fechaStr) {
      if (!fechaStr) return '—'
      const parts = fechaStr.split('-')
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`
      }
      return fechaStr
    }
  }
}
</script>

<style scoped>
/* Filtros */
.filters {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.filter-input,
.filter-select {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
  background: var(--bg);
  color: var(--text);
  transition: all 0.3s ease;
  outline: none;
}

.filter-input:focus,
.filter-select:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-bg);
}

.filter-search {
  min-width: 200px;
}

.filter-date {
  max-width: 140px;
}

.date-col {
  white-space: nowrap;
  font-weight: 500;
}

.element-name {
  font-weight: 700;
  color: var(--text-h);
}

.quantity-col {
  font-weight: 700;
  color: var(--error);
  text-align: center;
  max-width: 80px;
}

.reason-col {
  max-width: 250px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--text-light);
}

/* Badges */
.badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

/* Sobreescritura local para que solo este componente tenga el fondo blanco en su header */
.data-card-header {
  background: var(--bg);
  border-bottom: 1px solid var(--border-light);
  color: var(--text);
}
.data-card-header h2 {
  color: var(--text-h);
}
.data-card-header p.data-card-subtitle {
  color: var(--text-light);
  opacity: 1;
}

.badge-materia_prima {
  background: rgba(219, 39, 119, 0.1);
  color: #db2777;
}

.badge-material {
  background: rgba(37, 99, 235, 0.1);
  color: #2563eb;
}

.badge-producto_terminado {
  background: rgba(124, 58, 237, 0.1);
  color: #7c3aed;
}

/* Acciones */
.actions-header {
  text-align: right;
}

.actions-col {
  text-align: right;
}

@media (max-width: 768px) {
  .filters {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }

  .filter-search,
  .filter-select,
  .filter-date {
    width: 100%;
    max-width: none;
  }
}
</style>
