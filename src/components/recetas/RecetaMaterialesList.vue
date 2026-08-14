<template>
    <div class="panel selection-panel">
        <div class="selection-panel-header">
            <div>
                <h2>Materiales disponibles</h2>

                <p>Selecciona los materiales para la receta</p>
            </div>
            <button type="button" class="btn-refresh inline-flex-center gap-6" :disabled="cargando" @click="$emit('actualizar')">
                <ArrowPathIcon class="icon-sm" :class="{ 'spin': cargando }" />
                {{ cargando ? 'Cargando...' : 'Actualizar' }}
            </button>
        </div>

        <!-- LOADING -->
        <div v-if="cargando" class="empty-state">
            Cargando materiales...
        </div>

        <!-- TABLA -->
        <div v-else-if="materiales.length" class="selection-table-wrap">
            <table class="selection-table">
                <thead>
                    <tr>
                        <th>Sel.</th>
                        <th>Nombre</th>
                        <th>Disponible</th>
                        <th>Cantidad</th>
                    </tr>
                </thead>

                <tbody>
                    <tr v-for="item in materiales" :key="item.id">

                        <!-- CHECK -->
                        <td>
                            <input type="checkbox" :checked="esSeleccionado(item.id)"
                                @change=" $emit('alternar', item, $event.target.checked)" />
                        </td>

                        <!-- NOMBRE -->
                        <td>
                            <strong>{{ item.nombre }}</strong>
                            <div class="row-subtitle">
                                {{ item.descripcion || 'Sin descripción' }}
                            </div>
                        </td>

                        <!-- DISPONIBLE -->
                        <td>
                            {{ item.cantidad ?? 0 }}
                        </td>

                        <!-- CANTIDAD -->
                        <td>
                            <input type="number" min="1" class="qty-input" :disabled="!esSeleccionado(item.id)"
                                :value="obtenerCantidad(item.id)" @input=" $emit('cantidad', item.id, $event.target.value)" />
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- EMPTY -->
        <div v-else class="empty-state">
            No hay materiales registrados
        </div>

    </div>
</template>

<script>
import { ArrowPathIcon } from '@heroicons/vue/24/outline'

export default {
    components: { ArrowPathIcon },

    props: {

        materiales: {
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

        obtenerCantidad(id) {

            const item = this.seleccionados.find(item => item.id === id)
            return item ? item.cantidad : 1
        }
    }
}
</script>