import { ref } from 'vue'
import PlanificacionClient from '../client/PlanificacionClient.js'
import { obtenerFechaHoy } from '../utils/date.js'

export function usePlanificacionOperador() {
    const recetasPlanificadasIds = ref(null)
    const planificacionFecha = ref(null)
    const cargandoPlanificacion = ref(false)
    const sinPlanificacion = ref(false)
    const planificacionActual = ref(null)

    async function cargarPlanificacion(operadorId) {
        if (!operadorId) {
            sinPlanificacion.value = true
            recetasPlanificadasIds.value = null
            planificacionActual.value = null
            return null
        }

        cargandoPlanificacion.value = true
        sinPlanificacion.value = false
        planificacionActual.value = null

        try {
            const planificaciones = await PlanificacionClient.obtenerPlanificacionesPorOperador(operadorId)

            if (!planificaciones || planificaciones.length === 0) {
                sinPlanificacion.value = true
                recetasPlanificadasIds.value = null
                return null
            }

            // Filtrar solo las planificaciones de HOY
            const hoy = obtenerFechaHoy()
            const planificacionesHoy = planificaciones.filter(p => p.fecha === hoy)

            if (planificacionesHoy.length === 0) {
                sinPlanificacion.value = true
                recetasPlanificadasIds.value = null
                return null
            }

            // Tomar la planificación más reciente de hoy
            const planificacion = planificacionesHoy.sort(
                (a, b) => new Date(b.creadoEn) - new Date(a.creadoEn)
            )[0]

            planificacionFecha.value = planificacion.fecha
            recetasPlanificadasIds.value = (planificacion.recetas || []).map(r => r.recetaId)
            planificacionActual.value = planificacion

            return planificacion
        } catch (error) {
            console.error('Error al cargar planificación del operador:', error)
            sinPlanificacion.value = true
            return null
        } finally {
            cargandoPlanificacion.value = false
        }
    }

    return {
        recetasPlanificadasIds,
        planificacionFecha,
        cargandoPlanificacion,
        sinPlanificacion,
        planificacionActual,
        cargarPlanificacion
    }
}
