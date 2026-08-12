<template>
	<div class="mapeo-panel">
		<header class="mapeo-header">
			<h2>Mapear Recetas del Día</h2>
			<p>Selecciona una o más recetas para cada categoría de flor y distribuye la cantidad de stems solicitada.
			</p>
		</header>

		<div class="mapeo-content">
			<div class="categorias-grid">
				<div v-for="cat in categoriasRequeridas" :key="cat.categoria" class="categoria-card">
					<!-- Info de la Categoría -->
					<div class="categoria-summary">
						<div class="summary-text">
							<h3>{{ cat.categoria }}</h3>
							<p>Demanda total: <strong>{{ cat.totalStems }}</strong> stems</p>
						</div>

						<!-- Badge de Estado de Asignación -->
						<div :class="['status-badge', estadoAsignacion(cat).clase]">
							{{ estadoAsignacion(cat).texto }}
						</div>
					</div>

					<!-- Listado de Recetas Asignadas -->
					<div class="recetas-asignadas-list">
						<div v-for="(row, idx) in mapeoCategorias[cat.categoria]" :key="idx" class="receta-mapping-row">
							<div class="select-col">
								<select v-model="row.recetaId" class="select-mapeo"
									@change="validarRow(cat.categoria, idx)">
									<option value="">-- Seleccionar Receta --</option>
									<option v-for="rec in recetasPorCategoria(cat.categoria)" :key="rec.id"
										:value="rec.id">
										{{ rec.nombre }}
									</option>
								</select>
							</div>

							<div class="stems-col">
								<div class="stems-input-wrapper">
									<input v-model.number="row.stems" type="number" min="1" placeholder="Stems"
										class="stems-input" @input="balancearCantidades(cat.categoria, idx)" />
									<span class="stems-suffix">stems</span>
								</div>
							</div>

							<button type="button" class="btn-eliminar-row" title="Quitar esta receta"
								@click="eliminarRow(cat.categoria, idx)">
								✕
							</button>
						</div>
					</div>

					<!-- Botón agregar receta extra -->
					<div class="add-row-action">
						<button type="button" class="btn-add-receta" :disabled="!puedeAgregarReceta(cat.categoria)"
							@click="agregarRow(cat.categoria)">
							+ Agregar otra receta de {{ cat.categoria }}
						</button>
					</div>
				</div>
			</div>
		</div>

		<footer class="mapeo-actions">
			<button type="button" class="btn-cancelar" @click="$emit('cancelar')">
				Cancelar
			</button>
			<button type="button" class="btn-confirmar" :disabled="!formularioValido" @click="confirmarMapeo">
				Confirmar y Planificar
			</button>
		</footer>
	</div>
</template>

<script>
export default {
	name: 'PlanificacionMapeoRecetas',
	props: {
		categoriasRequeridas: {
			type: Array,
			required: true
		},
		todasLasRecetas: {
			type: Array,
			required: true
		}
	},
	emits: ['confirmar', 'cancelar'],

	data() {
		return {
			// mapeoCategorias: { [categoria]: [ { recetaId, stems } ] }
			mapeoCategorias: {}
		}
	},

	computed: {
		formularioValido() {
			// Todas las categorías deben estar asignadas exactamente al 100% de sus stems
			return this.categoriasRequeridas.every(cat => {
				const totalAsignado = this.obtenerTotalAsignado(cat.categoria)
				const rowsValidas = this.mapeoCategorias[cat.categoria].every(
					row => row.recetaId && parseInt(row.stems) > 0
				)
				return rowsValidas && totalAsignado === cat.totalStems
			})
		}
	},

	created() {
		// Inicializar el mapeo de categorías con una única receta por defecto
		this.categoriasRequeridas.forEach(cat => {
			const recetasDisp = this.recetasPorCategoria(cat.categoria)
			this.mapeoCategorias[cat.categoria] = [
				{
					recetaId: recetasDisp.length > 0 ? recetasDisp[0].id : '',
					stems: cat.totalStems
				}
			]
		})
	},

	methods: {
		recetasPorCategoria(categoria) {
			if (!categoria) return []
			return this.todasLasRecetas.filter(
				r => String(r.categoria).toLowerCase().trim() === String(categoria).toLowerCase().trim()
			)
		},

		obtenerTotalAsignado(categoria) {
			const rows = this.mapeoCategorias[categoria] || []
			return rows.reduce((acc, row) => acc + (parseInt(row.stems) || 0), 0)
		},

		puedeAgregarReceta(categoria) {
			// No agregar más si no hay más recetas disponibles para elegir que el número de filas actual
			const disponiblesCount = this.recetasPorCategoria(categoria).length
			const actualesCount = this.mapeoCategorias[categoria]?.length || 0
			return actualesCount < disponiblesCount
		},

		agregarRow(categoria) {
			const asignadoActualmente = this.obtenerTotalAsignado(categoria)
			const faltante = Math.max(0, this.categoriasRequeridas.find(c => c.categoria === categoria).totalStems - asignadoActualmente)

			this.mapeoCategorias[categoria].push({
				recetaId: '',
				stems: faltante
			})
		},

		eliminarRow(categoria, idx) {
			if (this.mapeoCategorias[categoria].length === 1) return // No eliminar la única fila
			this.mapeoCategorias[categoria].splice(idx, 1)
		},

		validarRow(categoria, idx) {
			const row = this.mapeoCategorias[categoria][idx]
			if (typeof row.stems !== 'number' || isNaN(row.stems)) {
				row.stems = 0
			}
		},

		balancearCantidades(categoria, editedIdx) {
			const rows = this.mapeoCategorias[categoria]
			if (!rows || rows.length <= 1) return

			const targetCat = this.categoriasRequeridas.find(c => c.categoria === categoria)
			if (!targetCat) return
			const totalDemand = targetCat.totalStems

			const numRows = rows.length

			// Validar el valor editado
			let val = parseInt(rows[editedIdx].stems)
			if (isNaN(val) || val < 0) val = 0
			if (val > totalDemand) val = totalDemand
			rows[editedIdx].stems = val

			// Si hay exactamente 2 filas
			if (numRows === 2) {
				const otherIdx = editedIdx === 0 ? 1 : 0
				rows[otherIdx].stems = Math.max(0, totalDemand - val)
				return
			}

			// Si hay más de 2 filas:
			// Si se editó la última fila, compensar en la penúltima.
			if (editedIdx === numRows - 1) {
				const sumRestante = rows.reduce((acc, row, idx) => {
					if (idx === numRows - 1 || idx === numRows - 2) return acc
					return acc + (parseInt(row.stems) || 0)
				}, 0)
				rows[numRows - 2].stems = Math.max(0, totalDemand - sumRestante - val)
			} else {
				// Si se editó cualquier fila anterior, compensar en la última.
				const sumRestante = rows.reduce((acc, row, idx) => {
					if (idx === numRows - 1 || idx === editedIdx) return acc
					return acc + (parseInt(row.stems) || 0)
				}, 0)
				rows[numRows - 1].stems = Math.max(0, totalDemand - sumRestante - val)
			}
		},

		estadoAsignacion(cat) {
			const totalAsignado = this.obtenerTotalAsignado(cat.categoria)
			if (totalAsignado === cat.totalStems) {
				return { clase: 'status-perfect', texto: 'Asignación Correcta' }
			}
			if (totalAsignado < cat.totalStems) {
				const faltante = cat.totalStems - totalAsignado
				return { clase: 'status-incomplete', texto: `⚠️ Faltan ${faltante} stems` }
			}
			const excedente = totalAsignado - cat.totalStems
			return { clase: 'status-overflow', texto: `🚨 Exceso de ${excedente} stems` }
		},

		confirmarMapeo() {
			if (this.formularioValido) {
				this.$emit('confirmar', this.mapeoCategorias)
			}
		}
	}
}
</script>

<style scoped>
.mapeo-panel {
	background: var(--bg);
	border-radius: 20px;
	box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
	border: 1px solid var(--border-light);
	padding: 24px;
	display: grid;
	gap: 20px;
}

.mapeo-header h2 {
	margin: 0;
	font-size: 22px;
	color: var(--text-h);
	font-weight: 800;
}

.mapeo-header p {
	margin: 6px 0 0;
	color: var(--text-light);
	font-size: 14px;
}

.mapeo-content {
	display: grid;
	gap: 20px;
}

.categorias-grid {
	display: grid;
	gap: 24px;
}

.categoria-card {
	padding: 20px;
	border-radius: 16px;
	background: linear-gradient(180deg, var(--bg) 0%, var(--bg-secondary) 100%);
	border: 1px solid var(--border);
	display: grid;
	gap: 16px;
}

.categoria-summary {
	display: flex;
	justify-content: space-between;
	align-items: center;
	flex-wrap: wrap;
	gap: 12px;
	border-bottom: 1px solid var(--border-light);
	padding-bottom: 12px;
}

.summary-text h3 {
	margin: 0;
	font-size: 18px;
	font-weight: 800;
	color: var(--text-h);
}

.summary-text p {
	margin: 4px 0 0;
	color: var(--text-light);
	font-size: 13px;
}

.status-badge {
	font-size: 12px;
	font-weight: 700;
	padding: 6px 12px;
	border-radius: 99px;
	text-transform: uppercase;
	letter-spacing: 0.03em;
}

.status-perfect {
	background: var(--alert-success-bg);
	color: var(--alert-success-text);
}

.status-incomplete {
	background: var(--alert-warning-bg);
	color: var(--alert-warning-text);
}

.status-overflow {
	background: var(--alert-error-bg);
	color: var(--alert-error-text);
}

.recetas-asignadas-list {
	display: grid;
	gap: 12px;
}

.receta-mapping-row {
	display: flex;
	align-items: center;
	gap: 12px;
}

.select-col {
	flex: 2;
}

.stems-col {
	flex: 1;
	min-width: 140px;
}

.select-mapeo {
	width: 100%;
	padding: 10px 14px;
	border: 1.5px solid var(--border);
	border-radius: 10px;
	background: var(--bg);
	font-size: 14px;
	color: var(--text-h);
	outline: none;
	cursor: pointer;
	transition: border-color 0.15s;
}

.select-mapeo:focus {
	border-color: var(--primary);
}

.stems-input-wrapper {
	position: relative;
	display: flex;
	align-items: center;
}

.stems-input {
	width: 100%;
	padding: 10px 55px 10px 14px;
	border: 1.5px solid var(--border);
	border-radius: 10px;
	font-size: 14px;
	color: var(--text-h);
	outline: none;
	text-align: right;
	transition: border-color 0.15s;
}

.stems-input:focus {
	border-color: var(--primary);
}

.stems-suffix {
	position: absolute;
	right: 14px;
	font-size: 12px;
	color: var(--text-light);
	pointer-events: none;
	font-weight: 600;
}

.btn-eliminar-row {
	border: none;
	background: none;
	color: var(--text-light);
	font-size: 16px;
	font-weight: 700;
	cursor: pointer;
	padding: 8px 12px;
	border-radius: 8px;
	transition: color 0.15s, background 0.15s;
}

.btn-eliminar-row:hover {
	color: var(--alert-error-text);
	background: var(--alert-error-bg);
}

.add-row-action {
	text-align: left;
}

.btn-add-receta {
	background: none;
	border: 1.5px dashed var(--border);
	color: var(--primary);
	font-weight: 700;
	font-size: 13px;
	padding: 8px 16px;
	border-radius: 10px;
	cursor: pointer;
	transition: background 0.15s, border-color 0.15s;
}

.btn-add-receta:hover:not(:disabled) {
	background: var(--primary-bg);
	border-color: var(--primary);
}

.btn-add-receta:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}

.mapeo-actions {
	padding-top: 16px;
	border-top: 1px solid var(--border-light);
	display: flex;
	justify-content: flex-end;
	gap: 12px;
}

.btn-cancelar {
	border: 1.5px solid var(--border);
	background: var(--bg);
	color: var(--text);
	font-weight: 700;
	padding: 11px 20px;
	border-radius: 12px;
	cursor: pointer;
	transition: background 0.15s;
}

.btn-cancelar:hover {
	background: var(--bg-secondary);
}

.btn-confirmar {
	border: none;
	background: var(--primary);
	color: white;
	font-weight: 700;
	padding: 12px 24px;
	border-radius: 12px;
	cursor: pointer;
	transition: opacity 0.15s;
}

.btn-confirmar:hover:not(:disabled) {
	opacity: 0.9;
}

.btn-confirmar:disabled {
	opacity: 0.55;
	cursor: not-allowed;
}

@media (max-width: 480px) {
	.receta-mapping-row {
		flex-direction: column;
		align-items: stretch;
	}

	.stems-col {
		min-width: 100%;
	}

	.btn-eliminar-row {
		align-self: flex-end;
	}
}
</style>
