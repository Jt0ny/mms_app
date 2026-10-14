
export const UMBRAL_MINIMO_TALLOS = 100;
export const UMBRAL_MINIMO_MATERIALES = 100;


export function clasificarEstadoStock(cantidad, umbral = 200) {
    const cant = Number(cantidad) || 0;
    if (cant <= 0) {
        return {
            estado: 'agotado',
            label: 'Agotado',
            badgeClass: 'badge-danger'
        };
    }
    if (cant < umbral) {
        return {
            estado: 'bajo',
            label: 'Stock Bajo',
            badgeClass: 'badge-warning'
        };
    }
    return {
        estado: 'optimo',
        label: 'Óptimo',
        badgeClass: 'badge-success'
    };
}
