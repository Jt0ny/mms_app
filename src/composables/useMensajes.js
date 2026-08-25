import { reactive } from 'vue'

export function useMensajes() {
    const mensaje = reactive({ tipo: null, texto: '' })
    const mensajeInline = reactive({ tipo: null, texto: '' })

    function mostrarMensaje(tipo, texto, duracion = 4000) {
        mensaje.tipo = tipo
        mensaje.texto = texto
        if (duracion > 0) {
            setTimeout(() => { mensaje.tipo = null; mensaje.texto = '' }, duracion)
        }
    }

    function mostrarMensajeInline(tipo, texto, duracion = 5000) {
        mensajeInline.tipo = tipo
        mensajeInline.texto = texto
        if (duracion > 0) {
            setTimeout(() => { mensajeInline.tipo = null; mensajeInline.texto = '' }, duracion)
        }
    }

    return { mensaje, mostrarMensaje, mensajeInline, mostrarMensajeInline }
}
