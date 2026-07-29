<template>
    <div class="produccion-resumen-diaria">
        <div v-if="!production || !production.detalle || !production.detalle.length" class="empty-state">
            No hay producción registrada para {{ mostrarFecha }}.
        </div>

        <div v-else class="content-table">
            <div class="inventory-info">
                <div class="info-left">
                    <p class="date">Producción del día: <strong>{{ mostrarFecha }}</strong></p>
                    <span v-if="production" class="badge">Total: {{ production.total ?? 0 }}</span>
                </div>

                <div class="info-right">
                    <button v-if="production" class="btn-action btn-edit" @click="$emit('editar', production)">
                        Editar</button>
                </div>
            </div>

            <table class="inventory-table">
                <thead>
                    <tr>
                        <th>Categoría</th>
                        <th>Cantidad</th>
                    </tr>
                </thead>

                <tbody>
                    <tr v-for="item in productionDetalle" :key="item.categoria">
                        <td data-label="Categoría">{{ item.categoria }}</td>
                        <td data-label="Cantidad">{{ item.cantidad ?? 0 }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script>
export default {
    name: 'ProduccionResumen',
    emits: ['editar'],
    props: {
        producciones: {
            type: Array,
            default: () => []
        },
        fecha: {
            type: String,
            default: () => {
                const d = new Date()
                const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
                return local.toISOString().slice(0, 10)
            }
        }
    },
    computed: {
        mostrarFecha() {
            try {
                const s = String(this.fecha)

                // si viene en formato YYYY-MM-DD, crear fecha en zona local
                if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
                    const [y, m, d] = s.split('-').map(Number)
                    const fLocal = new Date(y, m - 1, d)
                    return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).format(fLocal)
                }

                const f = new Date(this.fecha)
                if (Number.isNaN(f.getTime())) return this.fecha
                return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).format(f)
            } catch (e) {
                return this.fecha
            }
        },

        production() {
            if (!this.producciones || !this.producciones.length) return null

            const target = String(this.fecha).slice(0, 10)

            // normalizar una fecha/fecha-hora a YYYY-MM-DD en zona local
            const dateOnly = (val) => {
                if (!val) return null
                const s = String(val)
                // si ya parece YYYY-MM-DD
                const maybeDate = s.slice(0, 10)
                if (/^\d{4}-\d{2}-\d{2}$/.test(maybeDate)) return maybeDate
                const d = new Date(s)
                if (Number.isNaN(d.getTime())) return null
                const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
                return local.toISOString().slice(0, 10)
            }

            // filtrar producciones que correspondan exactamente al día objetivo
            const sameDay = this.producciones.filter(p => {
                const pdate = dateOnly(p.fecha) || dateOnly(p.creadoEn)
                return pdate === target
            })

            if (!sameDay.length) return null

            // si hay varias del mismo día, devolver la más reciente por creadoEn
            if (sameDay.length === 1) return sameDay[0]

            return sameDay.slice().sort((a, b) => {
                const da = a.creadoEn ? new Date(a.creadoEn).getTime() : 0
                const db = b.creadoEn ? new Date(b.creadoEn).getTime() : 0
                return db - da
            })[0] || null
        }
        ,
        productionDetalle() {
            const p = this.production
            if (!p) return []
            return Array.isArray(p.detalle) ? p.detalle : []
        }
    }
}
</script>

<style scoped>
.inventory-info {
    margin-bottom: 12px
}

.inventory-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding: 12px 0;
}

.info-left {
    display: flex;
    align-items: center;
    gap: 12px;
}

.date {
    margin: 0;
    font-weight: 600;
}

.badge {
    background: var(--primary);
    color: white;
    padding: 6px 10px;
    border-radius: 9px;
    font-weight: 700;
    font-size: 13px;
}

.inventory-table {
    width: 100%;
    border-collapse: collapse
}

.content-table {
    background: var(--bg);
    border: 1px solid var(--border-light);
    padding: 14px;
    border-radius: 12px;
    box-shadow: var(--shadow);
}

.inventory-table thead th {
    text-align: left;
    padding: 8px;
    color: var(--text-light);
    font-size: 13px
}

.inventory-table tbody td {
    padding: 8px;
    border-top: 1px solid var(--border-light)
}

.inventory-table tbody tr:nth-child(odd) {
    background: rgba(0, 0, 0, 0.02);
}

.inventory-table tbody tr:hover {
    background: rgba(0, 0, 0, 0.04);
}

.btn-edit {
    margin-left: 12px;
    border: 1px solid var(--primary);
    background: var(--primary);
    color: rgb(0, 0, 0);
    padding: 8px 12px;
    border-radius: 10px;
    cursor: pointer;
    font-weight: 700;
}

.btn-edit:hover {
    filter: brightness(0.95);
}

.btn-edit {
    margin-left: 12px;
    border: 1px solid var(--border);
    background: white;
    padding: 6px 10px;
    border-radius: 8px;
    cursor: pointer;
}

.empty-state {
    padding: 12px;
    border-radius: 10px;
    background: #f8faf8;
    border: 1px dashed var(--border);
    color: var(--text-light)
}

/* Responsive: convertir tabla a filas apiladas en pantallas pequeñas */
@media (max-width: 700px) {
    .inventory-table thead {
        display: none;
    }

    .inventory-table,
    .inventory-table tbody,
    .inventory-table tr,
    .inventory-table td {
        display: block;
        width: 100%;
    }

    .inventory-table tr {
        margin-bottom: 10px;
        border: 1px solid var(--border-light);
        border-radius: 8px;
        overflow: hidden;
    }

    .inventory-table td {
        padding: 10px 12px;
        border-top: none;
        display: flex;
        justify-content: space-between;
    }

    .inventory-table td::before {
        content: attr(data-label);
        color: var(--text-light);
        font-weight: 600;
        margin-right: 8px;
    }
}
</style>