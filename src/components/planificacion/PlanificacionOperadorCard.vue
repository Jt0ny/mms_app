<template>
	<div class="operadores-panel">
		<!-- Cabecera del operador -->
		<header class="operadores-header">
			<div>
				<h2>{{ asig.operador.nombre }}</h2>
				<p>{{ asig.stemsTotal }} stems asignados</p>
			</div>
			<div class="header-actions">
				<span class="operador-rol">Operador</span>
				<button class="btn-excluir" title="Excluir operador de la distribución" type="button" @click="$emit('excluir-operador')">
					✕
				</button>
			</div>
		</header>

		<!-- Tabla de recetas asignadas -->
		<div class="summary-recetas-col">
			<span class="summary-label">Recetas ({{ asig.recetas.length }})</span>

			<span v-if="!asig.recetas.length" class="summary-none">Sin recetas asignadas</span>

			<table v-else class="recetas-tabla">
				<thead>
					<tr>
						<th>Receta</th>
						<th>Categoría</th>
						<th>Stems</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="(r, ri) in asig.recetas" :key="r.recetaId">
						<td class="receta-nombre-cell">{{ r.nombre }}</td>
						<td class="receta-cat-cell">{{ r.categoria || '—' }}</td>
						<td class="cantidad-cell">
							<input v-model.number="r.cantidad" type="number" min="1" class="cantidad-input"
								@change="$emit('recalcular', idx)" />
						</td>
						<td>
							<button class="btn-quitar" type="button" title="Quitar"
								@click="$emit('quitar-receta', { idx, ri })">✕</button>
						</td>
					</tr>
				</tbody>
			</table>
		</div>

		<!-- Pedidos atendidos por este operador -->
		<div class="summary-pedidos-col">
			<span class="summary-label">Pedidos Atendidos ({{ asig.pedidosAsignados ? asig.pedidosAsignados.length : 0
			}})</span>
			<span v-if="!asig.pedidosAsignados || !asig.pedidosAsignados.length" class="summary-none">Sin pedidos
				asignados</span>
			<div v-else class="pedidos-tabla-wrapper">
				<table class="pedidos-tabla">
					<thead>
						<tr>
							<th>Pedido</th>
							<th>Cliente</th>
							<th>Categoría</th>
							<th class="text-right">Stems</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="p in asig.pedidosAsignados" :key="p.pedidoId + '-' + p.categoria">
							<td class="pedido-id-cell">#{{ p.pedidoId.length > 8 ? p.pedidoId.substring(0, 8) :
								p.pedidoId }}</td>
							<td class="pedido-cliente-cell">{{ p.cliente }}</td>
							<td class="pedido-categoria-cell">{{ p.categoria || '—' }}</td>
							<td class="pedido-stems-cell text-right">{{ p.stems }}</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>


	</div>
</template>

<script>
export default {
	name: 'PlanificacionOperadorCard',
	props: {
		asig: {
			type: Object,
			required: true,
			validator: (value) => {
				return value !== null && typeof value === 'object' && 'operador' in value && Array.isArray(value.recetas)
			}
		},
		idx: {
			type: Number,
			required: true
		},
		todasLasRecetas: {
			type: Array,
			required: true
		}
	},
	emits: ['quitar-receta', 'agregar-receta', 'recalcular', 'excluir-operador'],
	computed: {
		recetasDisponibles() {
			const yaAsignadas = new Set(this.asig.recetas.map(r => r.recetaId))
			return this.todasLasRecetas.filter(r => !yaAsignadas.has(r.id))
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
	background: var(--primary);
	color: white;
	padding: 16px 20px;
	display: flex;
	justify-content: space-between;
	align-items: center;
	border-bottom: 3px solid rgba(0, 0, 0, 0.1);
}

.header-actions {
	display: flex;
	align-items: center;
	gap: 12px;
}

.operadores-header h2 {
	margin: 0;
	font-size: 16px;
	font-weight: 700;
	letter-spacing: -0.02em;
}

.operadores-header p {
	margin: 4px 0 0;
	font-size: 12px;
	opacity: 0.9;
	font-weight: 500;
}

.operador-rol {
	display: inline-flex;
	width: fit-content;
	padding: 5px 10px;
	border-radius: 999px;
	background: rgba(255, 255, 255, 0.2);
	color: white;
	font-size: 11px;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	flex-shrink: 0;
}

.btn-excluir {
	background: transparent;
	color: rgba(255, 255, 255, 0.7);
	border: none;
	border-radius: 50%;
	width: 26px;
	height: 26px;
	font-size: 14px;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.btn-excluir:hover {
	background: rgba(255, 255, 255, 0.2);
	color: white;
	transform: scale(1.05);
}

.summary-recetas-col {
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

.recetas-tabla tbody tr+tr td {
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

.receta-cat-cell {
	color: var(--text-light);
	font-size: 13px;
}

.cantidad-cell {
	width: 90px;
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
	min-width: 44px;
	min-height: 44px;
	padding: 8px 10px;
	border-radius: 6px;
	transition: color 0.15s, background 0.15s;
}

.btn-quitar:hover {
	color: #dc2626;
	background: #fee2e2;
}

.agregar-receta-wrap {
	padding-top: 4px;
}

.select-receta {
	width: 100%;
	padding: 8px 12px;
	border: 1.5px dashed var(--border);
	border-radius: 10px;
	background: var(--bg-secondary);
	color: var(--text-light);
	font-size: 13px;
	cursor: pointer;
	outline: none;
	transition: border-color 0.15s, background 0.15s;
}

.select-receta:hover,
.select-receta:focus {
	border-color: var(--primary);
	background: var(--bg);
	color: var(--text-h);
}

.summary-pedidos-col {
	margin-top: 18px;
	padding-top: 14px;
	border-top: 1px dashed var(--border-light);
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.pedidos-tabla-wrapper {
	max-height: 160px;
	overflow-y: auto;
	border: 1px solid var(--border-light);
	border-radius: 10px;
	background: var(--bg);
}

/* Scrollbar styling for a premium look */
.pedidos-tabla-wrapper::-webkit-scrollbar {
	width: 6px;
}

.pedidos-tabla-wrapper::-webkit-scrollbar-track {
	background: transparent;
}

.pedidos-tabla-wrapper::-webkit-scrollbar-thumb {
	background: var(--border);
	border-radius: 99px;
}

.pedidos-tabla {
	width: 100%;
	border-collapse: collapse;
	font-size: 13px;
}

.pedidos-tabla thead th {
	text-align: left;
	color: var(--text-light);
	font-size: 10px;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	font-weight: 700;
	padding: 4px 8px 8px;
	border-bottom: 1px dashed var(--border);
}

.pedidos-tabla tbody tr+tr td {
	border-top: 1px solid var(--border-light);
}

.pedidos-tabla td {
	padding: 8px;
	vertical-align: middle;
	color: var(--text-h);
}

.pedido-id-cell {
	font-weight: 700;
	color: var(--primary);
	font-family: monospace;
}

.pedido-cliente-cell {
	font-weight: 600;
}

.pedido-categoria-cell {
	color: var(--text-light);
	font-size: 12px;
	font-weight: 600;
}

.pedido-stems-cell {
	font-weight: 700;
}

.text-right {
	text-align: right;
}

@media (max-width: 768px) {
	.operadores-header {
		flex-direction: column;
		align-items: flex-start;
	}
}
</style>
