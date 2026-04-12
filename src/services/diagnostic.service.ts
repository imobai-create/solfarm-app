import { api } from './api'
import type { Diagnostic } from '../types'

export const diagnosticService = {
  async generate(areaId: string, satelliteImageId?: string): Promise<Diagnostic> {
    const res = await api.post('/diagnostics/generate', { areaId, satelliteImageId })
    return res.data.diagnostic
  },

  async listByArea(areaId: string): Promise<Diagnostic[]> {
    const res = await api.get(`/diagnostics/areas/${areaId}`)
    return res.data.diagnostics
  },

  async findOne(id: string): Promise<Diagnostic> {
    const res = await api.get(`/diagnostics/${id}`)
    return res.data.diagnostic
  },
}
