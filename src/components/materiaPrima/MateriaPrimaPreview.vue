<template>
  <div v-if="datosProcesados.length > 0" class="materia-prima-preview">
    <div class="preview-card">

      <div class="preview-header">
        <p>
          <strong>{{ datosProcesados.length }}</strong>
          variedades encontradas
        </p>
      </div>

      <div class="preview-content">
        <div class="preview-info">
          <p> <strong>{{ datosProcesados.length }}</strong> variedades en este preview</p>
        </div>

        <table class="preview-table">
          <thead>
            <tr>
              <th>Variedad</th>
              <th>Cantidad (Tallos)</th>
              <th>Fecha Ingreso</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="(item, index) in datosProcesados" :key="index">
              <td class="variety" :data-label="'Variedad'">{{ item.variedad }}</td>
              <td class="quantity" :data-label="'Cantidad (Tallos)'">{{ item.cantidad_total }}</td>
              <td class="date" :data-label="'Fecha Ingreso'">{{ item.fecha_ingreso }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <ButtonActions :cargando="cargando" textoConfirmar="Guardar Inventario" textoCargando="Guardando..."
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
/* Shared styles for inventory and preview components */
.inventory-card,
.preview-card {
  background: var(--bg);
  border-radius: 12px;
  box-shadow: var(--shadow);
  border: 1px solid var(--border-light);
  overflow: hidden;
}

.inventory-header,
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

.inventory-header h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
}

.loading-state,
.empty-state {
  padding: 40px 20px;
  text-align: center;
  color: var(--text-light);
}

.content-table,
.preview-content {
  padding: 20px;
  overflow-y: auto;
  max-height: 450px;
}

.inventory-info,
.preview-info {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}

.inventory-info p,
.preview-info p {
  margin: 0;
  color: var(--text-h);
  font-weight: 600;
}

.inventory-table,
.preview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.inventory-table thead,
.preview-table thead {
  background: var(--primary);
  color: white;
}

.inventory-table th,
.preview-table th {
  padding: 14px 16px;

  text-align: left;

  text-transform: uppercase;

  font-size: 12px;
  font-weight: 700;

  letter-spacing: 0.8px;
}

.inventory-table td,
.preview-table td {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
  color: var(--text);
}

.inventory-table tbody tr:hover,
.preview-table tbody tr:hover {
  background: var(--bg-secondary);
}

.variety {
  color: var(--text-h);
  font-weight: 600;
}

.quantity {
  color: var(--primary);
  font-weight: 700;
}

.date {
  color: var(--text-light);
  font-size: 13px;
}

/* Alinear el componente ButtonActions al final del card */
:deep(ButtonActions) {
  display: flex;
  justify-content: flex-end;
  margin: 12px 20px 20px 20px;
}

@media (max-width: 768px) {

  .inventory-header,
  .preview-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .inventory-table,
  .preview-table {
    font-size: 12px;
  }

  .inventory-table th,
  .inventory-table td,
  .preview-table th,
  .preview-table td {
    padding: 10px 8px;
  }

}

/* Small screens: convert table into stacked rows for better readability */
@media (max-width: 480px) {
  .preview-content,
  .content-table {
    padding: 12px;
    max-height: 360px;
  }

  .preview-table,
  .inventory-table {
    display: block;
  }

  .preview-table thead,
  .inventory-table thead {
    display: none;
  }

  .preview-table tbody tr,
  .inventory-table tbody tr {
    display: block;
    margin-bottom: 12px;
    border: 1px solid var(--border-light);
    border-radius: 8px;
    padding: 8px;
    background: var(--bg);
  }

  .preview-table td,
  .inventory-table td {
    display: flex;
    justify-content: space-between;
    padding: 8px 6px;
    border-bottom: none;
  }

  .preview-table td:before,
  .inventory-table td:before {
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