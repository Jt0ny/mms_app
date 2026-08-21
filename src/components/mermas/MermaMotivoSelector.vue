<!-- MermaMotivoSelector.vue -->
<template>
    <div>
        <!-- Selector Principal de Motivo -->
        <div class="form-group">
            <label class="form-label" for="motivo-merma">Motivo de la Merma</label>
            <select id="motivo-merma" :value="motivo" @change="actualizarMotivo($event.target.value)"
                class="form-select" required>
                <option value="" disabled> Seleccionar motivo </option>
                <option value="Daño en armado">Daño durante el armado/ensamblaje</option>
                <option value="Rotura/Daño físico">Rotura o daño físico en almacén</option>
                <option value="Vencimiento/Descomposición">Vencimiento o pudrición (flores)</option>
                <option value="Defecto de proveedor">Defecto de calidad de proveedor</option>
                <option value="Otro">Otro motivo (especificar abajo)</option>
            </select>
        </div>

        <!-- Detalle condicional de Otro Motivo -->
        <div class="form-group mt-16" v-if="motivo === 'Otro'">
            <label class="form-label" for="otro-motivo-merma">Especificar Motivo</label>
            <input id="otro-motivo-merma" :value="otroMotivo" @input="$emit('update:otroMotivo', $event.target.value)"
                type="text" class="form-input" placeholder="Escribe el motivo detallado" required />
        </div>
    </div>
</template>

<script>
export default {
    name: 'MermaMotivoSelector',
    props: {
        motivo: {
            type: String,
            default: ''
        },
        otroMotivo: {
            type: String,
            default: ''
        }
    },
    emits: ['update:motivo', 'update:otroMotivo'],
    methods: {
        actualizarMotivo(valor) {
            this.$emit('update:motivo', valor);
            // Si cambia el motivo y ya no es 'Otro', limpiamos el campo de especificación
            if (valor !== 'Otro') {
                this.$emit('update:otroMotivo', '');
            }
        }
    }
}
</script>

<style scoped>
.mt-16 {
    margin-top: 16px;
}
</style>
