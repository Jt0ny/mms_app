<template>
    <div v-if="mensaje.texto" class="status" :class="claseAlerta">
        <CheckCircleIcon v-if="mensaje.tipo === 'exito'" class="icon-md icon-inline" />
        <XCircleIcon v-else-if="mensaje.tipo === 'error'" class="icon-md icon-inline" />
        <InformationCircleIcon v-else-if="mensaje.tipo === 'info'" class="icon-md icon-inline" />
        <span class="status-text">{{ mensaje.texto }}</span>
    </div>
</template>

<script>
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon } from '@heroicons/vue/24/solid'

export default {
    components: {
        CheckCircleIcon,
        XCircleIcon,
        InformationCircleIcon
    },
    props: {
        mensaje: {
            type: Object,
            default: () => ({
                tipo: null,
                texto: ''
            })
        }
    },
    computed: {
        claseAlerta() {
            return {
                'status-success': this.mensaje.tipo === 'exito',
                'status-error': this.mensaje.tipo === 'error',
                'status-info': this.mensaje.tipo === 'info'
            }
        }
    }
}
</script>

<style scoped>
.status {
    padding: 10px 16px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    line-height: 1.4;
    display: flex;
    align-items: center;
    gap: 8px;
}

.status-text {
    flex: 1;
}

.status-success {
    background: var(--alert-success-bg);
    color: var(--alert-success-text);
    border: 1px solid var(--alert-success-border);
}

.status-error {
    background: var(--alert-error-bg);
    color: var(--alert-error-text);
    border: 1px solid var(--alert-error-border);
}

.status-info {
    background: var(--alert-info-bg);
    color: var(--alert-info-text);
    border: 1px solid var(--alert-info-border);
}
</style>
