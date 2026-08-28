<template>
    <div class="page-container recetas-page">

        <div class="page-content-wrap">


            <h1 class="page-title">Creación de Recetas</h1>


            <Alertas :mensaje="mensaje" />

            <!-- LAYOUT -->
            <div class="panel-column">

                <!-- FORMULARIO -->
                <RecetaForm ref="formulario" :receta="nuevaReceta" :categorias="categorias" :totalSeleccionados="totalSeleccionados"
                    :totalMateriales="materialesSeleccionados.length"
                    :totalMateriaPrima="materiaPrimaSeleccionada.length" :guardando="guardandoReceta"
                    @actualizar-receta="nuevaReceta = $event" @guardar="guardarReceta" @cancelar="resetearFormulario" />

                <!-- TABLAS -->
                <div class="grid-halves">

                    <!-- MATERIALES -->
                    <RecetaMaterialesList :materiales="materiales" :seleccionados="materialesSeleccionados"
                        :cargando="cargandoMateriales" @actualizar="cargarMateriales(true)" @alternar="alternarMaterial"
                        @cantidad="actualizarCantidadMaterial" />

                    <!-- MATERIA PRIMA -->
                    <RecetaMateriaPrimaList :materiaPrima="materiaPrima" :seleccionados="materiaPrimaSeleccionada"
                        :cargando="cargandoMateriaPrima" @actualizar="cargarMateriaPrima(true)"
                        @alternar="alternarMateriaPrima" @cantidad="actualizarCantidadMateriaPrima" />

                </div>

                <!-- LISTA DE RECETAS -->
                <RecetaList :recetas="todasLasRecetas" :cargando="cargandoRecetas"
                    @actualizar="cargarTodasLasRecetas(true)" @editar="editarReceta" @eliminar="borrarReceta" />

            </div>
        </div>
    </div>
</template>

<script>
import RecetaClient from '../client/RecetaClient'
import PedidoClient from '../client/PedidoClient'
import { useCatalogos } from '../composables/useCatalogos.js'

import RecetaForm from '../components/recetas/RecetaForm.vue'
import RecetaMaterialesList from '../components/recetas/RecetaMaterialesList.vue'
import RecetaMateriaPrimaList from '../components/recetas/RecetaMateriaPrimaList.vue'
import RecetaList from '../components/recetas/RecetaList.vue'
import Alertas from '../components/shared/Alertas.vue'
import { useMensajes } from '../composables/useMensajes.js'

export default {

    components: {
        RecetaForm,
        RecetaMaterialesList,
        RecetaMateriaPrimaList,
        RecetaList,
        Alertas
    },

    setup() {
        const { mensaje, mostrarMensaje } = useMensajes()
        const catalogos = useCatalogos()
        return { mensaje, mostrarMensaje, catalogos }
    },

    data() {
        return {
            materiales: [],
            materiaPrima: [],
            materialesSeleccionados: [],
            materiaPrimaSeleccionada: [],
            cargandoMateriales: false,
            cargandoMateriaPrima: false,
            guardandoReceta: false,
            categorias: [],
            todasLasRecetas: [],
            cargandoRecetas: false,
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
        this.cargarTodasLasRecetas()
    },

    methods: {


        async cargarTodasLasRecetas(forceRefresh = false) {
            this.cargandoRecetas = true
            const response = await this.catalogos.obtenerRecetas(forceRefresh)
            this.todasLasRecetas = response?.success !== false ? (response?.data || []) : []
            this.cargandoRecetas = false
        },

        editarReceta(receta) {
            this.nuevaReceta = {
                id: receta.id,
                nombre: receta.nombre || '',
                categoria: receta.categoria || '',
                instrucciones: receta.instrucciones || ''
            }
            this.materialesSeleccionados = (receta.materiales || []).map(m => ({ ...m }))
            this.materiaPrimaSeleccionada = (receta.materiaPrima || []).map(m => ({ ...m }))

            // Scroll al inicio del formulario
            if (this.$refs.formulario && this.$refs.formulario.$el) {
                this.$refs.formulario.$el.scrollIntoView({ behavior: 'smooth' })
            }
        },

        async borrarReceta(receta) {

            const res = await RecetaClient.eliminarReceta(receta.id)
            if (res.success) {
                await this.catalogos.obtenerRecetas(true) // Force refresh the cache
                this.cargarTodasLasRecetas(true)
                this.mostrarMensaje('exito', 'Receta eliminada correctamente')
                if (this.nuevaReceta.id === receta.id) this.resetearFormulario()
            } else {
                this.mostrarMensaje('error', 'Error al eliminar la receta')
            }
        },

        // -- Cargar --
        async cargarMateriales(forceRefresh = false) {
            this.cargandoMateriales = true
            const response = await this.catalogos.obtenerMateriales(forceRefresh)

            if (response?.success === false) {
                this.materiales = []
                this.mostrarMensaje('error', 'Error al cargar materiales')
            } else {
                this.materiales = response?.data ?? []
            }

            this.cargandoMateriales = false
        },

        async cargarMateriaPrima(forceRefresh = false) {
            this.cargandoMateriaPrima = true
            const response = await this.catalogos.obtenerMateriaPrima(forceRefresh)

            if (response?.success === false) {
                this.materiaPrima = []
                this.mostrarMensaje('error', 'Error al cargar materia prima')
            } else {
                this.materiaPrima = response?.data ?? []
            }

            this.cargandoMateriaPrima = false
        },

        async cargarCategorias() {
            const [resRecetas, resPedidos] = await Promise.all([
                this.catalogos.obtenerRecetas(),
                PedidoClient.obtenerPedidos()
            ])

            const arrRecetas = resRecetas?.success ? (resRecetas.data ?? []) : (resRecetas ?? [])
            const arrPedidos = resPedidos?.success ? (resPedidos.data ?? []) : (resPedidos ?? [])

            const categoriasRecetas = arrRecetas
                .map(r => String(r?.categoria ?? '').trim())
                .filter(Boolean)

            const categoriasPedidos = arrPedidos
                .map(p => String(p?.categoria ?? '').trim())
                .filter(Boolean)

            this.categorias = [...new Set([...categoriasRecetas, ...categoriasPedidos])]
        },

        // -- Selección --
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

        // -- Validar --

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

        // -- Guardar --
        async guardarReceta() {

            if (!this.validarFormulario()) {
                return
            }

            this.guardandoReceta = true

            const payload = { ...this.nuevaReceta, materiales: this.materialesSeleccionados, materiaPrima: this.materiaPrimaSeleccionada, fechaCreacion: new Date().toISOString() }
            let response;
            if (this.nuevaReceta.id) {
                response = await RecetaClient.editarReceta(this.nuevaReceta.id, payload)
            } else {
                response = await RecetaClient.agregarReceta(payload)
            }

            this.guardandoReceta = false

            if (response.success) {
                await this.catalogos.obtenerRecetas(true) // Force refresh the cache
                await this.cargarTodasLasRecetas(true)
                this.mostrarMensaje('exito', this.nuevaReceta.id ? 'Receta actualizada correctamente' : 'Receta guardada correctamente')
                this.resetearFormulario()
            } else {
                this.mostrarMensaje('error', 'Error al guardar receta')
            }
        },

        // -- Reset --
        resetearFormulario() {

            this.nuevaReceta = {
                id: undefined,
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
