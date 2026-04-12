import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useAreasStore } from '../../src/store/areas.store'
import { Colors, healthColor, cultureEmoji, cultureLabel, biomeLabel } from '../../src/utils/colors'
import type { Area } from '../../src/types'

export default function AreasScreen() {
  const { areas, fetchAreas, isLoading } = useAreasStore()
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => { fetchAreas() }, [])

  async function onRefresh() {
    setRefreshing(true)
    await fetchAreas()
    setRefreshing(false)
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={[Colors.primaryDark, Colors.primary]} style={styles.header}>
        <Text style={styles.headerTitle}>Minhas Áreas</Text>
        <Text style={styles.headerSub}>{areas.length} área{areas.length !== 1 ? 's' : ''} cadastrada{areas.length !== 1 ? 's' : ''}</Text>
      </LinearGradient>

      {isLoading && !refreshing
        ? <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
        : (
          <FlatList
            data={areas}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
            ListEmptyComponent={<EmptyAreas />}
            renderItem={({ item }) => <AreaCard area={item} />}
          />
        )
      }

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/area/new')}>
        <Ionicons name="add" size={28} color={Colors.white} />
      </TouchableOpacity>
    </View>
  )
}

function AreaCard({ area }: { area: Area }) {
  const health = area.latestDiagnostic?.healthStatus
  const score = area.latestDiagnostic?.score

  return (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/area/${area.id}`)}>
      {/* Header do card */}
      <View style={styles.cardHeader}>
        <Text style={styles.cardEmoji}>{cultureEmoji(area.culture)}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardName} numberOfLines={1}>{area.name}</Text>
          {area.city && (
            <Text style={styles.cardLocation}>
              <Ionicons name="location-outline" size={11} color={Colors.gray400} />
              {' '}{area.city}, {area.state}
            </Text>
          )}
        </View>
        {health ? (
          <View style={[styles.scoreBadge, { backgroundColor: healthColor(health) + '18' }]}>
            <Text style={[styles.scoreText, { color: healthColor(health) }]}>{score?.toFixed(1)}</Text>
            <Text style={[styles.scoreSub, { color: healthColor(health) }]}>/10</Text>
          </View>
        ) : (
          <View style={styles.noScoreBadge}>
            <Ionicons name="scan-outline" size={14} color={Colors.gray400} />
          </View>
        )}
      </View>

      {/* Info row */}
      <View style={styles.infoRow}>
        <InfoChip icon="resize-outline" label={`${area.hectares} ha`} />
        <InfoChip icon="leaf-outline" label={cultureLabel(area.culture)} />
        {area.biome && <InfoChip icon="earth-outline" label={biomeLabel(area.biome)} />}
      </View>

      {/* Diagnóstico */}
      {health ? (
        <View style={[styles.diagRow, { backgroundColor: healthColor(health) + '12' }]}>
          <View style={[styles.healthDot, { backgroundColor: healthColor(health) }]} />
          <Text style={[styles.diagStatus, { color: healthColor(health) }]}>
            {health.replace('_', ' ')}
          </Text>
          <Text style={styles.diagDate}>
            · {new Date(area.latestDiagnostic!.createdAt).toLocaleDateString('pt-BR')}
          </Text>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.analyzeBtnRow}
          onPress={() => router.push(`/area/${area.id}`)}
        >
          <Ionicons name="pulse-outline" size={14} color={Colors.primary} />
          <Text style={styles.analyzeText}>Analisar via satélite</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  )
}

function InfoChip({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={styles.chip}>
      <Ionicons name={icon as any} size={12} color={Colors.gray500} />
      <Text style={styles.chipText}>{label}</Text>
    </View>
  )
}

function EmptyAreas() {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyEmoji}>🗺️</Text>
      <Text style={styles.emptyTitle}>Nenhuma área cadastrada</Text>
      <Text style={styles.emptyText}>Toque no botão + para adicionar sua primeira lavoura</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 24 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: Colors.white },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  list: { padding: 16, paddingBottom: 100 },
  card: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  cardEmoji: { fontSize: 36 },
  cardName: { fontSize: 16, fontWeight: '700', color: Colors.gray900 },
  cardLocation: { fontSize: 12, color: Colors.gray400, marginTop: 2 },
  scoreBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, flexDirection: 'row', alignItems: 'baseline' },
  scoreText: { fontSize: 20, fontWeight: '800' },
  scoreSub: { fontSize: 11, fontWeight: '600', marginLeft: 1 },
  noScoreBadge: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.gray100, alignItems: 'center', justifyContent: 'center' },
  infoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.gray100, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  chipText: { fontSize: 11, color: Colors.gray600, fontWeight: '500' },
  diagRow: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8, borderRadius: 8 },
  healthDot: { width: 8, height: 8, borderRadius: 4 },
  diagStatus: { fontSize: 12, fontWeight: '700' },
  diagDate: { fontSize: 11, color: Colors.gray400 },
  analyzeBtnRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primaryBg, padding: 10, borderRadius: 8 },
  analyzeText: { fontSize: 12, color: Colors.primary, fontWeight: '600' },
  fab: { position: 'absolute', bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.gray900, marginBottom: 8 },
  emptyText: { fontSize: 14, color: Colors.gray500, textAlign: 'center', lineHeight: 22 },
})
