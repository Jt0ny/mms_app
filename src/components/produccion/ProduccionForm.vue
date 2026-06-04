<template>
    <div class="produccion-form-card">
        <header class="header">
            <div>
                <p class="eyebrow">Registro diario</p>
                <h2>Producción por categoría</h2>
                <p class="subtitle">
                    Carga la cantidad hecha hoy para cada categoría que aparece en los pedidos.
                </p>
            </div>

            <label class="date-field" for="fecha-produccion">
                <span>Fecha</span>
                <input id="fecha-produccion" v-model="form.fecha" type="date" />
            </label>
        </header>

        <Alertas :mensaje="mensaje" />

        <Alertas v-if="cargandoCategorias" :mensaje="{ tipo: 'info', texto: 'Cargando categorías desde pedidos...' }" />

        <Alertas v-else-if="!categorias.length"
            :mensaje="{ tipo: 'info', texto: 'No hay categorías registradas en pedidos.' }" />

        <form v-else class="produccion-form" @submit.prevent="enviarFormulario">
            <div class="stats-grid">
                <article class="stat-card">
                    <span>Categorías</span>
                    <strong>{{ categorias.length }}</strong>
                </article>

                <article class="stat-card">
                    <span>Producción total</span>
                    <strong>{{ totalDelDia }}</strong>
                </article>

                <article class="stat-card">
                    <span>Categorías con cantidad registrada</span>
                    <strong>{{ categoriasConCantidad }}</strong>
                </article>
            </div>

            <div class="category-list">
                <article v-for="categoria in categorias" :key="categoria" class="category-row">
                    <div class="category-info">
                        <span class="category-name">{{ categoria }}</span>
                        <span class="category-hint">Cantidad producida hoy</span>
                    </div>

                    <input :value="obtenerCantidad(categoria)" type="number" min="0" step="1" inputmode="numeric"
                        class="category-input" @input="actualizarCantidad(categoria, $event.target.value)" />
                </article>
            </div>

            <footer class="form-footer">
                <p class="total-text">
                    Total registrado: <strong>{{ totalDelDia }}</strong>
                </p>

                <div style="display:flex; gap:8px;">
                    <button v-if="edicion" type="button" class="submit-btn" @click="handleCancelar"
                        :disabled="guardando">
                        Cancelar
                    </button>

                    <button type="submit" class="submit-btn" :disabled="guardando || cargandoCategorias">
                        {{ guardando ? (edicion ? 'Guardando...' : 'Guardando...') : (edicion ? 'Actualizar producción'
                            : 'Registrar producción') }}
                    </button>
                </div>
            </footer>
        </form>
    </div>
</template>

<script>
import PedidoClient from '../../client/PedidoClient'
import Alertas from '../Alertas.vue'

export default {
    name: 'ProduccionForm',
    components: { Alertas },

    props: {
        guardando: {
            type: Boolean,
            default: false
        },
        ultimaGuardada: {
            type: [String, Number],
            default: null
        },
        edicion: {
            type: Object,
            default: null
        }
    },

    emits: ['guardar', 'notificar', 'cancelar'],

    data() {
        return {
            cargandoCategorias: false,
            categorias: [],
            cantidadesPorCategoria: {},
            mensaje: { tipo: null, texto: '' },
            form: {
                fecha: this.obtenerFechaHoy()
            }
        }
    },

    computed: {
        totalDelDia() {
            return this.categorias.reduce((total, categoria) => {
                return total + this.obtenerCantidadNumerica(categoria)
            }, 0)
        },
        categoriasConCantidad() {
            return this.categorias.filter(categoria => this.obtenerCantidadNumerica(categoria) > 0).length
        }
    },

    watch: {
        ultimaGuardada(newVal, oldVal) {
            if (!newVal || newVal === oldVal) return
            const cantidades = {}
            this.categorias.forEach(categoria => {
                cantidades[categoria] = 0
            })
            this.cantidadesPorCategoria = cantidades
        },

        edicion() {
            this.applyEdicion()
        },
        categorias() {
            this.applyEdicion()
        }
    },

    mounted() {
        this.cargarCategorias()
    },

    methods: {
        obtenerFechaHoy() {
            const fecha = new Date()
            const fechaLocal = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000)
            return fechaLocal.toISOString().slice(0, 10)
        },

        notificar(tipo, texto, duracion = 4000) {
            // Mostrar alerta local en el formulario
            this.mensaje = { tipo, texto }
            // Emitir al padre para alertas globales
            this.$emit('notificar', { tipo, texto, duracion })
            if (duracion > 0) {
                setTimeout(() => {
                    this.mensaje = { tipo: null, texto: '' }
                }, duracion)
            }
        },

        async cargarCategorias() {
            this.cargandoCategorias = true
            try {
                const pedidos = await PedidoClient.obtenerPedidos()
                const categorias = (pedidos ?? [])
                    .map(pedido => String(pedido?.categoria ?? '').trim())
                    .filter(Boolean)
                this.categorias = [...new Set(categorias)].sort((a, b) => a.localeCompare(b, 'es'))
                const cantidades = {}
                this.categorias.forEach(categoria => {
                    cantidades[categoria] = 0
                })
                this.cantidadesPorCategoria = cantidades
            } catch (error) {
                console.error(error)
                this.notificar('error', '❌ No se pudieron cargar las categorías de pedidos', 0)
            } finally {
                this.cargandoCategorias = false
            }
        },

        applyEdicion() {
            const e = this.edicion
            if (!e) return
            // set fecha
            if (e.fecha) {
                this.form.fecha = e.fecha
            } else if (e.creado_en) {
                this.form.fecha = e.creado_en.slice(0, 10)
            }
            const cantidades = {}
            this.categorias.forEach(categoria => {
                const item = (e.detalle || []).find(d => String(d.categoria) === String(categoria))
                cantidades[categoria] = item ? (Number.isFinite(Number(item.cantidad)) ? Math.trunc(Number(item.cantidad)) : 0) : 0
            })
            this.cantidadesPorCategoria = cantidades
        },

        obtenerCantidad(categoria) {
            return this.cantidadesPorCategoria[categoria] ?? 0
        },

        obtenerCantidadNumerica(categoria) {
            const valor = Number(this.obtenerCantidad(categoria))
            return Number.isFinite(valor) && valor > 0 ? Math.trunc(valor) : 0
        },

        actualizarCantidad(categoria, valor) {
            const cantidad = Math.max(0, Math.trunc(Number(valor) || 0))
            this.cantidadesPorCategoria = {
                ...this.cantidadesPorCategoria,
                [categoria]: cantidad
            }
        },

        construirDetalle() {
            return this.categorias
                .map(categoria => ({
                    categoria,
                    cantidad: this.obtenerCantidadNumerica(categoria)
                }))
                .filter(item => item.cantidad > 0)
        },

        enviarFormulario() {
            const detalle = this.construirDetalle()
            if (!detalle.length) {
                this.notificar('error', 'Completa al menos una categoría con cantidad mayor a cero', 0)
                return
            }
            const payload = {
                fecha: this.form.fecha,
                total: this.totalDelDia,
                detalle,
                creado_en: new Date().toISOString()
            }
            if (this.edicion && this.edicion.id) {
                payload.id = this.edicion.id
            }
            this.$emit('guardar', payload)
        },

        handleCancelar() {
            const cantidades = {}
            this.categorias.forEach(categoria => {
                cantidades[categoria] = 0
            })
            this.cantidadesPorCategoria = cantidades
            this.form.fecha = this.obtenerFechaHoy()
            this.$emit('cancelar')
        }
    }
}
</script>

<style scoped>
.produccion-form-card {
    background: var(--bg);
    border: 1px solid var(--border-light);
    border-radius: 18px;
    padding: 24px;
    box-shadow: var(--shadow);
}

.header {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    align-items: flex-start;
    margin-bottom: 20px;
}

.eyebrow {
    margin: 0 0 6px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    font-size: 12px;
    font-weight: 700;
    color: var(--primary);
}

.header h2 {
    margin: 0;
    color: var(--text-h);
    font-size: clamp(22px, 2.5vw, 30px);
}

.subtitle {
    margin: 10px 0 0;
    color: var(--text-light);
    max-width: 640px;
    line-height: 1.5;
}

.date-field {
    min-width: 180px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    color: var(--text-h);
    font-weight: 600;
}

.date-field input,
.category-input {
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 11px 12px;
    font: inherit;
    background: white;
    color: var(--text);
}

.date-field input:focus,
.category-input:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.12);
}

.empty-state {
    padding: 22px;
    border-radius: 14px;
    background: #f8faf8;
    border: 1px dashed var(--border);
    color: var(--text-light);
}

.produccion-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
    /* Make the form scrollable when content is large */
    max-height: 75vh;
    overflow-y: auto;
    padding-right: 8px;
    /* prevent content hiding under scrollbar */
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
}

.stat-card {
    padding: 16px;
    border-radius: 14px;
    border: 1px solid var(--border-light);
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(243, 250, 244, 0.92));
}

.stat-card span {
    display: block;
    font-size: 13px;
    color: var(--text-light);
    margin-bottom: 8px;
}

.stat-card strong {
    font-size: clamp(20px, 2vw, 28px);
    color: var(--text-h);
}

.category-list {
    display: grid;
    gap: 12px;
}

.category-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 160px;
    gap: 14px;
    align-items: center;
    padding: 14px 16px;
    border: 1px solid var(--border-light);
    border-radius: 14px;
    background: white;
}

.category-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.category-name {
    font-weight: 700;
    color: var(--text-h);
}

.category-hint {
    color: var(--text-light);
    font-size: 13px;
}

.category-input {
    text-align: center;
    font-weight: 700;
}

.form-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    padding-top: 4px;
}

.total-text {
    margin: 0;
    color: var(--text-h);
}

.submit-btn {
    border: none;
    border-radius: 12px;
    padding: 12px 18px;
    font-weight: 700;
    color: white;
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.submit-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: var(--shadow-sm);
}

.submit-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

@media (max-width: 900px) {

    .header,
    .form-footer {
        flex-direction: column;
    }

    .date-field {
        width: 100%;
    }

    .stats-grid {
        grid-template-columns: 1fr;
    }

    .category-row {
        grid-template-columns: 1fr;
    }

    .category-input {
        width: 100%;
    }
}

/* Scrollbar styling for the form (WebKit) */
.produccion-form::-webkit-scrollbar {
    width: 8px;
}

.produccion-form::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.12);
    border-radius: 8px;
}

.produccion-form::-webkit-scrollbar-track {
    background: transparent;
}

@media (max-width: 600px) {
    .produccion-form {
        max-height: 50vh;
    }
}
</style>