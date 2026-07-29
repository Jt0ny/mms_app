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
            <button type="submit" class="btn-submit" :disabled="guardando">
                {{ guardando ? 'Guardando...' : 'Guardar receta' }}
            </button>

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
        'guardar'
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
    background: white;
    font: inherit;
}

.form-panel textarea {
    resize: vertical;
    min-height: 140px;
}

.resume-box {
    padding: 14px;
    border-radius: 10px;
    background: #f8faf8;
    border: 1px solid var(--border-light);
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.btn-submit {
    margin-top: 8px;
    padding: 12px;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    font-weight: 600;
    color: white;
    background: linear-gradient(135deg,
            var(--primary) 0%,
            var(--primary-dark) 100%);
    transition: 0.2s ease;
}

.btn-submit:hover {
    transform: translateY(-1px);
}

.btn-submit:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
}
</style>