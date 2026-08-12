<template>
  <InventoryTable title="Recetas Existentes" :items="recetas" :loading="cargando"
      item-label="recetas creadas" empty-text="No hay recetas registradas"
      @actualizar="$emit('actualizar')" :show-sync="false">
      <template #title-icon><BookOpenIcon class="icon-lg text-primary" /></template>
      <template #header>
          <th>Nombre de Receta</th>
          <th>Categoría</th>
          <th>Items Totales</th>
          <th>Acciones</th>
      </template>
      <template #row="{ item }">
          <td class="font-medium">{{ item.nombre }}</td>
          <td>
              <span class="badge" :class="getBadgeClass(item.categoria)">
                  {{ item.categoria || 'Sin categoría' }}
              </span>
          </td>
          <td>{{ item.total_items || item.totalItems || 0 }} ítems</td>
          <td class="action-cell">
              <button @click="$emit('editar', item)" class="btn-icon" title="Editar receta">
                  <PencilIcon class="icon-sm text-primary" />
              </button>
              <button @click="$emit('eliminar', item)" class="btn-icon btn-icon-danger" title="Eliminar receta">
                  <TrashIcon class="icon-sm text-error" />
              </button>
          </td>
      </template>
  </InventoryTable>
</template>

<script>
import { BookOpenIcon, PencilIcon, TrashIcon } from '@heroicons/vue/24/outline'
import InventoryTable from '../shared/InventoryTable.vue'

export default {
  name: 'RecetaList',
  components: {
      InventoryTable,
      BookOpenIcon,
      PencilIcon,
      TrashIcon
  },
  props: {
      recetas: {
          type: Array,
          default: () => []
      },
      cargando: {
          type: Boolean,
          default: false
      }
  },
  emits: ['actualizar', 'editar', 'eliminar'],
  methods: {
      getBadgeClass(categoria) {
          const cat = String(categoria || '').toLowerCase().trim();
          if (cat === 'flor') return 'badge-flor';
          if (cat === 'follaje') return 'badge-follaje';
          if (cat === 'empaque') return 'badge-empaque';
          return 'badge-gray';
      }
  }
}
</script>

<style scoped>
.badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: capitalize;
}

.badge-flor { background: rgba(236, 72, 153, 0.15); color: #ec4899; }
.badge-follaje { background: rgba(16, 185, 129, 0.15); color: #10b981; }
.badge-empaque { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
.badge-gray { background: #f3f4f6; color: #4b5563; }

.action-cell {
  display: flex;
  gap: 8px;
}

.btn-icon {
  background: transparent;
  border: none;
  padding: 6px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon:hover {
  background: rgba(0, 0, 0, 0.05);
  transform: translateY(-1px);
}

.btn-icon-danger:hover {
  background: rgba(239, 68, 68, 0.1);
}

.font-medium {
    font-weight: 500;
    color: var(--text-dark, #1f2937);
}
</style>
