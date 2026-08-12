<template>
    <div class="vista-container">
        <!-- Resumen -->
        <div class="summary-card">
            <div>
                <span class="summary-label">Fecha planificada</span>
                <strong>{{ fechaSeleccionada }}</strong>
            </div>

            <div>
                <span class="summary-label">Distribución Guardada</span>
                <strong>
                    {{ planificaciones.length }} operador{{ planificaciones.length !== 1 ? 'es' : '' }} —
                    {{ totalRecetas }} receta{{ totalRecetas !== 1 ? 's' : '' }} —
                    {{ totalStems }} stems
                </strong>
            </div>

            <button class="btn btn-danger" :disabled="eliminando" @click="$emit('eliminar')">
                {{ eliminando ? 'Eliminando...' : ' Eliminar y volver a planificar' }}
            </button>
        </div>

        <!-- Tabla de Planificación -->
        <div class="data-card">
            <table class="data-card-table">
                <thead>
                    <tr>
                        <th>Operador</th>
                        <th>Receta</th>
                        <th>Categoría</th>
                        <th class="text-right">Cantidad</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="fila in filasTabla" :key="fila.id" :class="{ 'row-operador': fila.isFirst }">
                        <td v-if="fila.isFirst" :rowspan="fila.rowspan" class="td-operador">
                            <strong>{{ fila.operador }}</strong>
                        </td>
                        <td>{{ fila.receta }}</td>
                        <td>
                            <span class="badge-cat" v-if="fila.categoria !== '-'">{{ fila.categoria }}</span>
                            <span v-else class="text-muted">-</span>
                        </td>
                        <td class="text-right cantidad-val">{{ fila.cantidad }}</td>
                    </tr>
                    <tr v-if="filasTabla.length === 0">
                        <td colspan="4" class="text-center text-muted py-4">No hay datos para mostrar</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script>
export default {
    name: 'PlanificacionVista',
    props: {
        planificaciones: {
            type: Array,
            required: true
        },
        fechaSeleccionada: {
            type: String,
            required: true
        },
        eliminando: {
            type: Boolean,
            default: false
        }
    },
    emits: ['eliminar'],
    computed: {
        totalRecetas() {
            return this.planificaciones.reduce((acc, p) => acc + (p.recetas?.length || 0), 0)
        },
        totalStems() {
            return this.planificaciones.reduce((acc, p) => acc + this.totalStemsPorOperador(p), 0)
        },
        filasTabla() {
            const filas = []
            for (const plan of this.planificaciones) {
                if (!plan.recetas || plan.recetas.length === 0) {
                    filas.push({
                        id: plan.operadorId + '-empty',
                        operador: plan.operadorNombre,
                        receta: '-',
                        categoria: '-',
                        cantidad: 0,
                        rowspan: 1,
                        isFirst: true
                    })
                    continue
                }

                plan.recetas.forEach((receta, index) => {
                    filas.push({
                        id: `${plan.operadorId}-${receta.recetaId}`,
                        operador: plan.operadorNombre,
                        receta: receta.nombre,
                        categoria: receta.categoria || '-',
                        cantidad: receta.cantidad,
                        rowspan: index === 0 ? plan.recetas.length : 0,
                        isFirst: index === 0
                    })
                })
            }
            return filas
        }
    },
    methods: {
        totalStemsPorOperador(plan) {
            return (plan.recetas || []).reduce((acc, r) => acc + (parseInt(r.cantidad) || 0), 0)
        }
    }
}
</script>

<style scoped>
.vista-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.summary-card {
    background: var(--bg);
    border-radius: 12px;
    padding: 20px 24px;
    display: grid;
    grid-template-columns: 1fr 1fr auto;
    gap: 24px;
    align-items: center;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border: 1px solid var(--border);
}

.summary-label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
}

.summary-card strong {
    font-size: 16px;
    color: var(--text-h);
}



.td-operador {
    vertical-align: top !important;
    background: var(--bg);
    border-right: 1px solid var(--border);
    color: var(--text-h);
    font-size: 15px;
}

.badge-cat {
    background: var(--bg-secondary);
    color: var(--text);
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
}

.cantidad-val {
    font-weight: 700;
    color: var(--primary);
    font-size: 15px;
}

.text-right {
    text-align: right;
}

.text-center {
    text-align: center;
}

.text-muted {
    color: var(--text-muted);
}

.py-4 {
    padding-top: 2rem !important;
    padding-bottom: 2rem !important;
}

@media (max-width: 768px) {
    .summary-card {
        grid-template-columns: 1fr;
        gap: 16px;
        text-align: center;
    }
}
</style>
