import Dashboard from '@/views/Dashboard.vue'
import Login from '@/views/Login.vue'
import SopLibrary from '@/views/SopLibrary.vue'
import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '@/services/supabase'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),

  routes: [
    {
      path: '/',
      name: 'login',
      component: Login
    },

    {
      path: '/dashboard',
      name: 'dashboard',
      component: Dashboard,
      meta: {
        requiresAuth: true
      }
    },

    {
      path: '/sop',
      name: 'sop',
      component: SopLibrary,
      meta: {
        requiresAuth: true
      }
    }
  ]
})

router.beforeEach(async (to) => {
  // Check current Supabase session
  const { data, error } = await supabase.auth.getSession()

  if (error) {
    console.error('Failed to get session:', error)
  }

  const isAuthenticated = !!data.session

  // Protected route + not logged in
  if (to.meta.requiresAuth && !isAuthenticated) {
    return {
      name: 'login'
    }
  }

  // Already logged in and trying to access login
  if (to.name === 'login' && isAuthenticated) {
    return {
      name: 'dashboard'
    }
  }

  return true
})

export default router