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
		<button class="btn-asignar" :disabled="guardando" @click="$emit('guardar')">
			{{ guardando ? 'Guardando...' : '💾 Guardar todas las planificaciones' }}
		</button>

		<!-- Mensaje inline -->
		<Alertas :mensaje="mensajeInline" style="grid-column: 1 / -1; margin-top: 10px;" />
	</div>
</template>

<script>
import Alertas from '../Alertas.vue'

export default {
	name: 'PlanificacionResumen',
	components: {
		Alertas
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
	background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
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

@media (max-width: 1100px) {
	.summary-card {
		grid-template-columns: 1fr;
	}
}
</style>
