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
import { useFiltroRecursos } from '../composables/useFiltroRecursos.js'

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

    const filtro = useFiltroRecursos(catalogos)

    return {
      mensaje,
      mostrarMensaje,
      catalogos,
      materiaPrimaFiltrada: filtro.materiaPrimaFiltrada,
      materialesFiltrados: filtro.materialesFiltrados,
      recetasFiltradas: filtro.recetasFiltradas,
      filtroActivoInfo: filtro.filtroActivoInfo,
      cargandoRecursos: filtro.cargandoRecursos,
      _filtrarRecursos: filtro.filtrarRecursos
    }
  },

  data() {
    return {
      mermas: [],
      materiales: [],
      materiaPrima: [],
      recetas: [],
      operadores: [],
      recetasCompletas: [],
      cargandoMermas: false,
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

    async filtrarRecursos(params) {
      await this._filtrarRecursos(params, {
        materiaPrima: this.materiaPrima,
        materiales: this.materiales,
        recetas: this.recetas,
        operadores: this.operadores
      })
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

<style scoped></style>
