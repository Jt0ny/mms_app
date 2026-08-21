<template>
    <div class="selector-rol">
        <label>Rol del Usuario</label>

        <div class="rol-selector">
            <div class="selector-display" :class="{ vacio: !modelValue }">
                {{ modelValue || 'Selecciona un rol' }}
            </div>

            <div class="chip-options">
                <div v-for="rol in roles" :key="rol" class="chip-option" :class="{ activa: rol === modelValue }"
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
    name: 'UsuarioRol',
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
</style>