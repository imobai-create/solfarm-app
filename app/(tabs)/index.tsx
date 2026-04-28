import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '../../src/store/auth.store'
import { useAreasStore } from '../../src/store/areas.store'
import { Colors, healthColor, cultureEmoji, cultureLabel } from '../../src/utils/colors'
import { canShowPaidPlans, effectivePlan } from '../../src/utils/platform'
import type { Area } from '../../src/types'

export default function HomeScreen() {
  const { user } = useAuthStore()
  const { areas, stats, fetchAreas, fetchStats, isLoading } = useAreasStore()
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchAreas()
    fetchStats()
  }, [])

  async function onRefresh() {
    setRefreshing(true)
    await Promise.all([fetchAreas(), fetchStats()])
    setRefreshing(false)
  }

  const firstName = user?.name.split(' ')[0] ?? 'Produtor'
  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Bom dia'
    if (h < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      {/* Header */}
      <LinearGradient colors={[Colors.primaryDark, Colors.primary]} style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>{greeting()}, {firstName}! 👋</Text>
            <Text style={styles.subGreeting}>Veja como estão suas lavouras</Text>
          </View>
          <TouchableOpacity style={styles.notifBtn}>
            <Ionicons name="notifications-outline" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Stats cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats?.totalAreas ?? 0}</Text>
            <Text style={styles.statLabel}>Áreas</Text>
          </View>
          <View style={[styles.statCard, styles.statCardMiddle]}>
            <Text style={styles.statValue}>{stats?.totalHectares?.toFixed(0) ?? 0}</Text>
            <Text style={styles.statLabel}>Hectares</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats?.diagnosticsRun ?? 0}</Text>
            <Text style={styles.statLabel}>Diagnósticos</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        {/* Ações rápidas */}
        <Text style={styles.sectionTitle}>Ações rápidas</Text>
        <View style={styles.actionsGrid}>
          <QuickAction icon="add-circle" label="Nova Área" color={Colors.primary} onPress={() => router.push('/area/new')} />
          <QuickAction icon="pulse" label="Diagnóstico" color={Colors.info} onPress={() => router.push('/(tabs)/areas')} />
          <QuickAction icon="storefront" label="Loja" color={Colors.earth} onPress={() => router.push('/(tabs)/marketplace')} />
          <QuickAction icon="people" label="Comunidade" color={Colors.primaryDark} onPress={() => router.push('/(tabs)/community')} />
        </View>

        {/* Plano — banner de upgrade só onde planos pagos são oferecidos */}
        {effectivePlan(user?.plan) === 'FREE' && canShowPaidPlans() && (
          <TouchableOpacity style={styles.planBanner} onPress={() => router.push('/planos')}>
            <LinearGradient colors={[Colors.earth, Colors.warning]} style={styles.planBannerGrad}>
              <Ionicons name="rocket-outline" size={24} color={Colors.white} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.planBannerTitle}>Plano Grátis — 1 área</Text>
                <Text style={styles.planBannerSub}>Faça upgrade e monitore até 5 áreas com diagnóstico completo</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.white} />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Áreas recentes */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Suas áreas</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/areas')}>
            <Text style={styles.seeAll}>Ver todas</Text>
          </TouchableOpacity>
        </View>

        {isLoading && !refreshing
          ? <ActivityIndicator color={Colors.primary} style={{ marginVertical: 20 }} />
          : areas.length === 0
          ? <EmptyAreas />
          : areas.slice(0, 3).map((area) => <AreaCard key={area.id} area={area} />)
        }
      </View>
    </ScrollView>
  )
}

function QuickAction({ icon, label, color, onPress }: {
  icon: string; label: string; color: string; onPress: () => void
}) {
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon as any} size={28} color={color} />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  )
}

function AreaCard({ area }: { area: Area }) {
  const health = area.latestDiagnostic?.healthStatus
  const score = area.latestDiagnostic?.score

  return (
    <TouchableOpacity style={styles.areaCard} onPress={() => router.push(`/area/${area.id}`)}>
      <View style={styles.areaCardLeft}>
        <Text style={styles.areaEmoji}>{cultureEmoji(area.culture)}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.areaName} numberOfLines={1}>{area.name}</Text>
          <Text style={styles.areaMeta}>{area.hectares} ha · {cultureLabel(area.culture)}</Text>
          {area.city && <Text style={styles.areaLocation}>📍 {area.city}, {area.state}</Text>}
        </View>
      </View>
      <View style={styles.areaCardRight}>
        {health ? (
          <>
            <View style={[styles.healthDot, { backgroundColor: healthColor(health) }]} />
            <Text style={[styles.areaScore, { color: healthColor(health) }]}>{score?.toFixed(1)}</Text>
            <Text style={styles.areaScoreLabel}>/10</Text>
          </>
        ) : (
          <View style={styles.noDiagBadge}>
            <Text style={styles.noDiagText}>Analisar</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={16} color={Colors.gray400} style={{ marginLeft: 4 }} />
      </View>
    </TouchableOpacity>
  )
}

function EmptyAreas() {
  return (
    <TouchableOpacity style={styles.emptyCard} onPress={() => router.push('/area/new')}>
      <Text style={styles.emptyEmoji}>🗺️</Text>
      <Text style={styles.emptyTitle}>Cadastre sua primeira área</Text>
      <Text style={styles.emptyText}>Desenhe o polígono da sua lavoura no mapa e receba o diagnóstico via satélite</Text>
      <View style={styles.emptyBtn}>
        <Text style={styles.emptyBtnText}>+ Cadastrar área</Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 28 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  greeting: { fontSize: 22, fontWeight: '800', color: Colors.white },
  subGreeting: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  notifBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 14, padding: 14, alignItems: 'center' },
  statCardMiddle: { backgroundColor: 'rgba(255,255,255,0.28)' },
  statValue: { fontSize: 26, fontWeight: '800', color: Colors.white },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  body: { padding: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: Colors.gray900, marginBottom: 12 },
  seeAll: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  quickAction: { width: '22%', alignItems: 'center' },
  quickActionIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  quickActionLabel: { fontSize: 11, fontWeight: '600', color: Colors.gray700, textAlign: 'center' },
  planBanner: { marginBottom: 20, borderRadius: 14, overflow: 'hidden' },
  planBannerGrad: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  planBannerTitle: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  planBannerSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 },
  areaCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  areaCardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  areaEmoji: { fontSize: 32 },
  areaName: { fontSize: 15, fontWeight: '700', color: Colors.gray900 },
  areaMeta: { fontSize: 12, color: Colors.gray500, marginTop: 2 },
  areaLocation: { fontSize: 11, color: Colors.gray400, marginTop: 2 },
  areaCardRight: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  healthDot: { width: 8, height: 8, borderRadius: 4 },
  areaScore: { fontSize: 18, fontWeight: '800', marginLeft: 4 },
  areaScoreLabel: { fontSize: 11, color: Colors.gray400, alignSelf: 'flex-end', marginBottom: 2 },
  noDiagBadge: { backgroundColor: Colors.primaryBg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  noDiagText: { fontSize: 11, color: Colors.primary, fontWeight: '700' },
  emptyCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 28, alignItems: 'center', borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed' },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: Colors.gray900, marginBottom: 8 },
  emptyText: { fontSize: 13, color: Colors.gray500, textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  emptyBtn: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  emptyBtnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
})
