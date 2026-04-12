import { create } from 'zustand'
import { areasService, type CreateAreaPayload } from '../services/areas.service'
import type { Area } from '../types'

interface AreasState {
  areas: Area[]
  selectedArea: Area | null
  isLoading: boolean
  error: string | null
  stats: {
    totalAreas: number
    totalHectares: number
    cultureBreakdown: Record<string, number>
    diagnosticsRun: number
  } | null

  fetchAreas: () => Promise<void>
  fetchArea: (id: string) => Promise<void>
  createArea: (payload: CreateAreaPayload) => Promise<Area>
  updateArea: (id: string, payload: Partial<CreateAreaPayload>) => Promise<void>
  deleteArea: (id: string) => Promise<void>
  fetchStats: () => Promise<void>
  clearSelected: () => void
}

export const useAreasStore = create<AreasState>((set, get) => ({
  areas: [],
  selectedArea: null,
  isLoading: false,
  error: null,
  stats: null,

  fetchAreas: async () => {
    set({ isLoading: true, error: null })
    try {
      const result = await areasService.list()
      set({ areas: result.data })
    } catch (err: any) {
      set({ error: err?.response?.data?.error ?? 'Erro ao carregar áreas' })
    } finally {
      set({ isLoading: false })
    }
  },

  fetchArea: async (id) => {
    set({ isLoading: true })
    try {
      const area = await areasService.findOne(id)
      set({ selectedArea: area })
    } finally {
      set({ isLoading: false })
    }
  },

  createArea: async (payload) => {
    const area = await areasService.create(payload)
    set((s) => ({ areas: [area, ...s.areas] }))
    return area
  },

  updateArea: async (id, payload) => {
    const updated = await areasService.update(id, payload)
    set((s) => ({
      areas: s.areas.map((a) => (a.id === id ? updated : a)),
      selectedArea: s.selectedArea?.id === id ? updated : s.selectedArea,
    }))
  },

  deleteArea: async (id) => {
    await areasService.delete(id)
    set((s) => ({ areas: s.areas.filter((a) => a.id !== id) }))
  },

  fetchStats: async () => {
    const stats = await areasService.stats()
    set({ stats })
  },

  clearSelected: () => set({ selectedArea: null }),
}))
