import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Alert, ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { api } from '../../src/services/api'
import { Colors } from '../../src/utils/colors'

const TX_ICON: Record<string, string> = {
  MINT: 'add-circle', BURN: 'flame', TRANSFER: 'arrow-up-circle',
  RECEIVE: 'arrow-down-circle', SPEND: 'cart', ENERGY_MINT: 'sunny',
  LOCK: 'lock-closed', UNLOCK: 'lock-open',
}
const TX_COLOR: Record<string, string> = {
  MINT: '#16a34a', BURN: '#dc2626', TRANSFER: '#f97316',
  RECEIVE: '#2563eb', SPEND: '#7c3aed', ENERGY_MINT: '#f59e0b',
}
const TX_LABEL: Record<string, string> = {
  MINT: 'Emissão', BURN: 'Queima', TRANSFER: 'Transferência',
  RECEIVE: 'Recebimento', SPEND: 'Gasto', ENERGY_MINT: 'Energia Solar',
}

const CULTURES = ['SOJA', 'MILHO', 'CAFE', 'ALGODAO', 'ARROZ', 'FEIJAO', 'TRIGO', 'CANA', 'OUTRO']
const CULTURE_PRICE: Record<string, number> = {
  SOJA: 130, MILHO: 65, CAFE: 1200, ALGODAO: 150,
  ARROZ: 80, FEIJAO: 280, TRIGO: 90, CANA: 20, OUTRO: 100,
}

export default function FarmCoinScreen() {
  const [wallet, setWallet] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [areas, setAreas] = useState<any[]>([])
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'wallet' | 'emitir' | 'energia' | 'ranking'>('wallet')

  // Emissão
  const [selectedArea, setSelectedArea] = useState('')
  const [culture, setCulture] = useState('SOJA')
  const [production, setProduction] = useState('')
  const [emitting, setEmitting] = useState(false)

  // Energia
  const [kwh, setKwh] = useState('')
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [energyLoading, setEnergyLoading] = useState(false)

  const load = useCallback(async () => {
    try {
      const [w, l, a] = await Promise.all([
        api.get('/farmcoin/wallet'),
        api.get('/farmcoin/leaderboard'),
        api.get('/areas'),
      ])
      setWallet(w.data.wallet)
      setTransactions(w.data.transactions)
      setLeaderboard(l.data.leaderboard)
      setAreas(a.data.data ?? [])
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleEmit() {
    if (!selectedArea || !production) return Alert.alert('Preencha área e produção')
    setEmitting(true)
    try {
      const res = await api.post('/farmcoin/request', {
        areaId: selectedArea, culture,
        declaredProduction: Number(production), productionUnit: 'sacas',
      })
      Alert.alert(
        '🎉 FARMCOINS Emitidos!',
        `${res.data.requestedTokens} FARMCOINS ${res.data.autoApproved ? 'disponíveis na carteira!' : 'em análise.'}`,
      )
      setProduction('')
      await load()
    } catch (e: any) {
      Alert.alert('Erro', e?.response?.data?.error ?? 'Erro ao emitir')
    } finally { setEmitting(false) }
  }

  async function handleEnergy() {
    if (!kwh) return Alert.alert('Informe os kWh')
    setEnergyLoading(true)
    try {
      const res = await api.post('/farmcoin/energy', { kwh: Number(kwh), month })
      Alert.alert('☀️ Energia registrada!', `${res.data.tokensEmitted} FARMCOINS emitidos!`)
      setKwh('')
      await load()
    } catch (e: any) {
      Alert.alert('Erro', e?.response?.data?.error ?? 'Erro')
    } finally { setEnergyLoading(false) }
  }

  const estimatedTokens = production
    ? Math.floor(Number(production) * (CULTURE_PRICE[culture] ?? 100) * 0.3)
    : 0

  if (loading) return (
    <View style={[s.container, s.centered]}>
      <ActivityIndicator size="large" color="#f59e0b" />
    </View>
  )

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      {/* Header carteira */}
      <LinearGradient colors={['#d97706', '#f59e0b', '#fbbf24']} style={s.walletCard}>
        <View style={s.walletIcon}>
          <Ionicons name="ribbon" size={28} color="#fff" />
        </View>
        <Text style={s.walletLabel}>Pontos de Recompensa</Text>
        <Text style={s.walletBalance}>{wallet?.balance?.toFixed(0) ?? '0'}</Text>
        <Text style={s.walletSub}>Programa de fidelidade SolFarm · sem valor monetário</Text>
        <View style={s.walletStats}>
          <View style={s.walletStat}>
            <Text style={s.statLabel}>Total emitido</Text>
            <Text style={s.statValue}>{wallet?.totalMinted?.toFixed(0) ?? 0}</Text>
          </View>
          <View style={s.walletDivider} />
          <View style={s.walletStat}>
            <Text style={s.statLabel}>Em garantia</Text>
            <Text style={s.statValue}>{wallet?.lockedBalance?.toFixed(0) ?? 0}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabsWrap}>
        {([
          { key: 'wallet', label: '💳 Carteira' },
          { key: 'emitir', label: '🌾 Emitir' },
          { key: 'energia', label: '☀️ Energia' },
          { key: 'ranking', label: '🏆 Ranking' },
        ] as const).map(({ key, label }) => (
          <TouchableOpacity key={key} onPress={() => setTab(key)}
            style={[s.tab, tab === key && s.tabActive]}>
            <Text style={[s.tabText, tab === key && s.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={s.body}>
        {/* ── Carteira ── */}
        {tab === 'wallet' && (
          <>
            <Text style={s.sectionTitle}>Últimas transações</Text>
            {transactions.length === 0 ? (
              <View style={s.emptyCard}>
                <Ionicons name="logo-bitcoin" size={40} color="#d4cec5" />
                <Text style={s.emptyTitle}>Nenhuma transação</Text>
                <Text style={s.emptySub}>Emita seus primeiros FARMCOINS declarando sua produção</Text>
              </View>
            ) : transactions.map((tx: any) => (
              <View key={tx.id} style={s.txRow}>
                <View style={[s.txIcon, { backgroundColor: (TX_COLOR[tx.type] ?? '#94a3b8') + '20' }]}>
                  <Ionicons name={TX_ICON[tx.type] as any ?? 'swap-horizontal'} size={18}
                    color={TX_COLOR[tx.type] ?? '#94a3b8'} />
                </View>
                <View style={s.txInfo}>
                  <Text style={s.txType}>{TX_LABEL[tx.type] ?? tx.type}</Text>
                  <Text style={s.txDesc} numberOfLines={1}>{tx.description}</Text>
                  <Text style={s.txDate}>{new Date(tx.createdAt).toLocaleDateString('pt-BR')}</Text>
                </View>
                <Text style={[s.txAmount, { color: TX_COLOR[tx.type] ?? '#1c1917' }]}>
                  {['TRANSFER','SPEND','BURN','LOCK'].includes(tx.type) ? '-' : '+'}{tx.amount.toFixed(2)}
                </Text>
              </View>
            ))}
          </>
        )}

        {/* ── Emitir ── */}
        {tab === 'emitir' && (
          <>
            <View style={s.infoCard}>
              <Text style={s.infoText}>
                Declare sua produção estimada. A plataforma emite FARMCOINS equivalentes a{' '}
                <Text style={s.infoBold}>30% do valor</Text> como lastro.
              </Text>
            </View>

            <Text style={s.label}>Área</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {areas.map((a: any) => (
                <TouchableOpacity key={a.id} onPress={() => setSelectedArea(a.id)}
                  style={[s.chip, selectedArea === a.id && s.chipActive]}>
                  <Text style={[s.chipText, selectedArea === a.id && s.chipTextActive]}>
                    {a.name} ({a.hectares}ha)
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={s.label}>Cultura</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {CULTURES.map(c => (
                <TouchableOpacity key={c} onPress={() => setCulture(c)}
                  style={[s.chip, culture === c && s.chipActive]}>
                  <Text style={[s.chipText, culture === c && s.chipTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={s.label}>Produção declarada (sacas)</Text>
            <TextInput value={production} onChangeText={setProduction} keyboardType="numeric"
              placeholder="Ex: 500" style={s.input} placeholderTextColor="#a8a29e" />

            {estimatedTokens > 0 && (
              <View style={s.estimateCard}>
                <Text style={s.estimateLabel}>Estimativa de emissão</Text>
                <Text style={s.estimateValue}>{estimatedTokens} FARMCOINS</Text>
                <Text style={s.estimateSub}>30% do valor estimado da produção</Text>
              </View>
            )}

            <TouchableOpacity onPress={handleEmit} disabled={emitting}
              style={[s.btnPrimary, { backgroundColor: '#f59e0b' }, emitting && { opacity: 0.6 }]}>
              {emitting
                ? <ActivityIndicator size="small" color="#fff" />
                : <><Ionicons name="logo-bitcoin" size={18} color="#fff" /><Text style={s.btnText}>Solicitar emissão</Text></>
              }
            </TouchableOpacity>
          </>
        )}

        {/* ── Energia ── */}
        {tab === 'energia' && (
          <>
            <View style={s.infoCard}>
              <Text style={s.infoText}>
                Registre o excedente solar injetado na rede e receba{' '}
                <Text style={s.infoBold}>0,5 FARMCOIN por kWh</Text>.
              </Text>
            </View>

            <Text style={s.label}>kWh excedente no mês</Text>
            <TextInput value={kwh} onChangeText={setKwh} keyboardType="numeric"
              placeholder="Ex: 1200" style={s.input} placeholderTextColor="#a8a29e" />

            <Text style={s.label}>Mês de referência</Text>
            <TextInput value={month} onChangeText={setMonth}
              placeholder="2026-04" style={s.input} placeholderTextColor="#a8a29e" />

            {kwh ? (
              <View style={s.estimateCard}>
                <Text style={s.estimateLabel}>Você receberá</Text>
                <Text style={s.estimateValue}>{Math.floor(Number(kwh) * 0.5)} FARMCOINS</Text>
              </View>
            ) : null}

            <TouchableOpacity onPress={handleEnergy} disabled={energyLoading}
              style={[s.btnPrimary, { backgroundColor: '#f59e0b' }, energyLoading && { opacity: 0.6 }]}>
              {energyLoading
                ? <ActivityIndicator size="small" color="#fff" />
                : <><Ionicons name="sunny" size={18} color="#fff" /><Text style={s.btnText}>Registrar e receber tokens</Text></>
              }
            </TouchableOpacity>
          </>
        )}

        {/* ── Ranking ── */}
        {tab === 'ranking' && (
          <>
            <Text style={s.sectionTitle}>🏆 Top Produtores FARMCOIN</Text>
            {leaderboard.length === 0 ? (
              <View style={s.emptyCard}>
                <Text style={s.emptyTitle}>Nenhum produtor com saldo ainda</Text>
              </View>
            ) : leaderboard.map((u: any, i: number) => (
              <View key={i} style={s.rankRow}>
                <View style={[s.rankNum, i === 0 ? s.gold : i === 1 ? s.silver : i === 2 ? s.bronze : {}]}>
                  <Text style={s.rankNumText}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.rankName}>{u.name}</Text>
                  <Text style={s.rankCity}>{u.city && u.state ? `${u.city}, ${u.state}` : '—'}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={s.rankBalance}>{u.balance.toFixed(0)}</Text>
                  <Text style={s.rankUnit}>FARMCOINS</Text>
                </View>
              </View>
            ))}
          </>
        )}

        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f7f4' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  walletCard: { paddingTop: 55, paddingBottom: 28, paddingHorizontal: 24, alignItems: 'center' },
  walletIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  walletLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600' },
  walletBalance: { color: '#fff', fontSize: 48, fontWeight: '900', letterSpacing: -1 },
  walletSub: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 2 },
  walletStats: { flexDirection: 'row', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.3)', gap: 24 },
  walletStat: { alignItems: 'center' },
  walletDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
  statLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  statValue: { color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 2 },
  tabsWrap: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f0ee' },
  tab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, marginRight: 8, backgroundColor: '#f5f3ef' },
  tabActive: { backgroundColor: '#f59e0b' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#78716c' },
  tabTextActive: { color: '#fff' },
  body: { padding: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1c1917', marginBottom: 12 },
  emptyCard: { alignItems: 'center', padding: 32, backgroundColor: '#fff', borderRadius: 16, gap: 8 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#44403c' },
  emptySub: { fontSize: 13, color: '#78716c', textAlign: 'center' },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8 },
  txIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  txInfo: { flex: 1 },
  txType: { fontSize: 13, fontWeight: '700', color: '#1c1917' },
  txDesc: { fontSize: 12, color: '#78716c', marginTop: 1 },
  txDate: { fontSize: 11, color: '#a8a29e', marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: '800' },
  infoCard: { backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a', borderRadius: 14, padding: 14, marginBottom: 16 },
  infoText: { fontSize: 13, color: '#92400e', lineHeight: 20 },
  infoBold: { fontWeight: '700' },
  label: { fontSize: 13, fontWeight: '600', color: '#44403c', marginBottom: 6 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f5f3ef', marginRight: 8, borderWidth: 1.5, borderColor: 'transparent' },
  chipActive: { backgroundColor: '#fef3c7', borderColor: '#f59e0b' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#78716c' },
  chipTextActive: { color: '#b45309' },
  input: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e2e0dc', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: '#1c1917', marginBottom: 12 },
  estimateCard: { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', borderRadius: 14, padding: 14, marginBottom: 14, alignItems: 'center' },
  estimateLabel: { fontSize: 12, color: '#4ade80', fontWeight: '600' },
  estimateValue: { fontSize: 28, fontWeight: '900', color: '#16a34a' },
  estimateSub: { fontSize: 11, color: '#86efac', marginTop: 2 },
  btnPrimary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 16, padding: 16, marginTop: 4 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8 },
  rankNum: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f5f3ef', alignItems: 'center', justifyContent: 'center' },
  gold: { backgroundColor: '#fef3c7' }, silver: { backgroundColor: '#f1f5f9' }, bronze: { backgroundColor: '#fff7ed' },
  rankNumText: { fontSize: 14, fontWeight: '800', color: '#44403c' },
  rankName: { fontSize: 14, fontWeight: '700', color: '#1c1917' },
  rankCity: { fontSize: 12, color: '#78716c' },
  rankBalance: { fontSize: 18, fontWeight: '900', color: '#f59e0b' },
  rankUnit: { fontSize: 11, color: '#a8a29e' },
})
