<template>
	<div class="header-actions">
		<!-- Selector de fecha -->
			<div class="fecha-group">
				<label class="fecha-label" for="plan-fecha">Fecha de pedidos</label>
				<input id="plan-fecha" :value="fechaSeleccionada" type="date" class="fecha-input"
					:disabled="cargandoAuto || guardando"
					@input="$emit('update:fechaSeleccionada', $event.target.value)" />
			</div>

			<button type="button" class="btn btn-primary inline-flex-center gap-6" :disabled="cargandoAuto || guardando"
				@click="$emit('distribuir')">
				<ArrowPathIcon v-if="cargandoAuto" class="icon-sm spin text-white" />
				<BoltIcon v-else class="icon-sm text-white" />
				{{ cargandoAuto ? 'Distribuyendo...' : 'Distribuir automáticamente' }}
			</button>

			<button v-if="mostrarLimpiar" type="button" class="btn btn-dark" :disabled="guardando"
				@click="$emit('limpiar')">
				Limpiar
			</button>
		</div>
</template>

<script>
import { BoltIcon, ArrowPathIcon } from '@heroicons/vue/24/outline'

export default {
	name: 'PlanificacionAsignacion',
	components: { BoltIcon, ArrowPathIcon },
	props: {
		fechaSeleccionada: {
			type: String,
			required: true
		},
		cargandoAuto: {
			type: Boolean,
			default: false
		},
		guardando: {
			type: Boolean,
			default: false
		},
		mostrarLimpiar: {
			type: Boolean,
			default: false
		}
	},
	emits: ['update:fechaSeleccionada', 'distribuir', 'limpiar']
}
</script>

<style scoped>
.fecha-group {
	display: grid;
	gap: 5px;
}

.fecha-label {
	font-size: 11px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.06em;
	color: var(--text-light);
}

.fecha-input {
	padding: 9px 14px;
	border: 1.5px solid var(--border);
	border-radius: 10px;
	font-size: 14px;
	color: var(--text-h);
	background: var(--bg);
	outline: none;
	transition: border-color 0.15s, box-shadow 0.15s;
}

.fecha-input:focus {
	border-color: var(--primary);
	box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.12);
}

.fecha-input:disabled {
	opacity: 0.6;
}

@media (max-width: 768px) {
	.btn {
		width: 100%;
	}
}
</style>
