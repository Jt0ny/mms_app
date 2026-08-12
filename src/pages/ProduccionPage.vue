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

            <div class="page-grid page-grid-produccion">
                <ProduccionForm :guardando="guardando" :ultima-guardada="ultimaGuardada" :edicion="editingProduccion"
                    :categorias-permitidas="categoriasRecetasAsignadas" :cantidades-externas="cantidadesExternas"
                    :limites-por-categoria="limitesPorCategoria" @guardar="guardarProduccion"
                    @notificar="mostrarMensaje($event.tipo, $event.texto, $event.duracion)"
                    @cancelar="editingProduccion = null" @cantidad-cambiada="sincronizarContadorReceta" />

                <!-- Panel de recetas: muestra solo las asignadas o mensaje vacío -->
                <div v-if="sinPlanificacion && !cargandoPlanificacion" class="empty-state-card">
                    <span class="sin-plan-icon flex-center"><ClipboardDocumentListIcon class="icon-xl text-light" /></span>
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
import DashboardClient from '../client/DashboardClient.js'
import ProduccionRecetasView from '../components/produccion/ProduccionRecetasView.vue'
import { ClipboardDocumentListIcon } from '@heroicons/vue/24/outline'
import { useCatalogos } from '../composables/useCatalogos.js'
import { useMensajes } from '../composables/useMensajes.js'
import { useAuth } from '../composables/useAuth.js'
import { obtenerFechaHoy } from '../utils/date.js'
import { usePlanificacionOperador } from '../composables/usePlanificacionOperador.js'
import { useContadorRecetas } from '../composables/useContadorRecetas.js'

export default {
    components: {
        ProduccionForm,
        Alertas,
        ProduccionRecetasView,
        ClipboardDocumentListIcon
    },

    setup() {
        const { mensaje, mostrarMensaje } = useMensajes()
        const { usuarioId, usuarioNombre } = useAuth()
        const catalogos = useCatalogos()

        const planificacionOperador = usePlanificacionOperador()
        const contadorRecetas = useContadorRecetas()

        return { 
            mensaje, mostrarMensaje, 
            operadorId: usuarioId, operadorNombre: usuarioNombre, 
            catalogos,
            // Planificacion
            recetasPlanificadasIds: planificacionOperador.recetasPlanificadasIds,
            planificacionFecha: planificacionOperador.planificacionFecha,
            cargandoPlanificacion: planificacionOperador.cargandoPlanificacion,
            sinPlanificacion: planificacionOperador.sinPlanificacion,
            planificacionActual: planificacionOperador.planificacionActual,
            cargarPlanificacionBase: planificacionOperador.cargarPlanificacion,
            // Contadores
            contadorRecetaPorId: contadorRecetas.contadorRecetaPorId,
            categoriasRecetasAsignadas: contadorRecetas.categoriasRecetasAsignadas,
            recetaCategoriaMap: contadorRecetas.recetaCategoriaMap,
            cantidadesExternas: contadorRecetas.cantidadesExternas,
            limitesPorCategoria: contadorRecetas.limitesPorCategoria,
            inicializarContadores: contadorRecetas.inicializarContadores,
            manejarAccionRecetaBase: contadorRecetas.manejarAccionReceta,
            sincronizarContadorReceta: contadorRecetas.sincronizarContadorReceta,
            resetearContadores: contadorRecetas.resetearContadores
        }
    },

    data() {
        return {
            guardando: false,
            ultimaGuardada: null,
            producciones: [],
            cargandoProducciones: false,
            editingProduccion: null
        }
    },



    watch: {
        operadorId: {
            immediate: true,
            async handler(newVal, oldVal) {
                if (!newVal) return
                // Resetear estado del operador anterior
                this.resetearContadores()
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
            const planificacion = await this.cargarPlanificacionBase(this.operadorId)
            
            // Cargar datos para inicializar los contadores
            const responseRecetas = await this.catalogos.obtenerRecetas()
            const todasLasRecetas = responseRecetas?.success !== undefined ? (responseRecetas.data || []) : (responseRecetas || [])
            const hoy = obtenerFechaHoy()
            const produccionesHoy = this.producciones.filter(p => p.fecha === hoy)

            this.inicializarContadores(
                planificacion, 
                produccionesHoy, 
                todasLasRecetas, 
                this.operadorId
            )
        },

        // ── Producción ─────────────────────────────────────────────
        async guardarProduccion(payload) {
            this.guardando = true
            
            // Vincular el operador actual que registra la producción
            payload.operadorId = this.operadorId

            let response;
            if (payload.id) {
                response = await ProduccionClient.editarProduccion(payload.id, payload)
            } else {
                response = await ProduccionClient.agregarProduccion(payload)
            }

            if (response.success) {
                this.mostrarMensaje('exito', payload.id ? 'Producción actualizada correctamente' : 'Producción registrada correctamente')
                
                this.ultimaGuardada = new Date().toISOString()
                this.editingProduccion = null
                await this.cargarProducciones()

                // Evaluar si la producción registrada completa algún pedido pendiente
                try {
                    await DashboardClient.autoCompletarPedidos(obtenerFechaHoy())
                } catch (e) {
                    console.error('Error al evaluar pedidos:', e)
                }
            } else {
                this.mostrarMensaje('error', 'No se pudo guardar la producción', 0)
            }
            
            this.guardando = false
        },

        async cargarProducciones() {
            this.cargandoProducciones = true
            const response = await ProduccionClient.obtenerProducciones()
            if (response.success) {
                this.producciones = response.data ?? []
            } else {
                this.producciones = []
                this.mostrarMensaje('error', 'Error al cargar la producción', 0)
            }
            this.cargandoProducciones = false
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

            const response = await ProduccionClient.eliminarProduccion(p.id)
            if (response.success) {
                this.mostrarMensaje('exito', 'Registro eliminado')
                await this.cargarProducciones()
            } else {
                this.mostrarMensaje('error', 'No se pudo eliminar el registro', 0)
            }
        },

        manejarAccionReceta(payload) {
            this.manejarAccionRecetaBase(payload?.receta, this.mostrarMensaje)
        }
    }
}
</script>

<style scoped>


/* ── Sin planificación ──────────────── */


.sin-plan-icon {
    font-size: 48px;
    line-height: 1;
}

.sin-plan-sub {
    color: var(--text-light) !important;
    font-weight: 400 !important;
    font-size: 14px !important;
}

/* ── Grid ───────────────────────────── */
.page-grid-produccion {
    grid-template-columns: minmax(0, 1.45fr) minmax(320px, 0.85fr);
}
</style>