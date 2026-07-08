import { reactive } from 'vue'

export function useMensajes() {

    const mensaje = reactive({ tipo: null, texto: '' })

    function mostrarMensaje(tipo, texto, duracion = 4000) {
        mensaje.tipo = tipo
        mensaje.texto = texto
        if (duracion > 0) {
            setTimeout(() => { mensaje.tipo = null; mensaje.texto = '' }, duracion)
        }
    }

    return { mensaje, mostrarMensaje }
}
