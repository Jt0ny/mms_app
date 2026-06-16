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

                    <button class="receta-accion" type="button" @click="emitirAccion(receta)">
                        {{ textoBotonPorReceta(receta) }}
                    </button>
                </li>
            </ul>
        </div>
    </div>
</template>

<script>
import RecetaClient from '../../client/RecetaClient'
import Alertas from '../Alertas.vue'

export default {
    name: 'ProduccionRecetasView',
    components: { Alertas },
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
        contadorPorReceta: {
            type: Object,
            default: () => ({})
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
        textoBotonPorReceta() {
            return receta => {
                if (this.modo !== 'contador') {
                    return this.textoSeleccionar
                }

                const estado = this.contadorPorReceta?.[receta?.id] || {}
                const actual = estado.actual ?? this.contadorActual
                const total = estado.total ?? this.contadorTotal
                return `${actual}/${total}`
            }
        },

        filteredRecetas() {
            const q = String(this.query || '').trim().toLowerCase()
            if (!q) return this.recetas
            return this.recetas.filter(r => {
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
        emitirAccion(receta) {
            this.$emit('accion-receta', {
                receta,
                modo: this.modo,
                contadorActual: this.contadorActual,
                contadorTotal: this.contadorTotal
            })
        },

        async buscarRecetas() {
            this.cargando = true
            this.error = null
            this.mensaje = { tipo: 'info', texto: 'Cargando recetas...' }
            try {
                const data = await RecetaClient.obtenerRecetas()
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
    /* Scrollable area: limit height and enable vertical scroll */
    max-height: 75vh;
    overflow-y: auto;
    padding-right: 8px; /* avoid content hidden behind scrollbar */}

.receta-card {
    background: white;
    padding: 12px;
    border-radius: 8px;
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--border-light);
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
}

.receta-accion:hover {
    filter: brightness(0.95);
}

.receta-accion:focus-visible {
    outline: 2px solid rgba(47, 111, 237, 0.35);
    outline-offset: 2px;
}

/* Scrollbar styling (WebKit) */
.receta-list::-webkit-scrollbar { width: 8px; }
.receta-list::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 8px; }
.receta-list::-webkit-scrollbar-track { background: transparent; }

@media (max-width: 600px) {
    .receta-list { max-height: 40vh; }
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