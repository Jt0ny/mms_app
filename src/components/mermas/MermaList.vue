<template>
  <div class="merma-list-card">
    <div class="list-header">
      <div class="title-section">
        <h3>📋 Historial de Mermas</h3>
        <p v-if="mermas.length > 0">
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
            <option value="materia_prima">🌸 Materia Prima</option>
            <option value="material">📦 Material</option>
            <option value="producto_terminado">✨ Prod. Terminado</option>
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
    <div v-else-if="mermasFiltradas.length === 0" class="empty-state">
      <p>📭 No se encontraron registros de mermas</p>
    </div>

    <!-- Tabla -->
    <div v-else class="table-container">
      <table class="mermas-table">
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
              <button class="btn-delete" @click="$emit('eliminar', item)" title="Eliminar registro"
                aria-label="Eliminar">
                🗑️
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MermaList',
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
      }).sort((a, b) => new Date(b.fecha || b.creado_en) - new Date(a.fecha || a.creado_en))
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
.merma-list-card {
  background: var(--bg);
  border-radius: 12px;
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow);
  overflow: hidden;
}

.list-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.title-section h3 {
  margin: 0 0 4px;
  font-size: 16px;
  color: var(--text-h);
}

.title-section p {
  margin: 0;
  font-size: 13px;
  color: var(--text-light);
}

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

/* Tabla */
.table-container {
  overflow-x: auto;
  padding: 0 20px 20px;
}

.mermas-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.mermas-table th {
  background: var(--bg-secondary);
  padding: 14px 20px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-light);
  border-bottom: 1px solid var(--border);
  letter-spacing: 0.5px;
}

.mermas-table td {
  padding: 14px 20px;
  font-size: 14px;
  border-bottom: 1px solid var(--border-light);
  color: var(--text);
  vertical-align: middle;
}

.mermas-table tbody tr:hover {
  background: var(--bg-secondary);
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

.btn-delete {
  background: rgba(185, 28, 28, 0.1);
  color: var(--error);
  border: none;
  border-radius: 6px;
  padding: 6px 10px;
  cursor: pointer;
  transition: transform 0.2s ease, background-color 0.2s ease;
  font-size: 14px;
}

.btn-delete:hover {
  background: rgba(185, 28, 28, 0.2);
  transform: scale(1.05);
}

/* Loading & Empty States */
.loading-state,
.empty-state {
  padding: 48px;
  text-align: center;
  color: var(--text-light);
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid var(--border);
  border-top-color: var(--error);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 12px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .list-header {
    flex-direction: column;
    align-items: flex-start;
  }

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

  .table-container {
    padding: 0 10px 10px;
  }
}
</style>
