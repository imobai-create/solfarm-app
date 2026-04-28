import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform,
} from 'react-native'
import MapView, { Circle, PROVIDER_GOOGLE } from 'react-native-maps'
import { useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { diagnosticService } from '../../src/services/diagnostic.service'
import { Colors, healthColor, severityColor, cultureLabel, ndviColor } from '../../src/utils/colors'
import type { Diagnostic } from '../../src/types'

export default function DiagnosticScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [diagnostic, setDiagnostic] = useState<Diagnostic | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'problems' | 'recommendations' | 'fertilization'>('overview')

  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoadError(null)
    diagnosticService.findOne(id)
      .then(setDiagnostic)
      .catch((err: any) => {
        const msg = err?.response?.data?.error
        setLoadError(typeof msg === 'string' ? msg : 'Não foi possível carregar o diagnóstico.')
      })
      .finally(() => setIsLoading(false))
  }, [id])

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
  }

  if (loadError || !diagnostic) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.gray400} />
        <Text style={{ color: Colors.gray700, marginTop: 12, textAlign: 'center', paddingHorizontal: 32 }}>
          {loadError ?? 'Diagnóstico não encontrado.'}
        </Text>
      </View>
    )
  }

  const { score, healthStatus, healthLabel, summary, problems, recommendations,
    recommendedCultures, fertilizationPlan, satellite, area, yieldEstimate } = diagnostic

  // Guard contra payload incompleto do servidor (evita crash em score.toFixed, etc.)
  if (!area || typeof score !== 'number' || !satellite?.indices?.ndvi) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.gray400} />
        <Text style={{ color: Colors.gray700, marginTop: 12, textAlign: 'center', paddingHorizontal: 32 }}>
          O servidor retornou um diagnóstico incompleto. Tente gerar novamente em instantes.
        </Text>
      </View>
    )
  }

  const safeProblems = problems ?? []
  const safeRecommendations = recommendations ?? []
  const zones = satellite?.zonesMap ?? []
  const centerLat = zones.length > 0 ? zones[Math.floor(zones.length / 2)].lat : -12.5
  const centerLng = zones.length > 0 ? zones[Math.floor(zones.length / 2)].lng : -55.7

  return (
    <ScrollView style={styles.container}>
      {/* Score hero */}
      <View style={[styles.hero, { backgroundColor: healthColor(healthStatus) }]}>
        <View style={styles.heroRow}>
          <View>
            <Text style={styles.heroArea}>{area.name}</Text>
            <Text style={styles.heroHa}>{area.hectares} ha · {cultureLabel(area.culture)}</Text>
          </View>
          <View style={styles.scorCircle}>
            <Text style={styles.scoreNum}>{score.toFixed(1)}</Text>
            <Text style={styles.scoreDen}>/10</Text>
          </View>
        </View>
        <Text style={styles.heroStatus}>{healthLabel}</Text>
        <Text style={styles.heroBannerText}>{summary}</Text>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
        <View style={styles.tabs}>
          {(['overview', 'problems', 'recommendations', 'fertilization'] as const).map((tab) => {
            const labels = { overview: 'Resumo', problems: `Problemas (${safeProblems.length})`, recommendations: 'Recomendações', fertilization: 'Fertilização' }
            return (
              <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{labels[tab]}</Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </ScrollView>

      <View style={styles.body}>

        {/* ─── OVERVIEW ─── */}
        {activeTab === 'overview' && (
          <>
            {/* Índices */}
            <Text style={styles.sectionTitle}>📡 Índices de Satélite</Text>
            <View style={styles.indicesRow}>
              <IndexCard label="NDVI" value={satellite.indices.ndvi.mean} description="Saúde da vegetação" />
              {satellite.indices.ndre && <IndexCard label="NDRE" value={satellite.indices.ndre.mean} description="Nitrogênio" />}
              {satellite.indices.ndwi && <IndexCard label="NDWI" value={satellite.indices.ndwi.mean} description="Umidade" />}
            </View>

            {/* Info satélite */}
            <View style={styles.infoCard}>
              <Text style={styles.infoCardText}>
                📅 Imagem: {new Date(satellite.acquisitionDate).toLocaleDateString('pt-BR')} · {satellite.satellite}
              </Text>
              <Text style={styles.infoCardText}>☁️ Cobertura de nuvens: {satellite.cloudCover.toFixed(0)}%</Text>
            </View>

            {/* Mapa de calor por zona */}
            {zones.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>🗺 Mapa de NDVI por Zona</Text>
                <MapView
                  style={styles.zonesMap}
                  provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                  initialRegion={{ latitude: centerLat, longitude: centerLng, latitudeDelta: 0.06, longitudeDelta: 0.06 }}
                  mapType="satellite"
                  scrollEnabled={false}
                  zoomEnabled={false}
                >
                  {zones.map((z) => (
                    <Circle
                      key={z.zone}
                      center={{ latitude: z.lat, longitude: z.lng }}
                      radius={300}
                      strokeColor={ndviColor(z.ndvi)}
                      fillColor={ndviColor(z.ndvi) + '70'}
                      strokeWidth={2}
                    />
                  ))}
                </MapView>
                <View style={styles.zonesGrid}>
                  {zones.map((z) => (
                    <View key={z.zone} style={[styles.zoneChip, { borderColor: ndviColor(z.ndvi) }]}>
                      <Text style={styles.zoneLabel}>{z.zone}</Text>
                      <Text style={[styles.zoneNdvi, { color: ndviColor(z.ndvi) }]}>{z.ndvi.toFixed(2)}</Text>
                      <Text style={styles.zoneStatus}>{z.status}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* Estimativa de produtividade */}
            {yieldEstimate && yieldEstimate.value > 0 && (
              <>
                <Text style={styles.sectionTitle}>📊 Estimativa de Produtividade</Text>
                <View style={styles.yieldCard}>
                  <View style={styles.yieldItem}>
                    <Text style={styles.yieldValue}>{yieldEstimate.value}</Text>
                    <Text style={styles.yieldUnit}>{yieldEstimate.unit}</Text>
                    <Text style={styles.yieldLabel}>Por hectare</Text>
                  </View>
                  <View style={styles.yieldDivider} />
                  <View style={styles.yieldItem}>
                    <Text style={styles.yieldValue}>{yieldEstimate.totalEstimate.toLocaleString()}</Text>
                    <Text style={styles.yieldUnit}>{yieldEstimate.unit.replace('/ha', '').trim()}</Text>
                    <Text style={styles.yieldLabel}>Total estimado</Text>
                  </View>
                  <View style={styles.yieldDivider} />
                  <View style={styles.yieldItem}>
                    <Text style={[styles.yieldValue, { color: healthColor(healthStatus) }]}>{yieldEstimate.efficiency}%</Text>
                    <Text style={styles.yieldLabel}>Eficiência</Text>
                  </View>
                </View>
              </>
            )}

            {/* Culturas recomendadas */}
            {(recommendedCultures?.length ?? 0) > 0 && (
              <>
                <Text style={styles.sectionTitle}>🌱 Culturas para Próxima Safra</Text>
                {(recommendedCultures ?? []).map((c, i) => (
                  <View key={i} style={styles.cultureCard}>
                    <View style={styles.cultureScore}>
                      <Text style={styles.cultureScoreText}>{c.score}%</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cultureName}>{cultureLabel(c.culture)}</Text>
                      <Text style={styles.cultureReason}>{c.reason}</Text>
                    </View>
                  </View>
                ))}
              </>
            )}
          </>
        )}

        {/* ─── PROBLEMS ─── */}
        {activeTab === 'problems' && (
          <>
            {safeProblems.length === 0
              ? <View style={styles.emptyTab}><Text style={styles.emptyTabEmoji}>✅</Text><Text style={styles.emptyTabText}>Nenhum problema detectado!</Text></View>
              : safeProblems.map((p, i) => (
                <View key={i} style={[styles.problemCard, { borderLeftColor: severityColor(p.severity) }]}>
                  <View style={styles.problemHeader}>
                    <View style={[styles.severityBadge, { backgroundColor: severityColor(p.severity) + '20' }]}>
                      <Text style={[styles.severityText, { color: severityColor(p.severity) }]}>{p.severity}</Text>
                    </View>
                    {p.affectedArea && (
                      <Text style={styles.affectedArea}>{p.affectedArea.toFixed(0)}% da área</Text>
                    )}
                  </View>
                  <Text style={styles.problemType}>{p.type.replace(/_/g, ' ')}</Text>
                  <Text style={styles.problemDesc}>{p.description}</Text>
                  {p.zone && <Text style={styles.problemZone}>📍 Zonas: {p.zone}</Text>}
                </View>
              ))
            }
          </>
        )}

        {/* ─── RECOMMENDATIONS ─── */}
        {activeTab === 'recommendations' && (
          <>
            {safeRecommendations.length === 0 && (
              <View style={styles.emptyTab}>
                <Text style={styles.emptyTabEmoji}>📋</Text>
                <Text style={styles.emptyTabText}>Nenhuma recomendação disponível.</Text>
              </View>
            )}
            {safeRecommendations.map((r, i) => (
              <View key={i} style={styles.recCard}>
                <View style={styles.recHeader}>
                  <View style={[styles.priorityBadge, { backgroundColor: priorityColor(r.priority) + '20' }]}>
                    <Text style={[styles.priorityText, { color: priorityColor(r.priority) }]}>{r.priority}</Text>
                  </View>
                  <Text style={styles.recCategory}>{r.category}</Text>
                </View>
                <Text style={styles.recAction}>{r.action}</Text>
                {r.detail && <Text style={styles.recDetail}>{r.detail}</Text>}
                <View style={styles.recMetrics}>
                  {r.estimatedCostReduction ? (
                    <View style={styles.recMetric}>
                      <Ionicons name="trending-down" size={14} color={Colors.success} />
                      <Text style={[styles.recMetricText, { color: Colors.success }]}>-{r.estimatedCostReduction}% custo</Text>
                    </View>
                  ) : null}
                  {r.estimatedProductivityGain ? (
                    <View style={styles.recMetric}>
                      <Ionicons name="trending-up" size={14} color={Colors.primary} />
                      <Text style={[styles.recMetricText, { color: Colors.primary }]}>+{r.estimatedProductivityGain}% produção</Text>
                    </View>
                  ) : null}
                </View>
                {r.productKeywords && r.productKeywords.length > 0 && (
                  <View style={styles.keywordsRow}>
                    {r.productKeywords.map((kw, j) => (
                      <View key={j} style={styles.kwChip}><Text style={styles.kwText}>{kw}</Text></View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </>
        )}

        {/* ─── FERTILIZATION PLAN (VRA) ─── */}
        {activeTab === 'fertilization' && (
          <>
            <View style={styles.vraHeader}>
              <Text style={styles.vraTitle}>Aplicação em Taxa Variável (VRA)</Text>
              <Text style={styles.vraSubtitle}>Doses recomendadas por zona da propriedade</Text>
            </View>
            {(fertilizationPlan ?? []).length === 0 && (
              <View style={styles.emptyTab}>
                <Text style={styles.emptyTabEmoji}>📊</Text>
                <Text style={styles.emptyTabText}>Plano de fertilização indisponível neste diagnóstico.</Text>
              </View>
            )}
            {(fertilizationPlan ?? []).map((z, i) => (
              <View key={i} style={[styles.vraCard, z.priority === 'URGENTE' && styles.vraCardUrgente]}>
                <View style={styles.vraCardHeader}>
                  <View style={[styles.zoneCircle, { backgroundColor: ndviColor(z.ndvi) }]}>
                    <Text style={styles.zoneCircleText}>{z.zone}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.vraZoneName}>Zona {z.zone}</Text>
                    <Text style={[styles.vraStatus, { color: ndviColor(z.ndvi) }]}>NDVI {z.ndvi.toFixed(2)} — {z.status}</Text>
                  </View>
                  {z.priority === 'URGENTE' && (
                    <View style={styles.urgentBadge}><Text style={styles.urgentText}>URGENTE</Text></View>
                  )}
                </View>
                <View style={styles.dosesRow}>
                  <DoseItem label="Nitrogênio" value={z.nitrogenDose} unit="kg N/ha" color={Colors.info} />
                  <DoseItem label="Fósforo" value={z.phosphorusDose} unit="kg P₂O₅/ha" color={Colors.warning} />
                  <DoseItem label="Potássio" value={z.potassiumDose} unit="kg K₂O/ha" color={Colors.earth} />
                  {z.limeDose && <DoseItem label="Calcário" value={z.limeDose} unit="ton/ha" color={Colors.gray500} />}
                </View>
              </View>
            ))}
          </>
        )}
      </View>
    </ScrollView>
  )
}

function IndexCard({ label, value, description }: { label: string; value: number; description: string }) {
  return (
    <View style={[styles.indexCard, { borderTopColor: ndviColor(value), borderTopWidth: 3 }]}>
      <Text style={styles.indexLabel}>{label}</Text>
      <Text style={[styles.indexValue, { color: ndviColor(value) }]}>{value.toFixed(3)}</Text>
      <Text style={styles.indexDesc}>{description}</Text>
    </View>
  )
}

function DoseItem({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  return (
    <View style={styles.doseItem}>
      <Text style={[styles.doseValue, { color }]}>{value}</Text>
      <Text style={styles.doseUnit}>{unit}</Text>
      <Text style={styles.doseLabel}>{label}</Text>
    </View>
  )
}

function priorityColor(priority: string): string {
  switch (priority) {
    case 'URGENTE': return Colors.danger
    case 'ALTA': return Colors.warning
    case 'MEDIA': return Colors.info
    default: return Colors.gray400
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { padding: 20, paddingTop: 16 },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  heroArea: { fontSize: 18, fontWeight: '800', color: Colors.white },
  heroHa: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  scorCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', alignSelf: 'center' },
  scoreNum: { fontSize: 24, fontWeight: '900', color: Colors.white },
  scoreDen: { fontSize: 13, color: 'rgba(255,255,255,0.75)', alignSelf: 'flex-end', marginBottom: 3 },
  heroStatus: { fontSize: 16, fontWeight: '800', color: Colors.white, marginBottom: 6 },
  heroBannerText: { fontSize: 13, color: 'rgba(255,255,255,0.9)', lineHeight: 19 },
  tabsScroll: { backgroundColor: Colors.white, borderBottomWidth: 1, borderColor: Colors.border },
  tabs: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 0 },
  tab: { paddingHorizontal: 14, paddingVertical: 14, borderBottomWidth: 3, borderColor: 'transparent' },
  tabActive: { borderColor: Colors.primary },
  tabText: { fontSize: 13, color: Colors.gray500, fontWeight: '600' },
  tabTextActive: { color: Colors.primary },
  body: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.gray900, marginBottom: 12, marginTop: 4 },
  indicesRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  indexCard: { flex: 1, backgroundColor: Colors.white, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  indexLabel: { fontSize: 11, fontWeight: '700', color: Colors.gray500, letterSpacing: 0.5 },
  indexValue: { fontSize: 22, fontWeight: '800', marginVertical: 4 },
  indexDesc: { fontSize: 10, color: Colors.gray400, textAlign: 'center' },
  infoCard: { backgroundColor: Colors.white, borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
  infoCardText: { fontSize: 12, color: Colors.gray600, marginBottom: 2 },
  zonesMap: { height: 200, borderRadius: 14, overflow: 'hidden', marginBottom: 12 },
  zonesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  zoneChip: { borderWidth: 2, borderRadius: 10, padding: 8, backgroundColor: Colors.white, alignItems: 'center', minWidth: 72 },
  zoneLabel: { fontSize: 11, fontWeight: '700', color: Colors.gray600 },
  zoneNdvi: { fontSize: 16, fontWeight: '800' },
  zoneStatus: { fontSize: 9, color: Colors.gray400, textAlign: 'center', marginTop: 2 },
  yieldCard: { flexDirection: 'row', backgroundColor: Colors.white, borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
  yieldItem: { flex: 1, alignItems: 'center' },
  yieldValue: { fontSize: 24, fontWeight: '800', color: Colors.gray900 },
  yieldUnit: { fontSize: 10, color: Colors.gray400, fontWeight: '600', marginTop: 1 },
  yieldLabel: { fontSize: 10, color: Colors.gray500, marginTop: 2 },
  yieldDivider: { width: 1, backgroundColor: Colors.border },
  cultureCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.white, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  cultureScore: { width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.primaryBg, alignItems: 'center', justifyContent: 'center' },
  cultureScoreText: { fontSize: 15, fontWeight: '800', color: Colors.primary },
  cultureName: { fontSize: 14, fontWeight: '700', color: Colors.gray900 },
  cultureReason: { fontSize: 12, color: Colors.gray500, marginTop: 2 },
  emptyTab: { alignItems: 'center', paddingVertical: 40 },
  emptyTabEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTabText: { fontSize: 16, fontWeight: '600', color: Colors.gray600 },
  problemCard: { backgroundColor: Colors.white, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border, borderLeftWidth: 4 },
  problemHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  severityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  severityText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  affectedArea: { fontSize: 11, color: Colors.gray500 },
  problemType: { fontSize: 14, fontWeight: '700', color: Colors.gray800, marginBottom: 6, textTransform: 'capitalize' },
  problemDesc: { fontSize: 13, color: Colors.gray600, lineHeight: 19 },
  problemZone: { fontSize: 11, color: Colors.gray400, marginTop: 8, fontStyle: 'italic' },
  recCard: { backgroundColor: Colors.white, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  recHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  priorityText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  recCategory: { fontSize: 11, color: Colors.gray500, fontWeight: '600' },
  recAction: { fontSize: 14, fontWeight: '700', color: Colors.gray800, marginBottom: 8 },
  recDetail: { fontSize: 12, color: Colors.gray600, lineHeight: 18, marginBottom: 10 },
  recMetrics: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  recMetric: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  recMetricText: { fontSize: 12, fontWeight: '700' },
  keywordsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  kwChip: { backgroundColor: Colors.gray100, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  kwText: { fontSize: 11, color: Colors.gray600 },
  vraHeader: { backgroundColor: Colors.primaryBg, borderRadius: 12, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: Colors.primary + '40' },
  vraTitle: { fontSize: 15, fontWeight: '800', color: Colors.primaryDark },
  vraSubtitle: { fontSize: 12, color: Colors.primary, marginTop: 2 },
  vraCard: { backgroundColor: Colors.white, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  vraCardUrgente: { borderColor: Colors.danger, borderWidth: 2 },
  vraCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  zoneCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  zoneCircleText: { color: Colors.white, fontWeight: '800', fontSize: 12 },
  vraZoneName: { fontSize: 14, fontWeight: '700', color: Colors.gray800 },
  vraStatus: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  urgentBadge: { backgroundColor: Colors.danger + '20', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  urgentText: { fontSize: 10, color: Colors.danger, fontWeight: '800' },
  dosesRow: { flexDirection: 'row', justifyContent: 'space-around' },
  doseItem: { alignItems: 'center', flex: 1 },
  doseValue: { fontSize: 20, fontWeight: '800' },
  doseUnit: { fontSize: 9, color: Colors.gray400, textAlign: 'center', marginTop: 1 },
  doseLabel: { fontSize: 10, color: Colors.gray500, fontWeight: '600', marginTop: 3 },
})
