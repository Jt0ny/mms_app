<template>
    <div class="merma-operador-selector">
        <label>Operador Responsable</label>

        <div class="selector-container">
            <div class="actual-seleccion" :class="{ vacio: !operadorSeleccionado }">
                👤 {{ operadorSeleccionado ? `Operador: ${operadorSeleccionado.nombre}` : 'Selecciona un operador' }}
            </div>

            <div class="opciones-chips">
                <div v-for="op in operadores" :key="op.id" class="chip-opcion"
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
export default {
    name: 'MermaOperadorSelector',
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

.opciones-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.chip-opcion {
    padding: 8px 14px;
    border-radius: 999px;
    border: 1px solid var(--border);
    background: var(--bg);
    color: var(--text);
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    transition: transform 0.18s ease, border-color 0.18s ease, background-color 0.18s ease, color 0.18s ease;
    user-select: none;
    display: flex;
    align-items: center;
    gap: 6px;
}

.chip-opcion:hover {
    transform: translateY(-1px);
    border-color: var(--primary-light);
}

.chip-opcion.activa {
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
    border-color: transparent;
    color: white;
    box-shadow: var(--shadow-sm);
    font-weight: 600;
}

.chip-opcion:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
}
</style>
