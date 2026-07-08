<template>
    <div v-if="items.length > 0" class="preview-wrapper">
        <div class="preview-card">
            <div class="preview-header">
                <p>
                    <strong>{{ items.length }}</strong>
                    {{ itemLabel }}
                </p>
            </div>

            <div class="preview-content">
                <div class="preview-info">
                    <p><strong>{{ items.length }}</strong> registros en este preview</p>
                </div>

                <table class="preview-table">
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
                <ButtonActions
                    :cargando="loading"
                    :textoConfirmar="confirmText"
                    :textoCargando="loadingText"
                    @cancelar="$emit('cancelar')"
                    @confirmar="$emit('confirmar')"
                />
            </div>
        </div>
    </div>
</template>

<script>
import ButtonActions from '../ButtonActions.vue'

export default {
    name: 'PreviewTable',
    components: { ButtonActions },
    props: {
        items: { type: Array, default: () => [] },
        loading: { type: Boolean, default: false },
        itemLabel: { type: String, default: 'encontrados' },
        confirmText: { type: String, default: 'Confirmar' },
        loadingText: { type: String, default: 'Procesando...' }
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

.preview-card {
    background: var(--bg);
    border-radius: 12px;
    box-shadow: var(--shadow);
    border: 1px solid var(--border-light);
    overflow: hidden;
}

.preview-header {
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
    color: white;
    padding: 16px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
}

.preview-header p {
    margin: 0;
    font-weight: 700;
}

.preview-content {
    padding: 20px;
    overflow-y: auto;
    max-height: 450px;
}

.preview-info {
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--border);
}

.preview-info p {
    margin: 0;
    color: var(--text-h);
    font-weight: 600;
}

.preview-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
}

.preview-table :deep(thead) {
    background: var(--primary);
    color: white;
}

.preview-table :deep(th) {
    padding: 14px 16px;
    text-align: left;
    text-transform: uppercase;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.8px;
}

.preview-table :deep(td) {
    padding: 14px 16px;
    border-bottom: 1px solid var(--border);
    color: var(--text);
}

.preview-table :deep(tbody tr:hover) {
    background: var(--bg-secondary);
}

.preview-actions {
    padding: 0 20px 20px;
    display: flex;
    justify-content: flex-end;
}

.preview-table :deep(td):before {
    display: none;
}

@media (max-width: 768px) {
    .preview-header {
        flex-direction: column;
        align-items: flex-start;
    }

    .preview-table {
        font-size: 12px;
    }

    .preview-table :deep(th),
    .preview-table :deep(td) {
        padding: 10px 8px;
    }
}

@media (max-width: 480px) {
    .preview-content {
        padding: 12px;
        max-height: 360px;
    }

    .preview-table {
        display: block;
    }

    .preview-table :deep(thead) {
        display: none;
    }

    .preview-table tbody tr {
        display: block;
        margin-bottom: 12px;
        border: 1px solid var(--border-light);
        border-radius: 8px;
        padding: 8px;
        background: var(--bg);
    }

    .preview-table :deep(td) {
        display: flex;
        justify-content: space-between;
        padding: 8px 6px;
        border-bottom: none;
    }

    .preview-table :deep(td):before {
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
