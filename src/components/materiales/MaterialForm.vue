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
                <button type="submit" class="btn btn-primary" :disabled="cargando">
                    {{ cargando ? 'Guardando...' : 'Agregar Material' }}
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
            required: true,
            validator: (value) => {
                return value !== null && typeof value === 'object' && 'nombre' in value
            }
        },
        cargando: {
            type: Boolean,
            default: false
        }
    },

    emits: [
        'guardar'
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
            this.$emit('guardar', this.materialLocal)
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

.actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 24px;
}


</style>