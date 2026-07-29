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
      recetasCache.value = await RecetaClient.obtenerRecetas()
    }
    return recetasCache.value
  }

  async function obtenerUsuarios(forceRefresh = false) {
    if (!usuariosCache.value || forceRefresh) {
      usuariosCache.value = await UsuarioClient.obtenerUsuarios()
      // Actualizar también el caché derivado de operadores
      operadoresCache.value = (usuariosCache.value || []).filter(
        u => String(u.rol).toLowerCase().trim() === 'operador'
      )
    }
    return usuariosCache.value
  }

  async function obtenerOperadores(forceRefresh = false) {
    if (!operadoresCache.value || forceRefresh) {
      await obtenerUsuarios(forceRefresh) // obtenerUsuarios actualiza ambos cachés
    }
    return operadoresCache.value
  }

  async function obtenerMateriales(forceRefresh = false) {
    if (!materialesCache.value || forceRefresh) {
      materialesCache.value = await MaterialClient.obtenerMateriales()
    }
    return materialesCache.value
  }

  async function obtenerMateriaPrima(forceRefresh = false) {
    if (!materiaPrimaCache.value || forceRefresh) {
      materiaPrimaCache.value = await MateriaPrimaClient.obtenerMateriaPrima()
    }
    return materiaPrimaCache.value
  }

  async function obtenerClientes(forceRefresh = false) {
    if (!clientesCache.value || forceRefresh) {
      clientesCache.value = await ClientesClient.obtenerClientes()
    }
    return clientesCache.value
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
