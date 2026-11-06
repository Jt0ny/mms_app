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
    height: 100dvh;
    overflow: hidden;
    background: var(--bg-secondary);
}

.main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
}

.page-content {
    flex: 1;
    overflow-y: auto;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    min-height: 0;
}

@media (max-width: 768px) {
    .main-layout {
        flex-direction: column;
        height: 100dvh;
    }

    .main-content {
        display: contents;
    }

    :deep(.container-nav) {
        order: 1;
        flex-shrink: 0;
    }

    :deep(.sidebar) {
        order: 2;
        flex-shrink: 0;
    }

    .page-content {
        order: 3;
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        overflow-x: auto;
    }
}
</style>