// stores/applicantAuth.ts
import { defineStore } from 'pinia'
import { supabase } from '@/services/supabase'

interface AdminUser {
  id: string
  email: string
  full_name: string
}

export const useAdminAuthStore = defineStore('adminAuth', {
  state: () => ({
    user: null as AdminUser | null,
    loading: false,
    error: null as string | null
  }),

  getters: {
    isAuthenticated: (state) => !!state.user
  },
 
  actions: {
    async login(email: string, phone: string) {
      this.loading = true
      this.error = null

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password: phone.trim()
        })
        console.log('login response:', data)
        if (error) throw error

        const meta = data.user.user_metadata
        

        this.user = {
          id: data.user.id,
          email: data.user.email!,
          full_name: meta.full_name
          
        }

        return true
      } catch (err: any) {
        console.log("error:", err)
        this.error = err.message || 'Login failed. Please check your email and password.'
        return false
      } finally {
        this.loading = false
      }
    },

    async logout() {
      await supabase.auth.signOut()
      this.user = null
    },

    async restoreSession() {
      const { data } = await supabase.auth.getSession()

      console.log('session:', data.session)

      if (data.session?.user) {
        console.log('metadata:', data.session.user.user_metadata)

        const meta = data.session.user.user_metadata

          this.user = {
            id: data.session.user.id,
            email: data.session.user.email!,
            full_name: meta.full_name
            
          }
       
      }
    }
  }
})
