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
                'status-error': this.mensaje.tipo === 'error'
            }
        }
    }
}
</script>