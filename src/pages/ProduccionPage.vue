<template>
    <div class="container produccion-page">
        <div class="content-wrap">
            <h1 class="page-title">Producción diaria</h1>

            <PedidoAlerts :mensaje="mensaje" />

            <div class="page-grid">
                <ProduccionForm :guardando="guardando" :ultima-guardada="ultimaGuardada" :edicion="editingProduccion" @guardar="guardarProduccion"
                    @notificar="mostrarMensaje($event.tipo, $event.texto, $event.duracion)" @cancelar="editingProduccion = null" />

                <!-- <ProduccionResumen :producciones="producciones" :permitirEliminar="false" @editar="editarProduccion" /> -->
                <ProduccionRecetasView />
            </div>
        </div>
    </div>
</template>

<script>
import PedidoAlerts from '../components/Alertas.vue'
import ProduccionForm from '../components/produccion/ProduccionForm.vue'
import ProduccionClient from '../client/ProduccionClient'
import ProduccionResumen from '../components/produccion/ProduccionResumen.vue'
import ProduccionRecetasView from '../components/produccion/ProduccionRecetasView.vue'

export default {
    components: {
        ProduccionForm,
        PedidoAlerts,
        ProduccionResumen,
        ProduccionRecetasView
    },

    data() {
        return {
            guardando: false,
            mensaje: {
                tipo: null,
                texto: ''
            }
            ,
            ultimaGuardada: null,
            producciones: [],
            cargandoProducciones: false
            ,
            editingProduccion: null
        }
    },

    mounted() {
        this.cargarProducciones()
    },

    methods: {
        mostrarMensaje(tipo, texto, duracion = 4000) {
            this.mensaje = { tipo, texto }

            if (duracion > 0) {
                setTimeout(() => {
                    this.mensaje = { tipo: null, texto: '' }
                }, duracion)
            }
        },

        async guardarProduccion(payload) {
            this.guardando = true
            try {
                if (payload.id) {
                    await ProduccionClient.editarProduccion(payload.id, payload)
                    this.mostrarMensaje('exito', '✓ Producción actualizada correctamente')
                } else {
                    await ProduccionClient.agregarProduccion(payload)
                    this.mostrarMensaje('exito', '✓ Producción registrada correctamente')
                }

                this.ultimaGuardada = new Date().toISOString()
                this.editingProduccion = null
                await this.cargarProducciones()
            } catch (error) {
                console.error(error)
                this.mostrarMensaje('error', '❌ No se pudo guardar la producción', 0)
            } finally {
                this.guardando = false
            }
        },
        async cargarProducciones() {
            this.cargandoProducciones = true
            try {
                const data = await ProduccionClient.obtenerProducciones()
                this.producciones = data ?? []
            } catch (error) {
                console.error(error)
                this.mostrarMensaje('error', '❌ Error al cargar la producción', 0)
            } finally {
                this.cargandoProducciones = false
            }
        },

        verProduccion(p) {
            console.log('Ver producción', p)
            this.mostrarMensaje('info', `Producción: ${p.total ?? '-'} — ${p.detalle?.length ?? 0} categorías`, 4000)
        },

        editarProduccion(p) {
            this.editingProduccion = p
            this.$nextTick(() => {
                const el = document.querySelector('.produccion-form-card')
                if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                const input = document.querySelector('#fecha-produccion')
                if (input && input.focus) input.focus()
            })
        },

        async eliminarProduccion(p) {
            if (!p || !p.id) {
                this.mostrarMensaje('error', 'Elemento no válido para eliminar', 3000)
                return
            }

            try {
                await ProduccionClient.eliminarProduccion(p.id)
                this.mostrarMensaje('exito', 'Registro eliminado')
                await this.cargarProducciones()
            } catch (error) {
                console.error(error)
                this.mostrarMensaje('error', 'No se pudo eliminar el registro', 0)
            }
        },
        formatearFecha() {
            // Mantener firma en caso de futura necesidad; actualmente no se usa.
            return ''
        }
    }
}
</script>

<style scoped>
.container {
    padding: 24px;
}

.content-wrap {
    max-width: 1400px;
    margin: 0 auto;
}

.page-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.45fr) minmax(320px, 0.85fr);
    gap: 24px;
    align-items: start;
}

/* Removed history-related styles not used by this page */

@media (max-width: 1100px) {
    .page-grid {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 768px) {
    .container {
        padding: 12px;
    }

    .history-header,
    .history-top {
        flex-direction: column;
    }
}
</style>