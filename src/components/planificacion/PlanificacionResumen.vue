<template>
	<div class="summary-card">
		<!-- Info global -->
		<div>
			<span class="summary-label">Fecha planificada</span>
			<strong>{{ fechaSeleccionada }}</strong>
		</div>

		<div>
			<span class="summary-label">Distribución</span>
			<strong>
				{{ totalOperadores }} operador{{ totalOperadores !== 1 ? 'es' : '' }} —
				{{ totalRecetas }} receta{{ totalRecetas !== 1 ? 's' : '' }} —
				{{ totalStems }} stems
			</strong>
		</div>

		<!-- Botón guardar todo -->
		<button class="btn-asignar inline-flex-center gap-6" :disabled="guardando" @click="$emit('guardar')">
			<DocumentCheckIcon class="icon-sm" v-if="!guardando" />
			{{ guardando ? 'Guardando...' : 'Guardar todas las planificaciones' }}
		</button>

		<!-- Indicador visual de balance -->
		<div v-if="balanceOperadores.length" class="balance-section">
			<span class="summary-label">Balance de carga</span>
			<div v-for="op in balanceOperadores" :key="op.nombre" class="balance-row">
				<span class="balance-name">{{ op.nombre }}</span>
				<div class="balance-bar-track">
					<div class="balance-bar-fill" :class="'balance-' + op.estado"
						:style="{ width: op.porcentaje + '%' }">
					</div>
				</div>
				<span class="balance-info flex-align-center gap-4">
					{{ op.stems }} stems ({{ op.porcentaje }}%)
					<CheckCircleIcon v-if="op.estado === 'balanceado'" class="icon-sm text-success" />
					<ExclamationTriangleIcon v-else-if="op.estado === 'aceptable'" class="icon-sm text-warning" />
					<XCircleIcon v-else class="icon-sm text-error" />
				</span>
			</div>
		</div>

		<!-- Mensaje inline -->
		<Alertas :mensaje="mensajeInline" style="grid-column: 1 / -1; margin-top: 10px;" />
	</div>
</template>

<script>
import Alertas from '../Alertas.vue'
import { DocumentCheckIcon, CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon } from '@heroicons/vue/24/outline'

export default {
	name: 'PlanificacionResumen',
	components: {
		Alertas,
		DocumentCheckIcon, CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon
	},
	props: {
		fechaSeleccionada: {
			type: String,
			required: true
		},
		totalOperadores: {
			type: Number,
			required: true
		},
		totalRecetas: {
			type: Number,
			required: true
		},
		totalStems: {
			type: Number,
			required: true
		},
		guardando: {
			type: Boolean,
			default: false
		},
		mensajeInline: {
			type: Object,
			default: () => ({ tipo: null, texto: '' })
		},
		asignaciones: {
			type: Array,
			default: () => []
		}
	},
	computed: {
		promedioStems() {
			if (!this.asignaciones.length) return 0
			return Math.round(this.totalStems / this.asignaciones.length)
		},
		balanceOperadores() {
			if (!this.asignaciones.length) return []
			return this.asignaciones.map(a => {
				const porcentaje = this.totalStems > 0
					? Math.round((a.stemsTotal / this.totalStems) * 100)
					: 0
				const desviacion = this.promedioStems > 0
					? Math.abs(a.stemsTotal - this.promedioStems) / this.promedioStems
					: 0
				// < 15% de desviación = balanceado, < 30% = aceptable, >= 30% = desbalanceado
				let estado = 'balanceado'
				if (desviacion >= 0.30) estado = 'desbalanceado'
				else if (desviacion >= 0.15) estado = 'aceptable'
				return {
					nombre: a.operador.nombre,
					stems: a.stemsTotal,
					porcentaje,
					estado
				}
			})
		}
	},
	emits: ['guardar']
}
</script>

<style scoped>
.summary-card {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 20px 24px;
	padding: 24px;
	border-radius: 20px;
	background: linear-gradient(180deg, var(--bg) 0%, var(--bg-secondary) 100%);
	box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
	align-items: start;
}

.summary-card>div {
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

/* ── Balance indicator ── */
.balance-section {
	grid-column: 1 / -1;
	display: flex;
	flex-direction: column;
	gap: 10px;
	margin-top: 4px;
}

.balance-row {
	display: grid;
	grid-template-columns: 120px 1fr auto;
	gap: 12px;
	align-items: center;
}

.balance-name {
	font-weight: 600;
	font-size: 13px;
	color: var(--text-h);
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.balance-bar-track {
	height: 8px;
	background: var(--bg-secondary);
	border-radius: 4px;
	overflow: hidden;
}

.balance-bar-fill {
	height: 100%;
	border-radius: 4px;
	transition: width 0.5s ease;
}

.balance-balanceado {
	background: var(--success);
}

.balance-aceptable {
	background: var(--warning);
}

.balance-desbalanceado {
	background: var(--error);
}

.balance-info {
	font-size: 12px;
	color: var(--text-light);
	white-space: nowrap;
}

@media (max-width: 1024px) {
	.summary-card {
		grid-template-columns: 1fr;
	}
}

@media (max-width: 768px) {
	.balance-row {
		grid-template-columns: 1fr;
		gap: 4px;
	}
}
</style>
