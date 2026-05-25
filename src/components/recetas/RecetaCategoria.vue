<template>
    <div class="receta-categoria">
        <label>Categoría de la receta</label>

        <div class="categoria-selector">
            <div class="categoria-actual" :class="{ vacio: !modelo }">
                {{ modelo || 'Selecciona una categoría' }}
            </div>

            <div class="categoria-opciones">
                <div v-for="categoria in categorias" :key="categoria" class="categoria-opcion"
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
    background: linear-gradient(180deg, #ffffff 0%, #f8faf8 100%);
    color: var(--text-h);
    font-weight: 600;
    box-shadow: var(--shadow-sm);
}

.categoria-actual.vacio {
    color: var(--text-light);
    font-weight: 500;
}

.categoria-opciones {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}

.categoria-opcion {
    padding: 9px 12px;
    border-radius: 999px;
    border: 1px solid var(--border);
    background: var(--bg);
    color: var(--text);
    cursor: pointer;
    transition: transform 0.18s ease, border-color 0.18s ease, background-color 0.18s ease, color 0.18s ease;
    user-select: none;
}

.categoria-opcion:hover {
    transform: translateY(-1px);
    border-color: var(--primary-light);
}

.categoria-opcion.activa {
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
    border-color: transparent;
    color: white;
    box-shadow: var(--shadow-sm);
}

.categoria-opcion:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
}
</style>