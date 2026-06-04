<template>
    <div class="usuario-table-container">
        <div class="usuario-table-header">

            <h2>Usuarios actuales</h2>
            <p>Usuarios registrados en el sistema</p>
            <button type="button" class="btn-refresh" :disabled="cargando" @click="$emit('actualizar')">
                {{ cargando ? '⟳ Cargando...' : '↻ Actualizar' }}
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
                            <button type="button" class="btn-action btn-delete" @click="$emit('eliminar', usuario.id)">
                                🗑️ Eliminar
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
export default {
    name: 'UsuarioTablaActual',
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
    background: #ffffff;
    border-radius: 20px;
    box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
    overflow: hidden;
}

.usuario-table-header {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid #e2e8f0;
}

.usuario-table-header h2 {
    margin: 0;
    font-size: 22px;
}

.usuario-table-header p {
    margin: 6px 0 0;
    color: #64748b;
}

.btn-refresh {
    border: none;
    border-radius: 12px;
    padding: 12px 16px;
    background: #0f766e;
    color: white;
    font-weight: 700;
    cursor: pointer;
    transition: opacity 0.2s ease, transform 0.2s ease;
}

.btn-refresh:hover:not(:disabled) {
    opacity: 0.92;
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
    color: #64748b;
}

.content-table {
    padding: 20px 24px 24px;
    overflow-x: auto;
}

.table-info {
    margin-bottom: 14px;
    color: #1e293b;
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
    background: #f8fafc;
}

.usuario-table th {
    text-align: left;
    padding: 14px 16px;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #475569;
}

.usuario-table td {
    padding: 14px 16px;
    border-bottom: 1px solid #e2e8f0;
    color: #1e293b;
}

.usuario-table tbody tr:hover {
    background: #f8fafc;
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
    background: #dcfce7;
    color: #166534;
}

.role-operador {
    background: #dbeafe;
    color: #1d4ed8;
}

.actions-column {
    width: 1%;
    white-space: nowrap;
}

.btn-action {
    border: none;
    border-radius: 10px;
    padding: 10px 14px;
    font-weight: 700;
    cursor: pointer;
    transition: transform 0.15s ease, opacity 0.15s ease;
}

.btn-action:hover {
    transform: translateY(-1px);
}

.btn-delete {
    background: #fee2e2;
    color: #991b1b;
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