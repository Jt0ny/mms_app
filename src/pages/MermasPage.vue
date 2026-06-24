<template>
  <div class="container mermas-page">
    <div class="content-wrap">
      <!-- Encabezado -->
      <header class="page-header">
        <div>
          <h1 class="page-title">Mermas de Producción</h1>

        </div>
      </header>

      <!-- Mensajes de Alerta -->
      <Alertas :mensaje="mensaje" />

      <!-- Tarjetas de Estadísticas (KPIs) -->
      <div class="stats-grid">
        <article class="stat-card">
          <div class="stat-icon pink">🌸</div>
          <div class="stat-info">
            <span> Flores Mermadas</span>
            <strong>{{ totalFloresMermadas }} <small>tallos</small></strong>
          </div>
        </article>

        <article class="stat-card">
          <div class="stat-icon blue">📦</div>
          <div class="stat-info">
            <span>Materiales Mermados</span>
            <strong>{{ totalMaterialesMermados }} <small>unidades</small></strong>
          </div>
        </article>

        <article class="stat-card">
          <div class="stat-icon purple">✨</div>
          <div class="stat-info">
            <span>Productos Finales Mermados</span>
            <strong>{{ totalProductosMermados }} <small>ramos</small></strong>
          </div>
        </article>
      </div>

      <!-- Layout Principal: Formulario + Listado -->
      <div class="main-layout">
        <!-- Formulario (Lado Izquierdo) -->
        <div class="left-panel">
          <MermaForm :materia-prima-lista="materiaPrima" :materiales-lista="materiales" :recetas-lista="recetas"
            :cargando-recursos="cargandoRecursos" :guardando="guardando" @guardar="registrarMerma" />
        </div>

        <!-- Historial/Tabla (Lado Derecho) -->
        <div class="right-panel">
          <MermaList :mermas="mermas" :cargando="cargandoMermas" @eliminar="confirmarEliminarMerma" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Alertas from '../components/Alertas.vue'
import MermaForm from '../components/mermas/MermaForm.vue'
import MermaList from '../components/mermas/MermaList.vue'

// Clientes API
import MermaClient from '../client/MermaClient'
import MaterialClient from '../client/MaterialClient'
import MateriaPrimaClient from '../client/MateriaPrimaClient'
import RecetaClient from '../client/RecetaClient'

export default {
  name: 'MermasPage',
  components: {
    Alertas,
    MermaForm,
    MermaList
  },
  data() {
    return {
      mermas: [],
      materiales: [],
      materiaPrima: [],
      recetas: [],
      cargandoMermas: false,
      cargandoRecursos: false,
      guardando: false,
      mensaje: { tipo: null, texto: '' }
    }
  },
  computed: {
    totalFloresMermadas() {
      return this.mermas
        .filter(m => m.tipo === 'materia_prima')
        .reduce((sum, m) => sum + (Number(m.cantidad) || 0), 0)
    },
    totalMaterialesMermados() {
      return this.mermas
        .filter(m => m.tipo === 'material')
        .reduce((sum, m) => sum + (Number(m.cantidad) || 0), 0)
    },
    totalProductosMermados() {
      return this.mermas
        .filter(m => m.tipo === 'producto_terminado')
        .reduce((sum, m) => sum + (Number(m.cantidad) || 0), 0)
    }
  },
  mounted() {
    this.cargarDatos()
  },
  methods: {
    mostrarMensaje(tipo, texto, duracion = 4000) {
      this.mensaje = { tipo, texto }
      if (duracion > 0) {
        setTimeout(() => {
          this.mensaje = { tipo: null, texto: '' }
        }, duracion)
      }
    },
    async cargarDatos() {
      this.cargandoMermas = true
      this.cargandoRecursos = true

      // Cargar mermas
      try {
        const data = await MermaClient.obtenerMermas()
        this.mermas = data ?? []
      } catch (error) {
        console.error('Error al cargar mermas:', error)
        this.mostrarMensaje('error', '❌ Error al cargar el historial de mermas')
      } finally {
        this.cargandoMermas = false
      }

      // Cargar catálogos
      try {
        const [materialesRes, recetasRes] = await Promise.all([
          MaterialClient.obtenerMateriales(),
          RecetaClient.obtenerRecetas()
        ])
        this.materiales = materialesRes ?? []
        this.recetas = recetasRes ?? []
      } catch (error) {
        console.error('Error al cargar materiales o recetas:', error)
      }

      // Cargar materia prima (con fallback silencioso por el puerto 8070)
      try {
        const mpRes = await MateriaPrimaClient.obtenerMateriaPrima()
        this.materiaPrima = mpRes ?? []
      } catch (error) {
        console.warn('Servidor de Materia Prima no disponible en puerto 8070. Usando lista vacía.', error)
        this.materiaPrima = []
      } finally {
        this.cargandoRecursos = false
      }
    },
    async registrarMerma(payload) {
      this.guardando = true
      try {
        // Enlazar datos de sesión del usuario
        payload.operadorId = localStorage.getItem('usuarioId') || 'sistema'
        payload.operadorNombre = localStorage.getItem('usuarioNombre') || 'operador'

        // 1. Guardar la merma en la base de datos
        const nuevaMerma = await MermaClient.agregarMerma(payload)
        this.mermas.push(nuevaMerma)

        // 2. Descontar del inventario si es de tipo "material"
        if (payload.tipo === 'material') {
          const material = this.materiales.find(m => m.id === payload.referenciaId)
          if (material) {
            const nuevaCantidad = Math.max(0, (Number(material.cantidad) || 0) - Number(payload.cantidad))

            // Actualizar stock de materiales en la base de datos
            await MaterialClient.actualizarMaterial(material.id, {
              ...material,
              cantidad: nuevaCantidad
            })

            // Refrescar inventario de materiales en memoria
            material.cantidad = nuevaCantidad
            this.mostrarMensaje('exito', `✓ Merma registrada e inventario de "${material.nombre}" actualizado.`)
          } else {
            this.mostrarMensaje('exito', '✓ Merma registrada con éxito.')
          }
        } else {
          this.mostrarMensaje('exito', '✓ Merma registrada con éxito.')
        }

      } catch (error) {
        console.error('Error al registrar merma:', error)
        this.mostrarMensaje('error', '❌ No se pudo registrar la merma.')
      } finally {
        this.guardando = false
      }
    },
    async confirmarEliminarMerma(item) {
      if (!confirm(`¿Estás seguro de eliminar el registro de merma de "${item.nombre}"?`)) {
        return
      }

      try {
        await MermaClient.eliminarMerma(item.id)
        this.mermas = this.mermas.filter(m => m.id !== item.id)
        this.mostrarMensaje('exito', '✓ Registro de merma eliminado.')
      } catch (error) {
        console.error('Error al eliminar merma:', error)
        this.mostrarMensaje('error', '❌ No se pudo eliminar el registro.')
      }
    }
  }
}
</script>

<style scoped>
.container {
  padding: 24px;
}

.content-wrap {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Encabezado */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  margin: 0 0 6px;
  font-size: clamp(24px, 3vw, 32px);
  font-weight: 800;
  color: var(--text-h);
}



/* Grid de Estadísticas */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.stat-card {
  background: var(--bg);
  border: 1px solid var(--border-light);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: var(--shadow);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.stat-icon.pink {
  background: rgba(219, 39, 119, 0.1);
}

.stat-icon.blue {
  background: rgba(37, 99, 235, 0.1);
}

.stat-icon.purple {
  background: rgba(124, 58, 237, 0.1);
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-info span {
  font-size: 13px;
  color: var(--text-light);
  font-weight: 500;
}

.stat-info strong {
  font-size: 22px;
  color: var(--text-h);
  font-weight: 700;
}

.stat-info strong small {
  font-size: 12px;
  color: var(--text-light);
  font-weight: 400;
}

/* Layout Principal */
.main-layout {
  display: grid;
  grid-template-columns: minmax(320px, 400px) 1fr;
  gap: 24px;
  align-items: start;
}

.left-panel {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.right-panel {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

@media (max-width: 1024px) {
  .main-layout {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}
</style>
