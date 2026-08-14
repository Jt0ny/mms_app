import RecetaClient from '../client/RecetaClient'
import UsuarioClient from '../client/UsuarioClient'
import MaterialClient from '../client/MaterialClient'
import MateriaPrimaClient from '../client/MateriaPrimaClient'
import ClienteClient from '../client/ClienteClient'

// Estado global de promesas
let recetasPromise = null
let usuariosPromise = null
let operadoresPromise = null
let materialesPromise = null
let materiaPrimaPromise = null
let clientesPromise = null

export function useCatalogos() {

  async function obtenerRecetas(forceRefresh = false) {
    if (!recetasPromise || forceRefresh) {
      recetasPromise = RecetaClient.obtenerRecetas().then(res => {
        if (res?.success === false) {
          recetasPromise = null
          return res
        }
        return { success: true, data: res?.success !== undefined ? (res.data || []) : (res || []) }
      })
    }
    return recetasPromise
  }

  async function obtenerUsuarios(forceRefresh = false) {
    if (!usuariosPromise || forceRefresh) {
      usuariosPromise = UsuarioClient.obtenerUsuarios().then(res => {
        if (res?.success === false) {
          usuariosPromise = null
          return res
        }
        return { success: true, data: res?.success !== undefined ? (res.data || []) : (res || []) }
      })
    }
    return usuariosPromise
  }

  async function obtenerOperadores(forceRefresh = false) {
    if (!operadoresPromise || forceRefresh) {
      operadoresPromise = obtenerUsuarios(forceRefresh).then(res => {
        if (res?.success === false) {
          operadoresPromise = null
          return res
        }
        const operadores = (res.data || []).filter(u => String(u.rol).toLowerCase().trim() === 'operador')
        return { success: true, data: operadores }
      })
    }
    return operadoresPromise
  }

  async function obtenerMateriales(forceRefresh = false) {
    if (!materialesPromise || forceRefresh) {
      materialesPromise = MaterialClient.obtenerMateriales().then(res => {
        if (res?.success === false) {
          materialesPromise = null
          return res
        }
        return { success: true, data: res?.success !== undefined ? (res.data || []) : (res || []) }
      })
    }
    return materialesPromise
  }

  async function obtenerMateriaPrima(forceRefresh = false) {
    if (!materiaPrimaPromise || forceRefresh) {
      materiaPrimaPromise = MateriaPrimaClient.obtenerMateriaPrima().then(res => {
        if (res?.success === false) {
          materiaPrimaPromise = null
          return res
        }
        return { success: true, data: res?.success !== undefined ? (res.data || []) : (res || []) }
      })
    }
    return materiaPrimaPromise
  }

  async function obtenerClientes(forceRefresh = false) {
    if (!clientesPromise || forceRefresh) {
      clientesPromise = ClienteClient.obtenerClientes().then(res => {
        if (res?.success === false) {
          clientesPromise = null
          return res
        }
        return { success: true, data: res?.success !== undefined ? (res.data || []) : (res || []) }
      })
    }
    return clientesPromise
  }

  function invalidar() {
    recetasPromise = null
    usuariosPromise = null
    operadoresPromise = null
    materialesPromise = null
    materiaPrimaPromise = null
    clientesPromise = null
  }

  return {
    obtenerRecetas,
    obtenerUsuarios,
    obtenerOperadores,
    obtenerMateriales,
    obtenerMateriaPrima,
    obtenerClientes,
    invalidar
  }
}
