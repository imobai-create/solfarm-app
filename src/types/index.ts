// ── Usuário ──────────────────────────────
export type UserRole = 'PRODUCER' | 'SUPPLIER' | 'AGRONOMIST' | 'ADMIN'
export type UserPlan = 'FREE' | 'CAMPO' | 'FAZENDA'

export interface User {
  id: string
  name: string
  email: string
  phone?: string
  avatar?: string
  role: UserRole
  plan: UserPlan
  planExpiresAt?: string
  state?: string
  city?: string
  region?: string
  isVerified: boolean
  createdAt: string
  _count?: { areas: number; diagnostics: number; orders: number }
}

// ── Auth ──────────────────────────────────
export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  name: string
  email: string
  password: string
  phone?: string
  state?: string
  role?: 'PRODUCER' | 'SUPPLIER'
}

// ── Área ──────────────────────────────────
export type CultureType =
  | 'SOJA' | 'MILHO' | 'CAFE' | 'CANA' | 'ALGODAO'
  | 'ARROZ' | 'FEIJAO' | 'TRIGO' | 'MANDIOCA' | 'EUCALIPTO'
  | 'PASTAGEM' | 'HORTIFRUTI' | 'FRUTAS' | 'OUTRO' | 'VAZIO'

export type BiomeType =
  | 'CERRADO' | 'AMAZONIA' | 'MATA_ATLANTICA'
  | 'CAATINGA' | 'PAMPA' | 'PANTANAL'

export type HealthStatus = 'EXCELENTE' | 'BOM' | 'REGULAR' | 'CRITICO' | 'MUITO_RUIM'

export interface GeoPolygon {
  type: 'Polygon'
  coordinates: number[][][]
}

export interface Area {
  id: string
  name: string
  description?: string
  hectares: number
  culture?: CultureType
  soilType?: string
  polygon?: GeoPolygon
  centroidLat?: number
  centroidLng?: number
  state?: string
  city?: string
  biome?: BiomeType
  isActive: boolean
  createdAt: string
  latestDiagnostic?: {
    id: string
    score: number
    healthStatus: HealthStatus
    createdAt: string
  }
  _count?: { diagnostics: number; satelliteImages: number }
}

// ── Satélite ──────────────────────────────
export interface SatelliteZone {
  zone: string
  ndvi: number
  lat: number
  lng: number
  status: string
}

export interface SatelliteImage {
  id: string
  acquisitionDate: string
  satellite: string
  cloudCover: number
  resolution: number
  ndviMean?: number
  ndviMin?: number
  ndviMax?: number
  ndreMean?: number
  ndwiMean?: number
  eviMean?: number
  zonesMap?: SatelliteZone[]
  thumbnailUrl?: string
  trueColorUrl?: string
  status: 'PROCESSING' | 'READY' | 'ERROR' | 'NO_DATA'
}

export interface STACSearchResult {
  stacId: string
  acquisitionDate: string
  cloudCover: number
  satellite: string
  thumbnailUrl?: string
  mgrs?: string
}

// ── Diagnóstico ───────────────────────────
export interface DiagnosticProblem {
  type: string
  severity: 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO'
  description: string
  zone?: string
  affectedArea?: number
}

export interface DiagnosticRecommendation {
  category: 'FERTILIZANTE' | 'DEFENSIVO' | 'IRRIGACAO' | 'CULTURA' | 'MANEJO' | 'INSUMO'
  priority: 'URGENTE' | 'ALTA' | 'MEDIA' | 'BAIXA'
  action: string
  detail?: string
  estimatedCostReduction?: number
  estimatedProductivityGain?: number
  productKeywords?: string[]
}

export interface FertilizationZone {
  zone: string
  ndvi: number
  status: string
  nitrogenDose: number
  phosphorusDose: number
  potassiumDose: number
  limeDose?: number
  priority: 'URGENTE' | 'NORMAL' | 'BAIXA'
}

export interface Diagnostic {
  id: string
  createdAt: string
  score: number
  healthStatus: HealthStatus
  healthLabel: string
  summary: string
  problems: DiagnosticProblem[]
  recommendations: DiagnosticRecommendation[]
  recommendedCultures: { culture: string; score: number; reason: string }[]
  fertilizationPlan: FertilizationZone[]
  yieldEstimate: { value: number; unit: string; totalEstimate: number; efficiency: number }
  area: Pick<Area, 'id' | 'name' | 'hectares' | 'culture' | 'biome'>
  satellite: {
    acquisitionDate: string
    cloudCover: number
    satellite: string
    indices: {
      ndvi: { mean: number; min?: number; max?: number }
      ndre?: { mean: number }
      ndwi?: { mean: number }
    }
    zonesMap: SatelliteZone[]
  }
}

// ── Marketplace ───────────────────────────
export type ProductCategory =
  | 'FERTILIZANTE' | 'DEFENSIVO' | 'SEMENTE' | 'INOCULANTE'
  | 'MAQUINA' | 'IMPLEMENTO' | 'FERRAMENTA' | 'IRRIGACAO' | 'SERVICO' | 'OUTRO'

export interface Product {
  id: string
  name: string
  description?: string
  category: ProductCategory
  price: number
  unit: string
  stock: number
  images: string[]
  brand?: string
  state?: string
  city?: string
  isFeatured: boolean
}

// ── Comunidade ───────────────────────────
export type PostCategory = 'GERAL' | 'DUVIDA' | 'DICA' | 'ALERTA' | 'RESULTADO' | 'VENDA'

export interface Post {
  id: string
  title?: string
  content: string
  images: string[]
  category: PostCategory
  likes: number
  state?: string
  city?: string
  createdAt: string
  user: Pick<User, 'id' | 'name' | 'avatar' | 'state' | 'city'>
}

// ── API ───────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ApiError {
  error: string
  code: string
}
