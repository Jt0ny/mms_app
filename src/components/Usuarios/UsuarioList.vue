<template>
    <div class="usuario-table-container">
        <div class="usuario-table-header">

            <h2>Usuarios actuales</h2>
            <p>Usuarios registrados en el sistema</p>
            <button type="button" class="btn-refresh inline-flex-center gap-6" :disabled="cargando" @click="$emit('actualizar')">
                <ArrowPathIcon class="icon-sm" :class="{ 'spin': cargando }" />
                {{ cargando ? 'Cargando...' : 'Actualizar' }}
            </button>
        </div>

        <div v-if="cargando" class="loading-state">
            <p>Cargando usuarios...</p>
        </div>

        <div v-else-if="usuarios.length > 0" class="content-table">
            <div class="table-info">
                <p><strong>{{ usuarios.length }}</strong> usuarios registrados</p>
            </div>

            <table class="usuario-table">
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
                        <td class="actions-column">
                            <button type="button" class="btn-action-ghost delete"
                                @click="$emit('eliminar', usuario.id)">
                                <TrashIcon class="icon-action text-error" />
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div v-else class="empty-state">
            <p>No hay usuarios registrados</p>
        </div>
    </div>
</template>
<script>
import { TrashIcon, ArrowPathIcon } from '@heroicons/vue/24/outline'

export default {
    name: 'UsuarioList',
    components: { TrashIcon, ArrowPathIcon },
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
.usuario-table-container {
    background: var(--bg);
    border-radius: 16px;
    box-shadow: var(--shadow);
    border: 1px solid var(--border-light);
    overflow: hidden;
}

.usuario-table-header {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: center;
    padding: 20px 24px;
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
    color: white;
}

.usuario-table-header h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: white;
}

.usuario-table-header p {
    margin: 4px 0 0;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.8);
}

.btn-refresh {
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 10px;
    padding: 10px 16px;
    background: rgba(255, 255, 255, 0.2);
    color: white;
    font-weight: 700;
    font-size: 13px;
    cursor: pointer;
    transition: background 0.2s ease, transform 0.2s ease;
    white-space: nowrap;
}

.btn-refresh:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-1px);
}

.btn-refresh:disabled {
    cursor: progress;
    opacity: 0.7;
}

.loading-state,
.empty-state {
    padding: 32px 24px;
    text-align: center;
    color: var(--text-light);
}

.content-table {
    padding: 20px 24px 24px;
    overflow-x: auto;
}

.table-info {
    margin-bottom: 14px;
    color: var(--text-h);
    font-weight: 600;
}

.table-info p {
    margin: 0;
}

.usuario-table {
    width: 100%;
    border-collapse: collapse;
}

.usuario-table thead {
    background: var(--primary);
}

.usuario-table th {
    text-align: left;
    padding: 12px 16px;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: white;
    font-weight: 700;
}

.usuario-table td {
    padding: 14px 16px;
    border-bottom: 1px solid var(--border);
    color: var(--text);
}

.usuario-table tbody tr:hover {
    background: var(--bg-secondary);
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

.actions-column {
    width: 1%;
    white-space: nowrap;
}



@media (max-width: 768px) {
    .usuario-table-header {
        flex-direction: column;
        align-items: flex-start;
    }

    .btn-refresh {
        width: 100%;
    }

    .usuario-table {
        font-size: 12px;
    }

    .usuario-table th,
    .usuario-table td {
        padding: 10px 8px;
    }
}
</style>