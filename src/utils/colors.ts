export const Colors = {
  // Verde SolFarm (alinhado com família EnergyCoin/GrãoFinance/GreenCoinCash)
  primary: '#10B981',       // emerald-500 — compartilhado com Grão
  primaryDark: '#065F46',   // emerald-900
  primaryLight: '#34D399',  // emerald-400
  primaryBg: '#ECFDF5',     // emerald-50

  // Accent ciano — identidade on-chain/tech comum aos apps
  accent: '#22D3EE',         // cyan-400
  accentLight: '#67E8F9',
  accentBg: '#ECFEFF',

  // Dourado — valor/destaque
  gold: '#F59E0B',

  // Tons de terra / agro (identidade SolFarm)
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

  // Background (light — identidade agro, campo aberto, sol)
  background: '#F7F6F2',
  card: '#FFFFFF',
  border: '#E8E7E1',

  // Texto semântico (substitui uso avulso de gray900/gray500)
  text: '#1A1A1A',
  textSecondary: '#666666',
  textMuted: '#999999',
} as const

export type ColorKey = keyof typeof Colors

// ─── Design tokens compartilhados com EnergyCoin/GrãoFinance/GreenCoinCash ───

export const Typography = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  xxl: 30,
  xxxl: 38,

  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
}

export const Spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 }

export const Radius = { sm: 8, md: 12, lg: 16, xl: 24, full: 999 }

export const Shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  premium: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 6,
  },
  floating: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
}

export const Surface = {
  // Gradiente hero (headers de tela)
  heroGradientStart: '#10B981',
  heroGradientEnd: '#065F46',

  // Camadas
  cardElevated: '#FFFFFF',
  cardSubtle: '#FBFAF6',
  divider: '#EDECE6',

  // Chips (bg suave pra ícones/status)
  chipGreen: '#E7EFEA',
  chipGold: '#FBF3DC',
  chipBlue: '#E6EEF7',
  chipPurple: '#EEE4F4',
  chipOrange: '#FCEFE0',
  chipEarth: '#F5ECE0',
}

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
