/**
 * Composable para centralizar la lógica de autenticación y sesión.
 * Usa Supabase Auth y variables reactivas, reemplazando sessionStorage.
 *
 * En componentes Vue: usar en setup() para acceso reactivo
 * En router/scripts: usar las funciones helper exportadas
 */

import { reactive, computed } from 'vue'
import UsuarioClient from '../client/UsuarioClient'
import { useCatalogos } from './useCatalogos'

const state = reactive({
  rol: null,
  usuarioId: null,
  usuarioNombre: null,
  inicializado: false  // Flag para saber si ya se verificó la sesión
})

export function useAuth() {
  const isLogged = computed(() => !!state.rol)

  // Inicializar: recuperar sesión existente al cargar la app
  async function inicializar() {
    if (state.inicializado) return

    const usuario = await UsuarioClient.obtenerSesion()
    if (usuario) {
      state.rol = (usuario.rol || '').toLowerCase()
      state.usuarioId = usuario.id
      state.usuarioNombre = usuario.nombre
    }
    state.inicializado = true
  }

  // Login: recibe el objeto usuario retornado por UsuarioClient.login()
  function setUsuario(usuario) {
    const rol = (usuario.rol || '').toLowerCase()
    state.rol = rol
    state.usuarioId = usuario.id ?? ''
    state.usuarioNombre = usuario.nombre ?? ''
  }

  // Logout: cierra sesión en Supabase y limpia estado local
  async function logout() {
    await UsuarioClient.logout()

    state.rol = null
    state.usuarioId = null
    state.usuarioNombre = null

    const { invalidar } = useCatalogos()
    invalidar()
  }

  return {
    rol: computed(() => state.rol),
    usuarioId: computed(() => state.usuarioId),
    usuarioNombre: computed(() => state.usuarioNombre),
    isLogged,
    inicializado: computed(() => state.inicializado),
    inicializar,
    login: setUsuario,   // Mantener nombre 'login' para compatibilidad
    logout
  }
}

// Helpers para router
export function obtenerRol() {
  return state.rol
}

export function estaAutenticado() {
  return !!state.rol
}

export function estaInicializado() {
  return state.inicializado
}
