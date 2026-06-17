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
    background: #dcfce7;
    color: #15803d;
    border: 1px solid #bbf7d0;
}

.status-error {
    background: #fee2e2;
    color: #dc2626;
    border: 1px solid #fecaca;
}

.status-info {
    background: #eff6ff;
    color: #2563eb;
    border: 1px solid #bfdbfe;
}
</style>