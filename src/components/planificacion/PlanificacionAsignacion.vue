<template>
	<header class="page-header">
		<div>
			<h1 class="page-title">Planificación</h1>
			<p class="page-subtitle">
				Selecciona una fecha y distribuye los pedidos pendientes entre operadores de forma automática y
				equitativa.
			</p>
		</div>

		<div class="header-actions">
			<!-- Selector de fecha -->
			<div class="fecha-group">
				<label class="fecha-label" for="plan-fecha">Fecha de pedidos</label>
				<input id="plan-fecha" :value="fechaSeleccionada" type="date" class="fecha-input"
					:disabled="cargandoAuto || guardando"
					@input="$emit('update:fechaSeleccionada', $event.target.value)" />
			</div>

			<button type="button" class="btn-distribuir" :style="{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }" :disabled="cargandoAuto || guardando"
				@click="$emit('distribuir')">
				<ArrowPathIcon v-if="cargandoAuto" class="icon-sm spin text-white" />
				<BoltIcon v-else class="icon-sm text-white" />
				{{ cargandoAuto ? 'Distribuyendo...' : 'Distribuir automáticamente' }}
			</button>

			<button v-if="mostrarLimpiar" type="button" class="btn-limpiar" :disabled="guardando"
				@click="$emit('limpiar')">
				Limpiar
			</button>
		</div>
	</header>
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

.btn-distribuir {
	border: none;
	border-radius: 12px;
	padding: 12px 18px;
	background: var(--primary);
	color: white;
	font-weight: 700;
	cursor: pointer;
	transition: opacity 0.2s ease, transform 0.2s ease;
}

.btn-distribuir:hover:not(:disabled) {
	opacity: 0.88;
	transform: translateY(-1px);
}

.btn-distribuir:disabled {
	opacity: 0.65;
	cursor: progress;
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

.btn-limpiar:hover:not(:disabled) {
	opacity: 0.88;
	transform: translateY(-1px);
}

@media (max-width: 768px) {
	.btn-distribuir,
	.btn-limpiar {
		width: 100%;
	}
}
</style>
