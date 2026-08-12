<template>
  <div class="data-card p-6">
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
            <div class="form-actions">
                <button type="submit" class="btn btn-primary btn-block" :disabled="cargando">
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

</style>