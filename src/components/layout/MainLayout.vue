<template>

    <div class="main-layout">

        <!-- SIDEBAR -->
        <SideBar />

        <!-- CONTENIDO -->
        <div class="main-content">

            <!-- NAVBAR -->
            <NavBar @logout="salirSistema" />

            <!-- PAGINAS -->
            <div class="page-content">
                <router-view />
            </div>

        </div>

    </div>

</template>

<script>
import SideBar from './SideBar.vue'
import NavBar from './NavBar.vue'
import { useAuth } from '../../composables/useAuth.js'

export default {

    components: {
        SideBar,
        NavBar
    },

    setup() {
        const { logout } = useAuth()
        return { logout }
    },

    methods: {
        async salirSistema() {
            await this.logout()
            this.$router.push('/')
        }
    }
}
</script>

<style scoped>
.main-layout {
    display: flex;
    min-height: 100vh;
    background: var(--bg-secondary);
}

.main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.page-content {
    flex: 1;
    overflow-y: auto;
}

@media (max-width: 768px) {
    .main-layout {
        flex-direction: column;
        min-height: 100vh;
    }

    .main-content {
        min-width: 0;
    }

    .page-content {
        overflow-y: visible;
    }
}
</style>