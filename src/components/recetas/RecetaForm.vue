<template>
    <div>
        <form class="panel form-panel" @submit.prevent="$emit('guardar')">

            <h2>Datos de la receta</h2>

            <!-- NOMBRE -->
            <label>Nombre</label>

            <input :value="receta.nombre" type="text" placeholder="Ej. Ramo Primavera"
                @input="actualizar('nombre', $event.target.value)" required />

            <!-- CATEGORÍA -->
            <label>Categoría</label>
            <RecetaCategoria :modelValue="receta.categoria" :categorias="categorias"
                @update:modelValue=" actualizar('categoria', $event)" />

            <!-- INSTRUCCIONES -->
            <label>Instrucciones</label>

            <textarea rows="6" placeholder="Describe el armado de la receta" :value="receta.instrucciones"
                @input="actualizar('instrucciones', $event.target.value)" required />

            <!-- RESUMEN -->
            <div class="resume-box">
                <p><strong>{{ totalSeleccionados }}</strong> insumos seleccionados</p>
                <p><strong>{{ totalMateriales }}</strong> materiales y <strong>{{ totalMateriaPrima }}</strong> materias
                    primas</p>
            </div>

            <!-- BOTÓN -->
            <div class="actions">
                <button type="submit" class="btn-submit" :disabled="guardando">
                    {{ guardando ? 'Guardando...' : (receta.id ? 'Actualizar receta' : 'Guardar receta') }}
                </button>
                <button v-if="receta.id" type="button" class="btn-cancel" @click="$emit('cancelar')" :disabled="guardando">
                    Cancelar Edición
                </button>
            </div>

        </form>
    </div>
</template>

<script>
import RecetaCategoria from '../recetas/RecetaCategoria.vue'

export default {

    components: {
        RecetaCategoria
    },

    props: {

        receta: {
            type: Object,
            required: true,
            validator: (value) => {
                return value !== null && typeof value === 'object' && 'nombre' in value
            }
        },

        categorias: {
            type: Array,
            default: () => []
        },

        totalSeleccionados: {
            type: Number,
            default: 0
        },

        totalMateriales: {
            type: Number,
            default: 0
        },

        totalMateriaPrima: {
            type: Number,
            default: 0
        },

        guardando: {
            type: Boolean,
            default: false
        }
    },

    emits: [
        'actualizar-receta',
        'guardar',
        'cancelar'
    ],

    methods: {
        actualizar(campo, valor) {
            this.$emit('actualizar-receta', { ...this.receta, [campo]: valor })
        }
    }
}
</script>

<style scoped>
.form-panel {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.form-panel label {
    font-weight: 600;
    color: var(--text-h);
}

.form-panel input,
.form-panel textarea,
.select-input {
    width: 100%;
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--bg);
    font: inherit;
}

.form-panel textarea {
    resize: vertical;
    min-height: 140px;
}

.resume-box {
    padding: 14px;
    border-radius: 10px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-light);
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.btn-submit {
    width: 100%;
    padding: 12px;
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
}

.btn-submit:hover:not(:disabled) {
    transform: translateY(-1px);
    opacity: 0.9;
}

.btn-submit:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
}

.btn-cancel {
    width: 100%;
    padding: 12px;
    background: transparent;
    color: var(--text-dark, #4b5563);
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
}

.btn-cancel:hover:not(:disabled) {
    background: #f3f4f6;
}

.btn-cancel:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}
</style>