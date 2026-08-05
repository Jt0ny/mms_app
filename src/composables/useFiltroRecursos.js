import { ref } from 'vue'
import PlanificacionClient from '../client/PlanificacionClient'

export function useFiltroRecursos(catalogos) {
    const materiaPrimaFiltrada = ref([])
    const materialesFiltrados = ref([])
    const recetasFiltradas = ref([])
    const filtroActivoInfo = ref(null)
    const cargandoRecursos = ref(false)

    async function filtrarRecursos(params, listasOriginales) {
        const { operadorId, fecha } = params || {}
        const { materiaPrima, materiales, recetas, operadores } = listasOriginales
        
        if (!operadorId || !fecha) {
            materiaPrimaFiltrada.value = materiaPrima
            materialesFiltrados.value = materiales
            recetasFiltradas.value = recetas
            filtroActivoInfo.value = null
            return
        }

        cargandoRecursos.value = true
        
        const response = await PlanificacionClient.obtenerPlanificacionesPorOperador(operadorId)
        if (response && response.success === false) {
            console.error('Error al filtrar recursos por planificación:', response.error)
            materiaPrimaFiltrada.value = materiaPrima
            materialesFiltrados.value = materiales
            recetasFiltradas.value = recetas
            filtroActivoInfo.value = {
                tipo: 'error',
                texto: '❌ Error al cargar la planificación del operador. Mostrando catálogo completo.'
            }
            cargandoRecursos.value = false
            return
        }

        const planificaciones = response?.success ? response.data : (response ?? [])
        const plan = planificaciones.find(p => p.fecha === fecha)

        if (!plan || !plan.recetas || plan.recetas.length === 0) {
            materiaPrimaFiltrada.value = materiaPrima
            materialesFiltrados.value = materiales
            recetasFiltradas.value = recetas

            const op = operadores.find(o => o.id === operadorId)
            filtroActivoInfo.value = {
                tipo: 'info',
                texto: `⚠️ El operador "${op ? op.nombre : ''}" no tiene planificación asignada para el ${fecha}. Mostrando catálogo completo.`
            }
            cargandoRecursos.value = false
            return
        }

        // Obtener recetas completas para saber qué ingredientes usan
        const recetasRes = await catalogos.obtenerRecetas()
        const todasLasRecetas = recetasRes?.success ? recetasRes.data : (recetasRes ?? [])

        const recetasPlanIds = plan.recetas.map(r => r.recetaId)
        const recetasPlanificadas = todasLasRecetas.filter(r => recetasPlanIds.includes(r.id))

        recetasFiltradas.value = recetasPlanificadas

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

        materiaPrimaFiltrada.value = materiaPrima.filter(mp => materiaPrimaIds.has(mp.id))
        materialesFiltrados.value = materiales.filter(mat => materialesIds.has(mat.id))

        const op = operadores.find(o => o.id === operadorId)
        filtroActivoInfo.value = {
            tipo: 'exito',
            texto: `✓ Filtro activo: mostrando recetas e insumos planificados para ${op ? op.nombre : ''} el ${fecha}.`
        }

        cargandoRecursos.value = false
    }

    return {
        materiaPrimaFiltrada,
        materialesFiltrados,
        recetasFiltradas,
        filtroActivoInfo,
        cargandoRecursos,
        filtrarRecursos
    }
}
