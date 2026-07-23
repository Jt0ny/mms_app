import ClientesClient from '../client/ClientesClient'
import { obtenerFechaHoy } from '../utils/date.js'
import { useCatalogos } from './useCatalogos.js'

export function usePedidoExcel() {

    function procesarDatosVentas(matriz) {
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
            throw new Error('Formato de archivo inválido. No se encontraron los encabezados "BILL CUSTOMER" y "SHIP CUSTOMER". Asegúrate de usar el formato Excel de ventas estándar.')
        }

        /* ================= MAPEAR COLUMNAS STEMS Y SALES ================= */
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

        /* ================= LEER DATOS ================= */
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
                        cliente_facturacion: billCustomer, 
                        cliente_envio: shipCustomer, 
                        categoria: map.categoria, 
                        stems, 
                        fecha_ingreso: fechaHoy,
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
            const clientesExistentes = await catalogos.obtenerClientes()
            const mapaClientes = new Map(clientesExistentes.map(c => [c.nombre.toLowerCase().trim(), c]))

            const clientesParaAgregarFacturacion = []
            const clientesParaAgregarEnvio = []
            const clientesParaActualizar = []

            for (const order of datosPedidos) {
                const billName = (order.cliente_facturacion || '').trim()
                const shipName = (order.cliente_envio || '').trim()

                if (billName) {
                    const billKey = billName.toLowerCase()
                    if (!mapaClientes.has(billKey)) {
                        const nuevo = {
                            nombre: billName,
                            tipo: 'Facturación',
                            clienteFacturacionAsociado: '',
                            email: '',
                            telefono: '',
                            direccion: '',
                            notas: ''
                        }
                        mapaClientes.set(billKey, nuevo)
                        clientesParaAgregarFacturacion.push(nuevo)
                    } else {
                        const existente = mapaClientes.get(billKey)
                        if (existente.tipo === 'Envío') {
                            existente.tipo = 'Ambos'
                            if (!clientesParaActualizar.some(c => c.id === existente.id)) {
                                clientesParaActualizar.push(existente)
                            }
                        }
                    }
                }

                if (shipName) {
                    const shipKey = shipName.toLowerCase()
                    if (!mapaClientes.has(shipKey)) {
                        const nuevo = {
                            nombre: shipName,
                            tipo: 'Envío',
                            clienteFacturacionAsociado: billName || '',
                            email: '',
                            telefono: '',
                            direccion: '',
                            notas: ''
                        }
                        mapaClientes.set(shipKey, nuevo)
                        clientesParaAgregarEnvio.push(nuevo)
                    } else {
                        const existente = mapaClientes.get(shipKey)
                        let modificado = false
                        if (existente.tipo === 'Facturación') {
                            existente.tipo = 'Ambos'
                            modificado = true
                        }
                        if (!existente.clienteFacturacionAsociado && billName && existente.nombre !== billName) {
                            existente.clienteFacturacionAsociado = billName
                            modificado = true
                        }
                        if (modificado) {
                            if (!clientesParaActualizar.some(c => c.id === existente.id)) {
                                clientesParaActualizar.push(existente)
                            }
                        }
                    }
                }
            }

            // 2. Insertar primeros los de Facturación
            if (clientesParaAgregarFacturacion.length > 0) {
                const insertadosFact = await ClientesClient.agregarClientesMasivos(
                    clientesParaAgregarFacturacion.map(c => ({
                        nombre: c.nombre.trim(),
                        tipo: c.tipo,
                        cliente_facturacion_id: null,
                        email: null,
                        telefono: null,
                        direccion: null,
                        notas: null
                    }))
                )
                insertadosFact.forEach(c => {
                    mapaClientes.set(c.nombre.toLowerCase().trim(), c)
                })
            }

            // 3. Insertar los de Envío resolviendo su parentId
            if (clientesParaAgregarEnvio.length > 0) {
                const payloadEnvio = clientesParaAgregarEnvio.map(c => {
                    let parentId = null
                    if (c.clienteFacturacionAsociado) {
                        const parentObj = mapaClientes.get(c.clienteFacturacionAsociado.toLowerCase().trim())
                        if (parentObj && parentObj.id) {
                            parentId = parentObj.id
                        }
                    }
                    return {
                        nombre: c.nombre.trim(),
                        tipo: c.tipo,
                        cliente_facturacion_id: parentId,
                        email: null,
                        telefono: null,
                        direccion: null,
                        notas: null
                    }
                })
                await ClientesClient.agregarClientesMasivos(payloadEnvio)
            }

            // 4. Actualizar clientes modificados de golpe usando bulk upsert
            if (clientesParaActualizar.length > 0) {
                const payloadUpsert = clientesParaActualizar.map(c => {
                    let parentId = c.cliente_facturacion_id || null
                    if (c.clienteFacturacionAsociado) {
                        const parentObj = mapaClientes.get(c.clienteFacturacionAsociado.toLowerCase().trim())
                        if (parentObj && parentObj.id) {
                            parentId = parentObj.id
                        }
                    }
                    return {
                        id: c.id,
                        nombre: c.nombre.trim(),
                        tipo: c.tipo,
                        cliente_facturacion_id: parentId,
                        email: c.email || null,
                        telefono: c.telefono || null,
                        direccion: c.direccion || null,
                        notas: c.notas || null
                    }
                })
                await ClientesClient.upsertClientesMasivos(payloadUpsert)
            }

            if (clientesParaAgregarFacturacion.length > 0 || clientesParaAgregarEnvio.length > 0 || clientesParaActualizar.length > 0) {
                catalogos.obtenerClientes(true).catch(console.error)
            }

        } catch (error) {
            console.error('Error al sincronizar clientes:', error)
            throw error
        }
    }

    return { procesarDatosVentas, sincronizarClientes }
}
