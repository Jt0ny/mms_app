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

.btn {
  border: none;
  border-radius: 8px;
  padding: 10px 18px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.25s ease;
}

.btn-primary {
  background: var(--primary);
  color: white;
}

.btn-primary:hover {
  background: var(--primary-dark);
}

.btn-secondary {
  background: var(--text-light);
  color: white;
}

.btn-secondary:hover {
  background: #4b5563;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 480px) {
  .actions {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }

  .btn {
    width: 100%;
  }
}
</style>