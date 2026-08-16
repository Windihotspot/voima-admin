import Dashboard from '@/views/Dashboard.vue'
import SopLibrary from '@/views/SopLibrary.vue'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: Dashboard
    },
    {
      path: '/sop',
      name: 'sop',
      component: SopLibrary
    }
  ]
})

export default router
