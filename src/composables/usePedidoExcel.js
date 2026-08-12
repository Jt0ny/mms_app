import ClientesClient from '../client/ClientesClient'
import { obtenerFechaHoy } from '../utils/date.js'
import { useCatalogos } from './useCatalogos.js'

export function usePedidoExcel() {

    function procesarDatosVentas(matriz) {
        const resultados = []
        let filaCategorias = -1
        let filaColumnas = -1

        // BUSCAR HEADERS 
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
            throw new Error('Formato de archivo inválido. No se encontraron los encabezados "BILL CUSTOMER" y "SHIP CUSTOMER". Asegúrate de usar el formato Excel de ventas estándar.')
        }

        // MAPEAR COLUMNAS STEMS Y SALES 
        const rowCategorias = matriz[filaCategorias]
        const rowSubColumnas = matriz[filaColumnas]
        const columnasCategoria = []
        let categoriaActual = ''

        const startIndex = 3

        for (let j = startIndex; j < rowCategorias.length; j++) {
            if (rowCategorias[j] && String(rowCategorias[j]).trim() !== '') {
                categoriaActual = String(rowCategorias[j]).trim()
            }
            const subColumna = String(rowSubColumnas[j] || '').toUpperCase()
            if (subColumna === 'STEMS' && categoriaActual.toUpperCase() !== 'TOTALS') {
                let existing = columnasCategoria.find(c => c.categoria === categoriaActual)
                if (!existing) {
                    existing = { categoria: categoriaActual }
                    columnasCategoria.push(existing)
                }
                existing.indiceStems = j
            }
            if (subColumna === 'SALES' && categoriaActual.toUpperCase() !== 'TOTALS') {
                let existing = columnasCategoria.find(c => c.categoria === categoriaActual)
                if (!existing) {
                    existing = { categoria: categoriaActual }
                    columnasCategoria.push(existing)
                }
                existing.indiceSales = j
            }
        }

        // LEER DATOS 
        for (let i = filaColumnas + 1; i < matriz.length; i++) {
            const fila = matriz[i]
            const billCustomer = String(fila[0] || '').trim()
            const shipCustomer = String(fila[2] || '').trim()

            if (!billCustomer || billCustomer === 'TOTALS' || billCustomer === 'BILL CUSTOMER') {
                continue
            }

            const fechaHoy = obtenerFechaHoy()

            columnasCategoria.forEach(map => {
                if (map.indiceStems === undefined) return

                let stems = parseInt(String(fila[map.indiceStems] || '0').replace(/\s+/g, ''), 10)
                if (isNaN(stems)) {
                    stems = 0
                }

                let precioCategoria = 0
                if (map.indiceSales !== undefined) {
                    precioCategoria = parseFloat(String(fila[map.indiceSales] || '0').replace(/[^0-9.-]+/g, ''))
                    if (isNaN(precioCategoria)) precioCategoria = 0
                }

                if (stems > 0) {
                    resultados.push({
                        clienteFacturacion: billCustomer,
                        clienteEnvio: shipCustomer,
                        categoria: map.categoria,
                        stems,
                        fechaIngreso: fechaHoy,
                        precio: precioCategoria
                    })
                }
            })
        }

        return resultados
    }

    async function sincronizarClientes(datosPedidos) {
        try {
            const catalogos = useCatalogos()
            const huboCambios = await ClientesClient.resolverClientesDePedidos(datosPedidos)

            if (huboCambios) {
                catalogos.obtenerClientes(true).catch(console.error)
            }
        } catch (error) {
            console.error('Error al sincronizar clientes:', error)
            throw error
        }
    }

    return { procesarDatosVentas, sincronizarClientes }
}
