import { ref, computed } from 'vue'

export function useContadorRecetas() {
    const contadorRecetaPorId = ref({})
    const categoriasRecetasAsignadas = ref(null)
    const recetaCategoriaMap = ref({})
    const cantidadesExternas = ref({})

    const limitesPorCategoria = computed(() => {
        const limites = {}
        for (const recetaId in recetaCategoriaMap.value) {
            const categoria = recetaCategoriaMap.value[recetaId]
            const totalPlanificado = contadorRecetaPorId.value[recetaId]?.total || 0
            limites[categoria] = (limites[categoria] || 0) + totalPlanificado
        }
        return limites
    })

    function inicializarContadores(planificacion, produccionesHoy, todasLasRecetas, operadorId) {
        if (!planificacion || !planificacion.recetas) {
            contadorRecetaPorId.value = {}
            categoriasRecetasAsignadas.value = null
            recetaCategoriaMap.value = {}
            cantidadesExternas.value = {}
            return
        }

        const ids = planificacion.recetas.map(r => r.recetaId)

        // Calcular lo que este operador ya ha producido hoy
        const produccionesOperador = produccionesHoy.filter(p => p.operadorId === operadorId)
        const producidoPorCategoria = {}
        
        produccionesOperador.forEach(prod => {
            (prod.detalle || []).forEach(det => {
                producidoPorCategoria[det.categoria] =
                    (producidoPorCategoria[det.categoria] || 0) + parseInt(det.cantidad || 0)
            })
        })

        // Inicializar contadores con las cantidades planificadas
        const contadores = {}
        for (const r of planificacion.recetas) {
            contadores[r.recetaId] = { actual: 0, total: r.cantidad }
        }

        // Cargar recetas completas para extraer sus categorías
        const categoriasSet = new Set()
        const map = {}
        for (const id of ids) {
            const receta = todasLasRecetas.find(r => r.id === id)
            if (receta?.categoria) {
                categoriasSet.add(receta.categoria)
                map[id] = receta.categoria
            }
        }
        recetaCategoriaMap.value = map
        categoriasRecetasAsignadas.value = categoriasSet.size > 0 ? [...categoriasSet] : null

        // Asignar progreso actual basado en producción existente
        for (const recetaId in contadores) {
            const categoria = map[recetaId]
            if (categoria && producidoPorCategoria[categoria]) {
                contadores[recetaId].actual = Math.min(
                    producidoPorCategoria[categoria],
                    contadores[recetaId].total
                )
            }
        }
        
        contadorRecetaPorId.value = contadores
    }

    function manejarAccionReceta(receta, mostrarMensaje) {
        const recetaId = receta?.id
        if (recetaId == null) return

        const estadoActual = contadorRecetaPorId.value[recetaId] || { actual: 0, total: 1 }

        if (estadoActual.actual < estadoActual.total) {
            // Incrementar contador de la receta
            contadorRecetaPorId.value = {
                ...contadorRecetaPorId.value,
                [recetaId]: { ...estadoActual, actual: estadoActual.actual + 1 }
            }

            // Incrementar cantidad en el formulario según la categoría de la receta
            const categoria = recetaCategoriaMap.value[recetaId]
            if (categoria) {
                cantidadesExternas.value = {
                    ...cantidadesExternas.value,
                    [categoria]: (cantidadesExternas.value[categoria] || 0) + 1
                }
            }
            return
        }

        if (mostrarMensaje) {
            mostrarMensaje('info', `El contador de ${receta.nombre} ya llegó al total configurado`, 2500)
        }
    }

    function sincronizarContadorReceta(categoria, cantidad) {
        // Encuentra la primera receta que pertenece a esa categoría
        const recetaId = Object.keys(recetaCategoriaMap.value).find(
            id => recetaCategoriaMap.value[id] === categoria
        )
        if (recetaId && contadorRecetaPorId.value[recetaId]) {
            const total = contadorRecetaPorId.value[recetaId].total
            // Evitar que exceda el total planificado si se desea
            const nuevoActual = Math.min(cantidad, total)
            contadorRecetaPorId.value = {
                ...contadorRecetaPorId.value,
                [recetaId]: {
                    ...contadorRecetaPorId.value[recetaId],
                    actual: nuevoActual
                }
            }
        }
    }

    function resetearContadores() {
        contadorRecetaPorId.value = {}
        categoriasRecetasAsignadas.value = null
        recetaCategoriaMap.value = {}
        cantidadesExternas.value = {}
    }

    return {
        contadorRecetaPorId,
        categoriasRecetasAsignadas,
        recetaCategoriaMap,
        cantidadesExternas,
        limitesPorCategoria,
        inicializarContadores,
        manejarAccionReceta,
        sincronizarContadorReceta,
        resetearContadores
    }
}
