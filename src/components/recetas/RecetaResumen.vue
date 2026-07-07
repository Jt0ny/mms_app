<template>
    <div class="panel summary-panel">

        <h2>Resumen de selección</h2>

        <!-- EMPTY -->
        <div v-if="!totalSeleccionados" class="empty-state">
            Aún no has seleccionado
            materiales ni materia prima
        </div>

        <!-- CONTENIDO -->
        <div v-else class="summary-lists">

            <!-- MATERIALES -->
            <div class="summary-box">

                <h3>Materiales</h3>

                <ul v-if="materiales.length">

                    <li v-for="item in materiales" :key="item.id">
                        <strong>{{ item.nombre }}</strong>
                        -
                        {{ item.cantidad }} unidad(es)
                    </li>

                </ul>

                <p v-else class="empty-text"> No hay materiales seleccionados</p>

            </div>

            <!-- MATERIA PRIMA -->
            <div class="summary-box">

                <h3>Materia Prima</h3>

                <ul v-if="materiaPrima.length">
                    <li v-for="item in materiaPrima" :key="item.id">
                        <strong> {{ item.nombre }}</strong>
                        -
                        {{ item.cantidad }}unidad(es)
                    </li>
                </ul>

                <p v-else class="empty-text">No hay materia prima seleccionada</p>
            </div>
        </div>
    </div>
</template>

<script>
export default {

    props: {

        materiales: {
            type: Array,
            default: () => []
        },

        materiaPrima: {
            type: Array,
            default: () => []
        }
    },

    computed: {

        totalSeleccionados() {
            return (
                this.materiales.length +
                this.materiaPrima.length
            )
        }
    }
}
</script>

<style scoped>
.summary-panel {
    background: white;
    border-radius: 14px;
    padding: 20px;
    box-shadow: var(--shadow-sm);
}

.summary-panel h2 {
    margin-bottom: 18px;
}

.summary-lists {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 18px;
}

.summary-box {
    padding: 16px;
    border-radius: 12px;
    background: #f8faf8;
    border: 1px solid var(--border-light);
}

.summary-box h3 {
    margin-bottom: 12px;
    color: var(--text-h);
}

.summary-box ul {
    margin: 0;
    padding-left: 18px;
}

.summary-box li {
    margin-bottom: 8px;
    color: var(--text);
}

.empty-state,
.empty-text {
    color: var(--text-light);
}

.empty-state {
    padding: 18px;
    border-radius: 10px;
    background: #f8faf8;
    border: 1px dashed var(--border);
}

@media (max-width: 768px) {

    .summary-lists {
        grid-template-columns: 1fr;
    }
}
</style>