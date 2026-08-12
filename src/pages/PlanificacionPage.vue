<template>
    <div class="page-container planificacion-page">
        <div class="page-content-wrap">

            <!-- Header / Selector de Fecha y Acciones -->
            <PlanificacionAsignacion v-model:fechaSeleccionada="fechaSeleccionada" :cargando-auto="cargandoAuto"
                :guardando="guardando" :mostrar-limpiar="asignaciones.length > 0"
                @distribuir="distribuirAutomaticamente" @limpiar="limpiarTodo" />

            <!-- Feedback Global de Errores/Éxito en el Header -->
            <Alertas :mensaje="mensaje" />

            <!-- Vista de planificaciones guardadas (Si ya existe una planificación para este día) -->
            <PlanificacionVista v-if="planificacionesGuardadas.length > 0" :planificaciones="planificacionesGuardadas"
                :fecha-seleccionada="fechaSeleccionada" :eliminando="eliminandoPlanificaciones"
                @eliminar="eliminarPlanificacionesDelDia" />

            <!-- Estado inicial / vacío -->
            <div v-else-if="!cargandoAuto && asignaciones.length === 0 && !mostrarMapeoWizard" class="empty-state-card">
                <p class="vacio-texto">
                    Selecciona una fecha y presiona <strong><BoltIcon class="icon-sm icon-inline text-primary" /> Distribuir automáticamente</strong> para generar la
                    planificación según los pedidos pendientes del día.
                </p>
            </div>

            <!-- Estado: distribuyendo -->
            <div v-else-if="cargandoAuto && !mostrarMapeoWizard" class="empty-state-card">
                <p class="vacio-texto">Analizando pedidos y distribuyendo carga entre operadores...</p>
            </div>

            <!-- Asistente de Mapeo de Recetas (Inline) -->
            <PlanificacionMapeoRecetas v-else-if="mostrarMapeoWizard" :categorias-requeridas="categoriasRequeridas"
                :todas-las-recetas="todasLasRecetas" @confirmar="confirmarMapeoYPlanificar"
                @cancelar="mostrarMapeoWizard = false; cargandoAuto = false" />

            <!-- Resumen de asignaciones y tarjetas de operadores -->
            <template v-else-if="asignaciones.length > 0">
                <!-- Resumen Global -->
                <PlanificacionResumen :fecha-seleccionada="fechaSeleccionada" :total-operadores="asignaciones.length"
                    :total-recetas="totalRecetasGlobal" :total-stems="totalStemsGlobal" :guardando="guardando"
                    :mensaje-inline="mensajeInline" :asignaciones="asignaciones" @guardar="guardarTodas" />

                <!-- Grid de Tarjetas de Operadores -->
                <div class="page-grid">
                    <PlanificacionOperadorCard v-for="(asig, idx) in asignaciones" :key="asig.operador.id" :asig="asig"
                        :idx="idx" :todas-las-recetas="todasLasRecetas" @quitar-receta="quitarReceta"
                        @agregar-receta="agregarReceta" @recalcular="recalcularStems"
                        @excluir-operador="excluirOperador(idx)" />
                </div>
            </template>

        </div>
    </div>
</template>

<script>
import { BoltIcon } from '@heroicons/vue/24/outline'
import PlanificacionClient from '../client/PlanificacionClient.js'

import PlanificacionAlgoritmo from '../client/PlanificacionAlgoritmo.js'
import { useCatalogos } from '../composables/useCatalogos.js'

import PlanificacionAsignacion from '../components/planificacion/PlanificacionAsignacion.vue'
import PlanificacionResumen from '../components/planificacion/PlanificacionResumen.vue'
import PlanificacionOperadorCard from '../components/planificacion/PlanificacionOperadorCard.vue'
import PlanificacionMapeoRecetas from '../components/planificacion/PlanificacionMapeoRecetas.vue'
import PlanificacionVista from '../components/planificacion/PlanificacionVista.vue'
import Alertas from '../components/Alertas.vue'
import { useMensajes } from '../composables/useMensajes.js'
import { obtenerFechaHoy } from '../utils/date.js'

export default {
    name: 'PlanificacionPage',

    components: {
        BoltIcon,
        PlanificacionAsignacion,
        PlanificacionResumen,
        PlanificacionOperadorCard,
        PlanificacionMapeoRecetas,
        PlanificacionVista,
        Alertas
    },

    setup() {
        const { mensaje, mostrarMensaje, mensajeInline, mostrarMensajeInline } = useMensajes()
        const catalogos = useCatalogos()
        return { mensaje, mostrarMensaje, mensajeInline, mostrarMensajeInline, catalogos }
    },

    data() {
        const hoy = obtenerFechaHoy()
        return {
            fechaSeleccionada: hoy,
            asignaciones: [],      // [{operador, recetas: [{recetaId, nombre, categoria, cantidad}], stemsTotal }]
            todasLasRecetas: [],   // cache para el select de agregar receta
            gruposRecetaBackup: [], // copia de respaldo con la información de pedidos por receta
            cargandoAuto: false,
            guardando: false,
            planificacionesGuardadas: [],
            cargandoPlanificaciones: false,
            eliminandoPlanificaciones: false,
            operadoresActivos: [],

            // Estados del asistente interactivo de recetas
            mostrarMapeoWizard: false,
            categoriasRequeridas: [],
            mapeoSeleccionado: null
        }
    },

    computed: {
        totalRecetasGlobal() {
            return this.asignaciones.reduce((acc, a) => acc + a.recetas.length, 0)
        },
        totalStemsGlobal() {
            return this.asignaciones.reduce((acc, a) => acc + a.stemsTotal, 0)
        }
    },

    watch: {
        fechaSeleccionada: {
            immediate: true,
            handler() {
                this.cargarPlanificacionesDelDia()
            }
        }
    },

    async mounted() {
        const response = await this.catalogos.obtenerRecetas()
        if (response?.success === false) {
            console.warn('No se pudieron cargar las recetas para el selector:', response.error)
            this.todasLasRecetas = []
        } else {
            this.todasLasRecetas = response?.data ?? []
        }
    },

    methods: {
        async cargarPlanificacionesDelDia() {
            this.cargandoPlanificaciones = true
            this.planificacionesGuardadas = []
            this.asignaciones = []
            
            const response = await PlanificacionClient.obtenerPlanificacionesPorFecha(this.fechaSeleccionada)
            if (response?.success === false) {
                this.mostrarMensaje('error', 'Error al cargar las planificaciones guardadas')
            } else {
                this.planificacionesGuardadas = response?.data ?? []
            }
            
            this.cargandoPlanificaciones = false
        },

        async eliminarPlanificacionesDelDia() {

            this.eliminandoPlanificaciones = true
            
            const response = await PlanificacionClient.eliminarPlanificacionesPorFecha(this.fechaSeleccionada)
            if (response.success) {
                this.mostrarMensaje('exito', 'Planificaciones eliminadas correctamente.')
                this.planificacionesGuardadas = []
                this.asignaciones = [] // Limpiamos para volver al estado inicial
            } else {
                this.mostrarMensaje('error', 'Error al eliminar las planificaciones')
            }
            
            this.eliminandoPlanificaciones = false
        },

        /* ─── Distribución automática ─────────────── */
        async distribuirAutomaticamente() {
            this.cargandoAuto = true
            this.asignaciones = []
            this.gruposRecetaBackup = []
            this.categoriasRequeridas = []
            this.mapeoSeleccionado = null

            try {
                // 1. Obtener los pedidos pendientes agrupados puramente por categoría de flor
                const categorias = await PlanificacionAlgoritmo.obtenerPedidosAgrupadosPorCategoria(
                    this.fechaSeleccionada
                )

                if (!categorias.length) {
                    this.mostrarMensaje('error', `No hay pedidos pendientes para el ${this.fechaSeleccionada}.`)
                    this.cargandoAuto = false
                    return
                }

                this.categoriasRequeridas = categorias
                // Abrir modal de mapeo interactivo de recetas
                this.mostrarMapeoWizard = true

            } catch (err) {
                console.error('Error al iniciar distribución:', err)
                this.mostrarMensaje('error', 'Error al obtener pedidos. Intenta de nuevo.')
                this.cargandoAuto = false
            }
        },

        /* ─── Confirmar Mapeo y Ejecutar Planificación ─── */
        async confirmarMapeoYPlanificar(mapeo) {
            this.mapeoSeleccionado = mapeo
            this.mostrarMapeoWizard = false

            try {
                const responseOp = await this.catalogos.obtenerOperadores()
                const operadores = responseOp?.data ?? []

                if (!operadores || !operadores.length) {
                    this.mostrarMensaje('error', 'No hay operadores disponibles.')
                    this.cargandoAuto = false
                    return
                }
                this.operadoresActivos = operadores

                const { asignaciones, gruposRecetaBackup } = PlanificacionAlgoritmo.asignarYDistribuir(
                    this.categoriasRequeridas,
                    mapeo,
                    this.todasLasRecetas,
                    this.operadoresActivos
                )

                this.asignaciones = asignaciones
                this.gruposRecetaBackup = gruposRecetaBackup

                this.mostrarMensaje(
                    'exito',
                    `${gruposRecetaBackup.length} recetas de producción distribuidas entre ${this.asignaciones.length} operadores según la carga de stems.`,
                    7000
                )

            } catch (err) {
                console.error('Error al distribuir:', err)
                this.mostrarMensaje('error', 'Error al distribuir carga entre operadores.')
            } finally {
                this.cargandoAuto = false
            }
        },

        /* ─── Excluir Operador (Ausencia) ─────────── */
        excluirOperador(idx) {
            const asig = this.asignaciones[idx]
            if (!asig || !asig.operador) return

            // Quitar de la lista de operadores activos
            this.operadoresActivos = this.operadoresActivos.filter(op => op.id !== asig.operador.id)

            if (this.operadoresActivos.length === 0) {
                this.mostrarMensaje('error', 'No puedes excluir a todos los operadores. Al menos uno debe quedar.')
                // Revertir
                this.operadoresActivos.push(asig.operador)
                return
            }

            try {
                this.asignaciones = PlanificacionAlgoritmo.redistribuirCarga(this.operadoresActivos, this.gruposRecetaBackup)
                this.mostrarMensaje('exito', `Operador ${asig.operador.nombre} excluido. Carga redistribuida equitativamente.`)
            } catch (error) {
                console.error('Error al redistribuir', error)
                this.mostrarMensaje('error', 'Error al redistribuir la carga.')
            }
        },

        /* ─── Edición por operador ──────────────── */
        quitarReceta({ idx, ri }) {
            const asig = this.asignaciones[idx]
            if (!asig) return
            asig.recetas.splice(ri, 1)
            this.recalcularPedidosYStems(idx)
        },

        agregarReceta({ idx, recetaId }) {
            const receta = this.todasLasRecetas.find(r => r.id === recetaId)
            if (!receta) return

            const asig = this.asignaciones[idx]
            if (!asig || asig.recetas.some(r => r.recetaId === recetaId)) {
                return
            }

            asig.recetas.push({
                recetaId: receta.id,
                nombre: receta.nombre,
                categoria: receta.categoria || '',
                cantidad: 1
            })
            this.recalcularPedidosYStems(idx)
        },

        recalcularStems(idx) {
            this.recalcularPedidosYStems(idx)
        },

        recalcularPedidosYStems(idx) {
            const asig = this.asignaciones[idx]
            if (!asig) return

            // Recalcular stems
            asig.stemsTotal = asig.recetas.reduce((acc, r) => acc + (parseInt(r.cantidad) || 0), 0)

            // Recalcular pedidos atendidos
            const pedidosMapa = new Map()
            asig.recetas.forEach(r => {
                const grupo = this.gruposRecetaBackup.find(g => g.recetaId === r.recetaId)
                if (grupo && grupo.pedidos) {
                    grupo.pedidos.forEach(p => {
                        const key = `${p.pedidoId}-${p.categoria}`
                        if (pedidosMapa.has(key)) {
                            pedidosMapa.get(key).stems += p.stems
                        } else {
                            pedidosMapa.set(key, {
                                pedidoId: p.pedidoId,
                                cliente: p.cliente,
                                categoria: p.categoria || '',
                                stems: p.stems
                            })
                        }
                    })
                }
            })
            asig.pedidosAsignados = Array.from(pedidosMapa.values())
        },

        /* ─── Limpiar ───────────────────────────── */
        limpiarTodo() {
            this.asignaciones = []
            this.mensaje = { tipo: null, texto: '' }
            this.mensajeInline = { tipo: null, texto: '' }
            this.gruposRecetaBackup = []
            this.categoriasRequeridas = []
            this.mapeoSeleccionado = null
            this.mostrarMapeoWizard = false
        },

        /* ─── Guardar todo ──────────────────────── */
        async guardarTodas() {
            const validas = this.asignaciones.filter(a => a.recetas.length > 0)
            if (!validas.length) {
                this.mostrarMensajeInline('error', 'No hay recetas asignadas para guardar.')
                return
            }

            this.guardando = true
            try {
                const resultado = await PlanificacionAlgoritmo.crearPlanificacionesMasivas(
                    validas.map(a => ({
                        operador: a.operador,
                        recetas: a.recetas.map(r => ({
                            recetaId: r.recetaId,
                            nombre: r.nombre,
                            cantidad: parseInt(r.cantidad) || 1
                        })),
                        stemsTotal: a.stemsTotal
                    })),
                    this.fechaSeleccionada,
                    this.mapeoSeleccionado
                )

                if (resultado.fallidos.length === 0) {
                    this.mostrarMensaje('exito', 'Todas las planificaciones se han guardado correctamente', 3000)
                    this.asignaciones = []
                    this.gruposRecetaBackup = []
                    this.categoriasRequeridas = []
                    this.mapeoSeleccionado = null
                    // Recargar para mostrar vista de solo lectura
                    await this.cargarPlanificacionesDelDia()
                } else {
                    const nombres = resultado.fallidos.map(f => `${f.nombre}: ${f.motivo}`).join(' · ')
                    this.mostrarMensajeInline(
                        'error',
                        `${resultado.exitosos} guardadas. ⚠️ No guardadas: ${nombres}`,
                        0
                    )
                }

            } catch (err) {
                console.error('Error al guardar planificaciones:', err)
                this.mostrarMensajeInline('error', 'Error al guardar. Intenta de nuevo.')
            } finally {
                this.guardando = false
            }
        }
    }
}
</script>

<style scoped>
/* ── Layout base ─────────────────────────── */

.vacio-texto {
    margin: 0;
    color: var(--text-light);
    text-align: center;
    font-size: 14px;
    padding: 16px 0;
}

.fade-msg-enter-active,
.fade-msg-leave-active {
    transition: opacity 0.3s ease;
}

.fade-msg-enter-from,
.fade-msg-leave-to {
    opacity: 0;
}



@media (max-width: 768px) {
    .page-container {
        padding: 12px;
    }
}
</style>
