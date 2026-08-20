<template>
    <div class="data-card">
        <div class="data-card-header">
            <h2 class="flex-align-center gap-8">
                <slot name="title-icon" />
                {{ titulo }}
            </h2>
            <div class="header-actions">
                <button v-if="showSync" @click="$emit('sincronizar')" :disabled="cargando" class="btn-header-outline">
                    <BoltIcon class="icon-sm icon-inline" /> Sincronizar API
                </button>
                <button @click="$emit('actualizar')" :disabled="cargando" class="btn-header-outline">
                    <ArrowPathIcon class="icon-sm icon-inline" :class="{ 'spin': cargando }" /> {{ cargando ? 'Cargando...' : 'Actualizar' }}
                </button>
            </div>
        </div>

        <div v-if="cargando" class="table-loading-state">
            <p>Cargando inventario...</p>
        </div>

        <div v-else-if="items.length > 0" class="data-card-content">
            <div class="data-card-info">
                <p><strong>{{ items.length }}</strong> {{ etiquetaItem }}</p>
            </div>
            <table class="data-card-table">
                <thead>
                    <tr>
                        <slot name="header" />
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(item, index) in items" :key="index">
                        <slot name="row" :item="item" :index="index" />
                    </tr>
                </tbody>
            </table>
        </div>

        <div v-else class="table-empty-state">
            <p>{{ textoVacio }}</p>
        </div>
    </div>
</template>

<script>
import { BoltIcon, ArrowPathIcon } from '@heroicons/vue/24/outline'

export default {
    name: 'InventarioTable',
    components: { BoltIcon, ArrowPathIcon },
    props: {
        titulo: { type: String, required: true },
        items: { type: Array, default: () => [] },
        cargando: { type: Boolean, default: false },
        etiquetaItem: { type: String, default: 'registros' },
        textoVacio: { type: String, default: 'No hay datos' },
        showSync: { type: Boolean, default: true }
    },
    emits: ['actualizar', 'sincronizar']
}
</script>

<style scoped>
@media (max-width: 768px) {
    .data-card-header {
        flex-direction: column;
        align-items: flex-start;
    }

    .btn-header-outline {
        width: 100%;
    }
}
</style>
