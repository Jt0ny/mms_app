export function obtenerFechaHoy() {
    const fecha = new Date()
    const fechaLocal = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000)
    return fechaLocal.toISOString().slice(0, 10)
}

// Formatea una fecha ISO a formato legible local (es-EC)
export function formatearFecha(fecha) {
    if (!fecha) return '-'
    try {
        return new Date(fecha).toLocaleDateString('es-EC')
    } catch {
        return fecha
    }
}
