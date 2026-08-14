<template>
    <div v-if="items.length > 0" class="preview-wrapper">
        <div class="data-card">
            <div class="data-card-header">
                <p>
                    <strong>{{ items.length }}</strong>
                    {{ etiquetaItem }}
                </p>
            </div>

            <div class="data-card-content">
                <div class="data-card-info">
                    <p><strong>{{ items.length }}</strong> registros en este preview</p>
                </div>

                <table class="data-card-table">
                    <thead>
                        <tr>
                            <slot name="header" />
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(item, index) in items" :key="item.id || index">
                            <slot name="row" :item="item" :index="index" />
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="preview-actions">
                <AccionesButton
                    :cargando="cargando"
                    :textoConfirmar="textoConfirmar"
                    :textoCargando="textoCargando"
                    @cancelar="$emit('cancelar')"
                    @confirmar="$emit('confirmar')"
                />
            </div>
        </div>
    </div>
</template>

<script>
import AccionesButton from './AccionesButton.vue'

export default {
    name: 'VistaPreviaTable',
    components: { AccionesButton },
    props: {
        items: { type: Array, default: () => [] },
        cargando: { type: Boolean, default: false },
        etiquetaItem: { type: String, default: 'encontrados' },
        textoConfirmar: { type: String, default: 'Confirmar' },
        textoCargando: { type: String, default: 'Procesando...' }
    },
    emits: ['cancelar', 'confirmar']
}
</script>

<style scoped>
.preview-wrapper {
    animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
}





.preview-actions {
    padding: 0 20px 20px;
    display: flex;
    justify-content: flex-end;
}

.data-card-table :deep(td):before {
    display: none;
}



@media (max-width: 480px) {
    .data-card-content {
        padding: 12px;
        max-height: 360px;
    }

    .data-card-table {
        display: block;
    }

    .data-card-table :deep(thead) {
        display: none;
    }

    .data-card-table tbody tr {
        display: block;
        margin-bottom: 12px;
        border: 1px solid var(--border-light);
        border-radius: 8px;
        padding: 8px;
        background: var(--bg);
    }

    .data-card-table :deep(td) {
        display: flex;
        justify-content: space-between;
        padding: 8px 6px;
        border-bottom: none;
    }

    .data-card-table :deep(td):before {
        display: block;
        content: attr(data-label);
        font-weight: 600;
        color: var(--text-light);
        margin-right: 8px;
        flex-shrink: 0;
    }

    .preview-actions :deep(.btn) {
        width: 100%;
    }
}
</style>
