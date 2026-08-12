import { ref } from 'vue'
import * as XLSX from 'xlsx'

export function useExcel() {

    const cargandoExcel = ref(false)

    //Lee un archivo Excel y devuelve un arreglo de datos JSON.
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

    //Normaliza las claves de una fila de datos Excel.
    //Convierte las claves a minúsculas y elimina los espacios en blanco.
    function normalizarClaves(fila) {
        const norm = {}
        Object.keys(fila).forEach(key => {
            norm[key.toLowerCase().replace(/\s+/g, '')] = fila[key]
        })
        return norm
    }

    return { cargandoExcel, leerExcel, normalizarClaves }
}
