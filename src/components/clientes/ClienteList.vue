<!-- ClienteList.vue -->
<template>
  <div class="clientes-list-card">
    <div class="list-header">
      <div class="title-section">
        <h3>{{ titulo }}</h3>
        <p class="subtitle">{{ totalClientes }} registros en total</p>
      </div>

      <!-- Filtros -->
      <div class="filters">
        <input v-model="filtros.buscar"
          :placeholder="mostrarDetallesContacto ? 'Buscar por nombre, correo...' : 'Buscar ...'"
          class="filter-input filter-search" />

        <div v-if="mostrarDetallesContacto" class="select-wrapper">
          <select v-model="filtros.tipo" class="filter-select">
            <option value="">Todos los tipos</option>
            <option value="Facturación">📄 Facturación</option>
            <option value="Envío">🚚 Envío</option>
            <option value="Ambos">🔄 Ambos</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Cargar -->
    <div v-if="cargando" class="loading-state">
      <div class="spinner"></div>
      <p>Cargando lista...</p>
    </div>

    <!-- Lista Vacía -->
    <div v-else-if="clientesFiltrados.length === 0" class="empty-state">
      <p>📭 No se encontraron registros</p>
    </div>

    <!-- Tabla de Clientes -->
    <div v-else class="table-container">
      <table class="clientes-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th v-if="mostrarDetallesContacto">Tipo</th>
            <th v-if="mostrarDetallesContacto">Email</th>
            <th v-if="mostrarDetallesContacto">Teléfono</th>
            <th v-if="mostrarDetallesContacto">Dirección</th>
            <th class="actions-col">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="cliente in clientesFiltrados" :key="cliente.id"
            :class="['client-row', { 'active-row': clienteSeleccionadoId === cliente.id, 'clickable-row': !mostrarDetallesContacto }]"
            @click="seleccionarFila(cliente)">
            <td class="name-col">
              <div class="client-name">{{ cliente.nombre }}</div>
              <div v-if="mostrarDetallesContacto && cliente.tipo === 'Envío' && cliente.clienteFacturacionAsociado"
                class="associated-badge">
                🔗 Factura a: {{ cliente.clienteFacturacionAsociado }}
              </div>
            </td>
            <td v-if="mostrarDetallesContacto">
              <span :class="['badge', getBadgeClass(cliente.tipo)]">
                {{ cliente.tipo }}
              </span>
            </td>
            <td v-if="mostrarDetallesContacto">
              <a v-if="cliente.email" :href="`mailto:${cliente.email}`" class="link-contact" @click.stop>
                ✉️ {{ cliente.email }}
              </a>
              <span v-else class="no-data">—</span>
            </td>
            <td v-if="mostrarDetallesContacto">
              <a v-if="cliente.telefono" :href="`tel:${cliente.telefono}`" class="link-contact" @click.stop>
                📞 {{ cliente.telefono }}
              </a>
              <span v-else class="no-data">—</span>
            </td>
            <td v-if="mostrarDetallesContacto">
              <span v-if="cliente.direccion" class="address-text" :title="cliente.direccion">
                📍 {{ cliente.direccion }}
              </span>
              <span v-else class="no-data">—</span>
            </td>
            <td class="actions-col" @click.stop>
              <button class="btn-action edit" @click.stop="$emit('editar', cliente)" title="Editar Cliente">
                ✏️
              </button>
              <button class="btn-action delete" @click.stop="$emit('eliminar', cliente)" title="Eliminar Cliente">
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
  name: 'ClienteList',
  props: {
    clientes: {
      type: Array,
      required: true
    },
    cargando: {
      type: Boolean,
      default: false
    },
    titulo: {
      type: String,
      default: 'Directorio de Clientes'
    },
    mostrarSoloTipo: {
      type: String,
      default: '' // 'Facturación' o 'Envío'
    },
    clienteFacturacionFiltro: {
      type: String,
      default: ''
    },
    mostrarDetallesContacto: {
      type: Boolean,
      default: true
    },
    clienteSeleccionadoId: {
      type: String,
      default: ''
    }
  },
  emits: ['editar', 'eliminar', 'seleccionar'],
  data() {
    return {
      filtros: {
        buscar: '',
        tipo: ''
      }
    }
  },
  computed: {
    totalClientes() {
      return this.clientesFiltrados.length
    },
    clientesFiltrados() {
      return this.clientes.filter(cliente => {
        // 1. Filtro por tipo desde props (Maestro-Detalle)
        if (this.mostrarSoloTipo) {
          if (this.mostrarSoloTipo === 'Facturación' && cliente.tipo !== 'Facturación' && cliente.tipo !== 'Ambos') {
            return false
          }
          if (this.mostrarSoloTipo === 'Envío' && cliente.tipo !== 'Envío' && cliente.tipo !== 'Ambos') {
            return false
          }
        }

        // 2. Filtro por cliente de facturación asociado (relación derecha)
        if (this.clienteFacturacionFiltro) {
          const filtroLower = this.clienteFacturacionFiltro.toLowerCase().trim()
          const asociadoLower = (cliente.clienteFacturacionAsociado || '').toLowerCase().trim()

          // Mostrar si está asociado al Broker O si es el mismo Broker que puede recibir envíos (tipo 'Ambos' o 'Envío')
          const esElMismoCliente = cliente.nombre.toLowerCase().trim() === filtroLower && (cliente.tipo === 'Envío' || cliente.tipo === 'Ambos')

          if (asociadoLower !== filtroLower && !esElMismoCliente) {
            return false
          }
        }

        // 3. Filtro por dropdown de tipo interno (solo si es columna de detalles)
        if (this.mostrarDetallesContacto && this.filtros.tipo) {
          if (this.filtros.tipo === 'Facturación' && cliente.tipo !== 'Facturación' && cliente.tipo !== 'Ambos') return false
          if (this.filtros.tipo === 'Envío' && cliente.tipo !== 'Envío' && cliente.tipo !== 'Ambos') return false
          if (this.filtros.tipo === 'Ambos' && cliente.tipo !== 'Ambos') return false
        }

        // 4. Buscador
        if (this.filtros.buscar) {
          const searchLower = this.filtros.buscar.toLowerCase()
          const matchNombre = cliente.nombre?.toLowerCase().includes(searchLower)
          const matchEmail = cliente.email?.toLowerCase().includes(searchLower)
          const matchDireccion = cliente.direccion?.toLowerCase().includes(searchLower)
          const matchAsociado = cliente.clienteFacturacionAsociado?.toLowerCase().includes(searchLower)

          return matchNombre || matchEmail || matchDireccion || matchAsociado
        }

        return true
      })
    }
  },
  methods: {
    getBadgeClass(tipo) {
      switch (tipo) {
        case 'Facturación': return 'badge-billing'
        case 'Envío': return 'badge-shipping'
        case 'Ambos': return 'badge-both'
        default: return ''
      }
    },
    seleccionarFila(cliente) {
      this.$emit('seleccionar', cliente)
    }
  }
}
</script>

<style scoped>
.clientes-list-card {
  background: var(--bg);
  border: 1px solid var(--border-light);
  border-radius: 12px;
  box-shadow: var(--shadow);
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.list-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.title-section h3 {
  margin: 0 0 2px 0;
  font-size: 15px;
  color: var(--text-h);
}

.subtitle {
  margin: 0;
  font-size: 11px;
  color: var(--text-light);
}

.filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.filter-search {
  min-width: 180px;
  padding: 6px 10px;
  font-size: 12px;
}

.select-wrapper {
  position: relative;
}

.filter-select {
  padding: 6px 30px 6px 10px;
  font-size: 12px;
}

/* Tabla */
.table-container {
  overflow-y: auto;
  flex-grow: 1;
  max-height: 600px;
}

.clientes-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.clientes-table th,
.clientes-table td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-light);
  font-size: 13px;
}

.clientes-table th {
  background: var(--primary);
  font-weight: 700;
  color: white;
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 0.5px;
  position: sticky;
  top: 0;
  z-index: 5;
  border: none;
}

.client-row {
  transition: background 0.2s ease;
}

.client-row:hover {
  background: var(--bg-secondary);
}

.clickable-row {
  cursor: pointer;
}

.active-row {
  background: rgba(22, 163, 74, 0.08) !important;
  border-left: 4px solid var(--primary);
}

.active-row td {
  font-weight: 500;
}

.client-name {
  font-weight: 600;
  color: var(--text-h);
}

.associated-badge {
  font-size: 11px;
  color: var(--text-light);
  margin-top: 4px;
  display: inline-block;
  background: var(--bg-secondary);
  padding: 1px 5px;
  border-radius: 4px;
  border: 1px solid var(--border);
}

.no-data {
  color: var(--text-light);
  font-style: italic;
}

.link-contact {
  color: var(--primary);
  text-decoration: none;
  transition: color 0.2s ease;
}

.link-contact:hover {
  color: var(--primary-dark);
  text-decoration: underline;
}

.address-text {
  max-width: 180px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: inline-block;
}

/* Badges */
.badge {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
}

.badge-billing {
  background: rgba(14, 165, 233, 0.1);
  color: #0ea5e9;
}

.badge-shipping {
  background: rgba(249, 115, 22, 0.1);
  color: #f97316;
}

.badge-both {
  background: var(--primary-bg);
  color: var(--primary);
}

/* Acciones */
.actions-col {
  text-align: right;
  width: 90px;
}

.btn-action {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  font-size: 13px;
  transition: background 0.2s ease;
  margin-left: 2px;
}

.btn-action:hover {
  background: var(--border-light);
}

/* Estado de carga */
.loading-state,
.empty-state {
  padding: 40px;
  text-align: center;
  color: var(--text-light);
}

.spinner {
  border: 3px solid var(--border);
  border-top: 3px solid var(--primary);
  border-radius: 50%;
  width: 24px;
  height: 24px;
  animation: spin 1s linear infinite;
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
  .select-wrapper,
  .filter-select {
    width: 100%;
  }
}
</style>
