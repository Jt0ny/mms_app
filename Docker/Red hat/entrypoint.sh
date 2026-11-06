#!/bin/sh
set -e

# ==============================================================================
# Inyección dinámica de variables de entorno en Runtime para Vue / Vite
# Genera el archivo config.js que el navegador descarga antes de la app
# ==============================================================================
echo "Generando /usr/share/nginx/html/config.js con las variables del contenedor..."

cat <<EOF > /usr/share/nginx/html/config.js
window.__ENV__ = {
  VITE_SUPABASE_URL: "${VITE_SUPABASE_URL}",
  VITE_SUPABASE_ANON_KEY: "${VITE_SUPABASE_ANON_KEY}",
  VITE_API_PEDIDOS_URL: "${VITE_API_PEDIDOS_URL}",
  VITE_API_MATERIA_PRIMA_URL: "${VITE_API_MATERIA_PRIMA_URL}",
  VITE_API_MATERIALES_URL: "${VITE_API_MATERIALES_URL}"
};
EOF

echo "Variables inyectadas con éxito. Iniciando Nginx..."

# Ejecutar el comando original (nginx)
exec "$@"
