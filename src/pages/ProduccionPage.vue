<template>
    <div class="page-container produccion-page">
        <div class="page-content-wrap">
            <header class="page-header">
                <div>
                    <h1 class="page-title">Producción diaria</h1>
                    <p v-if="operadorNombre" class="page-subtitle">
                        Planificación de <strong>{{ operadorNombre }}</strong>
                        <span v-if="planificacionFecha"> — {{ planificacionFecha }}</span>
                    </p>
                </div>

                <!-- Indicador de estado de planificación -->
                <div v-if="cargandoPlanificacion" class="badge badge-cargando">Cargando planificación...</div>
                <div v-else-if="sinPlanificacion" class="badge badge-warning">Sin planificación asignada hoy</div>
                <div v-else-if="recetasPlanificadasIds" class="badge badge-ok">
                    {{ recetasPlanificadasIds.length }} receta(s) asignadas
                </div>
            </header>

            <Alertas :mensaje="mensaje" />

            <div class="page-grid">
                <ProduccionForm :guardando="guardando" :ultima-guardada="ultimaGuardada" :edicion="editingProduccion"
                    :categorias-permitidas="categoriasRecetasAsignadas" :cantidades-externas="cantidadesExternas"
                    :limites-por-categoria="limitesPorCategoria" @guardar="guardarProduccion"
                    @notificar="mostrarMensaje($event.tipo, $event.texto, $event.duracion)"
                    @cancelar="editingProduccion = null" @cantidad-cambiada="sincronizarContadorReceta" />

                <!-- Panel de recetas: muestra solo las asignadas o mensaje vacío -->
                <div v-if="sinPlanificacion && !cargandoPlanificacion" class="sin-planificacion">
                    <span class="sin-plan-icon">📋</span>
                    <p>No tienes recetas asignadas para hoy.</p>
                    <p class="sin-plan-sub">El supervisor debe asignarte una planificación desde la sección
                        Planificación.</p>
                </div>

                <ProduccionRecetasView v-else modo="contador" :contador-por-receta="contadorRecetaPorId"
                    :contador-actual="0" :contador-total="0" :recetas-filtradas="recetasPlanificadasIds"
                    @accion-receta="manejarAccionReceta" />
            </div>
        </div>
    </div>
</template>

<script>
import Alertas from '../components/Alertas.vue'
import ProduccionForm from '../components/produccion/ProduccionForm.vue'
import ProduccionClient from '../client/ProduccionClient'
import ProduccionRecetasView from '../components/produccion/ProduccionRecetasView.vue'
import PlanificacionClient from '../client/PlanificacionClient.js'
import { useCatalogos } from '../composables/useCatalogos.js'
import { useMensajes } from '../composables/useMensajes.js'
import { useAuth } from '../composables/useAuth.js'
import { obtenerFechaHoy } from '../utils/date.js'

export default {
    components: {
        ProduccionForm,
        Alertas,
        ProduccionRecetasView
    },

    setup() {
        const { mensaje, mostrarMensaje } = useMensajes()
        const { usuarioId, usuarioNombre } = useAuth()
        const catalogos = useCatalogos()
        return { mensaje, mostrarMensaje, operadorId: usuarioId, operadorNombre: usuarioNombre, catalogos }
    },

    data() {
        return {
            guardando: false,
            ultimaGuardada: null,
            producciones: [],
            cargandoProducciones: false,
            editingProduccion: null,
            contadorRecetaPorId: {},

            // Planificación del operador
            recetasPlanificadasIds: null,   // null = sin cargar | Array = filtro activo
            planificacionFecha: null,
            cargandoPlanificacion: false,
            sinPlanificacion: false,
            categoriasRecetasAsignadas: null,  // Array de categorias de las recetas asignadas
            recetaCategoriaMap: {},            // { [recetaId]: categoria }
            cantidadesExternas: {}             // { [categoria]: total acumulado por clicks }
        }
    },

    computed: {
        limitesPorCategoria() {
            const limites = {}
            for (const recetaId in this.recetaCategoriaMap) {
                const categoria = this.recetaCategoriaMap[recetaId]
                const totalPlanificado = this.contadorRecetaPorId[recetaId]?.total || 0
                limites[categoria] = (limites[categoria] || 0) + totalPlanificado
            }
            return limites
        }
    },

    watch: {
        operadorId: {
            immediate: true,
            async handler(newVal, oldVal) {
                if (!newVal) return
                // Resetear estado del operador anterior
                this.contadorRecetaPorId = {}
                this.recetasPlanificadasIds = null
                this.planificacionFecha = null
                this.sinPlanificacion = false
                this.categoriasRecetasAsignadas = null
                this.recetaCategoriaMap = {}
                this.cantidadesExternas = {}
                this.editingProduccion = null

                // Cargar producciones PRIMERO, luego planificación (que depende de producciones)
                await this.cargarProducciones()
                await this.cargarPlanificacion()
            }
        }
    },

    methods: {
        // ── Planificación ──────────────────────────────────────────
        async cargarPlanificacion() {
            if (!this.operadorId) {
                this.sinPlanificacion = true
                return
            }

            this.cargandoPlanificacion = true
            this.sinPlanificacion = false

            try {
                const planificaciones = await PlanificacionClient.obtenerPlanificacionesPorOperador(this.operadorId)

                if (!planificaciones || planificaciones.length === 0) {
                    this.sinPlanificacion = true
                    this.recetasPlanificadasIds = null
                    return
                }

                // Filtrar solo las planificaciones de HOY
                const hoy = obtenerFechaHoy()
                const planificacionesHoy = planificaciones.filter(p => p.fecha === hoy)

                if (planificacionesHoy.length === 0) {
                    this.sinPlanificacion = true
                    this.recetasPlanificadasIds = null
                    return
                }

                // Tomar la planificación más reciente de hoy
                const planificacion = planificacionesHoy.sort(
                    (a, b) => new Date(b.creado_en) - new Date(a.creado_en)
                )[0]

                this.planificacionFecha = planificacion.fecha
                const ids = (planificacion.recetas || []).map(r => r.recetaId)
                this.recetasPlanificadasIds = ids

                // Calcular lo que este operador ya ha producido hoy
                const produccionesHoy = this.producciones.filter(
                    p => p.fecha === hoy && p.operador_id === this.operadorId
                )
                const producidoPorCategoria = {}
                produccionesHoy.forEach(prod => {
                    (prod.detalle || []).forEach(det => {
                        producidoPorCategoria[det.categoria] = 
                            (producidoPorCategoria[det.categoria] || 0) + parseInt(det.cantidad || 0)
                    })
                })

                // Inicializar contadores con las cantidades planificadas
                const contadores = {}
                for (const r of planificacion.recetas || []) {
                    contadores[r.recetaId] = { actual: 0, total: r.cantidad }
                }
                this.contadorRecetaPorId = contadores

                // Cargar recetas completas para extraer sus categorías
                try {
                    const todasLasRecetas = await this.catalogos.obtenerRecetas()
                    const categoriasSet = new Set()
                    const map = {}
                    for (const id of ids) {
                        const receta = todasLasRecetas.find(r => r.id === id)
                        if (receta?.categoria) {
                            categoriasSet.add(receta.categoria)
                            map[id] = receta.categoria
                        }
                    }
                    this.recetaCategoriaMap = map
                    this.categoriasRecetasAsignadas = categoriasSet.size > 0
                        ? [...categoriasSet]
                        : null

                    // Asignar progreso actual basado en producción existente
                    const contadoresActualizados = { ...this.contadorRecetaPorId }
                    for (const recetaId in contadoresActualizados) {
                        const categoria = map[recetaId]
                        if (categoria && producidoPorCategoria[categoria]) {
                            contadoresActualizados[recetaId] = {
                                ...contadoresActualizados[recetaId],
                                actual: Math.min(
                                    producidoPorCategoria[categoria],
                                    contadoresActualizados[recetaId].total
                                )
                            }
                        }
                    }
                    this.contadorRecetaPorId = contadoresActualizados
                } catch {
                    this.categoriasRecetasAsignadas = null
                }

            } catch (error) {
                console.error('Error al cargar planificación:', error)
                this.sinPlanificacion = true
            } finally {
                this.cargandoPlanificacion = false
            }
        },

        // ── Producción ─────────────────────────────────────────────
        async guardarProduccion(payload) {
            this.guardando = true
            try {
                // Vincular el operador actual que registra la producción
                payload.operador_id = this.operadorId

                if (payload.id) {
                    await ProduccionClient.editarProduccion(payload.id, payload)
                    this.mostrarMensaje('exito', '✓ Producción actualizada correctamente')
                } else {
                    await ProduccionClient.agregarProduccion(payload)
                    this.mostrarMensaje('exito', '✓ Producción registrada correctamente')
                }

                this.ultimaGuardada = new Date().toISOString()
                this.editingProduccion = null
                await this.cargarProducciones()
            } catch (error) {
                console.error(error)
                this.mostrarMensaje('error', '❌ No se pudo guardar la producción', 0)
            } finally {
                this.guardando = false
            }
        },

        async cargarProducciones() {
            this.cargandoProducciones = true
            try {
                const data = await ProduccionClient.obtenerProducciones()
                this.producciones = data ?? []
            } catch (error) {
                console.error(error)
                this.mostrarMensaje('error', '❌ Error al cargar la producción', 0)
            } finally {
                this.cargandoProducciones = false
            }
        },

        editarProduccion(p) {
            this.editingProduccion = p
            this.$nextTick(() => {
                const el = document.querySelector('.produccion-form-card')
                if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                const input = document.querySelector('#fecha-produccion')
                if (input && input.focus) input.focus()
            })
        },

        async eliminarProduccion(p) {
            if (!p || !p.id) {
                this.mostrarMensaje('error', 'Elemento no válido para eliminar', 3000)
                return
            }

            try {
                await ProduccionClient.eliminarProduccion(p.id)
                this.mostrarMensaje('exito', 'Registro eliminado')
                await this.cargarProducciones()
            } catch (error) {
                console.error(error)
                this.mostrarMensaje('error', 'No se pudo eliminar el registro', 0)
            }
        },

        manejarAccionReceta({ receta } = {}) {
            const recetaId = receta?.id
            if (recetaId == null) return

            const estadoActual = this.contadorRecetaPorId[recetaId] || {
                actual: 0,
                total: 1
            }

            if (estadoActual.actual < estadoActual.total) {
                // Incrementar contador de la receta
                this.contadorRecetaPorId = {
                    ...this.contadorRecetaPorId,
                    [recetaId]: { ...estadoActual, actual: estadoActual.actual + 1 }
                }

                // Incrementar cantidad en el formulario según la categoría de la receta
                const categoria = this.recetaCategoriaMap[recetaId]
                if (categoria) {
                    this.cantidadesExternas = {
                        ...this.cantidadesExternas,
                        [categoria]: (this.cantidadesExternas[categoria] || 0) + 1
                    }
                }
                return
            }

            this.mostrarMensaje('info', `El contador de ${receta.nombre} ya llegó al total configurado`, 2500)
        },

        sincronizarContadorReceta({ categoria, cantidad }) {
            // Encuentra la primera receta que pertenece a esa categoría
            const recetaId = Object.keys(this.recetaCategoriaMap).find(id => this.recetaCategoriaMap[id] === categoria)
            if (recetaId && this.contadorRecetaPorId[recetaId]) {
                const total = this.contadorRecetaPorId[recetaId].total
                // Evitar que exceda el total planificado si se desea, aunque si el usuario digita de más lo permitimos visualmente o lo capamos
                const nuevoActual = Math.min(cantidad, total)
                this.contadorRecetaPorId = {
                    ...this.contadorRecetaPorId,
                    [recetaId]: {
                        ...this.contadorRecetaPorId[recetaId],
                        actual: nuevoActual
                    }
                }
            }
        }
    }
}
</script>

<style scoped>
/* ── Badges de estado ───────────────── */
.badge {
    padding: 8px 14px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 700;
    white-space: nowrap;
}

.badge-cargando {
    background: #f1f5f9;
    color: var(--text-light);
}

.badge-ok {
    background: #dcfce7;
    color: #15803d;
}

.badge-warning {
    background: #fef9c3;
    color: #a16207;
}

/* ── Sin planificación ──────────────── */
.sin-planificacion {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 12px;
    padding: 48px 32px;
    border-radius: 20px;
    background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
    box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
}

.sin-plan-icon {
    font-size: 48px;
    line-height: 1;
}

.sin-planificacion p {
    margin: 0;
    color: var(--text-h);
    font-weight: 600;
    font-size: 16px;
}

.sin-plan-sub {
    color: var(--text-light) !important;
    font-weight: 400 !important;
    font-size: 14px !important;
}

/* ── Grid ───────────────────────────── */
.page-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.45fr) minmax(320px, 0.85fr);
    gap: 24px;
    align-items: start;
}

@media (max-width: 1024px) {
    .page-grid {
        grid-template-columns: 1fr;
    }
}
</style>