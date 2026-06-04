import { createRouter, createWebHistory } from 'vue-router'

import PublicHomePage from '../pages/PublicHomePage.vue'
import MainLayout from '../components/layout/MainLayout.vue'
import PedidoPage from '../pages/PedidoPage.vue'
import MateriaPrimaPage from '../pages/MateriaPrimaPage.vue'
import MaterialesPage from '../pages/MaterialesPage.vue'
import RecetasPage from '../pages/RecetasPage.vue'
import ProduccionPage from '../pages/ProduccionPage.vue'
import UsuariosPage from '../pages/UsuariosPage.vue'



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
        redirect: () => {
          const rol = localStorage.getItem('rol')
          return rol === 'operador' ? '/app/produccion' : '/app/pedidos'
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
        path:'materiales',
        name:'materiales',
        component: MaterialesPage,
        meta: { roles: ['supervisor'] }
      },
      {
        path:'recetas',
        name:'recetas',
        component: RecetasPage,
        meta: { roles: ['supervisor'] }
      },
      {
        path:'produccion',
        name:'produccion',
        component: ProduccionPage,
        meta: { roles: ['operador'] }
      },
      {
        path:'usuarios',
        name:'usuarios',
        component: UsuariosPage,
        meta: { roles: ['supervisor'] }
      },
      {
        path:'mantenimientoU',
        redirect: '/app/usuarios'
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
  },

  {
    path: '/produccion',
    redirect: '/app/produccion'
  },
  {
    path: '/usuarios',
    redirect: '/app/usuarios'
  },
  {
    path: '/mantenimientoU',
    redirect: '/app/usuarios'
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
    return rol === 'operador' ? '/app/produccion' : '/app/pedidos'
  }

  if (to.meta.requiresAuth && !isLogged) {
    return '/'
  }

  const allowedRoles = to.meta?.roles
  if (isLogged && Array.isArray(allowedRoles) && !allowedRoles.includes(rol)) {
    return rol === 'operador' ? '/app/produccion' : '/app/pedidos'
  }
})

export default router