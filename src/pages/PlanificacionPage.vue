<template>
	<div class="container planificacion-page">
		<div class="content-wrap">
			<header class="page-header">
				<div>
					<h1 class="page-title">Planificación</h1>
					<p class="page-subtitle">Selecciona un operador y una o más recetas para armar la planificación.</p>
				</div>

				<button type="button" class="btn-limpiar" @click="limpiarSeleccion">
					Limpiar selección
				</button>
			</header>

			<div class="summary-card">
				<div>
					<span class="summary-label">Operador</span>
					<strong>{{ operadorSeleccionado ? operadorSeleccionado.nombre : 'Ninguno seleccionado' }}</strong>
				</div>

				<div class="summary-recetas-col">
					<span class="summary-label">Recetas ({{ recetasSeleccionadas.length }})</span>
					<span v-if="!recetasSeleccionadas.length" class="summary-none">Ninguna seleccionada</span>
					<table v-else class="recetas-tabla">
						<thead>
							<tr>
								<th>Receta</th>
								<th>Cantidad</th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							<tr v-for="r in recetasSeleccionadas" :key="r.id">
								<td class="receta-nombre-cell">{{ r.nombre }}</td>
								<td class="cantidad-cell">
									<input
										v-model.number="r.cantidad"
										type="number"
										min="1"
										class="cantidad-input"
									/>
								</td>
								<td>
									<button class="btn-quitar" type="button" @click="quitarReceta(r.id)" title="Quitar">✕</button>
								</td>
							</tr>
						</tbody>
					</table>
				</div>
				<button class="btn-asignar" :disabled="guardando" @click="asignarPlanificacion">
					{{ guardando ? 'Guardando...' : 'Asignar' }}
				</button>
				<transition name="fade-msg">
					<p v-if="mensaje.texto" :class="['msg-feedback', 'msg-' + mensaje.tipo]">{{ mensaje.texto }}</p>
				</transition>
			</div>

			<div class="page-grid">
				<PlanificacionOperadores
					modo="seleccionar"
					texto-seleccionar="Seleccionar operador"
					:operador-seleccionado-id="operadorSeleccionado?.id ?? null"
					@seleccionar-operador="seleccionarOperador"
				/>

				<ProduccionRecetasView
					modo="seleccionar"
					texto-seleccionar="Seleccionar receta"
					:recetas-seleccionadas-ids="recetasSeleccionadasIds"
					@accion-receta="toggleReceta"
				/>
			</div>
		</div>
	</div>
</template>

<script>
import PlanificacionOperadores from '../components/planificacion/PlanificacionOperadores.vue'
import ProduccionRecetasView from '../components/produccion/ProduccionRecetasView.vue'
import PlanificacionClient from '../client/PlanificacionClient.js'

export default {
	name: 'PlanificacionPage',
	components: {
		PlanificacionOperadores,
		ProduccionRecetasView
	},

	data() {
		return {
			operadorSeleccionado: null,
			recetasSeleccionadas: [],
			guardando: false,
			mensaje: { tipo: null, texto: '' }
		}
	},

	methods: {
		seleccionarOperador(operador) {
			this.operadorSeleccionado = operador
		},

		toggleReceta({ receta } = {}) {
			if (!receta) return
			const idx = this.recetasSeleccionadas.findIndex(r => r.id === receta.id)
			if (idx === -1) {
				this.recetasSeleccionadas.push({ ...receta, cantidad: 1 })
			} else {
				this.recetasSeleccionadas.splice(idx, 1)
			}
		},

		quitarReceta(id) {
			const idx = this.recetasSeleccionadas.findIndex(r => r.id === id)
			if (idx !== -1) this.recetasSeleccionadas.splice(idx, 1)
		},

		limpiarSeleccion() {
			this.operadorSeleccionado = null
			this.recetasSeleccionadas = []
		},

		mostrarMensaje(tipo, texto, duracion = 4000) {
			this.mensaje = { tipo, texto }
			if (duracion > 0) setTimeout(() => { this.mensaje = { tipo: null, texto: '' } }, duracion)
		},

		async asignarPlanificacion() {
			if (!this.operadorSeleccionado) {
				this.mostrarMensaje('error', 'Selecciona un operador primero.')
				return
			}
			if (!this.recetasSeleccionadas.length) {
				this.mostrarMensaje('error', 'Selecciona al menos una receta.')
				return
			}

			this.guardando = true
			try {
				const hoy = new Date().toISOString().slice(0, 10)
				await PlanificacionClient.crearPlanificacion({
					operadorId: this.operadorSeleccionado.id,
					operadorNombre: this.operadorSeleccionado.nombre,
					fecha: hoy,
					recetas: this.recetasSeleccionadas.map(r => ({
						recetaId: r.id,
						nombre: r.nombre,
						cantidad: r.cantidad
					}))
				})
				this.mostrarMensaje('exito', `✓ Planificación asignada a ${this.operadorSeleccionado.nombre}`)
				this.limpiarSeleccion()
			} catch (e) {
				this.mostrarMensaje('error', '❌ No se pudo guardar la planificación.')
			} finally {
				this.guardando = false
			}
		}
	},

	computed: {
		recetasSeleccionadasIds() {
			return this.recetasSeleccionadas.map(r => r.id)
		}
	}
}
</script>

<style scoped>
/* ── Layout base ─────────────────────────── */
.container {
	padding: 24px;
}

.content-wrap {
	max-width: 1400px;
	margin: 0 auto;
	display: grid;
	gap: 20px;
}

/* ── Header ─────────────────────────────── */
.page-header {
	display: flex;
	justify-content: space-between;
	gap: 16px;
	align-items: center;
}

.page-title {
	margin: 0;
}

.page-subtitle {
	margin: 6px 0 0;
	color: var(--text-light);
}

.btn-limpiar {
	border: none;
	border-radius: 12px;
	padding: 12px 16px;
	background: #0f172a;
	color: white;
	font-weight: 700;
	cursor: pointer;
	transition: opacity 0.2s ease, transform 0.2s ease;
}

.btn-limpiar:hover {
	opacity: 0.88;
	transform: translateY(-1px);
}

/* ── Summary card ────────────────────────── */
.summary-card {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 20px 24px;
	padding: 24px;
	border-radius: 20px;
	background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
	box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
	align-items: start;
}

.summary-card > div {
	display: grid;
	gap: 6px;
}

.summary-label {
	color: var(--text-light);
	font-size: 11px;
	text-transform: uppercase;
	letter-spacing: 0.06em;
	font-weight: 700;
}

.summary-none {
	color: var(--text-light);
	font-style: italic;
	font-size: 14px;
}

/* ── Tabla de recetas seleccionadas ─────── */
.summary-recetas-col {
	display: grid;
	gap: 6px;
}

.recetas-tabla {
	width: 100%;
	border-collapse: collapse;
	font-size: 14px;
}

.recetas-tabla thead th {
	text-align: left;
	color: var(--text-light);
	font-size: 11px;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	font-weight: 700;
	padding: 4px 8px 8px;
	border-bottom: 1px solid var(--border);
}

.recetas-tabla tbody tr + tr td {
	border-top: 1px solid var(--border-light);
}

.recetas-tabla td {
	padding: 8px;
	vertical-align: middle;
}

.receta-nombre-cell {
	font-weight: 700;
	color: var(--text-h);
}

.cantidad-cell {
	width: 100px;
}

.cantidad-input {
	width: 76px;
	padding: 6px 10px;
	border: 1px solid var(--border);
	border-radius: 8px;
	font-size: 14px;
	text-align: center;
	color: var(--text-h);
	background: var(--bg-secondary);
	outline: none;
	transition: border-color 0.15s, box-shadow 0.15s;
}

.cantidad-input:focus {
	border-color: var(--primary);
	box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.12);
	background: var(--bg);
}

.btn-quitar {
	border: none;
	background: none;
	color: var(--text-light);
	cursor: pointer;
	font-size: 15px;
	padding: 4px 6px;
	border-radius: 6px;
	transition: color 0.15s, background 0.15s;
}

.btn-quitar:hover {
	color: #dc2626;
	background: #fee2e2;
}

.btn-asignar {
	align-self: end;
	padding: 11px 22px;
	border: none;
	border-radius: 12px;
	background: var(--primary);
	color: white;
	font-weight: 700;
	font-size: 14px;
	cursor: pointer;
	transition: opacity 0.2s ease, transform 0.2s ease;
}

.btn-asignar:hover:not(:disabled) {
	opacity: 0.9;
	transform: translateY(-1px);
}

.btn-asignar:disabled {
	opacity: 0.65;
	cursor: progress;
}

/* Feedback de asignación */
.msg-feedback {
	margin: 0;
	font-size: 13px;
	font-weight: 600;
	padding: 8px 12px;
	border-radius: 8px;
	grid-column: 1 / -1;
}

.msg-exito {
	background: #dcfce7;
	color: #15803d;
}

.msg-error {
	background: #fee2e2;
	color: #dc2626;
}

.fade-msg-enter-active,
.fade-msg-leave-active {
	transition: opacity 0.3s ease;
}

.fade-msg-enter-from,
.fade-msg-leave-to {
	opacity: 0;
}

/* ── Grid de paneles ─────────────────────── */
.page-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 24px;
	align-items: start;
}

/* ── Responsive ──────────────────────────── */
@media (max-width: 1100px) {
	.page-grid,
	.summary-card {
		grid-template-columns: 1fr;
	}
}

@media (max-width: 768px) {
	.container {
		padding: 12px;
	}

	.page-header {
		flex-direction: column;
		align-items: stretch;
	}

	.btn-limpiar,
	.btn-asignar {
		width: 100%;
	}
}
</style>
