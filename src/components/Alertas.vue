<template>

    <div v-if="mensaje.texto" class="status" :class="claseAlerta">
        {{ mensaje.texto }}
    </div>

</template>

<script>
export default {
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
