<template>

    <div class="selector-group">
        <div class="selector-display" :class="{ vacio: !modelo }">
            {{ modelo || 'Selecciona una categoría' }}
        </div>

        <div class="chip-options">
            <div v-for="categoria in categorias" :key="categoria" class="chip-option"
                :class="{ activa: categoria === modelo }" role="button" tabindex="0"
                @click="seleccionarCategoria(categoria)" @keydown.enter.prevent="seleccionarCategoria(categoria)"
                @keydown.space.prevent="seleccionarCategoria(categoria)">
                {{ categoria }}
            </div>
        </div>
    </div>

</template>

<script>


export default {

    props: {

        modelValue: {
            type: String,
            default: ''
        },

        categorias: {
            type: Array,
            default: () => []
        }
    },

    emits: ['update:modelValue'],

    computed: {

        modelo() {
            return this.modelValue
        }
    },

    methods: {

        seleccionarCategoria(categoria) {
            this.$emit('update:modelValue', categoria)
        }
    }
}
</script>

<style scoped></style>