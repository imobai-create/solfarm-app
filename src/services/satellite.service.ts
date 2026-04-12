import { api } from './api'
import type { SatelliteImage, STACSearchResult } from '../types'

export const satelliteService = {
  async searchImages(areaId: string, options?: {
    dateFrom?: string
    dateTo?: string
    maxCloudCover?: number
  }): Promise<{ total: number; images: STACSearchResult[] }> {
    const res = await api.get(`/satellite/areas/${areaId}/search`, { params: options })
    return res.data
  },

  async processImage(areaId: string, stacItemId: string): Promise<SatelliteImage> {
    const res = await api.post(`/satellite/areas/${areaId}/process`, { stacItemId })
    return res.data.image
  },

  async getLatest(areaId: string): Promise<SatelliteImage | null> {
    try {
      const res = await api.get(`/satellite/areas/${areaId}/latest`)
      return res.data.image
    } catch {
      return null
    }
  },

  async getHistory(areaId: string): Promise<SatelliteImage[]> {
    const res = await api.get(`/satellite/areas/${areaId}/history`)
    return res.data.images
  },
}
