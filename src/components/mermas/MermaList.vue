<template>
  <div class="data-card h-full">
    <div class="data-card-header neutral">
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
      <div class="filter-bar">
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
      <p>
        <InboxIcon class="icon-lg icon-inline text-light" /> No se encontraron registros de mermas
      </p>
    </div>

    <!-- Tabla -->
    <div v-else class="data-card-content no-pad no-limit">
      <table class="data-card-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Tipo</th>
            <th>Elemento</th>
            <th>Cantidad</th>
            <th>Motivo</th>
            <th class="actions-col">Acciones</th>
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
import { obtenerFechaHoy } from '../../utils/date.js'

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
        fecha: obtenerFechaHoy()
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




.badge-materia_prima {
  background: var(--color-materia-prima-bg);
  color: var(--color-materia-prima);
}

.badge-material {
  background: var(--color-material-bg);
  color: var(--color-material);
}

.badge-producto_terminado {
  background: var(--color-producto-terminado-bg);
  color: var(--color-producto-terminado);
}



@media (max-width: 768px) {
  .filter-date {
    width: 100%;
    max-width: none;
  }
}

/* Forzar altura al 100% de la columna (para igualar al formulario exacto) */
.data-card {
  height: 0;
  /* Evita que los registros internos estiren la fila del grid infinitamente */
  min-height: 100%;
  /* Obliga a la tarjeta a medir exactamente lo mismo que el formulario */
  display: flex;
  flex-direction: column;
}

/* Anular la restricción global de 450px y permitir scroll interno */
.data-card-content {
  flex: 1;
  min-height: 0;
  max-height: none;
  overflow-y: auto;
}
</style>
