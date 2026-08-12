<!-- ClienteForm.vue -->
<template>
  <div class="data-card p-6">
    <div class="mb-5">
      <h2 class="form-title">
        {{ modoEdicion ? 'Editar Cliente' : 'Agregar Nuevo Cliente' }}
      </h2>
    </div>

    <form @submit.prevent="enviarFormulario">
      <!-- Nombre -->
      <div class="form-group">
        <label class="form-label" for="cliente-nombre">Nombre del Cliente *</label>
        <input id="cliente-nombre" v-model="form.nombre" type="text" class="form-input" required />
      </div>

      <!-- Tipo -->
      <div class="form-group">
        <label class="form-label" for="cliente-tipo">Tipo de Cliente *</label>
        <div class="select-wrapper">
          <select id="cliente-tipo" v-model="form.tipo" class="form-select" required>
            <option value="" disabled>-- Seleccionar tipo --</option>
            <option value="Facturación">Facturación</option>
            <option value="Envío">Envío</option>
            <option value="Ambos">Ambos</option>
          </select>
        </div>
      </div>

      <!-- Cliente Facturacion Asociado (Solo si es Envío) -->
      <div class="form-group" v-if="form.tipo === 'Envío'">
        <label class="form-label" for="cliente-asociado">Cliente Facturación Asociado</label>
        <div class="select-wrapper">
          <select id="cliente-asociado" v-model="form.clienteFacturacionAsociado" class="form-select">
            <option value="">Sin asociación </option>
            <option v-for="nombreBroker in clientesFacturacionDisponibles" :key="nombreBroker" :value="nombreBroker">
              {{ nombreBroker }}
            </option>
          </select>
        </div>
        <small class="help-text">Indica a que cliente de facturación le pertenece este envío.</small>
      </div>

      <!-- Email -->
      <div class="form-group">
        <label class="form-label" for="cliente-email">Correo Electrónico</label>
        <input id="cliente-email" v-model="form.email" type="email" class="form-input"
          placeholder="ejemplo@correo.com" />
      </div>

      <!-- Teléfono -->
      <div class="form-group">
        <label class="form-label" for="cliente-telefono">Teléfono</label>
        <input id="cliente-telefono" v-model="form.telefono" type="tel" class="form-input"
          placeholder="Ej: +51 999 888 777" />
      </div>

      <!-- Dirección -->
      <div class="form-group">
        <label class="form-label" for="cliente-direccion">Dirección</label>
        <input id="cliente-direccion" v-model="form.direccion" type="text" class="form-input"
          placeholder="Ej: Calle Las Flores 123, Lima" />
      </div>

      <!-- Acciones -->
      <div class="form-actions">
        <button type="button" class="btn btn-secondary" @click="$emit('cancelar')">
          Cancelar
        </button>
        <button type="submit" class="btn btn-primary" :disabled="guardando">
          {{ guardando ? 'Guardando...' : (modoEdicion ? 'Actualizar Cliente' : 'Agregar Cliente') }}
        </button>
      </div>
    </form>
  </div>
</template>

<script>
export default {
  name: 'ClienteForm',
  props: {
    clienteSeleccionado: {
      type: Object,
      default: null,
      validator: (value) => {
        return value === null || (typeof value === 'object' && !Array.isArray(value))
      }
    },
    guardando: {
      type: Boolean,
      default: false
    },
    clientesFacturacionDisponibles: {
      type: Array,
      default: () => []
    }
  },
  emits: ['guardar', 'cancelar'],
  data() {
    return {
      form: {
        nombre: '',
        tipo: '',
        clienteFacturacionAsociado: '',
        email: '',
        telefono: '',
        direccion: '',
        notas: '',
        creadoEn: ''
      }
    }
  },
  computed: {
    modoEdicion() {
      return !!this.clienteSeleccionado && !!this.clienteSeleccionado.id
    }
  },
  watch: {
    clienteSeleccionado: {
      immediate: true,
      deep: true,
      handler(nuevoValor) {
        if (nuevoValor) {
          this.form = { ...nuevoValor }
        } else {
          this.resetearFormulario()
        }
      }
    },
    'form.tipo'(nuevoTipo) {
      // Limpiar asociación si deja de ser tipo envío
      if (nuevoTipo !== 'Envío') {
        this.form.clienteFacturacionAsociado = ''
      }
    }
  },
  methods: {
    enviarFormulario() {
      if (!this.form.nombre || !this.form.tipo) return

      const payload = {
        ...this.form,
        nombre: this.form.nombre.trim(),
        clienteFacturacionAsociado: this.form.clienteFacturacionAsociado ? this.form.clienteFacturacionAsociado.trim() : '',
        email: this.form.email ? this.form.email.trim() : '',
        telefono: this.form.telefono ? this.form.telefono.trim() : '',
        direccion: this.form.direccion ? this.form.direccion.trim() : '',
        notas: this.form.notas ? this.form.notas.trim() : '',
        creadoEn: this.form.creadoEn || new Date().toISOString()
      }

      this.$emit('guardar', payload)
    },
    resetearFormulario() {
      this.form = {
        nombre: '',
        tipo: '',
        clienteFacturacionAsociado: '',
        email: '',
        telefono: '',
        direccion: '',
        notas: '',
        creadoEn: ''
      }
    }
  }
}
</script>

<style scoped>
.select-wrapper {
  position: relative;
}

.help-text {
  font-size: 11px;
  color: var(--text-light);
  margin-top: 4px;
}
</style>
