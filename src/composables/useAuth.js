/**
 * Composable para centralizar la lógica de autenticación y sesión.
 * Reemplaza los usos dispersos de localStorage.getItem('rol'), etc.
 *
 * En componentes Vue: usar en setup() para acceso reactivo
 * En router/scripts: usar las funciones helper exportadas (getRol, getIsLogged)
 */

import { reactive, computed } from 'vue'
import { useCatalogos } from './useCatalogos'

// Estado global compartido entre todas las instancias
const state = reactive({
    rol: sessionStorage.getItem('rol') || null,
    usuarioId: sessionStorage.getItem('usuarioId') || null,
    usuarioNombre: sessionStorage.getItem('usuarioNombre') || null
})

/**
 * Composable para componentes Vue (usar dentro de setup())
 */
export function useAuth() {
    const isLogged = computed(() => !!state.rol)

    function login(usuario) {
        const rol = (usuario.rol || '').toLowerCase()
        state.rol = rol
        state.usuarioId = usuario.id ?? ''
        state.usuarioNombre = usuario.nombre ?? ''

        sessionStorage.setItem('rol', rol)
        sessionStorage.setItem('usuarioId', state.usuarioId)
        sessionStorage.setItem('usuarioNombre', state.usuarioNombre)
    }

    function logout() {
        state.rol = null
        state.usuarioId = null
        state.usuarioNombre = null

        sessionStorage.removeItem('rol')
        sessionStorage.removeItem('usuarioId')
        sessionStorage.removeItem('usuarioNombre')

        // Invalidar el estado global de catálogos para evitar fuga de datos entre sesiones
        const { invalidar } = useCatalogos()
        invalidar()
    }

    return {
        rol: computed(() => state.rol),
        usuarioId: computed(() => state.usuarioId),
        usuarioNombre: computed(() => state.usuarioNombre),
        isLogged,
        login,
        logout
    }
}

/**
 * Funciones helper para uso fuera de componentes Vue (router, scripts)
 */
export function getRol() {
    return state.rol || sessionStorage.getItem('rol')
}

export function getIsLogged() {
    return !!getRol()
}
