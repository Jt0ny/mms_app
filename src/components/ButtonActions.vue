<template>
  <div class="actions">

    <button
      @click="$emit('cancelar')"
      class="btn btn-secondary"
    >
      {{ textoCancelar }}
    </button>

    <button
      @click="$emit('confirmar')"
      :disabled="cargando"
      class="btn btn-primary"
    >
      {{ cargando ? textoCargando : textoConfirmar }}
    </button>

  </div>
</template>

<script>
export default {
  props: {
    cargando: {
      type: Boolean,
      default: false
    },

    textoCancelar: {
      type: String,
      default: 'Cancelar'
    },

    textoConfirmar: {
      type: String,
      default: 'Confirmar'
    },

    textoCargando: {
      type: String,
      default: 'Procesando...'
    }
  },

  emits: ['cancelar', 'confirmar']
}
</script>

<style scoped>
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}



@media (max-width: 480px) {
  .actions {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }
}
</style>