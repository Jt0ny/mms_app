import { ref, reactive, computed, watch, onMounted } from 'vue'
import PedidoClient from '../client/PedidoClient'
import { obtenerFechaHoy } from '../utils/date'

export function useProduccionForm(props, emit) {
    const cargandoCategorias = ref(false)
    const categorias = ref([])
    const cantidadesPorCategoria = ref({})
    
    const form = reactive({
        fecha: obtenerFechaHoy()
    })
    const intentoEnvio = ref(false)

    const resetearCantidades = () => {
        const cantidades = {}
        categorias.value.forEach(categoria => {
            cantidades[categoria] = 0
        })
        cantidadesPorCategoria.value = cantidades
    }

    const validarYAsignarCantidad = (categoria, nuevaCantidad) => {
        const limite = props.limitesPorCategoria?.[categoria]
        let cantidadFinal = nuevaCantidad

        if (limite !== undefined && cantidadFinal >= limite) {
            if (cantidadFinal > limite) {
                cantidadFinal = limite
                notificar('info', `El total planificado para la categoría ${categoria} es ${limite} y ya ha sido completado.`, 3000)
            } else if (cantidadFinal === limite) {
                notificar('exito', `¡Has completado la cantidad requerida para ${categoria}!`, 3000)
            }
        }

        cantidadesPorCategoria.value = {
            ...cantidadesPorCategoria.value,
            [categoria]: cantidadFinal
        }
    }

    const totalDelDia = computed(() => {
        return categorias.value.reduce((total, categoria) => {
            return total + obtenerCantidadNumerica(categoria)
        }, 0)
    })

    const categoriasConCantidad = computed(() => {
        return categorias.value.filter(categoria => obtenerCantidadNumerica(categoria) > 0).length
    })

    watch(() => props.ultimaGuardada, (newVal, oldVal) => {
        if (!newVal || newVal === oldVal) return
        resetearCantidades()
    })

    watch(() => props.edicion, () => {
        aplicarEdicion()
    })

    watch(categorias, () => {
        aplicarEdicion()
    })

    watch(() => props.categoriasPermitidas, () => {
        cargarCategorias()
    })

    watch(() => props.cantidadesExternas, (newVal, oldVal) => {
        for (const [categoria, total] of Object.entries(newVal || {})) {
            const anterior = (oldVal || {})[categoria] || 0
            const delta = total - anterior
            if (delta > 0) {
                const actual = Number(cantidadesPorCategoria.value[categoria] || 0)
                validarYAsignarCantidad(categoria, actual + delta)
            }
        }
    })

    onMounted(() => {
        cargarCategorias()
    })

    const notificar = (tipo, texto, duracion = 4000) => {
        emit('notificar', { tipo, texto, duracion })
    }

    const cargarCategorias = async () => {
        cargandoCategorias.value = true
        
        const response = await PedidoClient.obtenerPedidos()
        if (response && response.success === false) {
            notificar('error', 'No se pudieron cargar las categorías de pedidos', 0)
            cargandoCategorias.value = false
            return
        }

        let catList = (response?.success ? response.data : (response ?? []))
            .map(pedido => String(pedido?.categoria ?? '').trim())
            .filter(Boolean)

        if (Array.isArray(props.categoriasPermitidas) && props.categoriasPermitidas.length) {
            const permitidas = props.categoriasPermitidas.map(c => c.trim().toUpperCase())
            catList = catList.filter(c => permitidas.includes(c.trim().toUpperCase()))
        }

        categorias.value = [...new Set(catList)].sort((a, b) => a.localeCompare(b, 'es'))
        
        resetearCantidades()
        
        cargandoCategorias.value = false
    }

    const aplicarEdicion = () => {
        const e = props.edicion
        if (!e) return
        
        if (e.fecha) {
            form.fecha = e.fecha
        } else if (e.creadoEn) {
            form.fecha = e.creadoEn.slice(0, 10)
        }
        
        const cantidades = {}
        categorias.value.forEach(categoria => {
            const item = (e.detalle || []).find(d => String(d.categoria) === String(categoria))
            cantidades[categoria] = item ? (Number.isFinite(Number(item.cantidad)) ? Math.trunc(Number(item.cantidad)) : 0) : 0
        })
        cantidadesPorCategoria.value = cantidades
    }

    const obtenerCantidad = (categoria) => {
        return cantidadesPorCategoria.value[categoria] ?? 0
    }

    const obtenerCantidadNumerica = (categoria) => {
        const valor = Number(obtenerCantidad(categoria))
        return Number.isFinite(valor) && valor > 0 ? Math.trunc(valor) : 0
    }

    const actualizarCantidad = (categoria, valor) => {
        const cantidad = Math.max(0, Math.trunc(Number(valor) || 0))
        validarYAsignarCantidad(categoria, cantidad)
        emit('cantidad-cambiada', { categoria, cantidad: cantidadesPorCategoria.value[categoria] })
    }

    const construirDetalle = () => {
        return categorias.value
            .map(categoria => ({
                categoria,
                cantidad: obtenerCantidadNumerica(categoria)
            }))
            .filter(item => item.cantidad > 0)
    }

    const enviarFormulario = () => {
        intentoEnvio.value = true
        // Verificar que TODAS las categorías tengan valor > 0
        const categoriasVacias = categorias.value.filter(
            categoria => obtenerCantidadNumerica(categoria) === 0
        )
        
        if (categoriasVacias.length > 0) {
            const nombres = categoriasVacias.join(', ')
            notificar('error', `Las siguientes categorías están vacías: ${nombres}`, 0)
            return
        }
        
        const detalle = construirDetalle()
        const payload = {
            fecha: form.fecha,
            total: totalDelDia.value,
            detalle,
            creadoEn: new Date().toISOString()
        }
        if (props.edicion && props.edicion.id) {
            payload.id = props.edicion.id
        }
        emit('guardar', payload)
    }
    return {
        cargandoCategorias,
        categorias,
        cantidadesPorCategoria,
        form,
        totalDelDia,
        categoriasConCantidad,
        obtenerCantidad,
        actualizarCantidad,
        enviarFormulario,
        intentoEnvio
    }
}
