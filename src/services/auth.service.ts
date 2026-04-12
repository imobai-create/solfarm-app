import * as SecureStore from 'expo-secure-store'
import { api } from './api'
import type { LoginInput, RegisterInput, User, AuthTokens } from '../types'

export const authService = {
  async login(data: LoginInput): Promise<{ user: User } & AuthTokens> {
    const res = await api.post('/auth/login', data)
    const { user, accessToken, refreshToken } = res.data
    await SecureStore.setItemAsync('accessToken', accessToken)
    await SecureStore.setItemAsync('refreshToken', refreshToken)
    return { user, accessToken, refreshToken }
  },

  async register(data: RegisterInput): Promise<{ user: User } & AuthTokens> {
    const res = await api.post('/auth/register', data)
    const { user, accessToken, refreshToken } = res.data
    await SecureStore.setItemAsync('accessToken', accessToken)
    await SecureStore.setItemAsync('refreshToken', refreshToken)
    return { user, accessToken, refreshToken }
  },

  async me(): Promise<User> {
    const res = await api.get('/auth/me')
    return res.data.user
  },

  async logout(): Promise<void> {
    try { await api.post('/auth/logout') } catch {}
    await SecureStore.deleteItemAsync('accessToken')
    await SecureStore.deleteItemAsync('refreshToken')
  },

  async getStoredToken(): Promise<string | null> {
    return SecureStore.getItemAsync('accessToken')
  },
}
