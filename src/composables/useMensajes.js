import { reactive } from 'vue'

export function useMensajes() {
    const state = reactive({
        mensaje: { tipo: null, texto: '' }
    })

    function mostrarMensaje(tipo, texto, duracion = 4000) {
        state.mensaje = { tipo, texto }
        if (duracion > 0) {
            setTimeout(() => { state.mensaje = { tipo: null, texto: '' } }, duracion)
        }
    }

    return { state, mostrarMensaje }
}
