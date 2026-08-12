<template>
  <div class="data-card p-6">
    <div class="mb-6">
      <h2 class="form-title-lg">Registrar Merma</h2>
    </div>

    <!-- Alerta informativa del estado de filtrado por planificacion -->
    <Alertas v-if="filtroInfo" :mensaje="filtroInfo" class="mb-4" />

    <form @submit.prevent="enviarFormulario" class="merma-form">
      <!-- Operador Responsable -->
      <MermaOperadorSelector v-model="form.operadorId" :operadores="operadoresLista" />

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

      <div class="form-actions">
        <button type="submit" class="btn btn-primary btn-block" :disabled="guardando || cargandoRecursos">
          {{ guardando ? 'Registrando...' : 'Registrar Merma' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script>
import MermaTipoSelector from './MermaTipoSelector.vue'
import MermaMotivoSelector from './MermaMotivoSelector.vue'
import Alertas from '../Alertas.vue'
import MermaOperadorSelector from './MermaOperadorSelector.vue'
import { obtenerFechaHoy } from '../../utils/date.js'

export default {
  name: 'MermaForm',
  components: {
    MermaTipoSelector,
    MermaMotivoSelector,
    Alertas,
    MermaOperadorSelector
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
    operadoresLista: {
      type: Array,
      default: () => []
    },
    filtroInfo: {
      type: Object,
      default: null
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
  emits: ['guardar', 'cambio-filtro'],
  data() {
    return {
      form: {
        operadorId: '',
        fecha: obtenerFechaHoy(),
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
          extraInfo: item.cantidadTotal !== undefined ? `${item.cantidadTotal} tallos en stock` : ''
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
    },
    'form.operadorId'(newOpId) {
      this.$emit('cambio-filtro', { operadorId: newOpId, fecha: this.form.fecha })
    },
    'form.fecha'(newFecha) {
      this.$emit('cambio-filtro', { operadorId: this.form.operadorId, fecha: newFecha })
    }
  },
  methods: {
    enviarFormulario() {
      if (!this.form.operadorId || !this.form.referenciaId || !this.form.cantidad || this.form.cantidad <= 0 || !this.form.motivo) {
        return
      }
      const motivoFinal = this.form.motivo === 'Otro' ? this.form.otroMotivo : this.form.motivo

      // Encontrar el nombre del operador
      const opObj = this.operadoresLista.find(o => o.id === this.form.operadorId)

      const payload = {
        fecha: this.form.fecha,
        tipo: this.form.tipo,
        referenciaId: this.form.referenciaId,
        nombre: this.form.nombre,
        cantidad: Math.trunc(this.form.cantidad),
        motivo: motivoFinal,
        operadorId: this.form.operadorId,
        operadorNombre: opObj ? opObj.nombre : 'operador',
        creadoEn: new Date().toISOString()
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
      // Conservamos el operador y la fecha para facilitar cargas consecutivas
    }
  }
}
</script>

<style scoped>

</style>
