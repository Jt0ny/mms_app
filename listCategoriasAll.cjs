const fs = require('fs');
const path = require('path');

try {
  const dbPath = path.join(__dirname, 'db.json');
  const raw = fs.readFileSync(dbPath, 'utf8');
  const db = JSON.parse(raw);
  const recetas = Array.isArray(db.recetas) ? db.recetas : [];
  const pedidos = Array.isArray(db.pedidos) ? db.pedidos : [];

  const categoriasRecetas = recetas.map(r => String(r.categoria || '').trim()).filter(Boolean);
  const categoriasPedidos = pedidos.map(p => String(p.categoria || '').trim()).filter(Boolean);

  const categorias = [...new Set([...categoriasRecetas, ...categoriasPedidos])];
  console.log(JSON.stringify(categorias.sort(), null, 2));
} catch (err) {
  console.error('Error leyendo db.json:', err.message);
  process.exit(1);
}
