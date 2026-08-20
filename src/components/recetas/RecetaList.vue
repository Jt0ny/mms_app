<template>
    <InventarioTable titulo="Recetas Existentes" :items="recetas" :cargando="cargando" etiqueta-item="recetas"
        texto-vacio="No hay recetas registradas" @actualizar="$emit('actualizar')" :show-sync="false">
        <template #title-icon>
            <BookOpenIcon class="icon-lg text-primary" />
        </template>
        <template #header>
            <th>Nombre de Receta</th>
            <th>Categoría</th>
            <th>Items Totales</th>
            <th>Acciones</th>
        </template>
        <template #row="{ item }">
            <td class="font-medium">{{ item.nombre }}</td>
            <td>
                <span class="badge badge-gray">
                    {{ item.categoria || 'Sin categoría' }}
                </span>
            </td>
            <td>{{ item.total_items || item.totalItems || 0 }} ítems</td>
            <td class="action-cell" @click.stop>
                <button @click.stop="$emit('editar', item)" class="btn-action-ghost edit" title="Editar receta">
                    <PencilIcon class="icon-action text-info" />
                </button>
                <button @click.stop="$emit('eliminar', item)" class="btn-action-ghost delete" title="Eliminar receta">
                    <TrashIcon class="icon-action text-error" />
                </button>
            </td>
        </template>
    </InventarioTable>
</template>

<script>
import { BookOpenIcon, PencilIcon, TrashIcon } from '@heroicons/vue/24/outline'
import InventarioTable from '../shared/InventarioTable.vue'

export default {
    name: 'RecetaList',
    components: {
        InventarioTable,
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
    emits: ['actualizar', 'editar', 'eliminar']


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

.badge-gray {
    background: var(--bg-secondary);
    color: var(--text-light);
}

.action-cell {
    display: flex;
    gap: 8px;
}


.font-medium {
    font-weight: 500;
    color: var(--text-h);
}
</style>
