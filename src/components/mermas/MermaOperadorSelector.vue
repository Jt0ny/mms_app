<template>
    <div class="merma-operador-selector">
        <label>Operador Responsable</label>

        <div class="selector-container">
            <div class="actual-seleccion flex-align-center gap-8" :class="{ vacio: !operadorSeleccionado }">
                <UserIcon class="icon-md text-primary" /> 
                {{ operadorSeleccionado ? `Operador: ${operadorSeleccionado.nombre}` : 'Selecciona un operador' }}
            </div>

            <div class="chip-options">
                <div v-for="op in operadores" :key="op.id" class="chip-option"
                    :class="{ activa: op.id === modelValue }" role="button" tabindex="0"
                    @click="seleccionarOperador(op.id)" @keydown.enter.prevent="seleccionarOperador(op.id)"
                    @keydown.space.prevent="seleccionarOperador(op.id)">
                    {{ op.nombre }}
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { UserIcon } from '@heroicons/vue/24/outline'

export default {
    name: 'MermaOperadorSelector',
    components: { UserIcon },
    props: {
        modelValue: {
            type: String,
            default: ''
        },
        operadores: {
            type: Array,
            default: () => []
        }
    },
    emits: ['update:modelValue'],
    computed: {
        operadorSeleccionado() {
            return this.operadores.find(o => o.id === this.modelValue) || null
        }
    },
    methods: {
        seleccionarOperador(id) {
            this.$emit('update:modelValue', id)
        }
    }
}
</script>

<style scoped>
.merma-operador-selector {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.merma-operador-selector label {
    font-weight: 600;
    color: var(--text-h);
    font-size: 14px;
}

.selector-container {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.actual-seleccion {
    padding: 11px 14px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: linear-gradient(180deg, var(--bg) 0%, var(--bg-secondary) 100%);
    color: var(--text-h);
    font-weight: 600;
    box-shadow: var(--shadow-sm);
    font-size: 13px;
}

.actual-seleccion.vacio {
    color: var(--text-light);
    font-weight: 500;
}

</style>
