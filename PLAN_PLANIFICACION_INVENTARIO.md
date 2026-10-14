# Plan de Implementación: Planificación Sujeta a Disponibilidad de Inventario (Material-Constrained MRP)

## 1. 🎯 Objetivo y Enfoque

Actualmente el sistema planifica en base a la **Demanda** (los pedidos pendientes que solicitan los clientes).  
El objetivo de este nuevo modelo es permitir una planificación guiada o restringida por la **Capacidad Real de Abastecimiento**:

> *"El sistema evalúa la explosión de materiales (Bill of Materials - BOM) de cada receta seleccionada contra el stock real en bodega (`materia_prima` y `materiales`), alertando o restringiendo la asignación en tiempo real si no existe suficiente flor o insumos antes de distribuir la carga entre los operadores."*

---

## 2. 🔄 Comparativa del Flujo Operativo

```
FLUJO ACTUAL (Make-to-Order):
[Pedidos del Día] ──► [Mapeo de Recetas] ──► [Algoritmo Greedy LPT] ──► [Guarda Planificación]
                                                                                │
                                                                   (Alerta después en Dashboard)

NUEVO FLUJO (Material-Constrained MRP):
[Pedidos del Día] ──► [Mapeo de Recetas] ──► [VALIDACIÓN DE INVENTARIO] ──► [Algoritmo Greedy LPT]
                                                      │                                  │
                                          ¿Alcanza la flor/cajas?                        │
                                          ├── SÍ: Continúa                               │
                                          └── NO: Capa la cantidad a la                  │
                                                  disponibilidad real                    ▼
                                                                           [Guarda Planificación
                                                                            100% Viable]
```

---

## 3. 🗂️ Archivos a Modificar / Crear

| Componente / Archivo | Rol | Modificación |
| :--- | :--- | :--- |
| **`src/client/InventarioClient.js`** | Servicio | Función para calcular la explosión de materiales y stock disponible por receta. |
| **`src/client/PlanificacionAlgoritmo.js`** | Algoritmo | Integrar el filtro de capacidad máxima de inventario antes de la distribución Greedy. |
| **`src/components/planificacion/PlanificacionMapeoRecetas.vue`** | Interfaz | Mostrar en tiempo real badges de stock disponible, déficit y botón *"Ajustar al stock disponible"*. |
| **`src/components/planificacion/PlanificacionResumen.vue`** | Interfaz | Mostrar un semáforo de factibilidad de materiales antes de guardar. |

---

## 4. 🛠️ Detalle de Implementación Paso a Paso

### FASE 1: Motor de Cálculo de Factibilidad de Receta (BOM Explosion)
Se implementa una función analítica que determina el **Cuello de Botella** de cada receta:

$$\text{Capacidad Máxima Producible} = \min \left( \frac{\text{Stock Disponible Flor}_i}{\text{Flores requeridas por receta}_i}, \frac{\text{Stock Disponible Material}_j}{\text{Material requerido por receta}_j} \right)$$

* **Ejemplo Práctico:**
  * Si la receta *"Ramo San Valentín"* requiere: **12 Rosas Rojas** y **1 Capuchón Plástico**.
  * Y en bodega tienes: **600 Rosas Rojas** y **30 Capuchones**.
  * La flor alcanzaría para: $600 / 12 = 50\text{ ramos}$.
  * El material alcanzaría para: $30 / 1 = 30\text{ ramos}$.
  * **Capacidad máxima real permitida por inventario:** **30 ramos** *(el capuchón es el factor limitante / cuello de botella)*.

---

### FASE 2: Interfaz Visual en el Asistente de Mapeo (`PlanificacionMapeoRecetas.vue`)

Al momento en que el supervisor selecciona una receta y coloca los tallos a planificar, la pantalla le muestra el estado en vivo:

```
┌────────────────────────────────────────────────────────────────────────┐
│ Categoría: ROSAS ROJAS (Demanda solicitada: 1,000 stems)               │
├────────────────────────────────────────────────────────────────────────┤
│ Receta: Bouquet Pasión                                                 │
│ Cantidad a planificar: [  800  ] stems                                 │
│                                                                        │
│ 🟢 Flor disponible: 1,200 tallos (Suficiente)                          │
│ 🔴 Capuchón cónico: 400 unidades disp. (Déficit de 400 unidades)       │
│                                                                        │
│ [ ⚠️ Ajustar automáticamente a 400 stems según stock disponible ]     │
└────────────────────────────────────────────────────────────────────────┘
```

---

### FASE 3: Opciones de Política de Producción (Configuración de Restricción)

Para que el sistema responda a la realidad operativa de la empresa, se contemplan dos modos de operación seleccionables:

1. **Modo Estricto (Restricción Dura):**
   * El botón *"Confirmar y Planificar"* se deshabilita si existe déficit de materia prima o materiales.
   * Obliga a la planta a operar con **cero faltantes programados**.
2. **Modo Asistido / Advertencia (Recomendado):**
   * El sistema calcula el déficit y muestra una alerta modal interactiva:
     > *"Advertencia: La planificación excede el stock actual de flor en 350 tallos. ¿Deseas limitar la planificación al stock disponible (850 tallos) o continuar asumiendo que ingresará flor fresca hoy?"*
   * Permite al supervisor tomar la decisión respaldado por datos en tiempo real.

---

### FASE 4: Distribución de Carga (`PlanificacionAlgoritmo.js`)

Una vez validadas las cantidades contra el stock:
1. El algoritmo recibe únicamente las cantidades **factibles** de producir.
2. Aplica la heurística **Greedy LPT** para repartir esa carga ya validada equitativamente entre los operadores.
3. El resultado guardado en la base de datos garantiza que **ningún operador se quedará a mitad del turno con las manos vacías por falta de flores o cajas**.

---

## 5. 🎓 Evaluación para la Tesis: Pros y Contras

| Criterio | Mantener el modelo actual (Demanda + Alerta RF-22) | Implementar este nuevo plan (Sujeto a Stock) |
| :--- | :--- | :--- |
| **Alineación con el documento de tesis actual** | ✅ **100% alineado.** El RF-22 ya contempla alertar el déficit de inventario en el Dashboard. | ⚠️ Requeriría actualizar los requisitos funcionales del documento para añadir un RF de *"Planificación con restricción de inventario"*. |
| **Complejidad del código** | Simple, modular y ya probado. | Mayor complejidad algorítmica y validación en tiempo real. |
| **Realidad en poscosecha** | Muy común: los pedidos mandan y la flor llega en camiones durante el día. | Ideal para industrias con stock estático cerrado. |
| **Impacto académico** | Bueno, estándar en manufactura de flores bajo pedido (MTO). | Muy alto: demuestra capacidad de implementar algoritmos de planificación avanzada de materiales (MRP). |
