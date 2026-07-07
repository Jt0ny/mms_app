import { createRouter, createWebHistory } from 'vue-router'

import PublicHomePage from '../pages/PublicHomePage.vue'
import MainLayout from '../components/layout/MainLayout.vue'
import PedidoPage from '../pages/PedidoPage.vue'
import MateriaPrimaPage from '../pages/MateriaPrimaPage.vue'
import MaterialesPage from '../pages/MaterialesPage.vue'
import RecetasPage from '../pages/RecetasPage.vue'
import ProduccionPage from '../pages/ProduccionPage.vue'
import PlanificacionPage from '../pages/PlanificacionPage.vue'
import UsuariosPage from '../pages/UsuariosPage.vue'
import MermasPage from '../pages/MermasPage.vue'
import ClientesPage from '../pages/ClientesPage.vue'
import DashboardPage from '../pages/DashboardPage.vue'



const routes = [

  {
    path: '/',
    name: 'home',
    component: PublicHomePage
  },

  {
    path: '/app',
    component: MainLayout,
    meta: { requiresAuth: true },

    children: [
      {
        path: '',
        redirect: () => {
          const rol = localStorage.getItem('rol')
          return rol === 'operador' ? '/app/produccion' : '/app/dashboard'
        }
      },

      {
        path: 'pedidos',
        name: 'pedidos',
        component: PedidoPage,
        meta: { roles: ['supervisor'] }
      },

      {
        path: 'materia-prima',
        name: 'materia-prima',
        component: MateriaPrimaPage,
        meta: { roles: ['supervisor'] }
      },
      {
        path: 'materiales',
        name: 'materiales',
        component: MaterialesPage,
        meta: { roles: ['supervisor'] }
      },
      {
        path: 'dashboard',
        name: 'dashboard',
        component: DashboardPage,
        meta: { roles: ['supervisor'] }
      },
      {
        path: 'recetas',
        name: 'recetas',
        component: RecetasPage,
        meta: { roles: ['supervisor'] }
      },
      {
        path: 'produccion',
        name: 'produccion',
        component: ProduccionPage,
        meta: { roles: ['operador'] }
      },
      {
        path: 'planificacion',
        name: 'planificacion',
        component: PlanificacionPage,
        meta: { roles: ['supervisor'] }
      },
      {
        path: 'usuarios',
        name: 'usuarios',
        component: UsuariosPage,
        meta: { roles: ['supervisor'] }
      },
      {
        path: 'mermas',
        name: 'mermas',
        component: MermasPage,
        meta: { roles: ['supervisor'] }
      },
      {
        path: 'clientes',
        name: 'clientes',
        component: ClientesPage,
        meta: { roles: ['supervisor'] }
      },
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {
  const isLogged = !!localStorage.getItem('rol')
  const rol = localStorage.getItem('rol')

  if (to.path === '/' && isLogged) {
    return rol === 'operador' ? '/app/produccion' : '/app/dashboard'
  }

  if (to.meta.requiresAuth && !isLogged) {
    return '/'
  }

  const allowedRoles = to.meta?.roles
  if (isLogged && Array.isArray(allowedRoles) && !allowedRoles.includes(rol)) {
    return rol === 'operador' ? '/app/produccion' : '/app/dashboard'
  }
})

export default router