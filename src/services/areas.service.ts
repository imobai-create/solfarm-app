import { api } from './api'
import type { Area, GeoPolygon, CultureType, BiomeType, PaginatedResponse } from '../types'

export interface CreateAreaPayload {
  name: string
  description?: string
  culture?: CultureType
  soilType?: string
  polygon: GeoPolygon
  state?: string
  city?: string
  biome?: BiomeType
}

export const areasService = {
  async list(page = 1, limit = 10): Promise<PaginatedResponse<Area>> {
    const res = await api.get('/areas', { params: { page, limit } })
    return res.data
  },

  async findOne(id: string): Promise<Area> {
    const res = await api.get(`/areas/${id}`)
    return res.data.area
  },

  async create(payload: CreateAreaPayload): Promise<Area> {
    const res = await api.post('/areas', payload)
    return res.data.area
  },

  async update(id: string, payload: Partial<Omit<CreateAreaPayload, 'polygon'>>): Promise<Area> {
    const res = await api.patch(`/areas/${id}`, payload)
    return res.data.area
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/areas/${id}`)
  },

  async stats(): Promise<{
    totalAreas: number
    totalHectares: number
    cultureBreakdown: Record<string, number>
    diagnosticsRun: number
  }> {
    const res = await api.get('/areas/stats')
    return res.data
  },
}
