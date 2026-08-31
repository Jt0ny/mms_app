<template>
    <div class="page-container planificacion-page">
        <div class="page-content-wrap">
            <header class="page-header">
                <div>
                    <h1 class="page-title">Planificación</h1>
                    <p class="page-subtitle">
                        Selecciona una fecha y distribuye los pedidos pendientes entre operadores de forma automática y equitativa.
                    </p>
                </div>
            </header>

            <!-- Header / Selector de Fecha y Acciones -->
            <PlanificacionAsignacion v-model:fechaSeleccionada="fechaSeleccionada" :cargando-auto="cargandoAuto"
                :guardando="guardando" :mostrar-limpiar="asignaciones.length > 0"
                @distribuir="distribuirAutomaticamente" @limpiar="limpiarTodo" />

            <!-- Feedback Global de Errores/Éxito en el Header -->
            <Alertas :mensaje="mensaje" />

            <!-- Vista de planificaciones guardadas (Si ya existe una planificación para este día) -->
            <PlanificacionView v-if="planificacionesGuardadas.length > 0" :planificaciones="planificacionesGuardadas"
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

import PlanificacionAsignacion from '../components/planificacion/PlanificacionAsignacion.vue'
import PlanificacionResumen from '../components/planificacion/PlanificacionResumen.vue'
import PlanificacionOperadorCard from '../components/planificacion/PlanificacionOperadorCard.vue'
import PlanificacionMapeoRecetas from '../components/planificacion/PlanificacionMapeoRecetas.vue'
import PlanificacionView from '../components/planificacion/PlanificacionView.vue'
import Alertas from '../components/shared/Alertas.vue'
import { usePlanificacion } from '../composables/usePlanificacion.js'

export default {
    name: 'PlanificacionPage',

    components: {
        BoltIcon,
        PlanificacionAsignacion,
        PlanificacionResumen,
        PlanificacionOperadorCard,
        PlanificacionMapeoRecetas,
        PlanificacionView,
        Alertas
    },

    setup() {
        const planificacion = usePlanificacion()
        
        return {
            // Alertas globales
            mensaje: planificacion.mensaje,
            mostrarMensaje: planificacion.mostrarMensaje,
            mensajeInline: planificacion.mensajeInline,
            mostrarMensajeInline: planificacion.mostrarMensajeInline,

            // Estado del Dominio
            fechaSeleccionada: planificacion.fechaSeleccionada,
            asignaciones: planificacion.asignaciones,
            todasLasRecetas: planificacion.todasLasRecetas,
            gruposRecetaBackup: planificacion.gruposRecetaBackup,
            planificacionesGuardadas: planificacion.planificacionesGuardadas,
            operadoresActivos: planificacion.operadoresActivos,
            categoriasRequeridas: planificacion.categoriasRequeridas,

            // Computed
            totalRecetasGlobal: planificacion.totalRecetasGlobal,
            totalStemsGlobal: planificacion.totalStemsGlobal,

            // Lógica compleja (algoritmos) Base
            distribuirAutomaticamenteBase: planificacion.distribuirAutomaticamenteBase,
            confirmarMapeoYPlanificarBase: planificacion.confirmarMapeoYPlanificarBase,
            excluirOperadorBase: planificacion.excluirOperadorBase,
            recalcularPedidosYStemsBase: planificacion.recalcularPedidosYStemsBase,
            guardarTodasBase: planificacion.guardarTodasBase,

            // Operaciones simples de datos Base
            cargarRecetasIniciales: planificacion.cargarRecetasInicialesBase,
            cargarPlanificacionesDelDiaBase: planificacion.cargarPlanificacionesDelDiaBase
        }
    },

    data() {
        return {
            cargandoAuto: false,
            guardando: false,
            cargandoPlanificaciones: false,
            eliminandoPlanificaciones: false,
            
            // Estados del asistente interactivo de recetas
            mostrarMapeoWizard: false,
            mapeoSeleccionado: null
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
        await this.cargarRecetasIniciales()
    },

    methods: {
        async cargarPlanificacionesDelDia() {
            this.cargandoPlanificaciones = true
            await this.cargarPlanificacionesDelDiaBase()
            this.cargandoPlanificaciones = false
        },

        /* ─── Distribución automática ─────────────── */
        async distribuirAutomaticamente() {
            this.cargandoAuto = true
            const puedeAbrir = await this.distribuirAutomaticamenteBase()
            if (puedeAbrir) {
                this.mostrarMapeoWizard = true
            } else {
                this.cargandoAuto = false
            }
        },

        async confirmarMapeoYPlanificar(mapeo) {
            this.mapeoSeleccionado = mapeo
            this.mostrarMapeoWizard = false
            await this.confirmarMapeoYPlanificarBase(mapeo)
            this.cargandoAuto = false
        },

        excluirOperador(idx) {
            this.excluirOperadorBase(idx)
        },

        async guardarTodas() {
            this.guardando = true
            const exito = await this.guardarTodasBase(this.mapeoSeleccionado)
            if (exito) {
                this.mapeoSeleccionado = null
                await this.cargarPlanificacionesDelDia()
            }
            this.guardando = false
        },

        /* ─── Eliminar Planificaciones ────────────── */
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

        /* ─── Edición por operador ──────────────── */
        quitarReceta({ idx, ri }) {
            const asig = this.asignaciones[idx]
            if (!asig) return
            asig.recetas.splice(ri, 1)
            this.recalcularPedidosYStemsBase(idx)
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
            this.recalcularPedidosYStemsBase(idx)
        },

        recalcularStems(idx) {
            this.recalcularPedidosYStemsBase(idx)
        },

        /* ─── Limpiar ───────────────────────────── */
        limpiarTodo() {
            this.asignaciones = []
            this.mostrarMensaje(null, '')
            this.mostrarMensajeInline(null, '')
            this.gruposRecetaBackup = []
            this.categoriasRequeridas = []
            this.mapeoSeleccionado = null
            this.mostrarMapeoWizard = false
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
