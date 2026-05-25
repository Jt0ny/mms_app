import { createRouter, createWebHistory } from 'vue-router'

import PublicHomePage from '../pages/PublicHomePage.vue'
import MainLayout from '../components/layout/MainLayout.vue'
import PedidoPage from '../pages/PedidoPage.vue'
import MateriaPrimaPage from '../pages/MateriaPrimaPage.vue'
import MaterialesPage from '../pages/MaterialesPage.vue'
import RecetasPage from '../pages/RecetasPage.vue'



const routes = [

  {
    path: '/',
    name: 'home',
    component: PublicHomePage
  },

  {
    path: '/login',
    redirect: '/'
  },

  {
    path: '/app',
    component: MainLayout,
    meta: { requiresAuth: true },

    children: [
      {
        path: '',
        redirect: { name: 'pedidos' }
      },

      {
        path: 'pedidos',
        name: 'pedidos',
        component: PedidoPage
      },

      {
        path: 'materia-prima',
        name: 'materia-prima',
        component: MateriaPrimaPage
      },
      {
        path:'materiales',
        name:'materiales',
        component: MaterialesPage
      },
      {
        path:'recetas',
        name:'recetas',
        component: RecetasPage
      }
    ]
  },

  {
    path: '/pedidos',
    redirect: '/app/pedidos'
  },

  {
    path: '/materia-prima',
    redirect: '/app/materia-prima'
  },

  {
    path: '/materiales',
    redirect: '/app/materiales'
  },

  {
    path: '/recetas',
    redirect: '/app/recetas'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {
  const isLogged = !!localStorage.getItem('rol')

  if (to.path === '/' && isLogged) {
    return '/app/pedidos'
  }

  if (to.meta.requiresAuth && !isLogged) {
    return '/'
  }
})

export default router