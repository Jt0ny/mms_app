<template>
    <div class="tipo-selector">
        <button type="button" :class="['tipo-btn', { active: modelValue === 'materia_prima' }]"
            @click="$emit('update:modelValue', 'materia_prima')">
            <SunIcon class="icon-sm icon-inline" /> Materia Prima
        </button>
        <button type="button" :class="['tipo-btn', { active: modelValue === 'material' }]"
            @click="$emit('update:modelValue', 'material')">
            <CubeIcon class="icon-sm icon-inline" /> Material
        </button>
        <button type="button" :class="['tipo-btn', { active: modelValue === 'producto_terminado' }]"
            @click="$emit('update:modelValue', 'producto_terminado')">
            <SparklesIcon class="icon-sm icon-inline" /> Prod. Terminado
        </button>
    </div>
</template>

<script>
import { SunIcon, CubeIcon, SparklesIcon } from '@heroicons/vue/24/outline'

export default {
    name: 'MermaTipoSelector',
    components: { SunIcon, CubeIcon, SparklesIcon },
    props: {
        modelValue: {
            type: String,
            required: true
        }
    },
    emits: ['update:modelValue']
}
</script>

<style scoped>
.tipo-selector {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.tipo-btn {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 10px 4px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-light);
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  width: 100%;
}

.tipo-btn:hover {
  background: var(--border-light);
  color: var(--text-h);
}

.tipo-btn.active {
  background: var(--primary-bg);
  border-color: var(--primary);
  color: var(--primary);
  box-shadow: var(--shadow-sm);
}

@media (max-width: 480px) {
  .tipo-selector {
    grid-template-columns: 1fr;
  }
}
</style>