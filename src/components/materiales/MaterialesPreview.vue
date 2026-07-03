<template>
  <div v-if="datosProcesados.length > 0" class="materiales-preview">
    <div class="preview-card">

      <div class="preview-header">
        <p>
          <strong>{{ datosProcesados.length }}</strong>
          materiales encontrados
        </p>
      </div>

      <div class="preview-content">
        <div class="preview-info">
          <p><strong>{{ datosProcesados.length }}</strong> materiales en este preview</p>
        </div>

        <table class="preview-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Cantidad</th>
              <th>Descripción</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="(item, index) in datosProcesados" :key="index">
              <td class="nombre" :data-label="'Nombre'">{{ item.nombre }}</td>
              <td class="quantity" :data-label="'Cantidad'">{{ item.cantidad }}</td>
              <td class="descripcion" :data-label="'Descripción'">{{ item.descripcion || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <ButtonActions :cargando="cargando" textoConfirmar="Guardar Materiales" textoCargando="Guardando..."
        @cancelar="$emit('cancelar')" @confirmar="$emit('confirmar')" />

    </div>
  </div>
</template>

<script>
import ButtonActions from '../ButtonActions.vue'

export default {
  components: {
    ButtonActions
  },

  props: {
    datosProcesados: {
      type: Array,
      default: () => []
    },

    cargando: {
      type: Boolean,
      default: false
    }
  },

  emits: ['cancelar', 'confirmar']
}
</script>

<style scoped>
.preview-card {
  background: var(--bg);
  border-radius: 12px;
  box-shadow: var(--shadow);
  border: 1px solid var(--border-light);
  overflow: hidden;
}

.preview-header {
  background: linear-gradient(135deg,
      var(--primary) 0%,
      var(--primary-dark) 100%);
  color: white;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.loading-state,
.empty-state {
  padding: 40px 20px;
  text-align: center;
  color: var(--text-light);
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

.preview-table thead {
  background: var(--primary);
  color: white;
}

.preview-table th {
  padding: 14px 16px;
  text-align: left;
  text-transform: uppercase;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.8px;
}

.preview-table td {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
  color: var(--text);
}

.preview-table tbody tr:hover {
  background: var(--bg-secondary);
}

.nombre {
  color: var(--text-h);
  font-weight: 600;
}

.quantity {
  color: var(--primary);
  font-weight: 700;
}

.descripcion {
  color: var(--text-light);
  font-size: 13px;
}

:deep(ButtonActions) {
  display: flex;
  justify-content: flex-end;
  margin: 12px 20px 20px 20px;
}

@media (max-width: 768px) {
  .preview-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .preview-table {
    font-size: 12px;
  }

  .preview-table th,
  .preview-table td {
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

  .preview-table thead {
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

  .preview-table td {
    display: flex;
    justify-content: space-between;
    padding: 8px 6px;
    border-bottom: none;
  }

  .preview-table td:before {
    content: attr(data-label);
    font-weight: 600;
    color: var(--text-light);
    margin-right: 8px;
  }

  :deep(ButtonActions) {
    flex-direction: column;
  }

  :deep(ButtonActions) .btn {
    width: 100%;
  }
}
</style>
