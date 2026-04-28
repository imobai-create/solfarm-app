import { Platform } from 'react-native'
import type { UserPlan } from '../types'

export const IS_IOS = Platform.OS === 'ios'

// Apple Guideline 3.1.1: conteúdo digital pago no iOS exige In-App Purchase.
// Enquanto IAP não é implementado, o iOS é travado no plano FREE para
// evitar rejeição (sem venda externa, sem unlock de conteúdo pago).
export const IOS_LOCKED_TO_FREE = IS_IOS

export function effectivePlan(plan: UserPlan | undefined | null): UserPlan {
  if (!plan) return 'FREE'
  if (IOS_LOCKED_TO_FREE) return 'FREE'
  return plan
}

export function canShowPaidPlans(): boolean {
  return !IOS_LOCKED_TO_FREE
}

// Apple Guideline 3.1.1 / 3.1.5(b): "moeda virtual" sem IAP e sem licença
// específica é rejeitada. FARMCOIN fica oculto no iOS até virar IAP.
export function canShowFarmcoin(): boolean {
  return !IS_IOS
}

// Apple Guideline 1.2 (UGC): comunidade exige moderação, report e block.
// Enquanto não houver isso, esconde no iOS para evitar rejeição.
export function canShowCommunity(): boolean {
  return !IS_IOS
}
