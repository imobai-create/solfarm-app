import { create } from 'zustand'
import { authService } from '../services/auth.service'
import type { User, LoginInput, RegisterInput } from '../types'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  login: (data: LoginInput) => Promise<void>
  register: (data: RegisterInput) => Promise<void>
  logout: () => Promise<void>
  loadUser: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // começa true até loadUser terminar
  error: null,

  login: async (data) => {
    set({ isLoading: true, error: null })
    try {
      const { user } = await authService.login(data)
      set({ user, isAuthenticated: true })
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? 'Erro ao fazer login'
      set({ error: msg })
      throw err
    } finally {
      set({ isLoading: false })
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null })
    try {
      const { user } = await authService.register(data)
      set({ user, isAuthenticated: true })
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? 'Erro ao criar conta'
      set({ error: msg })
      throw err
    } finally {
      set({ isLoading: false })
    }
  },

  logout: async () => {
    await authService.logout()
    set({ user: null, isAuthenticated: false })
  },

  loadUser: async () => {
    set({ isLoading: true })
    try {
      const token = await authService.getStoredToken()
      if (!token) { set({ isLoading: false }); return }
      const user = await authService.me()
      set({ user, isAuthenticated: true })
    } catch {
      set({ user: null, isAuthenticated: false })
    } finally {
      set({ isLoading: false })
    }
  },

  clearError: () => set({ error: null }),
}))
