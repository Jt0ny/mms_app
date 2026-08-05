import { supabase } from './supabase'

export default {
  // Obtiene la lista completa de clientes y resuelve la relación recursiva del broker
  async obtenerClientes() {
    try {
      // Hacemos una consulta relacional (unir tabla clientes consigo misma)
      const { data, error } = await supabase
        .from('clientes')
        .select(`
          id,
          nombre,
          tipo,
          cliente_facturacion_id,
          email,
          telefono,
          direccion,
          notas,
          creado_en,
          parent:cliente_facturacion_id (
            nombre
          )
        `)
        .order('nombre', { ascending: true })

      if (error) throw error

      // Mapeamos el resultado para mantener la compatibilidad con el frontend
      return { success: true, data: data.map(item => ({
        id: item.id,
        nombre: item.nombre,
        tipo: item.tipo,
        // Mapeo snake_case a camelCase
        clienteFacturacionId: item.cliente_facturacion_id,
        // Asignamos el nombre del broker para que las vistas de Vue lo muestren sin cambios
        clienteFacturacionAsociado: item.parent ? item.parent.nombre : '',
        email: item.email || '',
        telefono: item.telefono || '',
        direccion: item.direccion || '',
        notas: item.notas || '',
        creadoEn: item.creado_en
      })) };
    } catch (error) {
      console.error("Error al obtener clientes desde Supabase:", error)
      return { success: false, error }
    }
  },

  // Agrega un nuevo cliente, resolviendo el UUID del broker por su nombre
  async agregarCliente(cliente) {
    try {
      let parentId = null

      // Si viene un nombre de broker asociado, buscamos su UUID
      if (cliente.clienteFacturacionAsociado) {
        const { data: broker, error: brokerErr } = await supabase
          .from('clientes')
          .select('id')
          .eq('nombre', cliente.clienteFacturacionAsociado.trim())
          .maybeSingle()

        if (!brokerErr && broker) {
          parentId = broker.id
        }
      }

      const { data, error } = await supabase
        .from('clientes')
        .insert([{
          nombre: cliente.nombre.trim(),
          tipo: cliente.tipo,
          cliente_facturacion_id: parentId,
          email: cliente.email || null,
          telefono: cliente.telefono || null,
          direccion: cliente.direccion || null,
          notas: cliente.notas || null
        }])
        .select()

      if (error) throw error
      return { success: true, data: data[0] }
    } catch (error) {
      console.error("Error al agregar cliente en Supabase:", error)
      return { success: false, error }
    }
  },

  // Actualiza los datos de un cliente
  async actualizarCliente(id, cliente) {
    if (!id || id === 'undefined') {
      console.warn("Intento de actualizar cliente con ID inválido:", id)
      return { success: false, error: new Error("ID inválido") }
    }
    try {
      let parentId = null

      if (cliente.clienteFacturacionAsociado) {
        const { data: broker, error: brokerErr } = await supabase
          .from('clientes')
          .select('id')
          .eq('nombre', cliente.clienteFacturacionAsociado.trim())
          .maybeSingle()

        if (!brokerErr && broker) {
          parentId = broker.id
        }
      }

      const { data, error } = await supabase
        .from('clientes')
        .update({
          nombre: cliente.nombre.trim(),
          tipo: cliente.tipo,
          cliente_facturacion_id: parentId,
          email: cliente.email || null,
          telefono: cliente.telefono || null,
          direccion: cliente.direccion || null,
          notas: cliente.notas || null
        })
        .eq('id', id)
        .select()

      if (error) throw error
      return { success: true, data: data[0] }
    } catch (error) {
      console.error("Error al actualizar cliente en Supabase:", error)
      return { success: false, error }
    }
  },

  // Elimina un cliente por su UUID
  async eliminarCliente(id) {
    try {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error("Error al eliminar cliente en Supabase:", error)
      return { success: false, error }
    }
  },

  // Inserta múltiples clientes de golpe en Supabase
  async agregarClientesMasivos(payload) {
    try {
      const dbPayload = payload.map(c => ({
        ...c,
        cliente_facturacion_id: c.clienteFacturacionId
      }))
      // Limpiar camelCase
      dbPayload.forEach(c => delete c.clienteFacturacionId)

      const { data, error } = await supabase
        .from('clientes')
        .insert(dbPayload)
        .select()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error("Error al agregar clientes masivos en Supabase:", error)
      return { success: false, error }
    }
  },

  // Actualiza múltiples clientes usando upsert en Supabase
  async upsertClientesMasivos(payload) {
    try {
      const dbPayload = payload.map(c => ({
        ...c,
        cliente_facturacion_id: c.clienteFacturacionId
      }))
      // Limpiar camelCase
      dbPayload.forEach(c => delete c.clienteFacturacionId)

      const { data, error } = await supabase
        .from('clientes')
        .upsert(dbPayload)
        .select()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error("Error al hacer upsert masivo de clientes en Supabase:", error)
      return { success: false, error }
    }
  },

  // Centraliza la lógica de crear clientes (Facturación/Envío) a partir de pedidos
  async resolverClientesDePedidos(pedidos, mapaClientes = null) {
    try {
      if (!mapaClientes) {
        const res = await this.obtenerClientes()
        const clientesExistentes = res.success ? res.data : []
        mapaClientes = new Map(clientesExistentes.map(c => [c.nombre.toLowerCase().trim(), c]))
      }

      const clientesParaAgregarFacturacion = []
      const clientesParaAgregarEnvio = []
      const clientesParaActualizar = []

      for (const order of pedidos) {
          const billName = (order.clienteFacturacion || order.cliente_facturacion || '').trim()
          const shipName = (order.clienteEnvio || order.cliente_envio || '').trim()

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

      // Insertar Facturación
      if (clientesParaAgregarFacturacion.length > 0) {
          const insertadosFact = await this.agregarClientesMasivos(
              clientesParaAgregarFacturacion.map(c => ({
                  nombre: c.nombre.trim(),
                  tipo: c.tipo,
                  clienteFacturacionId: null,
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

      // Insertar Envío
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
                  clienteFacturacionId: parentId,
                  email: null,
                  telefono: null,
                  direccion: null,
                  notas: null
              }
          })
          await this.agregarClientesMasivos(payloadEnvio)
      }

      // Actualizar Upserts
      if (clientesParaActualizar.length > 0) {
          const payloadUpsert = clientesParaActualizar.map(c => {
              let parentId = c.clienteFacturacionId || null
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
                  clienteFacturacionId: parentId,
                  email: c.email || null,
                  telefono: c.telefono || null,
                  direccion: c.direccion || null,
                  notas: c.notas || null
              }
          })
          await this.upsertClientesMasivos(payloadUpsert)
      }

      return { success: true, data: (clientesParaAgregarFacturacion.length > 0 || clientesParaAgregarEnvio.length > 0 || clientesParaActualizar.length > 0) }
    } catch (error) {
        console.error('Error al resolver clientes de pedidos:', error)
        return { success: false, error }
    }
  }
}
