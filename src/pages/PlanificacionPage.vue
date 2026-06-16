<template>
	<div class="container planificacion-page">
		<div class="content-wrap">
			<header class="page-header">
				<div>
					<h1 class="page-title">Planificación</h1>
					<p class="page-subtitle">Selecciona un operador y una receta para armar la planificación.</p>
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

				<div>
					<span class="summary-label">Receta</span>
					<strong>{{ recetaSeleccionada ? recetaSeleccionada.nombre : 'Ninguna seleccionada' }}</strong>
				</div>
                <div>
                    <span class="summary-label">Cantidad</span>
                    <input type="text">
                </div>
                <button>Asignar</button>
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
					@accion-receta="seleccionarReceta"
				/>
			</div>
		</div>
	</div>
</template>

<script>
import PlanificacionOperadores from '../components/planificacion/PlanificacionOperadores.vue'
import ProduccionRecetasView from '../components/produccion/ProduccionRecetasView.vue'

export default {
	name: 'PlanificacionPage',
	components: {
		PlanificacionOperadores,
		ProduccionRecetasView
	},

	data() {
		return {
			operadorSeleccionado: null,
			recetaSeleccionada: null
		}
	},

	methods: {
		seleccionarOperador(operador) {
			this.operadorSeleccionado = operador
		},

		seleccionarReceta({ receta } = {}) {
			this.recetaSeleccionada = receta ?? null
		},

		limpiarSeleccion() {
			this.operadorSeleccionado = null
			this.recetaSeleccionada = null
		}
	}
}
</script>

<style scoped>
.container {
	padding: 24px;
}

.content-wrap {
	max-width: 1400px;
	margin: 0 auto;
	display: grid;
	gap: 20px;
}

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
	color: #64748b;
}

.btn-limpiar {
	border: none;
	border-radius: 12px;
	padding: 12px 16px;
	background: #0f172a;
	color: white;
	font-weight: 700;
	cursor: pointer;
}

.summary-card {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 16px;
	padding: 18px 20px;
	border-radius: 18px;
	background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
	border: 1px solid #e2e8f0;
	box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
}

.summary-card > div {
	display: grid;
	gap: 6px;
}

.summary-label {
	color: #64748b;
	font-size: 13px;
	text-transform: uppercase;
	letter-spacing: 0.04em;
	font-weight: 700;
}

.page-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 24px;
	align-items: start;
}

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

	.btn-limpiar {
		width: 100%;
	}
}
</style>
