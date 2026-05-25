<template>
    <div v-if="datosProcesados.length > 0" class="pedido-preview">
        <div class="preview-card">
            <div class="preview-header">
                <p><strong>{{ datosProcesados.length }}</strong> líneas de pedido encontradas</p>
            </div>

            <div class="preview-content">
              <div class="preview-info">
                <p> <strong>{{ datosProcesados.length }}</strong> líneas de pedido en este preview</p>
              </div>

              <table class="preview-table">
                <thead>
                    <tr>
                        <th>Cliente (Bill)</th>
                        <th>Destino (Ship)</th>
                        <th>Categoría</th>
                        <th>Tallos</th>
                    </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in datosProcesados" :key="index">
                    <td class="variety" :data-label="'Cliente (Bill)'">{{ item.cliente_facturacion }}</td>
                    <td :data-label="'Destino (Ship)'">{{ item.cliente_envio }}</td>
                    <td :data-label="'Categoría'"><strong>{{ item.categoria }}</strong></td>
                    <td :data-label="'Tallos'">{{ item.stems }}</td>
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

.preview-header p { margin: 0; font-weight: 700; }

.preview-content { padding: 20px; overflow-y: auto; max-height: 420px; }

.preview-info { margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--border); }

.preview-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.preview-table thead { background: var(--primary); color: white; }
.preview-table th { padding: 12px 14px; text-align: left; text-transform: uppercase; font-size: 12px; font-weight:700; letter-spacing:0.6px; }
.preview-table td { padding: 12px 14px; border-bottom: 1px solid var(--border); color: var(--text); }
.preview-table tbody tr:hover { background: var(--bg-secondary); }

.variety { color: var(--text-h); font-weight: 600; }
.quantity { color: var(--primary); font-weight: 700; }
.date { color: var(--text-light); font-size: 13px; }

::v-deep ButtonActions { display:flex; justify-content:flex-end; margin:12px 20px 20px 20px; }

@media (max-width:768px) {
  .preview-header { flex-direction: column; align-items: flex-start; }
  .preview-table, .preview-table th, .preview-table td { font-size:12px; padding:8px 6px; }
}

/* Small screens: stacked rows */
@media (max-width: 480px) {
  .preview-content { padding: 12px; max-height: 360px; }

  .preview-table { display: block; }
  .preview-table thead { display: none; }

  .preview-table tbody tr { display: block; margin-bottom: 12px; border: 1px solid var(--border-light); border-radius: 8px; padding: 8px; background: var(--bg); }

  .preview-table td { display: flex; justify-content: space-between; padding: 8px 6px; border-bottom: none; }

  .preview-table td:before { content: attr(data-label); font-weight: 600; color: var(--text-light); margin-right: 8px; }

  ::v-deep ButtonActions { flex-direction: column; }
  ::v-deep ButtonActions .btn { width: 100%; }
}
</style>