<!-- ClientesPage.vue -->
<template>
  <div class="page-container clientes-page">
    <div class="page-content-wrap">
      <!-- Encabezado -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Directorio de Clientes</h1>
          <p class="page-subtitle">Administra y organiza tus brokers de facturación y destinos de entrega.</p>
        </div>

        <div class="header-actions">
          <button class="btn btn-secondary btn-sync" :disabled="sincronizando || cargando" @click="sincronizarManual"
            title="Extraer nuevos clientes del historial de pedidos">
            🔄 {{ sincronizando ? 'Sincronizando...' : 'Sincronizar desde Pedidos' }}
          </button>
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
import PedidoClient from '../client/PedidoClient'
import ClienteList from '../components/clientes/ClienteList.vue'
import ClienteForm from '../components/clientes/ClienteForm.vue'
import Alertas from '../components/Alertas.vue'
import { useMensajes } from '../composables/useMensajes.js'

export default {
  name: 'ClientesPage',
  components: {
    ClienteList,
    ClienteForm,
    Alertas
  },
  setup() {
    const { mensaje, mostrarMensaje } = useMensajes()
    return { mensaje, mostrarMensaje }
  },

  data() {
    return {
      clientes: [],
      cargando: false,
      sincronizando: false,
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
    async cargarClientes() {
      this.cargando = true
      try {
        const listado = await ClientesClient.obtenerClientes()
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
        await this.cargarClientes()
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
          await this.cargarClientes()
        } catch (error) {
          console.error(error)
          this.mostrarMensaje('error', '❌ Error al eliminar el cliente')
        }
      }
    },
    async sincronizarManual() {
      this.sincronizando = true
      this.mostrarMensaje('info', '🔄 Sincronizando clientes desde el histórico de pedidos...', 0)
      try {
        const pedidos = await PedidoClient.obtenerPedidos()
        if (!pedidos || pedidos.length === 0) {
          this.mostrarMensaje('info', '⚠️ No se encontraron pedidos registrados.')
          return
        }

        const clientesExistentes = await ClientesClient.obtenerClientes()
        const mapaClientes = new Map(clientesExistentes.map(c => [c.nombre.toLowerCase().trim(), c]))

        // --- FASE 1: Recorrer TODOS los pedidos y acumular roles sin actuar aún ---
        const billSet = new Set()  // nombres que aparecen como facturación
        const shipSet = new Set()  // nombres que aparecen como envío
        const shipParent = new Map() // shipName → billName (primer broker encontrado)

        for (const order of pedidos) {
          const billName = (order.cliente_facturacion || order.clienteFacturacion || '').trim()
          const shipName = (order.cliente_envio || order.clienteEnvio || '').trim()
          if (billName) billSet.add(billName)
          if (shipName) {
            shipSet.add(shipName)
            if (!shipParent.has(shipName.toLowerCase()) && billName && billName !== shipName) {
              shipParent.set(shipName.toLowerCase(), billName)
            }
          }
        }

        // --- FASE 2: Determinar tipo correcto y actualizar / crear ---
        const clientesParaAgregar = []
        const clientesParaActualizar = []
        const procesados = new Set()

        const todosLosNombres = new Set([...billSet, ...shipSet])

        for (const nombre of todosLosNombres) {
          const key = nombre.toLowerCase()
          if (procesados.has(key)) continue
          procesados.add(key)

          const esBill = billSet.has(nombre)
          const esShip = shipSet.has(nombre)
          let tipoCalculado = 'Ambos'
          if (esBill && !esShip) tipoCalculado = 'Facturación'
          else if (!esBill && esShip) tipoCalculado = 'Envío'

          const brokerAsociado = shipParent.get(key) || ''

          if (!mapaClientes.has(key)) {
            // Cliente nuevo
            const nuevo = {
              nombre,
              tipo: tipoCalculado,
              clienteFacturacionAsociado: tipoCalculado === 'Envío' ? brokerAsociado : '',
              email: '',
              telefono: '',
              direccion: '',
              notas: '',
              creado_en: new Date().toISOString()
            }
            mapaClientes.set(key, nuevo)
            clientesParaAgregar.push(nuevo)
          } else {
            // Cliente existente — corregir tipo si es incorrecto
            const existente = mapaClientes.get(key)
            let modificado = false

            if (existente.tipo !== tipoCalculado) {
              existente.tipo = tipoCalculado
              modificado = true
            }
            if (tipoCalculado === 'Envío' && !existente.clienteFacturacionAsociado && brokerAsociado) {
              existente.clienteFacturacionAsociado = brokerAsociado
              modificado = true
            }

            if (modificado && existente.id && existente.id !== 'undefined') {
              if (!clientesParaActualizar.some(c => c.id === existente.id)) {
                clientesParaActualizar.push(existente)
              }
            }
          }
        }

        // Guardar nuevos
        for (const nuevo of clientesParaAgregar) {
          await ClientesClient.agregarCliente(nuevo)
        }

        // Actualizar existentes con tipo corregido
        for (const modificado of clientesParaActualizar) {
          await ClientesClient.actualizarCliente(modificado.id, modificado)
        }

        await this.cargarClientes()
        this.mostrarMensaje('exito', `✓ Sincronización completada. Nuevos: ${clientesParaAgregar.length}, Actualizados: ${clientesParaActualizar.length}`)
      } catch (error) {
        console.error(error)
        this.mostrarMensaje('error', '❌ Error durante la sincronización')
      } finally {
        this.sincronizando = false
      }
    }
  }
}
</script>

<style scoped>
.page-content-wrap {
  width: 100%;
  max-width: 1500px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Encabezado */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.page-title {
  margin: 0 0 4px 0;
  font-size: clamp(20px, 3vw, 24px);
  color: var(--text-h);
  font-weight: 700;
  letter-spacing: -0.5px;
}

.page-subtitle {
  margin: 0;
  font-size: 14px;
  color: var(--text-light);
}

.header-actions {
  display: flex;
  gap: 12px;
}

/* Botones */
.btn {
  border: none;
  border-radius: 8px;
  padding: 10px 18px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: var(--primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-dark);
  transform: translateY(-1px);
}

.btn-secondary {
  background: var(--bg);
  border: 1px solid var(--border);
  color: var(--text);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--bg-secondary);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

@media (max-width: 568px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-actions {
    flex-direction: column;
  }
}
</style>
