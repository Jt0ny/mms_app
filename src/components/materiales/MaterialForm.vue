<template>
    <div class="material-form-card">

        <form @submit.prevent="enviarFormulario">

            <!-- NOMBRE -->
            <div class="form-group">
                <label class="form-label">Nombre del Material</label>
                <input v-model="materialLocal.nombre" type="text" class="form-input" placeholder="Ej: Papel Kraft"
                    required />
            </div>

            <!-- CANTIDAD -->
            <div class="form-group">
                <label class="form-label">Cantidad</label>
                <input v-model.number="materialLocal.cantidad" type="number" min="1" class="form-input" placeholder="0"
                    required />
            </div>

            <!-- DESCRIPCIÓN -->
            <div class="form-group">
                <label class="form-label"> Descripción</label>
                <textarea v-model="materialLocal.descripcion" class="form-textarea" rows="3"
                    placeholder="Descripción opcional..." />
            </div>

            <!-- BOTONES -->
            <div class="actions">
                <button v-if="modoEdicion" type="button" class="btn btn-secondary" @click="$emit('cancelar')">
                    Cancelar</button>

                <button type="submit" class="btn btn-primary" :disabled="cargando">
                    {{ cargando ? (modoEdicion ? 'Actualizando...' : 'Guardando...')
                        : (modoEdicion ? 'Actualizar Material' : 'Agregar Material')}}
                </button>

            </div>

        </form>

    </div>
</template>

<script>
export default {

    props: {
        material: {
            type: Object,
            required: true
        },
        cargando: {
            type: Boolean,
            default: false
        },
        modoEdicion: {
            type: Boolean,
            default: false
        }
    },

    emits: [
        'guardar',
        'actualizar',
        'cancelar'
    ],

    data() {
        return {
            materialLocal: {
                nombre: '',
                cantidad: null,
                descripcion: ''
            }
        }
    },

    watch: {
        material: {
            immediate: true,
            deep: true,
            handler(nuevoValor) {this.materialLocal = {...nuevoValor }}
        }
    },

    methods: {
        enviarFormulario() {
            if (this.modoEdicion) {
                this.$emit('actualizar',this.materialLocal)
                } else {
                this.$emit( 'guardar',this.materialLocal)
            }
        }
    }
}
</script>
<style scoped>
.material-form-card {
    background: var(--bg);
    border-radius: 12px;
    padding: 24px;
    border: 1px solid var(--border-light);
    box-shadow: var(--shadow);
}

.form-group {
    display: flex;
    flex-direction: column;
    margin-bottom: 18px;
}

.form-label {
    margin-bottom: 8px;
    font-weight: 600;
    color: var(--text-h);
    font-size: 14px;
}

.form-input,
.form-textarea {
    width: 100%;
    padding: 12px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--bg);
    color: var(--text);
    font-size: 14px;
    transition: all 0.3s ease;
}

.form-input:focus,
.form-textarea:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
}

.form-textarea {
    resize: vertical;
}

.actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 24px;
}

.btn {
    border: none;
    border-radius: 8px;
    padding: 10px 18px;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.btn-primary {
    background: var(--primary);
    color: white;
}

.btn-primary:hover {
    background: var(--primary-dark);
}

.btn-secondary {
    background: var(--text-light);
    color: white;
}

.btn-secondary:hover {
    background: #4b5563;
}

.btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}
</style>