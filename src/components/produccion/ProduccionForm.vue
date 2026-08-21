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


        </header>

        <Alertas :mensaje="mensaje" />

        <Alertas v-if="cargandoCategorias" :mensaje="{ tipo: 'info', texto: 'Cargando categorías desde pedidos...' }" />

        <Alertas v-else-if="!categorias.length"
            :mensaje="{ tipo: 'info', texto: 'No hay categorías registradas en pedidos.' }" />

        <form v-else class="produccion-form" @submit.prevent="enviarFormulario">
            <div class="stats-grid">
                <article class="stat-card simple">
                    <span>Categorías</span>
                    <strong>{{ categorias.length }}</strong>
                </article>

                <article class="stat-card simple">
                    <span>Producción total</span>
                    <strong>{{ totalDelDia }}</strong>
                </article>

                <article class="stat-card simple">
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

                    <div class="stepper">
                        <button type="button" class="stepper-btn"
                            @click="actualizarCantidad(categoria, obtenerCantidad(categoria) - 1)"
                            aria-label="Restar">−</button>
                        <input :value="obtenerCantidad(categoria)" type="number" min="0" step="1" inputmode="numeric"
                            class="form-input category-input"
                            @input="actualizarCantidad(categoria, $event.target.value)" />
                        <button type="button" class="stepper-btn"
                            @click="actualizarCantidad(categoria, obtenerCantidad(categoria) + 1)"
                            aria-label="Sumar">+</button>
                    </div>
                </article>
            </div>

            <footer class="form-footer">
                <p class="total-text">
                    Total registrado: <strong>{{ totalDelDia }}</strong>
                </p>
                <div class="form-actions-inline">
                    <button type="submit" class="btn btn-primary" :disabled="guardando || cargandoCategorias">
                        {{ guardando ? (edicion ? 'Guardando...' : 'Guardando...') : (edicion ? 'Actualizar producción'
                            : 'Registrar producción') }}
                    </button>
                </div>
            </footer>
        </form>
    </div>
</template>

<script>
import Alertas from '../shared/Alertas.vue'
import { useProduccionForm } from '../../composables/useProduccionForm'

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
            default: null,
            validator: (value) => {
                return value === null || (typeof value === 'object' && !Array.isArray(value))
            }
        },
        categoriasPermitidas: {
            // Array de strings con las categorías de las recetas asignadas.
            // Si es null/vacío, se muestran todas las categorías de pedidos.
            type: Array,
            default: null
        },
        cantidadesExternas: {
            // Acumulador externo: { [categoria]: totalClicks }.
            // El form lo observa y aplica el delta como incremento.
            type: Object,
            default: () => ({}),
            validator: (value) => {
                return value !== null && typeof value === 'object' && !Array.isArray(value)
            }
        },
        limitesPorCategoria: {
            // Límites de cantidad por categoría: { [categoria]: totalPlanificado }.
            type: Object,
            default: () => ({}),
            validator: (value) => {
                return value !== null && typeof value === 'object' && !Array.isArray(value)
            }
        }
    },

    emits: ['guardar', 'notificar', 'cancelar', 'cantidad-cambiada'],

    setup(props, { emit }) {
        const {
            cargandoCategorias,
            categorias,
            cantidadesPorCategoria,
            mensaje,
            form,
            totalDelDia,
            categoriasConCantidad,
            obtenerCantidad,
            actualizarCantidad,
            enviarFormulario,
            cancelar
        } = useProduccionForm(props, emit)

        return {
            cargandoCategorias,
            categorias,
            cantidadesPorCategoria,
            mensaje,
            form,
            totalDelDia,
            categoriasConCantidad,
            obtenerCantidad,
            obtenerCantidad,
            actualizarCantidad,
            enviarFormulario
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



.produccion-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
}


.category-list {
    display: grid;
    gap: 12px;
}

.category-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 14px;
    align-items: center;
    padding: 14px 16px;
    border: 1px solid var(--border-light);
    border-radius: 14px;
    background: var(--bg);
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


@media (max-width: 768px) {

    .header,
    .form-footer {
        flex-direction: column;
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

/* Stepper táctil — solo en pantallas touch (tablet/móvil) */
@media (pointer: coarse) {
    .stepper {
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .stepper-btn {
        width: 44px;
        height: 44px;
        border: 1px solid var(--border);
        border-radius: 10px;
        background: var(--bg-secondary);
        color: var(--text-h);
        font-size: 20px;
        font-weight: 700;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.15s ease;
        flex-shrink: 0;
    }

    .stepper-btn:active {
        background: var(--primary-bg);
    }

    .category-input {
        width: 60px;
        text-align: center;
    }
}

/* En desktop (mouse), el stepper-btn está oculto — usa solo el input */
@media (pointer: fine) {
    .stepper {
        display: contents;
        /* los hijos se comportan como si no existiera el wrapper */
    }

    .stepper-btn {
        display: none;
    }
}

.form-actions-inline {
    display: flex;
    gap: 8px;
}
</style>