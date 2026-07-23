<!-- ClientesPage.vue -->
<template>
  <div class="page-container clientes-page">
    <div class="page-content-wrap page-content-wide">
      <!-- Encabezado -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Directorio de Clientes</h1>
          <p class="page-subtitle">Administra y organiza tus brokers de facturación y destinos de entrega.</p>
        </div>

        <div class="header-actions">
          <button class="btn btn-primary" @click="abrirNuevoFormulario">
            ➕ Nuevo Cliente
          </button>
        </div>
      </div>

      <!-- Alertas -->
      <Alertas :mensaje="mensaje" />
      <!-- Layout Principal (Maestro - Detalle - Formulario Inline) -->
      <div class="main-layout" :class="{ 'with-form': mostrarFormulario }">
        <!-- Columna Izquierda: Maestro (Facturación) -->
        <div class="column-left">
          <ClienteList :clientes="clientes" :cargando="cargando" titulo="📄 1. Clientes de Facturación "
            mostrarSoloTipo="Facturación" :mostrarDetallesContacto="false"
            :clienteSeleccionadoId="clienteFacturacionSeleccionado?.id" @seleccionar="seleccionarFacturacion"
            @editar="seleccionarCliente" @eliminar="confirmarEliminar" />
        </div>

        <!-- Columna Derecha: Detalle (Envío) -->
        <div class="column-right">
          <ClienteList :clientes="clientes" :cargando="cargando" :titulo="clienteFacturacionSeleccionado
            ? `🚚 2. Destinos de Envío asociados (${clienteFacturacionSeleccionado.nombre})`
            : '🚚 2. Todos los Destinos de Envío'" mostrarSoloTipo="Envío"
            :clienteFacturacionFiltro="clienteFacturacionSeleccionado?.nombre" :mostrarDetallesContacto="true"
            @editar="seleccionarCliente" @eliminar="confirmarEliminar" />
        </div>

        <!-- Columna Formulario Inline -->
        <div v-if="mostrarFormulario" class="column-form">
          <ClienteForm :clienteSeleccionado="clienteParaEditar"
            :clientesFacturacionDisponibles="nombresFacturacionDisponibles" :guardando="guardando"
            @guardar="guardarCliente" @cancelar="cerrarFormulario" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ClientesClient from '../client/ClientesClient'
import ClienteList from '../components/clientes/ClienteList.vue'
import ClienteForm from '../components/clientes/ClienteForm.vue'
import Alertas from '../components/Alertas.vue'
import { useMensajes } from '../composables/useMensajes.js'
import { useCatalogos } from '../composables/useCatalogos.js'

export default {
  name: 'ClientesPage',
  components: {
    ClienteList,
    ClienteForm,
    Alertas
  },
  setup() {
    const { mensaje, mostrarMensaje } = useMensajes()
    const catalogos = useCatalogos()
    return { mensaje, mostrarMensaje, catalogos }
  },

  data() {
    return {
      clientes: [],
      cargando: false,
      guardando: false,
      mostrarFormulario: false,
      clienteParaEditar: null,
      clienteFacturacionSeleccionado: null
    }
  },
  computed: {
    nombresFacturacionDisponibles() {
      // Filtrar clientes que pueden ser Brokers de facturación
      return this.clientes.filter(c => c.tipo === 'Facturación' || c.tipo === 'Ambos').map(c => c.nombre)
        .sort((a, b) => a.localeCompare(b))
    }
  },
  mounted() {
    this.cargarClientes()
  },
  methods: {
    async cargarClientes(forceRefresh = false) {
      this.cargando = true
      try {
        const listado = await this.catalogos.obtenerClientes(forceRefresh)
        this.clientes = listado ?? []

        // Mantener la fila seleccionada sincronizada si cambió de nombre
        if (this.clienteFacturacionSeleccionado) {
          const matching = this.clientes.find(c => c.id === this.clienteFacturacionSeleccionado.id)
          if (matching) {
            this.clienteFacturacionSeleccionado = matching
          } else {
            this.clienteFacturacionSeleccionado = null
          }
        }
      } catch (error) {
        console.error(error)
        this.mostrarMensaje('error', '❌ Error al cargar los clientes')
      } finally {
        this.cargando = false
      }
    },
    seleccionarFacturacion(cliente) {
      // Si hace clic en el ya seleccionado, limpiamos filtro (toggle)
      if (this.clienteFacturacionSeleccionado && this.clienteFacturacionSeleccionado.id === cliente.id) {
        this.clienteFacturacionSeleccionado = null
      } else {
        this.clienteFacturacionSeleccionado = cliente
      }
    },
    abrirNuevoFormulario() {
      this.clienteParaEditar = null
      this.mostrarFormulario = true
    },
    seleccionarCliente(cliente) {
      this.clienteParaEditar = { ...cliente }
      this.mostrarFormulario = true
    },
    cerrarFormulario() {
      this.mostrarFormulario = false
      this.clienteParaEditar = null
    },
    async guardarCliente(payload) {
      this.guardando = true
      try {
        if (payload.id) {
          await ClientesClient.actualizarCliente(payload.id, payload)
          this.mostrarMensaje('exito', '✓ Cliente actualizado correctamente')
        } else {
          await ClientesClient.agregarCliente(payload)
          this.mostrarMensaje('exito', '✓ Cliente registrado correctamente')
        }
        this.cerrarFormulario()
        await this.cargarClientes(true)
      } catch (error) {
        console.error(error)
        this.mostrarMensaje('error', '❌ Error al guardar el cliente')
      } finally {
        this.guardando = false
      }
    },
    async confirmarEliminar(cliente) {
      if (confirm(`¿Estás seguro de que deseas eliminar al cliente "${cliente.nombre}"? Esto podría afectar sus relaciones.`)) {
        try {
          await ClientesClient.eliminarCliente(cliente.id)
          this.mostrarMensaje('exito', `✓ Cliente "${cliente.nombre}" eliminado correctamente`)
          if (this.clienteParaEditar && this.clienteParaEditar.id === cliente.id) {
            this.cerrarFormulario()
          }
          if (this.clienteFacturacionSeleccionado && this.clienteFacturacionSeleccionado.id === cliente.id) {
            this.clienteFacturacionSeleccionado = null
          }
          await this.cargarClientes(true)
        } catch (error) {
          console.error(error)
          this.mostrarMensaje('error', '❌ Error al eliminar el cliente')
        }
      }
    }
  }
}
</script>

<style scoped>
.page-content-wide {
  max-width: 1500px !important;
}

/* Banner de Filtro Activo */
.active-filter-banner {
  background: var(--primary-bg);
  border: 1px solid var(--primary-border);
  border-radius: 8px;
  padding: 12px 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  font-size: 13px;
  color: var(--text-h);
  animation: slideDown 0.2s ease-out;
}

.btn-clear-filter {
  background: var(--bg);
  border: 1px solid var(--primary-border);
  color: var(--primary);
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-clear-filter:hover {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

@keyframes slideDown {
  from {
    transform: translateY(-10px);
    opacity: 0;
  }

  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Layout Principal */
.main-layout {
  display: grid;
  grid-template-columns: 2fr 3fr;
  gap: 24px;
  align-items: start;
  transition: all 0.3s ease;
}

.main-layout.with-form {
  grid-template-columns: 1.5fr 2.5fr 2fr;
}

.column-left,
.column-right,
.column-form {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.column-form {
  animation: slideInRight 0.3s ease-out;
}

@keyframes slideInRight {
  from {
    transform: translateX(30px);
    opacity: 0;
  }

  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@media (max-width: 1200px) {
  .main-layout.with-form {
    grid-template-columns: 1fr 1fr;
  }

  .column-form {
    grid-column: span 2;
  }
}

@media (max-width: 1024px) {
  .main-layout {
    grid-template-columns: 1fr;
  }
}
</style>
