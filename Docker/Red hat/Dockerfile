# ==========================================
# Etapa 1: Construcción (Build Stage)
# ==========================================
FROM node:22-alpine AS build-stage

WORKDIR /app

# Dependencias
COPY package*.json ./
RUN npm install

# Código fuente
COPY . .

# Argumentos con valores de producción
ARG VITE_SUPABASE_URL=https://nvdyyxfemqwjfrlrokgx.supabase.co
ARG VITE_SUPABASE_ANON_KEY=sb_publishable_Hkm2ulzCTVW5XFyrK3BWSA_IuJBdrPg
ARG VITE_API_PEDIDOS_URL=http://localhost:8060/pedidos
ARG VITE_API_MATERIA_PRIMA_URL=http://localhost:8070/materia-prima
ARG VITE_API_MATERIALES_URL=http://localhost:8090/materiales

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
    VITE_API_PEDIDOS_URL=$VITE_API_PEDIDOS_URL \
    VITE_API_MATERIA_PRIMA_URL=$VITE_API_MATERIA_PRIMA_URL \
    VITE_API_MATERIALES_URL=$VITE_API_MATERIALES_URL

# Compilar la aplicación para producción
RUN npm run build

# ==========================================
# Etapa 2: Servidor Nginx Unprivileged (OpenShift Compatible)
# ==========================================
# Imagen oficial no-root de Nginx diseñada específicamente para Red Hat OpenShift y Kubernetes
FROM nginxinc/nginx-unprivileged:alpine AS production-stage

# Copiar configuración de Nginx en puerto 8080
COPY ["Docker/Red hat/nginx.conf", "/etc/nginx/conf.d/default.conf"]

# Copiar archivos compilados
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Copiar script de entrypoint para soporte de variables de entorno en runtime
COPY ["Docker/Red hat/entrypoint.sh", "/entrypoint.sh"]

# Dar permisos al entrypoint y al directorio html para cualquier usuario no-root de OpenShift
USER root
RUN sed -i 's/\r$//' /entrypoint.sh && \
    chmod +x /entrypoint.sh && \
    chown -R 101:0 /usr/share/nginx/html && \
    chmod -R g+rwx /usr/share/nginx/html && \
    chmod -R 777 /usr/share/nginx/html
USER 101

# Puerto no privilegiado 8080 requerido por OpenShift
EXPOSE 8080

ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]

