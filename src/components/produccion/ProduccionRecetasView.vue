<template>
    <div class="recetas-view">
        <h2>Recetas de Producción</h2>
        <p>Lista de recetas utilizadas en la producción diaria.</p>

        <div class="mb-4">
            <input class="filter-input" v-model="query" placeholder="Buscar por nombre o categoría" />
        </div>

        <Alertas :mensaje="mensaje" />

        <div>
            <div v-if="!filteredRecetas.length" class="empty-state-card text-light">
                {{ recetas.length ? 'No se encontraron recetas.' : 'No hay recetas registradas.' }}
            </div>

            <div v-else class="scroll-recetas-alto custom-scrollbar">
                <ul class="receta-list">
                    <li v-for="receta in filteredRecetas" :key="receta.id" class="data-card p-5">
                        <div class="receta-head">
                            <h3 class="receta-nombre">{{ receta.nombre }}</h3>
                            <span class="receta-categoria">{{ receta.categoria }}</span>
                        </div>

                        <p class="receta-instrucciones" v-if="receta.instrucciones">{{ receta.instrucciones }}</p>

                        <!-- Detalle de materiales: nombre y cantidad -->
                        <div v-if="(receta.materiales || []).length" class="ingrediente-list">
                            <h4>Materiales</h4>
                            <ul>
                                <li v-for="m in receta.materiales" :key="m.id || m.nombre">
                                    <strong>{{ m.nombre || m.descripcion || '—' }}</strong>
                                    - {{ (m.cantidad !== undefined && m.cantidad !== null) ? m.cantidad : 1 }}
                                    unidad(es)
                                </li>
                            </ul>
                        </div>
                        <!-- Detalle de materia prima: nombre y cantidad -->
                        <div v-if="(receta.materiaPrima || []).length" class="ingrediente-list">
                            <h4>Materia prima</h4>
                            <ul>
                                <li v-for="mp in receta.materiaPrima" :key="mp.id || mp.nombre">
                                    <strong>{{ mp.nombre || mp.variedad || '—' }}</strong>
                                    - {{ (mp.cantidad !== undefined && mp.cantidad !== null) ? mp.cantidad : 1 }}
                                    unidad(es)
                                </li>
                            </ul>
                        </div>

                        <button class="btn btn-primary btn-block mt-3"
                            :disabled="modo === 'contador' && isCompletada(receta.id)" type="button"
                            @click="emitirAccion(receta)">
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
    </div>
</template>

<script>
import { useCatalogos } from '../../composables/useCatalogos.js'
import { useMensajes } from '../../composables/useMensajes.js'
import Alertas from '../shared/Alertas.vue'

export default {
    name: 'ProduccionRecetasView',
    components: { Alertas },
    setup() {
        const catalogos = useCatalogos()
        const { mensaje, mostrarMensaje } = useMensajes()
        return { catalogos, mensaje, mostrarMensaje }
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
            this.mostrarMensaje('info', 'Cargando recetas...', 0)
            try {
                const data = await this.catalogos.obtenerRecetas()
                this.recetas = data?.success !== undefined ? (data.data || []) : (data || [])
                this.$emit('recetas-cargadas', this.recetas)
            } catch (err) {
                console.error('Error fetching recetas:', err)
                this.error = 'Error al cargar recetas'
                this.mostrarMensaje('error', 'Error al cargar recetas', 0)
            } finally {
                this.cargando = false
                if (!this.error) this.mostrarMensaje(null, '', 0)
            }
        }
    }
}

</script>

<style scoped>
.scroll-recetas-alto {
    height: 100%;
    max-height: calc(100vh - 309px);
    overflow-y: auto;
    padding-right: 8px;
}

.filter-input {
    width: 100%;
}

.recetas-view {
    background: var(--bg);
    border: 1px solid var(--border-light);
    border-radius: 18px;
    padding: 24px;
    box-shadow: var(--shadow);
}

.receta-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 12px;
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
    background: var(--bg-secondary);
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

.ingrediente-list h4 {
    margin: 10px 0 6px;
    font-size: 14px;
}

.ingrediente-list ul {
    margin: 0;
    padding-left: 18px;
}

.ingrediente-list li {
    margin-bottom: 6px;
    color: var(--text);
}
</style>