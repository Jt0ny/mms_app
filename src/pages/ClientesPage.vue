<!-- ClientesPage.vue -->
<template>
  <div class="page-container clientes-page">
    <div class="page-content-wrap wide">
      <!-- Encabezado -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Directorio de Clientes</h1>
          <p class="page-subtitle">Administra y organiza tus brokers de facturación y destinos de entrega.</p>
        </div>

        <div class="header-actions">
        </div>
      </div>

      <!-- Alertas -->
      <Alertas :mensaje="mensaje" />
      <!-- Layout Principal (Maestro - Detalle - Formulario Inline) -->
      <div class="main-layout" :class="{ 'with-form': mostrarFormulario }">
        <!-- Columna Izquierda: Maestro (Facturación) -->
        <div class="column-left">
          <ClienteList :clientes="clientes" :cargando="cargando" titulo="1. Clientes de Facturación "
            mostrarSoloTipo="Facturación" :mostrarDetallesContacto="false"
            :clienteSeleccionadoId="clienteFacturacionSeleccionado?.id" @seleccionar="seleccionarFacturacion"
            @editar="seleccionarCliente" @eliminar="confirmarEliminar" />
        </div>

        <!-- Columna Derecha: Detalle (Envío) -->
        <div class="column-right">
          <ClienteList :clientes="clientes" :cargando="cargando" :titulo="clienteFacturacionSeleccionado
            ? `2. Destinos de Envío asociados (${clienteFacturacionSeleccionado.nombre})`
            : '2. Todos los Destinos de Envío'" mostrarSoloTipo="Envío"
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
import ClienteClient from '../client/ClienteClient'
import ClienteList from '../components/clientes/ClienteList.vue'
import ClienteForm from '../components/clientes/ClienteForm.vue'
import Alertas from '../components/shared/Alertas.vue'
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
    this.cargarClientes(true)
  },
  methods: {
    async cargarClientes(forceRefresh = false) {
      this.cargando = true
      const response = await this.catalogos.obtenerClientes(forceRefresh)

      if (response?.success === false) {
        this.clientes = []
        this.mostrarMensaje('error', 'Error al cargar los clientes')
      } else {
        this.clientes = response?.data ?? []
      }

      // Mantener la fila seleccionada sincronizada si cambió de nombre
      if (this.clienteFacturacionSeleccionado) {
        const matching = this.clientes.find(c => c.id === this.clienteFacturacionSeleccionado.id)
        if (matching) {
          this.clienteFacturacionSeleccionado = matching
        } else {
          this.clienteFacturacionSeleccionado = null
        }
      }
      this.cargando = false
    },
    seleccionarFacturacion(cliente) {
      // Si hace clic en el ya seleccionado, limpiamos filtro (toggle)
      if (this.clienteFacturacionSeleccionado && this.clienteFacturacionSeleccionado.id === cliente.id) {
        this.clienteFacturacionSeleccionado = null
      } else {
        this.clienteFacturacionSeleccionado = cliente
      }
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

      let response;
      if (payload.id) {
        response = await ClienteClient.actualizarCliente(payload.id, payload)
      } else {
        response = await ClienteClient.agregarCliente(payload)
      }

      this.guardando = false

      if (response.success) {
        this.mostrarMensaje('exito', payload.id ? 'Cliente actualizado correctamente' : 'Cliente registrado correctamente')
        this.cerrarFormulario()
        await this.cargarClientes(true)
      } else {
        this.mostrarMensaje('error', 'Error al guardar el cliente')
      }
    },
    async confirmarEliminar(cliente) {

      const response = await ClienteClient.eliminarCliente(cliente.id)

      if (response.success) {
        this.mostrarMensaje('exito', `Cliente "${cliente.nombre}" eliminado correctamente`)
        if (this.clienteParaEditar && this.clienteParaEditar.id === cliente.id) {
          this.cerrarFormulario()
        }
        if (this.clienteFacturacionSeleccionado && this.clienteFacturacionSeleccionado.id === cliente.id) {
          this.clienteFacturacionSeleccionado = null
        }
        await this.cargarClientes(true)
      } else {
        this.mostrarMensaje('error', 'Error al eliminar el cliente')
      }

    }
  }
}
</script>

<style scoped>
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

/* ≤ 1200px — Tablet landscape: 2 col lado a lado, formulario ocupa fila completa abajo */
@media (max-width: 1200px) {
  .main-layout.with-form {
    grid-template-columns: 1fr 1fr;
  }

  .column-form {
    grid-column: 1 / -1;
  }
}

/* ≤ 900px — Tablet portrait: todo apilado en 1 columna */
@media (max-width: 900px) {
  .main-layout,
  .main-layout.with-form {
    grid-template-columns: 1fr;
  }

  .column-form {
    grid-column: auto;
  }
}

/* ≤ 768px — Móvil: sin animación para mejor rendimiento */
@media (max-width: 768px) {
  .column-form {
    animation: none;
  }
}
</style>
