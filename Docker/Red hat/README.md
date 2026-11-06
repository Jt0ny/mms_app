# 🔴 Despliegue en Red Hat OpenShift

Este directorio contiene todos los archivos necesarios para construir la imagen Docker y desplegar **mms_app** en Red Hat OpenShift.

---

## 📁 Archivos del directorio

| Archivo | Descripción |
|---|---|
| `Dockerfile` | Build multi-etapa con `nginxinc/nginx-unprivileged:alpine` (non-root, puerto 8080). Compatible con OpenShift SCC `restricted-v2`. |
| `deployment.yml` | Manifiestos de Kubernetes/OpenShift: Deployment, Service, Route y HPA. |
| `nginx.conf` | Configuración de Nginx en puerto 8080 con soporte para Vue Router (HTML5 History Mode). |
| `entrypoint.sh` | Script de inyección dinámica de variables de entorno en runtime (`config.js`). |
| `README.md` | Este archivo. |

---

## 📦 Componentes incluidos en `deployment.yml`:

1. **`Deployment` (`mms-web`)**: Descarga la imagen `anthonyjoel/mms_app:vr` desde Docker Hub y la ejecuta con 1 réplica en puerto 8080. Incluye probes de salud (liveness/readiness).
2. **`Service` (`mms-web-service`)**: Conecta internamente el puerto 8080 del Pod.
3. **`Route` (`mms-web-route`)**: Recurso nativo de OpenShift que asigna automáticamente un dominio público con certificado SSL/TLS (HTTPS).
4. **`HorizontalPodAutoscaler` (`mms-web-hpa`)**: Autoescalado de 1 a 3 réplicas basado en CPU y memoria (umbral 70%).

---

## 🐳 Cómo construir la imagen Docker

```bash
# Desde la raíz del proyecto (mms_app/)
docker build -f "Docker/Red hat/Dockerfile" -t anthonyjoel/mms_app:vr .

# Subir a Docker Hub
docker push anthonyjoel/mms_app:vr
```

---

## 🚀 Cómo desplegar en OpenShift

### Opción 1: Desde la consola web de OpenShift (Más fácil)
1. Inicia sesión en la consola web de tu clúster de OpenShift.
2. Selecciona o crea tu **Proyecto (Namespace)**.
3. En la esquina superior derecha, haz clic en el botón **`+` (Import YAML)**.
4. Copia y pega el contenido completo de `deployment.yml`.
5. Haz clic en **Create**.
6. Ve a la sección **Networking > Routes** para ver tu URL pública generada.

### Opción 2: Usando la CLI de OpenShift (`oc`)
```bash
# 1. Iniciar sesión en el clúster
oc login --token=<TU_TOKEN> --server=<TU_CLUSTER_URL>

# 2. Seleccionar tu proyecto
oc project <NOMBRE_DE_TU_PROYECTO>

# 3. Aplicar el archivo
oc apply -f Docker/"Red hat"/deployment.yml

# 4. Obtener la URL pública asignada
oc get route mms-web-route
```

---

## 🔄 Cambiar variables de entorno sin recompilar

La imagen utiliza inyección dinámica en runtime. Para cambiar las APIs o Supabase:

1. Edita las variables `env:` en `deployment.yml`.
2. Aplica los cambios: `oc apply -f Docker/"Red hat"/deployment.yml`
3. OpenShift reinicia el pod automáticamente con las nuevas variables.

**No es necesario** recompilar la imagen ni hacer `docker build` ni `docker push`.
