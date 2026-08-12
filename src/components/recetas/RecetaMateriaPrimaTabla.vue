<template>
    <div class="panel selection-panel">
        <div class="selection-panel-header">
            <div>
                <h2>Materia prima disponible</h2>
                <p>Selecciona la materia prima para la receta</p>
            </div>

            <button type="button" class="btn-refresh inline-flex-center gap-6" :disabled="cargando" @click="$emit('actualizar')">
                <ArrowPathIcon class="icon-sm" :class="{ 'spin': cargando }" />
                {{ cargando ? 'Cargando...' : 'Actualizar' }}
            </button>
        </div>

        <!-- LOADING -->
        <div v-if="cargando" class="empty-state">
            Cargando materia prima...
        </div>

        <!-- TABLA -->
        <div v-else-if="materiaPrima.length" class="selection-table-wrap">

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
                                Fecha: {{ item.fechaIngreso || '-' }}
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
import { ArrowPathIcon } from '@heroicons/vue/24/outline'

export default {
    components: { ArrowPathIcon },

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