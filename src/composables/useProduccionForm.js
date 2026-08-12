import { ref, reactive, computed, watch, onMounted } from 'vue'
import PedidoClient from '../client/PedidoClient'
import { obtenerFechaHoy } from '../utils/date'

export function useProduccionForm(props, emit) {
    const cargandoCategorias = ref(false)
    const categorias = ref([])
    const cantidadesPorCategoria = ref({})
    
    // El formulario maneja su propio mensaje interno pero también emite notificar
    const mensaje = ref({ tipo: null, texto: '' })
    const form = reactive({
        fecha: obtenerFechaHoy()
    })

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
        const cantidades = {}
        categorias.value.forEach(categoria => {
            cantidades[categoria] = 0
        })
        cantidadesPorCategoria.value = cantidades
    })

    watch(() => props.edicion, () => {
        applyEdicion()
    })

    watch(categorias, () => {
        applyEdicion()
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
                const limite = props.limitesPorCategoria?.[categoria]
                let nuevaCantidad = actual + delta
                
                if (limite !== undefined && nuevaCantidad >= limite) {
                    if (nuevaCantidad > limite) {
                        nuevaCantidad = limite
                        notificar('info', `El total planificado para la categoría ${categoria} es ${limite} y ya ha sido completado.`, 3000)
                    } else if (nuevaCantidad === limite) {
                        notificar('exito', `¡Has completado la cantidad requerida para ${categoria}!`, 3000)
                    }
                }
                
                cantidadesPorCategoria.value = {
                    ...cantidadesPorCategoria.value,
                    [categoria]: nuevaCantidad
                }
            }
        }
    })

    onMounted(() => {
        cargarCategorias()
    })

    const notificar = (tipo, texto, duracion = 4000) => {
        mensaje.value = { tipo, texto }
        emit('notificar', { tipo, texto, duracion })
        if (duracion > 0) {
            setTimeout(() => {
                mensaje.value = { tipo: null, texto: '' }
            }, duracion)
        }
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
        
        const cantidades = {}
        categorias.value.forEach(categoria => {
            cantidades[categoria] = 0
        })
        cantidadesPorCategoria.value = cantidades
        
        cargandoCategorias.value = false
    }

    const applyEdicion = () => {
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
        let cantidad = Math.max(0, Math.trunc(Number(valor) || 0))
        const limite = props.limitesPorCategoria?.[categoria]

        if (limite !== undefined && cantidad >= limite) {
            if (cantidad > limite) {
                cantidad = limite
                notificar('info', `El total planificado para la categoría ${categoria} es ${limite} y ya ha sido completado.`, 3000)
            } else if (cantidad === limite) {
                notificar('exito', `¡Has completado la cantidad requerida para ${categoria}!`, 3000)
            }
        }

        cantidadesPorCategoria.value = {
            ...cantidadesPorCategoria.value,
            [categoria]: cantidad
        }
        emit('cantidad-cambiada', { categoria, cantidad })
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
        const detalle = construirDetalle()
        if (!detalle.length) {
            notificar('error', 'Completa al menos una categoría con cantidad mayor a cero', 0)
            return
        }
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

    const handleCancelar = () => {
        const cantidades = {}
        categorias.value.forEach(categoria => {
            cantidades[categoria] = 0
        })
        cantidadesPorCategoria.value = cantidades
        form.fecha = obtenerFechaHoy()
        emit('cancelar')
    }

    return {
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
        handleCancelar
    }
}
