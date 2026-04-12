export const Colors = {
  // Verde SolFarm
  primary: '#16a34a',       // green-600
  primaryDark: '#15803d',   // green-700
  primaryLight: '#22c55e',  // green-500
  primaryBg: '#f0fdf4',     // green-50

  // Tons de terra / agro
  earth: '#92400e',         // amber-800
  earthLight: '#fef3c7',    // amber-100
  soil: '#78350f',          // amber-900

  // Alertas e status
  danger: '#dc2626',        // red-600
  dangerBg: '#fef2f2',
  warning: '#d97706',       // amber-600
  warningBg: '#fffbeb',
  success: '#16a34a',
  successBg: '#f0fdf4',
  info: '#2563eb',          // blue-600
  infoBg: '#eff6ff',

  // NDVI / Health status
  ndviExcelente: '#15803d',  // > 0.7
  ndviBom: '#65a30d',        // 0.5–0.7
  ndviRegular: '#ca8a04',    // 0.3–0.5
  ndviCritico: '#dc2626',    // 0.1–0.3
  ndviMuitoruim: '#7f1d1d',  // < 0.1

  // Neutros
  white: '#ffffff',
  black: '#000000',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',

  // Background
  background: '#f9fafb',
  card: '#ffffff',
  border: '#e5e7eb',
} as const

export type ColorKey = keyof typeof Colors

// NDVI → cor
export function ndviColor(ndvi: number): string {
  if (ndvi > 0.7) return Colors.ndviExcelente
  if (ndvi > 0.5) return Colors.ndviBom
  if (ndvi > 0.3) return Colors.ndviRegular
  if (ndvi > 0.1) return Colors.ndviCritico
  return Colors.ndviMuitoruim
}

// HealthStatus → cor
export function healthColor(status: string): string {
  switch (status) {
    case 'EXCELENTE': return Colors.ndviExcelente
    case 'BOM': return Colors.ndviBom
    case 'REGULAR': return Colors.ndviRegular
    case 'CRITICO': return Colors.ndviCritico
    case 'MUITO_RUIM': return Colors.ndviMuitoruim
    default: return Colors.gray400
  }
}

// Severity → cor
export function severityColor(severity: string): string {
  switch (severity) {
    case 'CRITICO': return Colors.danger
    case 'ALTO': return Colors.warning
    case 'MEDIO': return Colors.info
    case 'BAIXO': return Colors.success
    default: return Colors.gray400
  }
}

// Cultura → emoji
export function cultureEmoji(culture?: string): string {
  const map: Record<string, string> = {
    SOJA: '🌱', MILHO: '🌽', CAFE: '☕', CANA: '🎋',
    ALGODAO: '🌸', ARROZ: '🌾', FEIJAO: '🫘', TRIGO: '🌾',
    MANDIOCA: '🥔', EUCALIPTO: '🌳', PASTAGEM: '🐄',
    HORTIFRUTI: '🥬', FRUTAS: '🍎', OUTRO: '🌿', VAZIO: '🏜️',
  }
  return culture ? (map[culture] ?? '🌾') : '🌾'
}

// Cultura → label PT
export function cultureLabel(culture?: string): string {
  const map: Record<string, string> = {
    SOJA: 'Soja', MILHO: 'Milho', CAFE: 'Café', CANA: 'Cana-de-açúcar',
    ALGODAO: 'Algodão', ARROZ: 'Arroz', FEIJAO: 'Feijão', TRIGO: 'Trigo',
    MANDIOCA: 'Mandioca', EUCALIPTO: 'Eucalipto', PASTAGEM: 'Pastagem',
    HORTIFRUTI: 'Hortifrutigranjeiros', FRUTAS: 'Fruticultura',
    OUTRO: 'Outro', VAZIO: 'Sem cultura',
  }
  return culture ? (map[culture] ?? culture) : 'Sem cultura'
}

// Bioma → label PT
export function biomeLabel(biome?: string): string {
  const map: Record<string, string> = {
    CERRADO: 'Cerrado', AMAZONIA: 'Amazônia', MATA_ATLANTICA: 'Mata Atlântica',
    CAATINGA: 'Caatinga', PAMPA: 'Pampa', PANTANAL: 'Pantanal',
  }
  return biome ? (map[biome] ?? biome) : ''
}
