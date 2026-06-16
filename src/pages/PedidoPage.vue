<template>
    <div class="container materia-prima-page">

        <div class="content-wrap">

            <!-- TÍTULO -->
            <h1 class="page-title">Carga de Pedidos</h1>

            <!-- ALERTAS -->
            <PedidoAlerts :mensaje="mensaje" />

            <!-- LAYOUT -->
            <div class="main-layout" :class="{ 'with-preview': datosProcesados.length > 0 }">

                <!-- PANEL IZQUIERDO -->
                <div class="left-panel">

                    <!-- UPLOAD -->
                    <CargaArchivo nombreModulo="Ventas" :cargando="cargando" @archivo-seleccionado="procesarArchivo" />

                    <!-- INVENTARIO -->
                    <PedidoInventarioActual :pedidos="pedidosActual" :cargando="cargandoPedidos"
                        @actualizar="cargarPedidos" />

                </div>

                <!-- PANEL DERECHO -->
                <PedidoPreview :datosProcesados="datosProcesados" :cargando="cargando" @cancelar="limpiarDatos"
                    @confirmar="confirmarYSubir" />

            </div>

        </div>

    </div>
</template>
<script>
import PedidoClient from '../client/PedidoClient'
import * as XLSX from 'xlsx'

import CargaArchivo from '../components/CargaArchivo.vue'
import PedidoPreview from '../components/pedidos/PedidoPreview.vue'
import PedidoInventarioActual from '../components/pedidos/PedidoInventarioActual.vue'
import PedidoAlerts from '../components/Alertas.vue'

export default {

    components: {
        PedidoInventarioActual,
        PedidoPreview,
        CargaArchivo,
        PedidoAlerts
    },

    data() {
        return {
            datosProcesados: [],
            pedidosActual: [],
            mensaje: {
                tipo: null,
                texto: ''
            },
            cargando: false,
            cargandoPedidos: false
        }
    },

    mounted() {
        this.cargarPedidos()
    },

    methods: {
        mostrarMensaje(tipo, texto, duracion = 4000) {

            this.mensaje = {
                tipo,
                texto
            }
            if (duracion > 0) {
                setTimeout(() => {
                    this.mensaje = {
                        tipo: null,
                        texto: ''
                    }
                }, duracion)
            }
        },

        /* ================= PEDIDOS ================= */
        async cargarPedidos() {
            this.cargandoPedidos = true
            try {
                const datos = await PedidoClient.obtenerPedidos()
                this.pedidosActual = datos ?? []
            } catch (error) {
                console.error(error)
                this.mostrarMensaje('error', '❌ Error al cargar pedidos', 0)
            } finally {
                this.cargandoPedidos = false
            }
        },

        /* ================= ARCHIVO ================= */
        async procesarArchivo(file) {
            if (!file) return
            this.cargando = true
            try {
                const data = await file.arrayBuffer()
                const workbook = XLSX.read(data, { type: 'array' })

                const sheet = workbook.Sheets[workbook.SheetNames[0]]

                /* 
                   IMPORTANTE:
                   header: 1
                   devuelve matriz [][] 
                */
                const matrizDatos = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

                if (!matrizDatos.length) {
                    this.mostrarMensaje('error', '❌ Archivo vacío')
                    return
                }

                this.datosProcesados = this.procesarDatosVentas(matrizDatos)

                if (!this.datosProcesados.length) {
                    this.mostrarMensaje('error', '❌ Datos inválidos o sin registros')
                    return
                }
                this.mostrarMensaje('exito', `✓ ${this.datosProcesados.length} líneas de pedido cargadas`)

            } catch (error) {
                console.error(error)
                this.mostrarMensaje('error', '❌ Error al leer Excel')
            } finally {
                this.cargando = false
            }
        },

        /* ================= PROCESAMIENTO ================= */
        procesarDatosVentas(matriz) {
            const resultados = []
            let filaCategorias = -1
            let filaColumnas = -1

            /* ================= BUSCAR HEADERS ================= */
            for (let i = 0; i < matriz.length; i++) {
                const fila = matriz[i]
                if (!Array.isArray(fila)) continue
                const cellsUpper = fila.map(c => String(c || '').toUpperCase())
                const tieneBill = cellsUpper.some(c => c.includes('BILL CUSTOMER'))
                const tieneShip = cellsUpper.some(c => c.includes('SHIP CUSTOMER'))
                if (tieneBill && tieneShip) {
                    filaCategorias = i - 1
                    filaColumnas = i
                    break
                }
            }

            if (filaCategorias === -1 || filaColumnas === -1) {
                console.error('❌ No se encontraron encabezados')
                return []
            }

            /* ================= MAPEAR COLUMNAS STEMS ================= */
            const rowCategorias = matriz[filaCategorias]
            const rowSubColumnas = matriz[filaColumnas]
            const columnasStems = []
            let categoriaActual = ''

            const startIndex = 3

            for (let j = startIndex; j < rowCategorias.length; j++) {
                if (rowCategorias[j] && String(rowCategorias[j]).trim() !== '') {

                    categoriaActual = String(rowCategorias[j]).trim()
                }

                const subColumna = String(rowSubColumnas[j] || '').toUpperCase()

                if (subColumna === 'STEMS' && categoriaActual.toUpperCase() !== 'TOTALS') {

                    columnasStems.push({ categoria: categoriaActual, indice: j })
                }
            }

            /* ================= LEER DATOS ================= */
            for (let i = filaColumnas + 1; i < matriz.length; i++) {

                const fila = matriz[i]
                const billCustomer = String(fila[0] || '').trim()

                const shipCustomer = String(fila[2] || '').trim()

                if (!billCustomer || billCustomer === 'TOTALS' || billCustomer === 'BILL CUSTOMER') {
                    continue
                }

                columnasStems.forEach(map => {
                    let stems = parseInt(String(fila[map.indice] || '0').replace(/\s+/g, ''), 10)

                    if (isNaN(stems)) {
                        stems = 0
                    }

                    if (stems > 0) {
                        resultados.push({ cliente_facturacion: billCustomer, cliente_envio: shipCustomer, categoria: map.categoria, stems })
                    }
                })
            }

            return resultados
        },

        /* ================= LIMPIAR ================= */
        limpiarDatos() {
            this.datosProcesados = []
            this.mostrarMensaje('exito', 'Vista previa limpiada')
        },

        /* ================= GUARDAR ================= */
        async confirmarYSubir() {
            if (!this.datosProcesados.length) {
                return
            }

            this.cargando = true

            try {
                await PedidoClient.agregarPedido(this.datosProcesados)
                this.mostrarMensaje('exito', '✓ Pedidos guardados correctamente')
                this.datosProcesados = []
                await this.cargarPedidos()

            } catch (error) {
                console.error(error)
                this.mostrarMensaje('error', '❌ Error al guardar pedidos', 0)
            } finally {
                this.cargando = false
            }
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

.main-layout {
    display: grid;
    grid-template-columns: 1fr;
    gap: 24px;
    margin-top: 24px;
}

.main-layout.with-preview {
    grid-template-columns: minmax(220px, 360px) 1fr;
}

.left-panel {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

@media (max-width: 768px) {

    .main-layout,
    .main-layout.with-preview {
        grid-template-columns: 1fr;
    }

    .container {
        padding: 12px;
    }
}
</style>