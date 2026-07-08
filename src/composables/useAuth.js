/**
 * Composable para centralizar la lógica de autenticación y sesión.
 * Reemplaza los usos dispersos de localStorage.getItem('rol'), etc.
 *
 * En componentes Vue: usar en setup() para acceso reactivo
 * En router/scripts: usar las funciones helper exportadas (getRol, getIsLogged)
 */

import { reactive, computed } from 'vue'

// Estado global compartido entre todas las instancias
const state = reactive({
    rol: localStorage.getItem('rol') || null,
    usuarioId: localStorage.getItem('usuarioId') || null,
    usuarioNombre: localStorage.getItem('usuarioNombre') || null
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

        localStorage.setItem('rol', rol)
        localStorage.setItem('usuarioId', state.usuarioId)
        localStorage.setItem('usuarioNombre', state.usuarioNombre)
    }

    function logout() {
        state.rol = null
        state.usuarioId = null
        state.usuarioNombre = null

        localStorage.removeItem('rol')
        localStorage.removeItem('usuarioId')
        localStorage.removeItem('usuarioNombre')
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
    return state.rol || localStorage.getItem('rol')
}

export function getIsLogged() {
    return !!getRol()
}
