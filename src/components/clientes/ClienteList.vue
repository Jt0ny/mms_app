<!-- ClienteList.vue -->
<template>
  <div class="data-card h-full">
    <div class="data-card-header neutral">
      <div class="title-section">
        <div class="flex-align-center gap-8">
          <DocumentTextIcon v-if="mostrarSoloTipo === 'Facturación'" class="icon-lg text-primary" />
          <TruckIcon v-else-if="mostrarSoloTipo === 'Envío'" class="icon-lg text-warning" />
          <h2>{{ titulo }}</h2>
        </div>
        <p class="data-card-subtitle">{{ totalClientes }} registros en total</p>
      </div>

      <!-- Filtros -->
      <div class="filter-bar">
        <input v-model="filtros.buscar"
          :placeholder="mostrarDetallesContacto ? 'Buscar por nombre, correo...' : 'Buscar ...'"
          class="filter-input filter-search" />

        <div v-if="mostrarDetallesContacto" class="select-wrapper">
          <select v-model="filtros.tipo" class="filter-select">
            <option value="">Todos los tipos</option>
            <option value="Facturación">Facturación</option>
            <option value="Envío">Envío</option>
            <option value="Ambos">Ambos</option>
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
    <div v-else-if="clientesFiltrados.length === 0" class="empty-state-card m-5">
      <p>
        <InboxIcon class="icon-lg icon-inline text-light" /> No se encontraron registros
      </p>
    </div>

    <!-- Tabla de Clientes -->
    <div v-else class="data-card-content no-pad">
      <table class="data-card-table">
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
                <LinkIcon class="icon-sm icon-inline" /> Factura a: {{ cliente.clienteFacturacionAsociado }}
              </div>
            </td>
            <td v-if="mostrarDetallesContacto">
              <span :class="['badge', getBadgeClass(cliente.tipo)]">
                {{ cliente.tipo }}
              </span>
            </td>
            <td v-if="mostrarDetallesContacto">
              <a v-if="cliente.email" :href="`mailto:${cliente.email}`" class="link-contact" @click.stop>
                {{ cliente.email }}
              </a>
              <span v-else class="no-data">—</span>
            </td>
            <td v-if="mostrarDetallesContacto">
              <a v-if="cliente.telefono" :href="`tel:${cliente.telefono}`" class="link-contact" @click.stop>
                {{ cliente.telefono }}
              </a>
              <span v-else class="no-data">—</span>
            </td>
            <td v-if="mostrarDetallesContacto">
              <span v-if="cliente.direccion" class="address-text" :title="cliente.direccion">
                {{ cliente.direccion }}
              </span>
              <span v-else class="no-data">—</span>
            </td>
            <td class="actions-col" @click.stop>
              <button class="btn-action-ghost edit" @click.stop="$emit('editar', cliente)" title="Editar Cliente">
                <PencilIcon class="icon-action text-info" />
              </button>
              <button class="btn-action-ghost delete" @click.stop="$emit('eliminar', cliente)" title="Eliminar Cliente">
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
import {
  DocumentTextIcon, TruckIcon, InboxIcon,
  LinkIcon, PencilIcon, TrashIcon
} from '@heroicons/vue/24/outline'

export default {
  name: 'ClienteList',
  components: {
    DocumentTextIcon, TruckIcon, InboxIcon,
    LinkIcon, PencilIcon, TrashIcon
  },
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
.title-section {
  flex-grow: 1;
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
  background: var(--primary-bg) !important;
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
.badge-billing {
  background: var(--alert-info-bg);
  color: var(--alert-info-text);
}

.badge-shipping {
  background: var(--alert-warning-bg);
  color: var(--alert-warning-text);
}

.badge-both {
  background: var(--primary-bg);
  color: var(--primary);
}
</style>
