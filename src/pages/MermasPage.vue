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

      <!-- Layout Principal: Formulario + Listado -->
      <div class="main-layout">
        <!-- Formulario (Lado Izquierdo) -->
        <div class="left-panel">
          <MermaForm :materia-prima-lista="materiaPrimaFiltrada" :materiales-lista="materialesFiltrados"
            :recetas-lista="recetasFiltradas" :operadores-lista="operadores" :filtro-info="filtroActivoInfo"
            :cargando-recursos="cargandoRecursos" :guardando="guardando" @guardar="registrarMerma"
            @cambio-filtro="filtrarRecursos" />
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
import UsuarioClient from '../client/UsuarioClient'
import PlanificacionClient from '../client/PlanificacionClient'
import { supabase } from '../supabase'
import { useMensajes } from '../composables/useMensajes.js'

export default {
  name: 'MermasPage',
  components: {
    Alertas,
    MermaForm,
    MermaList
  },
  data() {
    const { state, mostrarMensaje } = useMensajes()
    return {
      mensaje: state,
      mostrarMensaje,
      mermas: [],
      materiales: [],
      materiaPrima: [],
      recetas: [],
      operadores: [],
      materiaPrimaFiltrada: [],
      materialesFiltrados: [],
      recetasFiltradas: [],
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
        const usuariosRes = await UsuarioClient.obtenerUsuarios()
        this.operadores = (usuariosRes ?? []).filter(u => String(u.rol).toLowerCase().trim() === 'operador')
      } catch (error) {
        console.error('Error al obtener operadores:', error)
      }

      // Cargar catálogos
      try {
        const [materialesRes, recetasRes] = await Promise.all([
          MaterialClient.obtenerMateriales(),
          RecetaClient.obtenerRecetas()
        ])
        this.materiales = materialesRes ?? []
        this.materialesFiltrados = this.materiales
        this.recetas = recetasRes ?? []
        this.recetasFiltradas = this.recetas
      } catch (error) {
        console.error('Error al cargar materiales o recetas:', error)
      }

      // Cargar materia prima (sincronizando con Supabase primero en segundo plano)
      try {
        // 1. Cargar inmediatamente desde Supabase para no bloquear la carga de la pantalla
        const mpRes = await MateriaPrimaClient.obtenerMateriaPrima()
        this.materiaPrima = mpRes ?? []
        this.materiaPrimaFiltrada = this.materiaPrima
        this.cargandoRecursos = false // Liberar estado de carga inicial de recursos

        // 2. Sincronizar en segundo plano
        MateriaPrimaClient.sincronizarConSupabase()
          .then(async () => {
            const mpResActualizado = await MateriaPrimaClient.obtenerMateriaPrima()
            this.materiaPrima = mpResActualizado ?? []
            this.materiaPrimaFiltrada = this.materiaPrima
            console.log("Sincronización en segundo plano de materia prima para mermas completada.");
          })
          .catch(syncError => {
            console.warn('Servidor de Materia Prima no disponible en puerto 8070 o error en segundo plano.', syncError)
          })
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
        // 1. Guardar la merma en la base de datos
        const nuevaMerma = await MermaClient.agregarMerma(payload)
        this.mermas.push(nuevaMerma)

        // 2. Descontar del inventario si es de tipo "material" o "materia_prima"
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
        } else if (payload.tipo === 'materia_prima') {
          const mp = this.materiaPrima.find(m => m.id === payload.referenciaId || m.variedad === payload.referenciaId)
          if (mp) {
            const nuevaCantidad = Math.max(0, (Number(mp.cantidad_total) || 0) - Number(payload.cantidad))

            // Actualizar stock de materia prima en Supabase
            const { error: mpErr } = await supabase
              .from('materia_prima')
              .update({ cantidad_total: nuevaCantidad })
              .eq('id', mp.id)

            if (!mpErr) {
              mp.cantidad_total = nuevaCantidad
              mp.cantidadTotal = nuevaCantidad
              this.mostrarMensaje('exito', `✓ Merma registrada e inventario de "${mp.variedad}" actualizado.`)
            } else {
              this.mostrarMensaje('exito', '✓ Merma registrada con éxito.')
            }
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
        const todasLasRecetas = await RecetaClient.obtenerRecetas()

        const recetasPlanIds = plan.recetas.map(r => r.recetaId)
        const recetasPlanificadas = todasLasRecetas.filter(r => recetasPlanIds.includes(r.id))

        this.recetasFiltradas = recetasPlanificadas

        // Extraer materias primas y materiales
        const materiaPrimaIds = new Set()
        const materialesIds = new Set()

        for (const receta of recetasPlanificadas) {
          if (receta.materiaPrima && Array.isArray(receta.materiaPrima)) {
            receta.materiaPrima.forEach(rm => materiaPrimaIds.add(rm.materia_prima_id || rm.materiaPrimaId || rm.id))
          } else if (receta.receta_materia_prima) {
            receta.receta_materia_prima.forEach(rm => materiaPrimaIds.add(rm.materia_prima_id))
          }

          if (receta.materiales && Array.isArray(receta.materiales)) {
            receta.materiales.forEach(rm => materialesIds.add(rm.material_id || rm.materialId || rm.id))
          } else if (receta.receta_materiales) {
            receta.receta_materiales.forEach(rm => materialesIds.add(rm.material_id))
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
