import { createRouter, createWebHistory } from 'vue-router'
import { obtenerRol, estaAutenticado, estaInicializado, useAuth } from '../composables/useAuth.js'

// Layout se carga estáticamente (siempre necesario)
import MainLayout from '../components/layout/MainLayout.vue'

// Lazy loading de páginas — cada página se carga solo cuando se navega a ella
const PublicHomePage = () => import('../pages/PublicHomePage.vue')
const PedidoPage = () => import('../pages/PedidoPage.vue')
const MateriaPrimaPage = () => import('../pages/MateriaPrimaPage.vue')
const MaterialesPage = () => import('../pages/MaterialesPage.vue')
const RecetasPage = () => import('../pages/RecetasPage.vue')
const ProduccionPage = () => import('../pages/ProduccionPage.vue')
const PlanificacionPage = () => import('../pages/PlanificacionPage.vue')
const UsuariosPage = () => import('../pages/UsuariosPage.vue')
const MermasPage = () => import('../pages/MermasPage.vue')
const ClientesPage = () => import('../pages/ClientesPage.vue')
const DashboardPage = () => import('../pages/DashboardPage.vue')



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
          const rol = obtenerRol()
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
  history: createWebHistory(), routes
})

router.beforeEach(async (to) => {
  // Esperar a que se inicialice la sesión al primer acceso
  if (!estaInicializado()) {
    const { inicializar } = useAuth()
    await inicializar()
  }

  const isLogged = estaAutenticado()
  const rol = obtenerRol()

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
