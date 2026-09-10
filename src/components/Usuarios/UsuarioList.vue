<template>
    <div class="data-card">
        <div class="data-card-header">
            <div class="flex-align-center gap-14">
                <span class="form-icon flex-align-center">
                    <UsersIcon class="icon-lg text-white" />
                </span>
                <div>
                    <h2>Usuarios actuales</h2>
                    <p class="data-card-subtitle">Usuarios registrados en el sistema</p>
                </div>
            </div>
            <button type="button" class="btn-header-outline" :disabled="cargando" @click="$emit('actualizar')">
                <ArrowPathIcon class="icon-sm" :class="{ 'spin': cargando }" />
                {{ cargando ? 'Cargando...' : 'Actualizar' }}
            </button>
        </div>

        <div v-if="cargando" class="table-loading-state">
            <p>Cargando usuarios...</p>
        </div>

        <div v-else-if="usuarios.length > 0" class="data-card-content">
            <div class="table-info">
                <p><strong>{{ usuarios.length }}</strong> usuarios registrados</p>
            </div>

            <table class="data-card-table">
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Rol</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="usuario in usuarios" :key="usuario.id">
                        <td class="user-name">{{ usuario.nombre }}</td>
                        <td>
                            <span class="role-badge" :class="`role-${usuario.rol}`">
                                {{ formatearRol(usuario.rol) }}
                            </span>
                        </td>
                        <td class="actions-col">
                            <button type="button" class="btn-action-ghost delete"
                                @click="$emit('eliminar', usuario.id)">
                                <TrashIcon class="icon-action text-error" />
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div v-else class="table-empty-state">
            <p>No hay usuarios registrados</p>
        </div>
    </div>
</template>
<script>
import { TrashIcon, ArrowPathIcon, UsersIcon } from '@heroicons/vue/24/outline'

export default {
    name: 'UsuarioList',
    components: { TrashIcon, ArrowPathIcon, UsersIcon },
    props: {
        usuarios: {
            type: Array,
            default: () => []
        },
        cargando: {
            type: Boolean,
            default: false
        }
    },
    emits: ['actualizar', 'eliminar'],
    methods: {
        formatearRol(rol) {
            if (!rol) return '-'
            return String(rol).charAt(0).toUpperCase() + String(rol).slice(1)
        }
    }
}
</script>

<style scoped>

.table-info {
    margin-bottom: 14px;
    color: var(--text-h);
    font-weight: 600;
}

.table-info p {
    margin: 0;
}

.user-name {
    font-weight: 700;
}

.role-badge {
    display: inline-flex;
    align-items: center;
    padding: 6px 12px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 700;
    text-transform: capitalize;
}

.role-supervisor {
    background: var(--alert-success-bg);
    color: var(--alert-success-text);
}

.role-operador {
    background: var(--alert-info-bg);
    color: var(--alert-info-text);
}

/* Forzar altura al 100% de la columna (para igualar al formulario exacto) */
.data-card {
  height: 0; /* Evita que los registros internos estiren la fila del grid infinitamente */
  min-height: 100%; /* Obliga a la tarjeta a medir exactamente lo mismo que el formulario */
  display: flex;
  flex-direction: column;
}

/* Anular la restricción global de 450px y permitir scroll interno */
.data-card-content {
  flex: 1;
  min-height: 0;
  max-height: none !important;
  overflow-y: auto;
}
</style>
