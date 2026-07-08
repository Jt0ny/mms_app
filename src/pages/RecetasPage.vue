<template>
    <div class="container recetas-page">

        <div class="content-wrap">

            <!-- TÍTULO -->
            <h1 class="page-title">Creación de Recetas</h1>

            <!-- ALERTAS -->
            <Alertas :mensaje="mensaje" />

            <!-- LAYOUT -->
            <div class="main-layout">

                <!-- FORMULARIO -->
                <RecetaForm :receta="nuevaReceta" :categorias="categorias" :totalSeleccionados="totalSeleccionados"
                    :totalMateriales="materialesSeleccionados.length"
                    :totalMateriaPrima="materiaPrimaSeleccionada.length" :guardando="guardandoReceta"
                    @actualizar-receta="nuevaReceta = $event" @guardar="guardarReceta" />

                <!-- TABLAS -->
                <div class="tables-grid">

                    <!-- MATERIALES -->
                    <RecetaMaterialesTabla :materiales="materiales" :seleccionados="materialesSeleccionados"
                        :cargando="cargandoMateriales" @actualizar="cargarMateriales" @alternar="alternarMaterial"
                        @cantidad="actualizarCantidadMaterial" />

                    <!-- MATERIA PRIMA -->
                    <RecetaMateriaPrimaTabla :materiaPrima="materiaPrima" :seleccionados="materiaPrimaSeleccionada"
                        :cargando="cargandoMateriaPrima" @actualizar="cargarMateriaPrima"
                        @alternar="alternarMateriaPrima" @cantidad="actualizarCantidadMateriaPrima" />

                </div>

                <!-- RESUMEN -->
                <RecetaResumen :materiales="materialesSeleccionados" :materiaPrima="materiaPrimaSeleccionada" />

            </div>
        </div>
    </div>
</template>

<script>
import MaterialClient from '../client/MaterialClient'
import MateriaPrimaClient from '../client/MateriaPrimaClient'
import RecetaClient from '../client/RecetaClient'
import PedidoClient from '../client/PedidoClient'

import RecetaForm from '../components/recetas/RecetaForm.vue'
import RecetaMaterialesTabla from '../components/recetas/RecetaMaterialesTabla.vue'
import RecetaMateriaPrimaTabla from '../components/recetas/RecetaMateriaPrimaTabla.vue'
import RecetaResumen from '../components/recetas/RecetaResumen.vue'
import Alertas from '../components/Alertas.vue'
import { useMensajes } from '../composables/useMensajes.js'

export default {

    components: {
        RecetaForm,
        RecetaMaterialesTabla,
        RecetaMateriaPrimaTabla,
        RecetaResumen,
        Alertas
    },

    data() {
        const { state, mostrarMensaje } = useMensajes()
        return {
            mensaje: state,
            mostrarMensaje,

            materiales: [],
            materiaPrima: [],
            materialesSeleccionados: [],
            materiaPrimaSeleccionada: [],
            cargandoMateriales: false,
            cargandoMateriaPrima: false,
            guardandoReceta: false,
            categorias: [],
            nuevaReceta: {
                nombre: '',
                categoria: '',
                instrucciones: ''
            },
        }
    },

    computed: {

        totalSeleccionados() {
            return (this.materialesSeleccionados.length + this.materiaPrimaSeleccionada.length)
        }
    },

    mounted() {
        this.cargarMateriales()
        this.cargarMateriaPrima()
        this.cargarCategorias()
    },

    methods: {

        /* ================= CARGAR ================= */
        async cargarMateriales() {
            this.cargandoMateriales = true
            try {
                const data = await MaterialClient.obtenerMateriales()
                this.materiales = data ?? []
            } catch (error) {
                console.error(error)
                this.mostrarMensaje('error', 'Error al cargar materiales')
            } finally {
                this.cargandoMateriales = false
            }
        },

        async cargarMateriaPrima() {
            this.cargandoMateriaPrima = true
            try {
                try {
                    await MateriaPrimaClient.sincronizarConSupabase()
                } catch (syncError) {
                    console.warn('Servidor de Materia Prima no disponible en puerto 8070. Usando base de datos local de Supabase.', syncError)
                }
                const data = await MateriaPrimaClient.obtenerMateriaPrima()
                this.materiaPrima = data ?? []
            } catch (error) {
                console.error(error)
                this.mostrarMensaje('error', 'Error al cargar materia prima')
            } finally {
                this.cargandoMateriaPrima = false
            }
        },

        async cargarCategorias() {
            try {
                const [recetas, pedidos] = await Promise.all([
                    RecetaClient.obtenerRecetas(),
                    PedidoClient.obtenerPedidos()
                ])

                const categoriasRecetas = (recetas ?? [])
                    .map(r => String(r?.categoria ?? '').trim())
                    .filter(Boolean)

                const categoriasPedidos = (pedidos ?? [])
                    .map(p => String(p?.categoria ?? '').trim())
                    .filter(Boolean)

                this.categorias = [...new Set([...categoriasRecetas, ...categoriasPedidos])]
            } catch (error) {
                console.error(error)
                this.mostrarMensaje('error', 'Error al cargar categorías')
            }
        },

        /* ================= SELECCIÓN ================= */
        alternarMaterial(item, seleccionado) {
            if (seleccionado) {
                this.materialesSeleccionados.push({ id: item.id, nombre: item.nombre, cantidad: 1 })
                return
            }
            this.materialesSeleccionados = this.materialesSeleccionados.filter(material => material.id !== item.id)
        },

        alternarMateriaPrima(item, seleccionado) {
            if (seleccionado) {
                this.materiaPrimaSeleccionada.push({ id: item.id, nombre: item.variedad, cantidad: 1 })
                return
            }
            this.materiaPrimaSeleccionada = this.materiaPrimaSeleccionada.filter(material => material.id !== item.id)
        },

        actualizarCantidadMaterial(id, valor) {
            const item = this.materialesSeleccionados.find(material => material.id === id)

            if (item) {
                item.cantidad = Number(valor) || 1
            }
        },

        actualizarCantidadMateriaPrima(id, valor) {
            const item = this.materiaPrimaSeleccionada.find(material => material.id === id)

            if (item) {
                item.cantidad = Number(valor) || 1
            }
        },

        /* ================= VALIDAR ================= */

        validarFormulario() {
            if (!this.nuevaReceta.nombre || !this.nuevaReceta.categoria || !this.nuevaReceta.instrucciones) {
                this.mostrarMensaje('error', 'Completa todos los campos')
                return false
            }

            if (!this.totalSeleccionados) {
                this.mostrarMensaje('error', 'Selecciona materiales o materia prima')
                return false
            }
            return true
        },

        /* ================= GUARDAR ================= */
        async guardarReceta() {

            if (!this.validarFormulario()) {
                return
            }

            this.guardandoReceta = true

            try {
                const payload = { ...this.nuevaReceta, materiales: this.materialesSeleccionados, materiaPrima: this.materiaPrimaSeleccionada, fecha_creacion: new Date().toISOString() }
                await RecetaClient.agregarReceta(payload)

                this.mostrarMensaje('exito', 'Receta guardada correctamente')

                this.resetearFormulario()

            } catch (error) {
                console.error(error)
                this.mostrarMensaje('error', 'Error al guardar receta')
            } finally {
                this.guardandoReceta = false
            }
        },

        /* ================= RESET ================= */
        resetearFormulario() {

            this.nuevaReceta = {
                nombre: '',
                categoria: '',
                instrucciones: ''
            }

            this.materialesSeleccionados = []
            this.materiaPrimaSeleccionada = []
        }
    }
}
</script>

<style scoped>
.container {
    width: 100%;
    min-height: 100%;
    padding: 24px;
    background: var(--bg-secondary);
}

.content-wrap {
    width: 100%;
    max-width: 1400px;
    margin: 0 auto;
}

.page-title {
    margin-bottom: 24px;
}

.main-layout {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.tables-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
}

@media (max-width: 900px) {

    .tables-grid {
        grid-template-columns: 1fr;
    }

    .container {
        padding: 12px;
    }
}
</style>