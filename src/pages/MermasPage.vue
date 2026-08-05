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
      filtrarRecursosBase: filtro.filtrarRecursos
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
      const responseMermas = await MermaClient.obtenerMermas()
      if (responseMermas && responseMermas.success === false) {
        this.mermas = []
        this.mostrarMensaje('error', '❌ Error al cargar el historial de mermas')
      } else {
        this.mermas = responseMermas?.success ? responseMermas.data : (responseMermas ?? [])
      }
      this.cargandoMermas = false

      // Cargar operadores
      const opRes = await this.catalogos.obtenerOperadores()
      this.operadores = opRes?.success ? opRes.data : (opRes ?? [])

      // Cargar catálogos
      const [materialesRes, recetasRes] = await Promise.all([
        this.catalogos.obtenerMateriales(),
        this.catalogos.obtenerRecetas()
      ])
      
      const matsData = materialesRes?.success ? materialesRes.data : (materialesRes ?? [])
      this.materiales = matsData
      this.materialesFiltrados = this.materiales

      const recsData = recetasRes?.success ? recetasRes.data : (recetasRes ?? [])
      this.recetas = recsData
      this.recetasCompletas = recsData
      this.recetasFiltradas = this.recetas

      // Cargar materia prima (desde Supabase directamente)
      const mpRes = await this.catalogos.obtenerMateriaPrima()
      const mpData = mpRes?.success ? mpRes.data : (mpRes ?? [])
      
      this.materiaPrima = mpData
      this.materiaPrimaFiltrada = this.materiaPrima
      this.cargandoRecursos = false // Liberar estado de carga inicial de recursos
    },
    async registrarMerma(payload) {
      this.guardando = true
      
      const response = await MermaClient.registrarMermaConDescuento(
        payload,
        {
          materiales: this.materiales,
          materiaPrima: this.materiaPrima,
          recetasCompletas: this.recetasCompletas
        }
      )

      if (response.success) {
        const { nuevaMerma, stocksActualizados, mensajeExito } = response.data

        this.mermas.unshift(nuevaMerma) // Mejor unshift para que se vea de primero

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
      } else {
        this.mostrarMensaje('error', '❌ No se pudo registrar la merma.')
      }
      
      this.guardando = false
    },

    async filtrarRecursos(params) {
      await this.filtrarRecursosBase(params, {
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

      const response = await MermaClient.eliminarMerma(item.id)
      if (response.success) {
        this.mermas = this.mermas.filter(m => m.id !== item.id)
        this.mostrarMensaje('exito', '✓ Registro de merma eliminado.')
      } else {
        this.mostrarMensaje('error', '❌ No se pudo eliminar el registro.')
      }
    }
  }
}
</script>

