<template>
    <div class="upload-card">
        <label class="input-label">
            Importar Reporte de {{ nombreModulo }} (.xls / .xlsx)
        </label>
        <input  type="file"accept=".xls,.xlsx" class="file-input" :disabled="cargando" @change="handleFileUpload"/>
        <p class="helper-text"> Formatos soportados: .xls, .xlsx</p>
    </div>
</template>

<script>
export default {

    props: {

        cargando: {
            type: Boolean,
            default: false
        },

        nombreModulo: {
            type: String,
            default: 'Producción'
        }
    },

    emits: ['archivo-seleccionado'],

    methods: {
        handleFileUpload(event) {
            const file = event.target.files?.[0];
            if (!file) return;
            this.$emit('archivo-seleccionado', file);
        }
    }
}
</script>
<style scoped>
.upload-card {
    padding: 24px;
    border-radius: 12px;
    background: var(--bg);
    border: 2px dashed var(--primary-border);
    transition: all 0.3s ease;
}

.upload-card:hover {
    border-color: var(--primary);
}

.input-label {
    display: block;
    margin-bottom: 12px;
    color: var(--text-h);
    font-weight: 600;
    font-size: 15px;
}

.file-input {
    width: 100%;
    padding: 8px 0;
    cursor: pointer;
}

.file-input::file-selector-button {
    margin-right: 12px;
    padding: 10px 18px;
    border-radius: 8px;
    border: none;
    background: var(--primary-bg);
    color: var(--primary-dark);
    font-weight: 600;
    cursor: pointer;
}

.helper-text {
    margin-top: 8px;
    color: var(--text-light);
    font-size: 13px;
}
</style>