import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Crear datos de ejemplo
const datosEjemplo = [
  { Variety: 'Red Roses', 'Total Stems': 150 },
  { Variety: 'Pink Roses', 'Total Stems': 200 },
  { Variety: 'White Roses', 'Total Stems': 175 },
  { Variety: 'Yellow Roses', 'Total Stems': 120 },
  { Variety: 'Red Roses', 'Total Stems': 90 }  // Mismo tipo, se debe sumar
];

// Crear un nuevo workbook
const workbook = XLSX.utils.book_new();

// Convertir datos a worksheet
const worksheet = XLSX.utils.json_to_sheet(datosEjemplo);

// Agregar el worksheet al workbook
XLSX.utils.book_append_sheet(workbook, worksheet, 'Produccion');

// Definir anchos de columna
worksheet['!cols'] = [
  { wch: 20 }, // Variety
  { wch: 15 }  // Total Stems
];

// Guardar en formato XLSX (nuevo)
const rutaXLSX = path.join(__dirname, 'public', 'Ejemplo_Produccion.xlsx');
XLSX.writeFile(workbook, rutaXLSX);
console.log('✓ Archivo XLSX creado en:', rutaXLSX);

// Guardar en formato XLS (antiguo) - usando la opción bookType
const rutaXLS = path.join(__dirname, 'public', 'Ejemplo_Produccion.xls');
XLSX.writeFile(workbook, rutaXLS, { bookType: 'biff8' });
console.log('✓ Archivo XLS creado en:', rutaXLS);

console.log('\nDatos de ejemplo:');
console.table(datosEjemplo);
console.log('\n📥 Ambos archivos están listos para descargar en tu aplicación!');
