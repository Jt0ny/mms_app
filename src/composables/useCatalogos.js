import { ref } from 'vue'
import RecetaClient from '../client/RecetaClient'
import UsuarioClient from '../client/UsuarioClient'
import MaterialClient from '../client/MaterialClient'
import MateriaPrimaClient from '../client/MateriaPrimaClient'
import ClientesClient from '../client/ClientesClient'

// Estado global en caché
const recetasCache = ref(null)
const operadoresCache = ref(null) // Solo guardamos los filtrados con rol 'operador'
const usuariosCache = ref(null)   // Todos los usuarios
const materialesCache = ref(null)
const materiaPrimaCache = ref(null)
const clientesCache = ref(null)

export function useCatalogos() {

  async function obtenerRecetas(forceRefresh = false) {
    if (!recetasCache.value || forceRefresh) {
      const res = await RecetaClient.obtenerRecetas()
      if (res?.success === false) return res; // Propaga el error a la vista
      recetasCache.value = res?.success !== undefined ? (res.data || []) : (res || [])
    }
    return { success: true, data: recetasCache.value }
  }

  async function obtenerUsuarios(forceRefresh = false) {
    if (!usuariosCache.value || forceRefresh) {
      const res = await UsuarioClient.obtenerUsuarios()
      if (res?.success === false) return res;
      usuariosCache.value = res?.success !== undefined ? (res.data || []) : (res || [])
      // Actualizar también el caché derivado de operadores
      operadoresCache.value = (usuariosCache.value || []).filter(
        u => String(u.rol).toLowerCase().trim() === 'operador'
      )
    }
    return { success: true, data: usuariosCache.value }
  }

  async function obtenerOperadores(forceRefresh = false) {
    if (!operadoresCache.value || forceRefresh) {
      const res = await obtenerUsuarios(forceRefresh) // obtenerUsuarios actualiza ambos cachés
      if (res?.success === false) return res;
    }
    return { success: true, data: operadoresCache.value }
  }

  async function obtenerMateriales(forceRefresh = false) {
    if (!materialesCache.value || forceRefresh) {
      const res = await MaterialClient.obtenerMateriales()
      if (res?.success === false) return res;
      materialesCache.value = res?.success !== undefined ? (res.data || []) : (res || [])
    }
    return { success: true, data: materialesCache.value }
  }

  async function obtenerMateriaPrima(forceRefresh = false) {
    if (!materiaPrimaCache.value || forceRefresh) {
      const res = await MateriaPrimaClient.obtenerMateriaPrima()
      if (res?.success === false) return res;
      materiaPrimaCache.value = res?.success !== undefined ? (res.data || []) : (res || [])
    }
    return { success: true, data: materiaPrimaCache.value }
  }

  async function obtenerClientes(forceRefresh = false) {
    if (!clientesCache.value || forceRefresh) {
      const res = await ClientesClient.obtenerClientes()
      if (res?.success === false) return res;
      clientesCache.value = res?.success !== undefined ? (res.data || []) : (res || [])
    }
    return { success: true, data: clientesCache.value }
  }

  function invalidar() {
    recetasCache.value = null
    operadoresCache.value = null
    usuariosCache.value = null
    materialesCache.value = null
    materiaPrimaCache.value = null
    clientesCache.value = null
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
