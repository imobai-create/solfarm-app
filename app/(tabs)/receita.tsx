import { useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, Image,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import * as ImageManipulator from 'expo-image-manipulator'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { api } from '../../src/services/api'
import { Colors } from '../../src/utils/colors'

type Produto = {
  nome: string
  principioAtivo: string
  dose: string
  unidade: string
  doseTotal: string
  classeAgrotoxica: string
  classetoxicologica: string
  periodoCarencia: string | null
  epi: string[]
  registradoParaCultura: boolean
  observacoes: string
}

type Validacao = {
  receitaValida: boolean
  problemas: string[]
  alertas: string[]
  conformeLegislacao: boolean
  possuiCrea: boolean
  dentroValidade: boolean
  dosagensAdequadas: boolean
  recomendacoes: string[]
}

type ReceitaResult = {
  analise: {
    receita: Record<string, string | null>
    produtos: Produto[]
    validacao: Validacao
    resumo: string
    confiancaLeitura: string
  }
  metadados: { geradoEm: string; fontes: string[] }
}

const TOX_COLOR: Record<string, string> = {
  'I (Extremamente tóxico)': '#dc2626',
  'II (Altamente tóxico)': '#ea580c',
  'III (Medianamente)': '#f59e0b',
  'IV (Pouco tóxico)': '#16a34a',
  'Não identificada': '#94a3b8',
}

export default function ReceitaScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ReceitaResult | null>(null)

  async function pickImage(fromCamera: boolean) {
    if (fromCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'Precisamos acessar sua câmera.')
        return
      }
    }
    const res = fromCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 })

    if (res.canceled || !res.assets[0]) return

    const manipulated = await ImageManipulator.manipulateAsync(
      res.assets[0].uri,
      [{ resize: { width: 1200 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
    )
    setImageUri(manipulated.uri)
    setImageBase64(manipulated.base64 ?? null)
    setResult(null)
  }

  const analyze = useCallback(async () => {
    if (!imageBase64) return
    setLoading(true)
    try {
      const { data } = await api.post('/receita/validar', {
        imageBase64,
        mimeType: 'image/jpeg',
      })
      setResult(data)
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.error ?? 'Erro ao analisar receita.')
    } finally {
      setLoading(false)
    }
  }, [imageBase64])

  function reset() { setImageUri(null); setImageBase64(null); setResult(null) }

  // ── Tela inicial ───────────────────────────────────────────
  if (!imageUri) {
    return (
      <View style={s.container}>
        <LinearGradient colors={['#1e3a5f', '#2563eb']} style={s.header}>
          <Ionicons name="document-text-outline" size={40} color="#fff" />
          <Text style={s.headerTitle}>Verificar Receita</Text>
          <Text style={s.headerSub}>Fotografe a receita agronômica e a IA verifica conformidade, dosagens e produtos</Text>
        </LinearGradient>

        <View style={s.body}>
          <Text style={s.sectionTitle}>O que será verificado:</Text>
          {[
            { icon: 'checkmark-shield', text: 'Conformidade com a legislação agrícola (MAPA/AGROFIT)' },
            { icon: 'flask', text: 'Dosagens adequadas por cultura e área' },
            { icon: 'ban', text: 'Produtos banidos ou com restrição no Brasil' },
            { icon: 'person', text: 'CREA do responsável técnico' },
            { icon: 'calendar', text: 'Validade da receita' },
            { icon: 'shield-checkmark', text: 'EPIs necessários por produto' },
          ].map(({ icon, text }) => (
            <View key={text} style={s.featureRow}>
              <View style={[s.featureIcon, { backgroundColor: '#eff6ff' }]}>
                <Ionicons name={icon as any} size={18} color="#2563eb" />
              </View>
              <Text style={s.featureText}>{text}</Text>
            </View>
          ))}

          <TouchableOpacity style={[s.btnPrimary, { backgroundColor: '#2563eb' }]} onPress={() => pickImage(true)}>
            <Ionicons name="camera" size={22} color="#fff" />
            <Text style={s.btnText}>Fotografar receita</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.btnSecondary, { borderColor: '#2563eb' }]} onPress={() => pickImage(false)}>
            <Ionicons name="images" size={20} color="#2563eb" />
            <Text style={[s.btnSecText, { color: '#2563eb' }]}>Escolher da galeria</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  if (imageUri && !result && !loading) {
    return (
      <View style={s.container}>
        <Image source={{ uri: imageUri }} style={s.preview} resizeMode="contain" />
        <View style={s.previewActions}>
          <TouchableOpacity style={s.btnCancel} onPress={reset}>
            <Ionicons name="close" size={20} color="#64748b" />
            <Text style={s.btnCancelText}>Outra foto</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.btnAnalyze, { backgroundColor: '#2563eb' }]} onPress={analyze}>
            <Ionicons name="shield-checkmark" size={20} color="#fff" />
            <Text style={s.btnAnalyzeText}>Verificar receita</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  if (loading) {
    return (
      <View style={[s.container, s.centered]}>
        <LinearGradient colors={['#eff6ff', '#dbeafe']} style={s.loadingCard}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={[s.loadingTitle, { color: '#1e40af' }]}>Verificando receita...</Text>
          <Text style={[s.loadingText, { color: '#60a5fa' }]}>
            Consultando MAPA/AGROFIT{'\n'}e analisando com IA
          </Text>
        </LinearGradient>
      </View>
    )
  }

  if (!result) return null
  const { analise, metadados } = result
  const { receita, produtos, validacao } = analise
  const valida = validacao.receitaValida

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      {/* Status banner */}
      <LinearGradient
        colors={valida ? ['#14532d', '#16a34a'] : ['#7f1d1d', '#dc2626']}
        style={s.statusBanner}
      >
        <Ionicons name={valida ? 'shield-checkmark' : 'close-circle'} size={36} color="#fff" />
        <View>
          <Text style={s.statusTitle}>{valida ? 'Receita Válida ✓' : 'Problemas Encontrados ✗'}</Text>
          <Text style={s.statusSub}>
            {valida ? 'Conforme legislação brasileira' : `${validacao.problemas.length} problema(s) detectado(s)`}
          </Text>
        </View>
      </LinearGradient>

      <View style={s.resultBody}>
        {/* Indicadores rápidos */}
        <View style={s.pillRow}>
          <BoolPill label="CREA válido" value={validacao.possuiCrea} />
          <BoolPill label="Dentro validade" value={validacao.dentroValidade} />
          <BoolPill label="Conforme lei" value={validacao.conformeLegislacao} />
          <BoolPill label="Doses OK" value={validacao.dosagensAdequadas} />
        </View>

        {/* Dados da receita */}
        <View style={s.card}>
          <Text style={s.cardTitle}>📋 Dados da Receita</Text>
          <InfoRow label="Nº Receita" value={receita.numero} />
          <InfoRow label="Agrônomo" value={receita.agronomoResponsavel} />
          <InfoRow label="CREA/CRF" value={receita.crea} />
          <InfoRow label="Produtor" value={receita.produtor} />
          <InfoRow label="Cultura" value={receita.cultura} />
          <InfoRow label="Área" value={receita.areaHa ? `${receita.areaHa} ha` : null} />
          <InfoRow label="Município" value={receita.municipio} />
          <InfoRow label="Emissão" value={receita.dataEmissao} />
          <InfoRow label="Validade" value={receita.validade} />
        </View>

        {/* Resumo */}
        <View style={s.card}>
          <Text style={s.cardTitle}>🔍 Análise Geral</Text>
          <Text style={s.cardText}>{analise.resumo}</Text>
          <Text style={s.cardSub}>Confiança de leitura: {analise.confiancaLeitura}</Text>
        </View>

        {/* Problemas */}
        {validacao.problemas.length > 0 && (
          <View style={[s.card, s.cardDanger]}>
            <Text style={[s.cardTitle, { color: '#991b1b' }]}>❌ Problemas</Text>
            {validacao.problemas.map((p, i) => (
              <Text key={i} style={s.dangerItem}>• {p}</Text>
            ))}
          </View>
        )}

        {/* Alertas */}
        {validacao.alertas.length > 0 && (
          <View style={[s.card, s.cardWarning]}>
            <Text style={[s.cardTitle, { color: '#92400e' }]}>⚠️ Alertas</Text>
            {validacao.alertas.map((a, i) => (
              <Text key={i} style={s.warningItem}>• {a}</Text>
            ))}
          </View>
        )}

        {/* Produtos */}
        <Text style={s.sectionHeader}>Produtos ({produtos.length})</Text>
        {produtos.map((p, i) => (
          <View key={i} style={s.card}>
            <View style={s.prodHeader}>
              <View style={{ flex: 1 }}>
                <Text style={s.prodNome}>{p.nome}</Text>
                <Text style={s.prodPA}>{p.principioAtivo}</Text>
              </View>
              <View style={[s.classeBadge, { backgroundColor: '#eff6ff' }]}>
                <Text style={[s.classeText, { color: '#2563eb' }]}>{p.classeAgrotoxica}</Text>
              </View>
            </View>

            <View style={s.prodGrid}>
              <ProdInfo label="Dose" value={`${p.dose} ${p.unidade}`} />
              <ProdInfo label="Total" value={p.doseTotal} />
              <ProdInfo label="Carência" value={p.periodoCarencia ? `${p.periodoCarencia} dias` : 'N/A'} />
            </View>

            {/* Classe toxicológica */}
            <View style={[s.toxBadge, { backgroundColor: (TOX_COLOR[p.classetoxicologica] ?? '#94a3b8') + '22' }]}>
              <View style={[s.toxDot, { backgroundColor: TOX_COLOR[p.classetoxicologica] ?? '#94a3b8' }]} />
              <Text style={[s.toxText, { color: TOX_COLOR[p.classetoxicologica] ?? '#94a3b8' }]}>
                {p.classetoxicologica}
              </Text>
            </View>

            {!p.registradoParaCultura && (
              <Text style={s.naoReg}>⚠️ Pode não estar registrado para esta cultura</Text>
            )}

            {p.epi.length > 0 && (
              <Text style={s.epi}>🦺 EPI: {p.epi.join(', ')}</Text>
            )}

            {p.observacoes && (
              <Text style={s.obs}>{p.observacoes}</Text>
            )}
          </View>
        ))}

        {/* Recomendações */}
        {validacao.recomendacoes.length > 0 && (
          <View style={[s.card, s.cardGreen]}>
            <Text style={[s.cardTitle, { color: '#166534' }]}>✅ Recomendações</Text>
            {validacao.recomendacoes.map((r, i) => (
              <Text key={i} style={s.recItem}>{i + 1}. {r}</Text>
            ))}
          </View>
        )}

        <Text style={s.fontes}>
          Fontes: {metadados.fontes.join(' · ')}
        </Text>
        <TouchableOpacity style={[s.btnNewScan, { borderColor: '#2563eb' }]} onPress={reset}>
          <Ionicons name="camera-outline" size={20} color="#2563eb" />
          <Text style={[s.btnNewScanText, { color: '#2563eb' }]}>Nova verificação</Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  )
}

function BoolPill({ label, value }: { label: string; value: boolean }) {
  return (
    <View style={[pp.wrap, { backgroundColor: value ? '#dcfce7' : '#fee2e2' }]}>
      <Ionicons name={value ? 'checkmark-circle' : 'close-circle'} size={13} color={value ? '#16a34a' : '#dc2626'} />
      <Text style={[pp.text, { color: value ? '#166534' : '#991b1b' }]}>{label}</Text>
    </View>
  )
}
const pp = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 20, marginRight: 6, marginBottom: 6 },
  text: { fontSize: 11, fontWeight: '700' },
})

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <View style={ir.row}>
      <Text style={ir.label}>{label}</Text>
      <Text style={ir.value}>{value}</Text>
    </View>
  )
}
const ir = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  label: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  value: { fontSize: 13, color: '#1e293b', fontWeight: '600', flex: 1, textAlign: 'right', marginLeft: 8 },
})

function ProdInfo({ label, value }: { label: string; value: string }) {
  return (
    <View style={pi.wrap}>
      <Text style={pi.label}>{label}</Text>
      <Text style={pi.value}>{value}</Text>
    </View>
  )
}
const pi = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', padding: 8, backgroundColor: '#f8fafc', borderRadius: 10 },
  label: { fontSize: 11, color: '#94a3b8', fontWeight: '500' },
  value: { fontSize: 13, color: '#0f172a', fontWeight: '700', marginTop: 2 },
})

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: { paddingTop: 60, paddingBottom: 32, alignItems: 'center', paddingHorizontal: 24, gap: 8 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginTop: 8 },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 20 },
  body: { padding: 20, gap: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1c1917', marginBottom: 8 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  featureIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  featureText: { fontSize: 14, color: '#44403c', flex: 1 },
  btnPrimary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 16, padding: 16, marginTop: 16 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  btnSecondary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'transparent', borderWidth: 1.5, borderRadius: 16, padding: 14, marginTop: 10 },
  btnSecText: { fontSize: 15, fontWeight: '600' },
  preview: { width: '100%', height: 400, backgroundColor: '#000' },
  previewActions: { flexDirection: 'row', padding: 16, gap: 12, backgroundColor: '#fff' },
  btnCancel: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: '#e2e8f0' },
  btnCancelText: { color: '#64748b', fontWeight: '600' },
  btnAnalyze: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 14 },
  btnAnalyzeText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  loadingCard: { borderRadius: 24, padding: 40, alignItems: 'center', gap: 16, margin: 24, width: '85%' },
  loadingTitle: { fontSize: 18, fontWeight: '700' },
  loadingText: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  statusBanner: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 24, paddingTop: 50 },
  statusTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  statusSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  resultBody: { padding: 16 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  cardDanger: { backgroundColor: '#fff5f5', borderWidth: 1, borderColor: '#fecaca' },
  cardWarning: { backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a' },
  cardGreen: { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0' },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#1c1917', marginBottom: 10 },
  cardText: { fontSize: 14, color: '#44403c', lineHeight: 20 },
  cardSub: { fontSize: 12, color: '#78716c', marginTop: 6 },
  dangerItem: { fontSize: 13, color: '#991b1b', marginTop: 4, lineHeight: 20 },
  warningItem: { fontSize: 13, color: '#92400e', marginTop: 4, lineHeight: 20 },
  sectionHeader: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 8, marginTop: 4 },
  prodHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  prodNome: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  prodPA: { fontSize: 12, color: '#64748b', marginTop: 2 },
  classeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  classeText: { fontSize: 11, fontWeight: '700' },
  prodGrid: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  toxBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, alignSelf: 'flex-start', marginBottom: 8 },
  toxDot: { width: 8, height: 8, borderRadius: 4 },
  toxText: { fontSize: 12, fontWeight: '600' },
  naoReg: { fontSize: 12, color: '#b45309', marginTop: 4 },
  epi: { fontSize: 12, color: '#475569', marginTop: 6 },
  obs: { fontSize: 12, color: '#64748b', marginTop: 6, fontStyle: 'italic' },
  recItem: { fontSize: 13, color: '#166534', marginTop: 6, lineHeight: 20 },
  fontes: { fontSize: 11, color: '#a8a29e', textAlign: 'center', marginTop: 6 },
  btnNewScan: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, padding: 14, borderRadius: 14, borderWidth: 1.5 },
  btnNewScanText: { fontWeight: '700', fontSize: 15 },
})
