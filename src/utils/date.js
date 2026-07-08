export function obtenerFechaHoy() {
    const fecha = new Date()
    const fechaLocal = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000)
    return fechaLocal.toISOString().slice(0, 10)
}
