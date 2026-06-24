<template>
  <div class="merma-form-card">
    <div class="header">
      <h2>Registrar Merma</h2>
    </div>

    <form @submit.prevent="enviarFormulario" class="merma-form">
      <!-- Fecha -->
      <div class="form-group">
        <label class="form-label" for="fecha-merma">Fecha de Registro</label>
        <input id="fecha-merma" v-model="form.fecha" type="date" class="form-input" required />
      </div>

      <!-- Tipo de Merma -->
      <div class="form-group">
        <label class="form-label">Tipo de Merma</label>
        <MermaTipoSelector v-model="form.tipo" />
      </div>

      <!-- Selección del Elemento -->
      <div class="form-group">
        <label class="form-label" for="elemento-merma">Seleccionar {{ nombreTipoElemento }}</label>
        <select id="elemento-merma" v-model="form.referenciaId" class="form-select" required
          :disabled="cargandoRecursos || elementosDisponibles.length === 0">
          <option value="" disabled>
            {{ cargandoRecursos ? 'Cargando recursos...' :
              (elementosDisponibles.length === 0 ? 'No hay elementos disponibles' : 'Seleccionar elemento ') }}
          </option>
          <option v-for="item in elementosDisponibles" :key="item.id" :value="item.id">
            {{ item.nombre }} {{ item.extraInfo ? `(${item.extraInfo})` : '' }}
          </option>
        </select>
      </div>

      <!-- Cantidad -->
      <div class="form-group">
        <label class="form-label" for="cantidad-merma">Cantidad</label>
        <input id="cantidad-merma" v-model.number="form.cantidad" type="number" min="1" step="1" class="form-input"
          placeholder="Cantidad perdida" required />
      </div>

      <!-- Motivo -->
      <MermaMotivoSelector v-model:motivo="form.motivo" v-model:otroMotivo="form.otroMotivo" />

      <div class="actions">
        <button type="submit" class="btn btn-primary" :disabled="guardando || cargandoRecursos">
          {{ guardando ? 'Registrando...' : 'Registrar Merma' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script>
import MermaTipoSelector from './MermaTipoSelector.vue'
import MermaMotivoSelector from './MermaMotivoSelector.vue'

export default {
  name: 'MermaForm',
  components: {
    MermaTipoSelector,
    MermaMotivoSelector
  },
  props: {
    materiaPrimaLista: {
      type: Array,
      default: () => []
    },
    materialesLista: {
      type: Array,
      default: () => []
    },
    recetasLista: {
      type: Array,
      default: () => []
    },
    cargandoRecursos: {
      type: Boolean,
      default: false
    },
    guardando: {
      type: Boolean,
      default: false
    }
  },
  emits: ['guardar'],
  data() {
    return {
      form: {
        fecha: this.obtenerFechaHoy(),
        tipo: 'materia_prima',
        referenciaId: '',
        nombre: '',
        cantidad: null,
        motivo: '',
        otroMotivo: ''
      }
    }
  },
  computed: {
    nombreTipoElemento() {
      switch (this.form.tipo) {
        case 'materia_prima': return 'Variedad de Flor'
        case 'material': return 'Material'
        case 'producto_terminado': return 'Receta / Producto'
        default: return 'Elemento'
      }
    },
    elementosDisponibles() {
      if (this.form.tipo === 'materia_prima') {
        return this.materiaPrimaLista.map(item => ({
          id: item.id || item.variedad,
          nombre: item.variedad,
          extraInfo: item.cantidad_total !== undefined ? `${item.cantidad_total} tallos en stock` : ''
        }))
      } else if (this.form.tipo === 'material') {
        return this.materialesLista.map(item => ({
          id: item.id,
          nombre: item.nombre,
          extraInfo: item.cantidad !== undefined ? `${item.cantidad} unidades` : ''
        }))
      } else if (this.form.tipo === 'producto_terminado') {
        return this.recetasLista.map(item => ({
          id: item.id,
          nombre: item.nombre,
          extraInfo: item.categoria ? `${item.categoria}` : ''
        }))
      }
      return []
    }
  },
  watch: {
    'form.tipo'() {
      this.form.referenciaId = ''
      this.form.nombre = ''
    },
    'form.referenciaId'(newId) {
      if (!newId) {
        this.form.nombre = ''
        return
      }
      const match = this.elementosDisponibles.find(item => item.id === newId)
      if (match) {
        this.form.nombre = match.nombre
      }
    }
  },
  methods: {
    obtenerFechaHoy() {
      const fecha = new Date()
      const fechaLocal = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000)
      return fechaLocal.toISOString().slice(0, 10)
    },
    enviarFormulario() {
      if (!this.form.referenciaId || !this.form.cantidad || this.form.cantidad <= 0 || !this.form.motivo) {
        return
      }
      const motivoFinal = this.form.motivo === 'Otro' ? this.form.otroMotivo : this.form.motivo
      const payload = {
        fecha: this.form.fecha,
        tipo: this.form.tipo,
        referenciaId: this.form.referenciaId,
        nombre: this.form.nombre,
        cantidad: Math.trunc(this.form.cantidad),
        motivo: motivoFinal,
        creado_en: new Date().toISOString()
      }
      this.$emit('guardar', payload)
      this.resetearFormulario()
    },
    resetearFormulario() {
      this.form.referenciaId = ''
      this.form.nombre = ''
      this.form.cantidad = null
      this.form.motivo = ''
      this.form.otroMotivo = ''
      this.form.fecha = this.obtenerFechaHoy()
    }
  }
}
</script>

<style scoped>
.merma-form-card {
  background: var(--bg);
  border: 1px solid var(--border-light);
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow);
}

.header {
  margin-bottom: 24px;
}

.header h2 {
  margin: 0 0 6px;
  font-size: clamp(18px, 2vw, 22px);
  color: var(--text-h);
}

.merma-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.btn {
  border: none;
  border-radius: 8px;
  padding: 10px 18px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
}

.btn-primary {
  background: var(--primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-dark);
  transform: translateY(-1px);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
