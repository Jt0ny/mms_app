<template>
  <div class="inventory-card">
    <div class="inventory-header">
      <h2>📦 Inventario Actual</h2>
    <button @click="$emit('actualizar')" :disabled="cargando" class="btn-refresh">
        {{ cargando ? '⟳ Cargando...' : '↻ Actualizar' }}
      </button>
    </div>

    <!-- LOADING -->
    <div v-if="cargando" class="loading-state">
      <p>Cargando inventario...</p>
    </div>

    <!-- TABLA -->
    <div v-else-if="materiales.length > 0" class="content-table">
      <div class="inventory-info">
        <p><strong>{{ materiales.length }}</strong>materiales registrados</p>
      </div>
      <table class="inventory-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Cantidad</th>
            <th>Descripción</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="item in materiales":key="item.id">
            <td class="variety">{{ item.nombre }}</td>
            <td class="quantity">{{ item.cantidad }}</td>
            <td>{{ item.descripcion || '-' }}</td>

            <td class="actions-column">
            <button class="btn-action btn-edit" @click="$emit('editar', item)">✏️</button>
            <button class="btn-action btn-delete"@click="$emit('eliminar', item.id)" > 🗑️</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- VACÍO -->
    <div v-else class="empty-state">
      <p>📭 No hay materiales registrados</p>
    </div>

  </div>
</template>

<script>
export default {

  props: {

    materiales: {
      type: Array,
      default: () => []
    },

    cargando: {
      type: Boolean,
      default: false
    }
  },

  emits: [
    'actualizar',
    'editar',
    'eliminar'
  ]
}
</script>

<style scoped>
.inventory-card {
  background: var(--bg);
  border-radius: 12px;
  border: 1px solid var(--border-light);
  overflow: hidden;
  box-shadow: var(--shadow);
}

.inventory-header {
  background: linear-gradient(
    135deg,
    var(--primary) 0%,
    var(--primary-dark) 100%
  );

  color: white;

  padding: 16px 20px;

  display: flex;
  justify-content: space-between;
  align-items: center;
}

.inventory-header h2 {
  margin: 0;
  font-size: 16px;
}

.btn-refresh {
  background: rgba(255,255,255,0.2);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 14px;
  cursor: pointer;
  font-weight: 600;
}

.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-state,
.empty-state {
  padding: 32px;
  text-align: center;
  color: var(--text-light);
}

.content-table {
  padding: 20px;
  overflow-x: auto;
}

.inventory-info {
  margin-bottom: 16px;
}

.inventory-table {
  width: 100%;
  border-collapse: collapse;
}

.inventory-table thead {
  background: var(--primary);
  color: white;
}

.inventory-table th {
  text-align: left;
  padding: 14px;
  font-size: 13px;
}

.inventory-table td {
  padding: 14px;
  border-bottom: 1px solid var(--border);
}

.inventory-table tbody tr:hover {
  background: var(--bg-secondary);
}

.variety {
  font-weight: 600;
  color: var(--text-h);
}

.quantity {
  font-weight: 600;
  color: var(--primary);
}

.actions-column {
  display: flex;
  gap: 8px;
}

.btn-action {
  border: none;
  border-radius: 6px;
  padding: 8px 10px;
  cursor: pointer;
  transition: 0.3s ease;
}

.btn-edit {
  background: #dbeafe;
}

.btn-delete {
  background: #fee2e2;
}

.btn-action:hover {
  transform: scale(1.05);
}

@media (max-width: 768px) {

  .inventory-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .btn-refresh {
    width: 100%;
  }

  .inventory-table {
    font-size: 12px;
  }

  .inventory-table th,
  .inventory-table td {
    padding: 10px 8px;
  }
}
</style>