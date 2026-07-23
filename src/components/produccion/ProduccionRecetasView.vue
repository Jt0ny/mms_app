<template>
    <div class="recetas-view">
        <h2>Recetas de Producción</h2>
        <p>Lista de recetas utilizadas en la producción diaria.</p>

        <div class="controls">
            <input v-model="query" placeholder="Buscar por nombre o categoría" />
        </div>

        <Alertas :mensaje="mensaje" />

        <div>
            <div v-if="!filteredRecetas.length" class="empty">
                {{ recetas.length ? 'No se encontraron recetas.' : 'No hay recetas registradas.' }}
            </div>

            <ul v-else class="receta-list">
                <li v-for="receta in filteredRecetas" :key="receta.id" class="receta-card">
                    <div class="receta-head">
                        <h3 class="receta-nombre">{{ receta.nombre }}</h3>
                        <span class="receta-categoria">{{ receta.categoria }}</span>
                    </div>

                    <p class="receta-instrucciones" v-if="receta.instrucciones">{{ receta.instrucciones }}</p>

                    <!-- Detalle de materiales: nombre y cantidad -->
                    <div v-if="(receta.materiales || []).length" class="materiales-list">
                        <h4>Materiales</h4>
                        <ul>
                            <li v-for="m in receta.materiales" :key="m.id || m.nombre">
                                <strong>{{ m.nombre || m.descripcion || '—' }}</strong>
                                - {{ (m.cantidad !== undefined && m.cantidad !== null) ? m.cantidad : 1 }} unidad(es)
                            </li>
                        </ul>
                    </div>
                    <!-- Detalle de materia prima: nombre y cantidad -->
                    <div v-if="(receta.materiaPrima || []).length" class="materia-list">
                        <h4>Materia prima</h4>
                        <ul>
                            <li v-for="mp in receta.materiaPrima" :key="mp.id || mp.nombre">
                                <strong>{{ mp.nombre || mp.variedad || '—' }}</strong>
                                - {{ (mp.cantidad !== undefined && mp.cantidad !== null) ? mp.cantidad : 1 }} unidad(es)
                            </li>
                        </ul>
                    </div>

                    <button class="receta-accion"
                        :class="{ 
                            'receta-accion--seleccionada': modo === 'seleccionar' && isSelected(receta),
                            'receta-accion--completada': modo === 'contador' && isCompletada(receta.id)
                        }"
                        type="button" @click="emitirAccion(receta)">
                        <template v-if="modo === 'contador'">
                            {{ obtenerContadorTexto(receta.id) }}
                        </template>
                        <template v-else>
                            {{ isSelected(receta) ? '\u2713 Seleccionada' : textoSeleccionar }}
                        </template>
                    </button>
                </li>
            </ul>
        </div>
    </div>
</template>

<script>
import { useCatalogos } from '../../composables/useCatalogos.js'
import Alertas from '../Alertas.vue'

export default {
    name: 'ProduccionRecetasView',
    components: { Alertas },
    setup() {
        const catalogos = useCatalogos()
        return { catalogos }
    },
    props: {
        modo: {
            type: String,
            default: 'seleccionar',
            validator: value => ['seleccionar', 'contador'].includes(value)
        },
        textoSeleccionar: {
            type: String,
            default: 'Seleccionar'
        },
        contadorActual: {
            type: [Number, String],
            default: 0
        },
        contadorTotal: {
            type: [Number, String],
            default: 0
        },
        recetasSeleccionadasIds: {
            type: Array,
            default: () => []
        },
        contadorPorReceta: {
            type: Object,
            default: () => ({})
        },
        recetasFiltradas: {
            type: Array,
            default: null
        }
    },
    emits: ['accion-receta', 'recetas-cargadas'],


    data() {
        return {
            recetas: [],
            cargando: false,
            error: null,
            mensaje: { tipo: null, texto: '' },
            query: ''
        }
    },

    computed: {

        filteredRecetas() {
            // Si se pasa recetasFiltradas, solo mostrar esas recetas
            let base = this.recetas
            if (Array.isArray(this.recetasFiltradas)) {
                base = this.recetas.filter(r => this.recetasFiltradas.includes(r.id))
            }
            const q = String(this.query || '').trim().toLowerCase()
            if (!q) return base
            return base.filter(r => {
                const nombre = String(r?.nombre || '').toLowerCase()
                const categoria = String(r?.categoria || '').toLowerCase()
                return nombre.includes(q) || categoria.includes(q)
            })
        }
    },

    mounted() {
        this.buscarRecetas()
    },

    methods: {
        isSelected(receta) {
            return this.recetasSeleccionadasIds.includes(receta?.id)
        },

        emitirAccion(receta) {
            this.$emit('accion-receta', {
                receta,
                modo: this.modo,
                contadorActual: this.contadorActual,
                contadorTotal: this.contadorTotal
            })
        },

        obtenerContadorTexto(recetaId) {
            const estado = this.contadorPorReceta?.[recetaId]
            if (!estado) return this.contadorTotal
            return `${estado.actual} / ${estado.total}`
        },

        isCompletada(recetaId) {
            const estado = this.contadorPorReceta?.[recetaId]
            if (!estado) return false
            return estado.actual >= estado.total && estado.total > 0
        },

        async buscarRecetas() {
            this.cargando = true
            this.error = null
            this.mensaje = { tipo: 'info', texto: 'Cargando recetas...' }
            try {
                const data = await this.catalogos.obtenerRecetas()
                this.recetas = data ?? []
                this.$emit('recetas-cargadas', this.recetas)
            } catch (err) {
                console.error('Error fetching recetas:', err)
                this.error = 'Error al cargar recetas'
                this.mensaje = { tipo: 'error', texto: 'Error al cargar recetas' }
            } finally {
                this.cargando = false
                if (!this.error) this.mensaje = { tipo: null, texto: '' }
            }
        }
    }
}

</script>

<style scoped>
.recetas-view {
    padding: 12px;
}

.controls {
    margin: 12px 0;
}

.controls input {
    width: 100%;
    padding: 8px 10px;
    border-radius: 6px;
    border: 1px solid var(--border-light);
}

.info {
    color: var(--text-light);
}

.error {
    color: var(--danger);
}

.empty {
    color: var(--text-light);
}

.receta-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 12px;
}

.receta-card {
    background: white;
    padding: 12px;
    border-radius: 8px;
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--border-light);
    transition: transform 0.1s ease;
}

.receta-card:active {
    transform: scale(0.99);
}

.receta-accion {
    margin-top: 12px;
    padding: 8px 12px;
    border: 0;
    border-radius: 6px;
    background: var(--primary, #2f6fed);
    color: white;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
}

.receta-accion--seleccionada {
    background: #16a34a;
    color: white;
}

.receta-accion--completada {
    background: #16a34a;
    color: white;
    pointer-events: none;
    opacity: 0.85;
}

.receta-accion:hover {
    filter: brightness(0.95);
}

.receta-accion:focus-visible {
    outline: 2px solid rgba(47, 111, 237, 0.35);
    outline-offset: 2px;
}

/* Scrollbar — ya no hay scroll interno, por si se reactiva en futuro */
.receta-list::-webkit-scrollbar {
    width: 8px;
}

.receta-list::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.12);
    border-radius: 8px;
}

.receta-list::-webkit-scrollbar-track {
    background: transparent;
}

.receta-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px
}

.receta-nombre {
    margin: 0
}

.receta-categoria {
    background: #f1f1f1;
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 12px
}

.receta-meta {
    display: flex;
    gap: 18px;
    margin-top: 8px;
    color: var(--text);
}

.receta-instrucciones {
    margin-top: 8px;
    color: var(--text-light);
    white-space: pre-wrap;
    word-break: break-word;
}

.materia-list h4 {
    margin: 10px 0 6px;
    font-size: 14px;
}

.materia-list ul {
    margin: 0;
    padding-left: 18px;
}

.materia-list li {
    margin-bottom: 6px;
    color: var(--text);
}

.materiales-list h4 {
    margin: 10px 0 6px;
    font-size: 14px;
}

.materiales-list ul {
    margin: 0;
    padding-left: 18px;
}

.materiales-list li {
    margin-bottom: 6px;
    color: var(--text);
}
</style>