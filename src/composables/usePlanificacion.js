import { ref, computed } from 'vue'
import PlanificacionClient from '../client/PlanificacionClient.js'
import PlanificacionAlgoritmo from '../client/PlanificacionAlgoritmo.js'
import { useCatalogos } from './useCatalogos.js'
import { useMensajes } from './useMensajes.js'
import { obtenerFechaHoy } from '../utils/date.js'

export function usePlanificacion() {
    const { mensaje, mostrarMensaje, mensajeInline, mostrarMensajeInline } = useMensajes()
    const catalogos = useCatalogos()

    // ── Estado ──────────────────────────────────
    const fechaSeleccionada = ref(obtenerFechaHoy())
    const asignaciones = ref([])
    const todasLasRecetas = ref([])
    const gruposRecetaBackup = ref([])
    const planificacionesGuardadas = ref([])
    const operadoresActivos = ref([])
    const categoriasRequeridas = ref([])

    // ── Computed ─────────────────────────────────
    const totalRecetasGlobal = computed(() =>
        asignaciones.value.reduce((acc, a) => acc + a.recetas.length, 0)
    )
    const totalStemsGlobal = computed(() =>
        asignaciones.value.reduce((acc, a) => acc + a.stemsTotal, 0)
    )

    // ═══════════════════════════════════════════════
    // Lógica compleja — Algoritmos y distribución
    // ═══════════════════════════════════════════════

    // ── Distribución automática ─────────────────
    async function distribuirAutomaticamenteBase() {
        asignaciones.value = []
        gruposRecetaBackup.value = []
        categoriasRequeridas.value = []

        try {
            const categorias = await PlanificacionAlgoritmo.obtenerPedidosAgrupadosPorCategoria(
                fechaSeleccionada.value
            )

            if (!categorias.length) {
                mostrarMensaje('error', `No hay pedidos pendientes para el ${fechaSeleccionada.value}.`)
                return false
            }

            categoriasRequeridas.value = categorias
            return true // indica que puede abrir el wizard
        } catch (err) {
            console.error('Error al iniciar distribución:', err)
            mostrarMensaje('error', 'Error al obtener pedidos. Intenta de nuevo.')
            return false
        }
    }

    // ── Confirmar Mapeo y Ejecutar Planificación ──
    async function confirmarMapeoYPlanificarBase(mapeo) {
        try {
            const responseOp = await catalogos.obtenerOperadores()
            const operadores = responseOp?.data ?? []

            if (!operadores || !operadores.length) {
                mostrarMensaje('error', 'No hay operadores disponibles.')
                return false
            }
            operadoresActivos.value = operadores

            const resultado = PlanificacionAlgoritmo.asignarYDistribuir(
                categoriasRequeridas.value,
                mapeo,
                todasLasRecetas.value,
                operadoresActivos.value
            )

            asignaciones.value = resultado.asignaciones
            gruposRecetaBackup.value = resultado.gruposRecetaBackup

            mostrarMensaje(
                'exito',
                `${resultado.gruposRecetaBackup.length} recetas de producción distribuidas entre ${asignaciones.value.length} operadores según la carga de stems.`,
                7000
            )
            return true
        } catch (err) {
            console.error('Error al distribuir:', err)
            mostrarMensaje('error', 'Error al distribuir carga entre operadores.')
            return false
        }
    }

    // ── Excluir Operador (Ausencia) ─────────────
    function excluirOperadorBase(idx) {
        const asig = asignaciones.value[idx]
        if (!asig || !asig.operador) return

        operadoresActivos.value = operadoresActivos.value.filter(op => op.id !== asig.operador.id)

        if (operadoresActivos.value.length === 0) {
            mostrarMensaje('error', 'No puedes excluir a todos los operadores. Al menos uno debe quedar.')
            operadoresActivos.value.push(asig.operador)
            return
        }

        try {
            asignaciones.value = PlanificacionAlgoritmo.redistribuirCarga(operadoresActivos.value, gruposRecetaBackup.value)
            mostrarMensaje('exito', `Operador ${asig.operador.nombre} excluido. Carga redistribuida equitativamente.`)
        } catch (error) {
            console.error('Error al redistribuir', error)
            mostrarMensaje('error', 'Error al redistribuir la carga.')
        }
    }

    // ── Recalcular pedidos y stems ───────────────
    function recalcularPedidosYStemsBase(idx) {
        const asig = asignaciones.value[idx]
        if (!asig) return

        asig.stemsTotal = asig.recetas.reduce((acc, r) => acc + (parseInt(r.cantidad) || 0), 0)

        const pedidosMapa = new Map()
        asig.recetas.forEach(r => {
            const grupo = gruposRecetaBackup.value.find(g => g.recetaId === r.recetaId)
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
    }

    // ── Guardar todo ────────────────────────────
    async function guardarTodasBase(mapeoSeleccionado) {
        const validas = asignaciones.value.filter(a => a.recetas.length > 0)
        if (!validas.length) {
            mostrarMensajeInline('error', 'No hay recetas asignadas para guardar.')
            return false
        }

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
                fechaSeleccionada.value,
                mapeoSeleccionado
            )

            if (resultado.fallidos.length === 0) {
                mostrarMensaje('exito', 'Todas las planificaciones se han guardado correctamente', 3000)
                asignaciones.value = []
                gruposRecetaBackup.value = []
                categoriasRequeridas.value = []
                return true
            } else {
                const nombres = resultado.fallidos.map(f => `${f.nombre}: ${f.motivo}`).join(' · ')
                mostrarMensajeInline(
                    'error',
                    `${resultado.exitosos} guardadas. ⚠️ No guardadas: ${nombres}`,
                    0
                )
                return false
            }
        } catch (err) {
            console.error('Error al guardar planificaciones:', err)
            mostrarMensajeInline('error', 'Error al guardar. Intenta de nuevo.')
            return false
        }
    }

    // ═══════════════════════════════════════════════
    // Operaciones simples de datos (usadas por la Page)
    // ═══════════════════════════════════════════════

    async function cargarRecetasInicialesBase() {
        const response = await catalogos.obtenerRecetas()
        if (response?.success === false) {
            console.warn('No se pudieron cargar las recetas para el selector:', response.error)
            todasLasRecetas.value = []
        } else {
            todasLasRecetas.value = response?.data ?? []
        }
    }

    async function cargarPlanificacionesDelDiaBase() {
        planificacionesGuardadas.value = []
        asignaciones.value = []

        const response = await PlanificacionClient.obtenerPlanificacionesPorFecha(fechaSeleccionada.value)
        if (response?.success === false) {
            mostrarMensaje('error', 'Error al cargar las planificaciones guardadas')
        } else {
            planificacionesGuardadas.value = response?.data ?? []
        }
    }

    return {
        // Alertas globales (se comparten si es necesario)
        mensaje,
        mostrarMensaje,
        mensajeInline,
        mostrarMensajeInline,

        // Estado del Dominio
        fechaSeleccionada,
        asignaciones,
        todasLasRecetas,
        gruposRecetaBackup,
        planificacionesGuardadas,
        operadoresActivos,
        categoriasRequeridas,

        // Computed
        totalRecetasGlobal,
        totalStemsGlobal,

        // Lógica compleja (algoritmos)
        distribuirAutomaticamenteBase,
        confirmarMapeoYPlanificarBase,
        excluirOperadorBase,
        recalcularPedidosYStemsBase,
        guardarTodasBase,

        // Operaciones simples de datos
        cargarRecetasInicialesBase,
        cargarPlanificacionesDelDiaBase
    }
}
