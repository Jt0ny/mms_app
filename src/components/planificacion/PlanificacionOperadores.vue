<template>
	<div class="operadores-panel">
		<header class="operadores-header">
			<div>
				<h2>Operadores disponibles</h2>
				<p>Solo se muestran los usuarios con rol operador.</p>
			</div>

			<button type="button" class="btn-refresh" :disabled="cargando" @click="cargarUsuarios">
				{{ cargando ? '⟳ Cargando...' : '↻ Actualizar' }}
			</button>
		</header>

		<div v-if="cargando" class="estado-vacio">
			<p>Cargando operadores...</p>
		</div>

		<div v-else-if="operadores.length > 0" class="operadores-lista">
			<div class="resumen">
				<strong>{{ operadores.length }}</strong>
				<span>operadores encontrados</span>
			</div>

			<ul class="lista-operadores">
				<li
					v-for="operador in operadores"
					:key="operador.id"
					:class="['operador-card', { 'is-selected': operadorSeleccionadoId === operador.id }]"
				>
					<div class="operador-info">
						<span class="operador-nombre">{{ operador.nombre }}</span>
						<span class="operador-rol">Operador</span>
					</div>

					<div class="operador-meta">
						<span v-if="operador.usuario || operador.username">@{{ operador.usuario || operador.username }}</span>
						<span v-if="operador.correo || operador.email">{{ operador.correo || operador.email }}</span>
					</div>

					<button type="button" class="btn-seleccionar" @click="seleccionarOperador(operador)">
						{{ textoBoton }}
					</button>
				</li>
			</ul>
		</div>

		<div v-else class="estado-vacio">
			<p>No hay operadores registrados.</p>
		</div>
	</div>
</template>

<script>
import UsuarioClient from '../../client/UsuarioClient.js'

export default {
	name: 'PlanificacionOperadores',
	props: {
		modo: {
			type: String,
			default: 'seleccionar',
			validator: value => ['seleccionar'].includes(value)
		},
		textoSeleccionar: {
			type: String,
			default: 'Seleccionar'
		},
		operadorSeleccionadoId: {
			type: [Number, String],
			default: null
		}
	},
	emits: ['seleccionar-operador'],

	data() {
		return {
			usuarios: [],
			cargando: false
		}
	},

	computed: {
		textoBoton() {
			return this.modo === 'seleccionar' ? this.textoSeleccionar : ''
		},

		operadores() {
			return this.usuarios.filter((usuario) => String(usuario.rol).toLowerCase() === 'operador')
		}
	},

	mounted() {
		this.cargarUsuarios()
	},

	methods: {
		seleccionarOperador(operador) {
			this.$emit('seleccionar-operador', operador)
		},

		async cargarUsuarios() {
			this.cargando = true

			try {
				const datos = await UsuarioClient.obtenerUsuarios()
				this.usuarios = Array.isArray(datos) ? datos : []
			} catch (error) {
				console.error(error)
				this.usuarios = []
			} finally {
				this.cargando = false
			}
		}
	}
}
</script>

<style scoped>
.operadores-panel {
	display: grid;
	gap: 18px;
	padding: 24px;
	border-radius: 20px;
	background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
	box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
}

.operadores-header {
	display: flex;
	justify-content: space-between;
	gap: 16px;
	align-items: center;
}

.operadores-header h2 {
	margin: 0;
	font-size: 24px;
}

.operadores-header p {
	margin: 6px 0 0;
	color: #64748b;
}

.btn-refresh {
	border: none;
	border-radius: 12px;
	padding: 12px 16px;
	background: #0f766e;
	color: white;
	font-weight: 700;
	cursor: pointer;
	transition: opacity 0.2s ease, transform 0.2s ease;
}

.btn-refresh:hover:not(:disabled) {
	opacity: 0.92;
	transform: translateY(-1px);
}

.btn-refresh:disabled {
	cursor: progress;
	opacity: 0.7;
}

.operadores-lista {
	display: grid;
	gap: 14px;
}

.resumen {
	display: flex;
	align-items: baseline;
	gap: 8px;
	color: #1e293b;
}

.resumen strong {
	font-size: 22px;
}

.lista-operadores {
	display: grid;
	gap: 12px;
	list-style: none;
	padding: 0;
	margin: 0;
}

.operador-card {
	display: flex;
	justify-content: space-between;
	gap: 16px;
	align-items: center;
	padding: 16px 18px;
	border-radius: 16px;
	border: 1px solid #e2e8f0;
	background: white;
}

.operador-info {
	display: grid;
	gap: 4px;
}

.operador-nombre {
	font-weight: 800;
	color: #0f172a;
}

.operador-rol {
	display: inline-flex;
	width: fit-content;
	padding: 5px 10px;
	border-radius: 999px;
	background: #dbeafe;
	color: #1d4ed8;
	font-size: 12px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.04em;
}

.operador-meta {
	display: grid;
	justify-items: end;
	gap: 4px;
	color: #64748b;
	font-size: 14px;
}

	.btn-seleccionar {
		justify-self: end;
		border: none;
		border-radius: 12px;
		padding: 10px 14px;
		background: #2563eb;
		color: white;
		font-weight: 700;
		cursor: pointer;
		transition: opacity 0.2s ease, transform 0.2s ease;
	}

	.btn-seleccionar:hover {
		opacity: 0.92;
		transform: translateY(-1px);
	}

	.operador-card.is-selected {
		border-color: #2563eb;
		box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
	}

.estado-vacio {
	padding: 28px;
	text-align: center;
	border: 1px dashed #cbd5e1;
	border-radius: 16px;
	color: #64748b;
	background: #f8fafc;
}

@media (max-width: 768px) {
	.operadores-header,
	.operador-card {
		flex-direction: column;
		align-items: flex-start;
	}

	.btn-refresh {
		width: 100%;
	}

	.operador-meta {
		justify-items: start;
	}

	.btn-seleccionar {
		justify-self: start;
	}
}
</style>
