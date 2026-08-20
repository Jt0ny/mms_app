<template>
    <div class="selector-rol">
        <label>Rol de usuario</label>

        <div class="rol-selector">
            <div class="rol-actual" :class="{ vacio: !modelo }">
                {{ modelo || 'Selecciona un rol' }}
            </div>

            <div class="chip-options">
                <div v-for="rol in roles" :key="rol" class="chip-option" :class="{ activa: rol === modelo }"
                    role="button" tabindex="0" @click="seleccionarRol(rol)" @keydown.enter.prevent="seleccionarRol(rol)"
                    @keydown.space.prevent="seleccionarRol(rol)">
                    {{ rol }}
                </div>
            </div>
        </div>
    </div>
</template>
<script>

export default {
    props: {
        modelValue: {
            type: String,
            default: ''
        },

        roles: {
            type: Array,
            default: () => ['Supervisor', 'Operador']
        }
    },

    emits: ['update:modelValue'],

    computed: {
        modelo() {
            return this.modelValue;
        }
    },

    methods: {
        seleccionarRol(rol) {
            this.$emit('update:modelValue', rol);
        }
    }
};
</script>
<style scoped>
.selector-rol {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.selector-rol label {
    font-weight: 600;
}

.rol-selector {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.rol-actual {
    padding: 11px 14px;
    border-radius: 10px;
    border: 1px solid var(--border);
}

.rol-actual.vacio {
    color: var(--text-light);
}

</style>