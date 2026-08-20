<template>
    <div class="upload-card">
        <label class="upload-zone" :class="{ disabled: cargando }">
            <span class="upload-icon"><ArrowUpTrayIcon class="icon-lg text-primary" /></span>
            <span class="upload-label">Importar Reporte de {{ nombreModulo }}</span>
            <span class="upload-hint">.xls / .xlsx</span>
            <input type="file" accept=".xls,.xlsx" class="file-input" :disabled="cargando" @change="procesarSubidaArchivo" />
        </label>
        <p class="helper-text">Formatos soportados: .xls, .xlsx</p>
    </div>
</template>

<script>
import { ArrowUpTrayIcon } from '@heroicons/vue/24/outline'

export default {
    components: { ArrowUpTrayIcon },
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
        procesarSubidaArchivo(event) {
            const file = event.target.files?.[0];
            if (!file) return;
            this.$emit('archivo-seleccionado', file);
        }
    }
}
</script>
<style scoped>
.upload-card {
    padding: 0;
}

.upload-zone {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 32px 24px;
    border-radius: 14px;
    background: var(--primary-bg);
    border: 2px dashed var(--primary-border);
    cursor: pointer;
    transition: all 0.25s ease;
    text-align: center;
    min-height: 120px;
}

.upload-zone:hover:not(.disabled) {
    border-color: var(--primary);
    background: rgba(22, 163, 74, 0.12);
}

.upload-zone.disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.upload-icon {
    font-size: 32px;
    line-height: 1;
}

.upload-label {
    font-weight: 600;
    color: var(--text-h);
    font-size: 15px;
}

.upload-hint {
    font-size: 13px;
    color: var(--text-light);
}

.file-input {
    display: none; /* oculto, la label activa el input */
}

.helper-text {
    margin-top: 10px;
    color: var(--text-light);
    font-size: 13px;
}

/* En tablet/touch: zona aun más grande */
@media (pointer: coarse) {
    .upload-zone {
        min-height: 150px;
        padding: 40px 24px;
    }

    .upload-icon {
        font-size: 40px;
    }
}
</style>