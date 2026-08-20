<template>
    <div class="receta-categoria">
        <label>Categoría de la receta</label>

        <div class="categoria-selector">
            <div class="categoria-actual" :class="{ vacio: !modelo }">
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

<style scoped>
.receta-categoria {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.receta-categoria label {
    font-weight: 600;
    color: var(--text-h);
}

.categoria-selector {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.categoria-actual {
    padding: 11px 14px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: linear-gradient(180deg, var(--bg) 0%, var(--bg-secondary) 100%);
    color: var(--text-h);
    font-weight: 600;
    box-shadow: var(--shadow-sm);
}

.categoria-actual.vacio {
    color: var(--text-light);
    font-weight: 500;
}

</style>