import { ref } from 'vue'
import * as XLSX from 'xlsx'

export function useExcel() {

    const cargandoExcel = ref(false)

    /**
     * Lee un archivo Excel y devuelve un arreglo de datos JSON.
     * @param {File} file - El archivo a procesar
     * @param {Object} options - Opciones pasadas a sheet_to_json (ej. { header: 1 })
     * @returns {Promise<Array>} Matriz de datos
     */
    async function leerExcel(file, options = { defval: '' }) {
        cargandoExcel.value = true
        try {
            const data = await file.arrayBuffer()
            const workbook = XLSX.read(data, { type: 'array' })
            const sheet = workbook.Sheets[workbook.SheetNames[0]]
            const rawData = XLSX.utils.sheet_to_json(sheet, options)

            if (!rawData || !rawData.length) {
                throw new Error('El archivo está vacío o es inválido')
            }
            return rawData
        } finally {
            cargandoExcel.value = false
        }
    }

    return { cargandoExcel, leerExcel }
}
