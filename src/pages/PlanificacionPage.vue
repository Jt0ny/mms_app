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
			<div v-else-if="!cargandoAuto && asignaciones.length === 0 && !mostrarMapeoWizard"
				class="summary-card-vacio">
				<p class="vacio-texto">
					Selecciona una fecha y presiona <strong>⚡ Distribuir automáticamente</strong> para generar la
					planificación según los pedidos pendientes del día.
				</p>
			</div>

			<!-- Estado: distribuyendo -->
			<div v-else-if="cargandoAuto && !mostrarMapeoWizard" class="summary-card-vacio">
				<p class="vacio-texto">⟳ Analizando pedidos y distribuyendo carga entre operadores...</p>
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
		PlanificacionAsignacion,
		PlanificacionResumen,
		PlanificacionOperadorCard,
		PlanificacionMapeoRecetas,
		PlanificacionVista,
		Alertas
	},

	setup() {
		const { mensaje, mostrarMensaje } = useMensajes()
		const catalogos = useCatalogos()
		return { mensaje, mostrarMensaje, catalogos }
	},

	data() {
		const hoy = obtenerFechaHoy()
		return {
			fechaSeleccionada: hoy,
			asignaciones: [],      // [{ operador, recetas: [{recetaId, nombre, categoria, cantidad}], stemsTotal }]
			todasLasRecetas: [],   // cache para el select de agregar receta
			gruposRecetaBackup: [], // copia de respaldo con la información de pedidos por receta
			cargandoAuto: false,
			guardando: false,
			planificacionesGuardadas: [],
			cargandoPlanificaciones: false,
			eliminandoPlanificaciones: false,
			mensajeInline: { tipo: null, texto: '' }, // mensaje dentro del summary card
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
		try {
			this.todasLasRecetas = await this.catalogos.obtenerRecetas()
		} catch (e) {
			console.warn('No se pudieron cargar las recetas para el selector:', e)
		}
	},

	methods: {
		/* ─── Utilidades ─────────────────────────── */
		mostrarMensajeInline(tipo, texto, duracion = 5000) {
			this.mensajeInline = { tipo, texto }
			if (duracion > 0) setTimeout(() => { this.mensajeInline = { tipo: null, texto: '' } }, duracion)
		},

		async cargarPlanificacionesDelDia() {
			this.cargandoPlanificaciones = true
			this.planificacionesGuardadas = []
			this.asignaciones = []
			try {
				const planes = await PlanificacionClient.obtenerPlanificacionesPorFecha(this.fechaSeleccionada)
				this.planificacionesGuardadas = planes || []
			} catch (error) {
				console.error('Error cargando planificaciones del día', error)
				this.mostrarMensaje('error', 'Error al cargar las planificaciones guardadas')
			} finally {
				this.cargandoPlanificaciones = false
			}
		},

		async eliminarPlanificacionesDelDia() {

			this.eliminandoPlanificaciones = true
			try {
				await PlanificacionClient.eliminarPlanificacionesPorFecha(this.fechaSeleccionada)
				this.mostrarMensaje('exito', 'Planificaciones eliminadas correctamente.')
				this.planificacionesGuardadas = []
				this.asignaciones = [] // Limpiamos para volver al estado inicial
			} catch (error) {
				console.error('Error eliminando planificaciones', error)
				this.mostrarMensaje('error', '❌ Error al eliminar las planificaciones')
			} finally {
				this.eliminandoPlanificaciones = false
			}
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
					this.mostrarMensaje('error', `📭 No hay pedidos pendientes para el ${this.fechaSeleccionada}.`)
					this.cargandoAuto = false
					return
				}

				this.categoriasRequeridas = categorias
				// Abrir modal de mapeo interactivo de recetas
				this.mostrarMapeoWizard = true

			} catch (err) {
				console.error('Error al iniciar distribución:', err)
				this.mostrarMensaje('error', '❌ Error al obtener pedidos. Intenta de nuevo.')
				this.cargandoAuto = false
			}
		},

		/* ─── Confirmar Mapeo y Ejecutar Planificación ─── */
		async confirmarMapeoYPlanificar(mapeo) {
			this.mapeoSeleccionado = mapeo
			this.mostrarMapeoWizard = false

			try {
				// 1. Reconstruir los grupos de receta y distribuir pedidos basándonos en la elección del supervisor
				const gruposReceta = []
				for (const cat of this.categoriasRequeridas) {
					const mappings = mapeo[cat.categoria] || []
					const targetRecipes = mappings.map(m => {
						const recetaObj = this.todasLasRecetas.find(r => r.id === m.recetaId)
						return {
							recetaId: m.recetaId,
							nombre: recetaObj ? recetaObj.nombre : `Receta ${cat.categoria}`,
							categoria: cat.categoria,
							capacity: parseInt(m.stems) || 0,
							pedidos: []
						}
					})

					// Algoritmo FIFO para asignar pedidos individuales de la categoría a las recetas físicas
					let recipeIdx = 0
					for (const p of cat.pedidos) {
						let remainingStems = p.stems
						while (remainingStems > 0 && recipeIdx < targetRecipes.length) {
							const currentRecipe = targetRecipes[recipeIdx]
							const allocatedStems = Math.min(remainingStems, currentRecipe.capacity)

							if (allocatedStems > 0) {
								currentRecipe.pedidos.push({
									pedidoId: p.pedidoId,
									cliente: p.cliente,
									categoria: p.categoria,
									stems: allocatedStems
								})
								currentRecipe.capacity -= allocatedStems
								remainingStems -= allocatedStems
							}

							if (currentRecipe.capacity <= 0) {
								recipeIdx++
							}
						}

						if (remainingStems > 0) {
							const lastRecipe = targetRecipes[targetRecipes.length - 1] || targetRecipes[0]
							if (lastRecipe) {
								lastRecipe.pedidos.push({
									pedidoId: p.pedidoId,
									cliente: p.cliente,
									categoria: p.categoria,
									stems: remainingStems
								})
							}
						}
					}

					// Restablecer el totalStems e ingresarlo en la lista final para Greedy
					mappings.forEach((m, i) => {
						if (targetRecipes[i]) {
							targetRecipes[i].totalStems = parseInt(m.stems) || 0
							gruposReceta.push(targetRecipes[i])
						}
					})
				}

				this.gruposRecetaBackup = gruposReceta

				// 2. Obtener operadores disponibles
				const operadores = await this.catalogos.obtenerOperadores()

				if (!operadores.length) {
					this.mostrarMensaje('error', '👥 No hay operadores disponibles.')
					this.cargandoAuto = false
					return
				}
				this.operadoresActivos = operadores

				// 3. Algoritmo de distribución equitativa
				const dist = PlanificacionAlgoritmo.distribuirEquitativamente(this.operadoresActivos, gruposReceta)

				// 4. Construir asignaciones editables
				this.asignaciones = dist.map(d => {
					const asigObj = {
						operador: d.operador,
						recetas: d.recetas.map(r => ({
							recetaId: r.recetaId,
							nombre: r.nombre,
							categoria: gruposReceta.find(g => g.recetaId === r.recetaId)?.categoria || '',
							cantidad: r.cantidad
						})),
						pedidosAsignados: [],
						stemsTotal: d.stemsTotal
					}
					return asigObj
				})

				// Resolver pedidos asignados a cada operador inicialmente
				for (let i = 0; i < this.asignaciones.length; i++) {
					this.recalcularPedidosYStems(i)
				}

				this.mostrarMensaje(
					'exito',
					`✓ ${gruposReceta.length} recetas de producción distribuidas entre ${dist.length} operadores según la carga de stems.`,
					7000
				)

			} catch (err) {
				console.error('Error al distribuir:', err)
				this.mostrarMensaje('error', '❌ Error al distribuir carga entre operadores.')
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
				this.mostrarMensaje('error', '❌ No puedes excluir a todos los operadores. Al menos uno debe quedar.')
				// Revertir
				this.operadoresActivos.push(asig.operador)
				return
			}

			try {
				// Volver a distribuir con la lista original de recetas y los operadores restantes
				const dist = PlanificacionAlgoritmo.distribuirEquitativamente(this.operadoresActivos, this.gruposRecetaBackup)

				this.asignaciones = dist.map(d => {
					return {
						operador: d.operador,
						recetas: d.recetas.map(r => ({
							recetaId: r.recetaId,
							nombre: r.nombre,
							categoria: this.gruposRecetaBackup.find(g => g.recetaId === r.recetaId)?.categoria || '',
							cantidad: r.cantidad
						})),
						pedidosAsignados: [],
						stemsTotal: d.stemsTotal
					}
				})

				// Resolver pedidos
				for (let i = 0; i < this.asignaciones.length; i++) {
					this.recalcularPedidosYStems(i)
				}

				this.mostrarMensaje('exito', `✓ Operador ${asig.operador.nombre} excluido. Carga redistribuida equitativamente.`)
			} catch (error) {
				console.error('Error al redistribuir', error)
				this.mostrarMensaje('error', '❌ Error al redistribuir la carga.')
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
					this.mostrarMensaje('exito', '✅ Todas las planificaciones se han guardado correctamente', 3000)
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
						`✓ ${resultado.exitosos} guardadas. ⚠️ No guardadas: ${nombres}`,
						0
					)
				}

			} catch (err) {
				console.error('Error al guardar planificaciones:', err)
				this.mostrarMensajeInline('error', '❌ Error al guardar. Intenta de nuevo.')
			} finally {
				this.guardando = false
			}
		}
	}
}
</script>

<style scoped>
/* ── Layout base ─────────────────────────── */


.page-content-wrap {
	max-width: 1400px;
	margin: 0 auto;
	display: grid;
	gap: 24px;
}

/* ── Estado Vacío / Cargas ──────────────── */
.summary-card-vacio {
	display: grid;
	padding: 24px;
	border-radius: 20px;
	background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
	box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
	justify-content: center;
	align-items: center;
}

.vacio-texto {
	margin: 0;
	color: var(--text-light);
	text-align: center;
	font-size: 14px;
	padding: 16px 0;
}

/* ── Feedback ───────────────────────── */
.msg-feedback {
	margin: 0;
	font-size: 13px;
	font-weight: 600;
	padding: 8px 12px;
	border-radius: 8px;
}

.msg-exito {
	background: #dcfce7;
	color: #15803d;
}

.msg-error {
	background: #fee2e2;
	color: #dc2626;
}

.msg-info {
	background: #e0f2fe;
	color: #0369a1;
}

.fade-msg-enter-active,
.fade-msg-leave-active {
	transition: opacity 0.3s ease;
}

.fade-msg-enter-from,
.fade-msg-leave-to {
	opacity: 0;
}

/* ── Grid de Tarjetas ─────────────────── */
.page-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 24px;
	align-items: start;
}

/* ── Responsive ──────────────────────── */
@media (max-width: 1100px) {
	.page-grid {
		grid-template-columns: 1fr;
	}
}

@media (max-width: 768px) {
	.page-container {
		padding: 12px;
	}
}
</style>
