<template>
    <div class="panel inventory-panel">
        <div class="panel-header">
            <div>
                <h2>Materia prima disponible</h2>
                <p>Selecciona la materia prima para la receta</p>
            </div>

            <button type="button" class="btn-refresh" :disabled="cargando" @click="$emit('actualizar')">
                {{ cargando ? 'Cargando...' : 'Actualizar' }}
            </button>
        </div>

        <!-- LOADING -->
        <div v-if="cargando" class="empty-state">
            Cargando materia prima...
        </div>

        <!-- TABLA -->
        <div v-else-if="materiaPrima.length" class="table-wrap">

            <table class="selection-table">
                <thead>
                    <tr>
                        <th>Sel.</th>
                        <th>Variedad</th>
                        <th>Disponible</th>
                        <th>Cantidad</th>
                    </tr>
                </thead>

                <tbody>
                    <tr v-for="item in materiaPrima" :key="item.id">

                        <!-- CHECK -->
                        <td>
                            <input type="checkbox" :checked="esSeleccionado(item.id)"
                                @change="$emit('alternar', item, $event.target.checked)" />
                        </td>

                        <!-- NOMBRE -->
                        <td>
                            <strong>
                                {{ item.variedad }}
                            </strong>

                            <div class="row-subtitle">
                                Fecha:{{ item.fechaIngreso || '-' }}
                            </div>

                        </td>

                        <!-- DISPONIBLE -->
                        <td>
                            {{ item.cantidadTotal ?? 0 }}
                        </td>

                        <!-- CANTIDAD -->
                        <td>
                            <input type="number" min="1" class="qty-input" :disabled="!esSeleccionado(item.id)"
                                :value="getCantidad(item.id)"
                                @input="$emit('cantidad', item.id, $event.target.value)" />
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- EMPTY -->
        <div v-else class="empty-state">
            No hay materia prima registrada
        </div>

    </div>
</template>

<script>
export default {

    props: {

        materiaPrima: {
            type: Array,
            default: () => []
        },

        seleccionados: {
            type: Array,
            default: () => []
        },

        cargando: {
            type: Boolean,
            default: false
        }
    },

    emits: [
        'alternar',
        'cantidad',
        'actualizar'
    ],

    methods: {

        esSeleccionado(id) {
            return this.seleccionados.some(item => item.id === id)
        },

        getCantidad(id) {
            const item = this.seleccionados.find(item => item.id === id)
            return item ? item.cantidad : 1
        }
    }
}
</script>

<style scoped>
.inventory-panel {
    background: white;
    border-radius: 14px;
    padding: 20px;
    box-shadow: var(--shadow-sm);
}

.panel-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 16px;
}

.panel-header p {
    margin-top: 4px;
    color: var(--text-light);
}

.btn-refresh {
    border: none;
    border-radius: 10px;
    padding: 10px 14px;
    cursor: pointer;
    font-weight: 600;
    background: var(--primary-bg);
    color: var(--primary-dark);
}

.table-wrap {
    max-height: 420px;
    overflow: auto;
}

.selection-table {
    width: 100%;
    border-collapse: collapse;
}

.selection-table th,
.selection-table td {
    padding: 12px 10px;
    border-bottom: 1px solid var(--border-light);
    text-align: left;
}

.selection-table th {
    font-size: 14px;
    color: var(--text-light);
}

.row-subtitle {
    margin-top: 4px;
    font-size: 13px;
    color: var(--text-light);
}

.qty-input {
    width: 100px;
    padding: 8px;
    border-radius: 8px;
    border: 1px solid var(--border);
}

.empty-state {
    padding: 18px;
    border-radius: 10px;
    background: #f8faf8;
    border: 1px dashed var(--border);
    color: var(--text-light);
}
</style>