import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, RefreshControl, Platform,
} from 'react-native'
import MapView, { Polygon, PROVIDER_GOOGLE } from 'react-native-maps'
import { useLocalSearchParams, router } from 'expo-router'
import { useEffect, useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useAreasStore } from '../../src/store/areas.store'
import { satelliteService } from '../../src/services/satellite.service'
import { diagnosticService } from '../../src/services/diagnostic.service'
import { Colors, healthColor, cultureEmoji, cultureLabel, biomeLabel } from '../../src/utils/colors'
import type { STACSearchResult } from '../../src/types'

export default function AreaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { selectedArea, fetchArea, isLoading } = useAreasStore()
  const [refreshing, setRefreshing] = useState(false)
  const [stacImages, setStacImages] = useState<STACSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isProcessing, setIsProcessing] = useState<string | null>(null)
  const [isGeneratingDiag, setIsGeneratingDiag] = useState(false)

  useEffect(() => { if (id) fetchArea(id) }, [id])

  async function onRefresh() {
    setRefreshing(true)
    await fetchArea(id!)
    setRefreshing(false)
  }

  async function searchSatelliteImages() {
    if (!id) return
    setIsSearching(true)
    try {
      const result = await satelliteService.searchImages(id, { maxCloudCover: 20 })
      setStacImages(result.images)
      if (result.images.length === 0) Alert.alert('Sem imagens', 'Nenhuma imagem disponível com menos de 20% de nuvens nos últimos 30 dias.')
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.error ?? 'Não foi possível buscar imagens.')
    } finally {
      setIsSearching(false)
    }
  }

  async function processImage(stacId: string) {
    if (!id) return
    setIsProcessing(stacId)
    try {
      await satelliteService.processImage(id, stacId)
      Alert.alert('✅ Imagem processada!', 'Agora você pode gerar o diagnóstico.', [
        { text: 'Gerar Diagnóstico', onPress: generateDiagnostic },
        { text: 'Depois' },
      ])
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.error ?? 'Falha no processamento.')
    } finally {
      setIsProcessing(null)
    }
  }

  async function generateDiagnostic() {
    if (!id) return
    setIsGeneratingDiag(true)
    try {
      const diag = await diagnosticService.generate(id)
      router.push(`/diagnostic/${diag.id}`)
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? 'Erro ao gerar diagnóstico.'
      if (msg.includes('imagem')) {
        Alert.alert('Sem imagem', 'Busque e processe uma imagem de satélite primeiro.')
      } else {
        Alert.alert('Erro', msg)
      }
    } finally {
      setIsGeneratingDiag(false)
    }
  }

  if (isLoading && !refreshing) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
  }

  const area = selectedArea
  if (!area || area.id !== id) return null

  const health = area.latestDiagnostic?.healthStatus
  const score = area.latestDiagnostic?.score

  // Prepara coordenadas do mapa
  const polygonCoords = area.polygon?.coordinates[0]?.map(([lng, lat]) => ({ latitude: lat, longitude: lng })) ?? []
  const centerLat = area.centroidLat ?? -12.5
  const centerLng = area.centroidLng ?? -55.7

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      {/* Mini mapa */}
      {polygonCoords.length > 0 && (
        <MapView
          style={styles.miniMap}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          initialRegion={{ latitude: centerLat, longitude: centerLng, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
          mapType="satellite"
          scrollEnabled={false}
          zoomEnabled={false}
          pitchEnabled={false}
        >
          <Polygon
            coordinates={polygonCoords}
            strokeColor={Colors.primaryLight}
            strokeWidth={3}
            fillColor="rgba(34,197,94,0.3)"
          />
        </MapView>
      )}

      <View style={styles.body}>
        {/* Header da área */}
        <View style={styles.areaHeader}>
          <Text style={styles.areaEmoji}>{cultureEmoji(area.culture)}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.areaName}>{area.name}</Text>
            {area.description && <Text style={styles.areaDesc}>{area.description}</Text>}
          </View>
          {health && (
            <View style={[styles.scoreBadge, { backgroundColor: healthColor(health) }]}>
              <Text style={styles.scoreText}>{score?.toFixed(1)}</Text>
              <Text style={styles.scoreSub}>/10</Text>
            </View>
          )}
        </View>

        {/* Info chips */}
        <View style={styles.infoRow}>
          <InfoItem icon="resize-outline" label="Hectares" value={`${area.hectares} ha`} />
          <InfoItem icon="leaf-outline" label="Cultura" value={cultureLabel(area.culture)} />
          {area.biome && <InfoItem icon="earth-outline" label="Bioma" value={biomeLabel(area.biome)} />}
          {area.state && <InfoItem icon="location-outline" label="Local" value={`${area.city ?? ''}, ${area.state}`} />}
        </View>

        {/* Status de saúde */}
        {health && (
          <View style={[styles.healthBanner, { backgroundColor: healthColor(health) + '15' }]}>
            <View style={[styles.healthDot, { backgroundColor: healthColor(health) }]} />
            <Text style={[styles.healthLabel, { color: healthColor(health) }]}>
              {health.replace('_', ' ')} — Score {score?.toFixed(1)}/10
            </Text>
            <TouchableOpacity onPress={() => area.latestDiagnostic && router.push(`/diagnostic/${area.latestDiagnostic.id}`)}>
              <Text style={[styles.viewDiag, { color: healthColor(health) }]}>Ver diagnóstico →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* AÇÕES SATÉLITE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📡 Análise via Satélite</Text>

          <TouchableOpacity style={styles.actionBtn} onPress={generateDiagnostic} disabled={isGeneratingDiag}>
            {isGeneratingDiag
              ? <ActivityIndicator color={Colors.white} size="small" />
              : <Ionicons name="pulse" size={20} color={Colors.white} />
            }
            <Text style={styles.actionBtnText}>
              {isGeneratingDiag ? 'Gerando diagnóstico...' : 'Gerar Diagnóstico Agora'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnSecondary]} onPress={searchSatelliteImages} disabled={isSearching}>
            {isSearching
              ? <ActivityIndicator color={Colors.primary} size="small" />
              : <Ionicons name="search" size={20} color={Colors.primary} />
            }
            <Text style={[styles.actionBtnText, { color: Colors.primary }]}>
              {isSearching ? 'Buscando...' : 'Buscar Imagens Sentinel-2'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Lista de imagens STAC */}
        {stacImages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🛰 Imagens disponíveis</Text>
            {stacImages.map((img) => (
              <View key={img.stacId} style={styles.stacCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stacDate}>
                    📅 {new Date(img.acquisitionDate).toLocaleDateString('pt-BR')}
                  </Text>
                  <Text style={styles.stacMeta}>
                    ☁️ {img.cloudCover.toFixed(0)}% nuvens · {img.satellite}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.processBtn, isProcessing === img.stacId && { opacity: 0.7 }]}
                  onPress={() => processImage(img.stacId)}
                  disabled={!!isProcessing}
                >
                  {isProcessing === img.stacId
                    ? <ActivityIndicator color={Colors.white} size="small" />
                    : <Text style={styles.processBtnText}>Processar</Text>
                  }
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Diagnósticos anteriores */}
        {(area as any).diagnostics?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 Histórico de diagnósticos</Text>
            {(area as any).diagnostics.map((d: any) => (
              <TouchableOpacity key={d.id} style={styles.diagHistCard} onPress={() => router.push(`/diagnostic/${d.id}`)}>
                <View style={[styles.healthDot, { backgroundColor: healthColor(d.healthStatus) }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.diagHistStatus}>{d.healthStatus.replace('_', ' ')}</Text>
                  <Text style={styles.diagHistDate}>{new Date(d.createdAt).toLocaleDateString('pt-BR')}</Text>
                </View>
                <Text style={[styles.diagHistScore, { color: healthColor(d.healthStatus) }]}>{d.score?.toFixed(1)}/10</Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.gray400} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  )
}

function InfoItem({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoItem}>
      <Ionicons name={icon as any} size={14} color={Colors.primary} />
      <View>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  miniMap: { height: 200, width: '100%' },
  body: { padding: 16 },
  areaHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
  areaEmoji: { fontSize: 40 },
  areaName: { fontSize: 20, fontWeight: '800', color: Colors.gray900, flex: 1 },
  areaDesc: { fontSize: 13, color: Colors.gray500, marginTop: 4 },
  scoreBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, flexDirection: 'row', alignItems: 'baseline' },
  scoreText: { fontSize: 22, fontWeight: '800', color: Colors.white },
  scoreSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginLeft: 1 },
  infoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  infoItem: { flexDirection: 'row', gap: 6, alignItems: 'center', backgroundColor: Colors.white, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: Colors.border },
  infoLabel: { fontSize: 10, color: Colors.gray400, fontWeight: '500' },
  infoValue: { fontSize: 13, color: Colors.gray800, fontWeight: '700' },
  healthBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, marginBottom: 16 },
  healthDot: { width: 10, height: 10, borderRadius: 5 },
  healthLabel: { flex: 1, fontSize: 13, fontWeight: '700' },
  viewDiag: { fontSize: 12, fontWeight: '600' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.gray900, marginBottom: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: 12, height: 50, marginBottom: 10, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
  actionBtnSecondary: { backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.primary, shadowOpacity: 0, elevation: 0 },
  actionBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  stacCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  stacDate: { fontSize: 14, fontWeight: '600', color: Colors.gray800 },
  stacMeta: { fontSize: 12, color: Colors.gray400, marginTop: 2 },
  processBtn: { backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  processBtnText: { color: Colors.white, fontSize: 12, fontWeight: '700' },
  diagHistCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.white, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  diagHistStatus: { fontSize: 13, fontWeight: '700', color: Colors.gray800 },
  diagHistDate: { fontSize: 11, color: Colors.gray400, marginTop: 2 },
  diagHistScore: { fontSize: 16, fontWeight: '800', marginRight: 4 },
})
