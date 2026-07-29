<template>
  <div class="page-container mermas-page">
    <div class="page-content-wrap">
      <!-- Encabezado -->
      <header class="page-header">
        <div>
          <h1 class="page-title">Mermas de Producción</h1>

        </div>
      </header>

      <!-- Mensajes de Alerta -->
      <Alertas :mensaje="mensaje" />

      <!-- Layout Principal: Formulario + Listado -->
      <div class="main-layout-split with-preview">
        <!-- Formulario (Lado Izquierdo) -->
        <div class="panel-column">
          <MermaForm :materia-prima-lista="materiaPrimaFiltrada" :materiales-lista="materialesFiltrados"
            :recetas-lista="recetasFiltradas" :operadores-lista="operadores" :filtro-info="filtroActivoInfo"
            :cargando-recursos="cargandoRecursos" :guardando="guardando" @guardar="registrarMerma"
            @cambio-filtro="filtrarRecursos" />
        </div>

        <!-- Historial/Tabla (Lado Derecho) -->
        <div class="panel-column">
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
import PlanificacionClient from '../client/PlanificacionClient'
import { useMensajes } from '../composables/useMensajes.js'
import { useCatalogos } from '../composables/useCatalogos.js'

export default {
  name: 'MermasPage',
  components: {
    Alertas,
    MermaForm,
    MermaList
  },
  setup() {
    const { mensaje, mostrarMensaje } = useMensajes()
    const catalogos = useCatalogos()
    return { mensaje, mostrarMensaje, catalogos }
  },

  data() {
    return {
      mermas: [],
      materiales: [],
      materiaPrima: [],
      recetas: [],
      operadores: [],
      materiaPrimaFiltrada: [],
      materialesFiltrados: [],
      recetasFiltradas: [],
      recetasCompletas: [],
      filtroActivoInfo: null,
      cargandoMermas: false,
      cargandoRecursos: false,
      guardando: false
    }
  },
  mounted() {
    this.cargarDatos()
  },
  methods: {
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

      // Cargar operadores
      try {
        this.operadores = await this.catalogos.obtenerOperadores()
      } catch (error) {
        console.error('Error al obtener operadores:', error)
      }

      // Cargar catálogos
      try {
        const [materialesRes, recetasRes] = await Promise.all([
          this.catalogos.obtenerMateriales(),
          this.catalogos.obtenerRecetas()
        ])
        this.materiales = materialesRes ?? []
        this.materialesFiltrados = this.materiales
        this.recetas = recetasRes ?? []
        this.recetasCompletas = recetasRes ?? []
        this.recetasFiltradas = this.recetas
      } catch (error) {
        console.error('Error al cargar materiales o recetas:', error)
      }

      // Cargar materia prima (desde Supabase directamente)
      try {
        const mpRes = await this.catalogos.obtenerMateriaPrima()
        this.materiaPrima = mpRes ?? []
        this.materiaPrimaFiltrada = this.materiaPrima
        this.cargandoRecursos = false // Liberar estado de carga inicial de recursos
      } catch (error) {
        console.error('Error al obtener materia prima:', error)
        this.materiaPrima = []
        this.materiaPrimaFiltrada = []
        this.cargandoRecursos = false
      }
    },
    async registrarMerma(payload) {
      this.guardando = true
      try {
        const { nuevaMerma, stocksActualizados, mensajeExito } = await MermaClient.registrarMermaConDescuento(
          payload,
          {
            materiales: this.materiales,
            materiaPrima: this.materiaPrima,
            recetasCompletas: this.recetasCompletas
          }
        )

        this.mermas.push(nuevaMerma)

        // Sincronizar memoria local con los nuevos stocks devueltos
        if (stocksActualizados.materiales?.length) {
          stocksActualizados.materiales.forEach(update => {
            const item = this.materiales.find(m => m.id === update.id)
            if (item) item.cantidad = update.cantidad
          })
        }
        if (stocksActualizados.materiaPrima?.length) {
          stocksActualizados.materiaPrima.forEach(update => {
            const item = this.materiaPrima.find(m => m.id === update.id)
            if (item) {
              item.cantidadTotal = update.cantidadTotal
            }
          })
        }

        this.mostrarMensaje('exito', mensajeExito)
      } catch (error) {
        console.error('Error al registrar merma:', error)
        this.mostrarMensaje('error', '❌ No se pudo registrar la merma.')
      } finally {
        this.guardando = false
      }
    },

    async filtrarRecursos({ operadorId, fecha }) {
      if (!operadorId || !fecha) {
        this.materiaPrimaFiltrada = this.materiaPrima
        this.materialesFiltrados = this.materiales
        this.recetasFiltradas = this.recetas
        this.filtroActivoInfo = null
        return
      }

      this.cargandoRecursos = true
      try {
        const planificaciones = await PlanificacionClient.obtenerPlanificacionesPorOperador(operadorId)
        const plan = planificaciones.find(p => p.fecha === fecha)

        if (!plan || !plan.recetas || plan.recetas.length === 0) {
          this.materiaPrimaFiltrada = this.materiaPrima
          this.materialesFiltrados = this.materiales
          this.recetasFiltradas = this.recetas

          const op = this.operadores.find(o => o.id === operadorId)
          this.filtroActivoInfo = {
            tipo: 'info',
            texto: `⚠️ El operador "${op ? op.nombre : ''}" no tiene planificación asignada para el ${fecha}. Mostrando catálogo completo.`
          }
          return
        }

        // Obtener recetas completas para saber qué ingredientes usan
        const todasLasRecetas = await this.catalogos.obtenerRecetas()

        const recetasPlanIds = plan.recetas.map(r => r.recetaId)
        const recetasPlanificadas = todasLasRecetas.filter(r => recetasPlanIds.includes(r.id))

        this.recetasFiltradas = recetasPlanificadas

        // Extraer materias primas y materiales
        const materiaPrimaIds = new Set()
        const materialesIds = new Set()

        for (const receta of recetasPlanificadas) {
          if (receta.materiaPrima && Array.isArray(receta.materiaPrima)) {
            receta.materiaPrima.forEach(rm => materiaPrimaIds.add(rm.materiaPrimaId || rm.id))
          }

          if (receta.materiales && Array.isArray(receta.materiales)) {
            receta.materiales.forEach(rm => materialesIds.add(rm.materialId || rm.id))
          }
        }

        this.materiaPrimaFiltrada = this.materiaPrima.filter(mp => materiaPrimaIds.has(mp.id))
        this.materialesFiltrados = this.materiales.filter(mat => materialesIds.has(mat.id))

        const op = this.operadores.find(o => o.id === operadorId)
        this.filtroActivoInfo = {
          tipo: 'exito',
          texto: `✓ Filtro activo: mostrando recetas e insumos planificados para ${op ? op.nombre : ''} el ${fecha}.`
        }

      } catch (error) {
        console.error('Error al filtrar recursos por planificación:', error)
        this.materiaPrimaFiltrada = this.materiaPrima
        this.materialesFiltrados = this.materiales
        this.recetasFiltradas = this.recetas
        this.filtroActivoInfo = {
          tipo: 'error',
          texto: '❌ Error al cargar la planificación del operador. Mostrando catálogo completo.'
        }
      } finally {
        this.cargandoRecursos = false
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

@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}
</style>
