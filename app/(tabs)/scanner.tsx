import { useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, Image, Platform,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import * as Location from 'expo-location'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { api } from '../../src/services/api'
import { Colors } from '../../src/utils/colors'

type ScanResult = {
  localizacao: {
    municipio: string
    estado: string
    estadoSigla: string
    bioma: string
    enderecoCompleto: string
  } | null
  coordenadas: { latitude: number; longitude: number } | null
  hidrologia: { bacia: string; areaKm2: string | null }
  desmatamento: { alertas: number; risco: string }
  analiseImagem: {
    tipoUsoSolo: string
    vegetacao: {
      descricao: string
      estadoConservacao: string
      presencaMataGaleria: boolean
      presencaCerradoNativo: boolean
    }
    solo: {
      aparencia: string
      sinaisErosao: boolean
      sinaisCompactacao: boolean
    }
    aguaSuperficie: { presenca: boolean; tipo: string }
    infraestrutura: {
      estradas: boolean
      construcoes: boolean
      pivoCentral: boolean
      sistemaIrrigacao: boolean
    }
    riscos: string[]
    potencialAgricola: string
    recomendacoes: string[]
    confianca: string
    observacoes: string
  }
  metadados: { geradoEm: string; fontes: string[] }
}

const RISCO_COLOR: Record<string, string> = {
  Alto: '#ef4444', Médio: '#f59e0b', Baixo: '#22c55e', 'Não verificado': '#94a3b8',
}

const POTENCIAL_COLOR: Record<string, string> = {
  Alto: '#22c55e', Médio: '#f59e0b', Baixo: '#ef4444',
}

const CONSERVACAO_COLOR: Record<string, string> = {
  Preservado: '#22c55e', 'Em recuperação': '#84cc16',
  Alterado: '#f59e0b', Degradado: '#ef4444',
}

export default function ScannerScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)

  async function pickImage(fromCamera: boolean) {
    // Permissões
    if (fromCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'Precisamos acessar sua câmera para fotografar a área.')
        return
      }
    }

    const opts: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      base64: true,
      quality: 0.4,   // comprime mais para reduzir payload
      exif: true,
      allowsEditing: false,
    }

    const res = fromCamera
      ? await ImagePicker.launchCameraAsync(opts)
      : await ImagePicker.launchImageLibraryAsync(opts)

    if (res.canceled || !res.assets[0]) return

    const asset = res.assets[0]
    setImageUri(asset.uri)
    setImageBase64(asset.base64 ?? null)
    setResult(null)
  }

  const analyze = useCallback(async () => {
    if (!imageBase64) return
    setLoading(true)

    try {
      // Tenta pegar GPS
      let latitude: number | undefined
      let longitude: number | undefined
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
          latitude = loc.coords.latitude
          longitude = loc.coords.longitude
        }
      } catch {}

      const { data } = await api.post('/scan', {
        imageBase64,
        mimeType: 'image/jpeg',
        latitude,
        longitude,
      })

      setResult(data.scan)
    } catch (err: any) {
      Alert.alert(
        'Erro na análise',
        err?.response?.data?.error ?? 'Não foi possível analisar a imagem. Tente novamente.',
      )
    } finally {
      setLoading(false)
    }
  }, [imageBase64])

  function resetScan() {
    setImageUri(null)
    setImageBase64(null)
    setResult(null)
  }

  // ── Tela inicial (sem imagem) ──────────────────────────────
  if (!imageUri) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#14532d', '#16a34a']} style={styles.header}>
          <Ionicons name="scan-outline" size={40} color="#fff" />
          <Text style={styles.headerTitle}>Diagnóstico por Foto</Text>
          <Text style={styles.headerSub}>
            Fotografe sua área e receba uma análise completa com IA
          </Text>
        </LinearGradient>

        <View style={styles.body}>
          <Text style={styles.sectionTitle}>O que será analisado:</Text>
          {[
            { icon: 'leaf', text: 'Tipo de vegetação e estado de conservação' },
            { icon: 'water', text: 'Rios, córregos e recursos hídricos' },
            { icon: 'earth', text: 'Bioma e dados de localização' },
            { icon: 'warning', text: 'Riscos: erosão, desmatamento, degradação' },
            { icon: 'trending-up', text: 'Potencial agrícola e recomendações' },
          ].map(({ icon, text }) => (
            <View key={text} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Ionicons name={icon as any} size={18} color={Colors.primary} />
              </View>
              <Text style={styles.featureText}>{text}</Text>
            </View>
          ))}

          <TouchableOpacity style={styles.btnPrimary} onPress={() => pickImage(true)}>
            <Ionicons name="camera" size={22} color="#fff" />
            <Text style={styles.btnText}>Fotografar área agora</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnSecondary} onPress={() => pickImage(false)}>
            <Ionicons name="images" size={20} color={Colors.primary} />
            <Text style={styles.btnSecText}>Escolher da galeria</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  // ── Prévia da imagem antes de analisar ──────────────────────
  if (imageUri && !result && !loading) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
        <View style={styles.previewActions}>
          <TouchableOpacity style={styles.btnCancel} onPress={resetScan}>
            <Ionicons name="close" size={20} color="#64748b" />
            <Text style={styles.btnCancelText}>Tirar outra</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnAnalyze} onPress={analyze}>
            <Ionicons name="analytics" size={20} color="#fff" />
            <Text style={styles.btnAnalyzeText}>Analisar esta foto</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  // ── Carregando ─────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <LinearGradient colors={['#f0fdf4', '#dcfce7']} style={styles.loadingCard}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingTitle}>Analisando área...</Text>
          <Text style={styles.loadingText}>
            Consultando IBGE, ANA, INPE{'\n'}e processando com IA
          </Text>
        </LinearGradient>
      </View>
    )
  }

  // ── Resultado ──────────────────────────────────────────────
  if (!result) return null
  const { localizacao, hidrologia, desmatamento, analiseImagem: a, metadados } = result

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Foto + header */}
      <View style={styles.resultImageWrap}>
        <Image source={{ uri: imageUri! }} style={styles.resultImage} resizeMode="cover" />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={styles.resultOverlay}>
          <Text style={styles.resultTitle}>{a.tipoUsoSolo}</Text>
          {localizacao && (
            <Text style={styles.resultSub}>
              {localizacao.municipio}, {localizacao.estadoSigla} · {localizacao.bioma}
            </Text>
          )}
        </LinearGradient>
      </View>

      <View style={styles.resultBody}>
        {/* Potencial + Risco */}
        <View style={styles.pillRow}>
          <View style={[styles.pill, { backgroundColor: POTENCIAL_COLOR[a.potencialAgricola] + '22' }]}>
            <Text style={[styles.pillLabel, { color: POTENCIAL_COLOR[a.potencialAgricola] }]}>
              Potencial {a.potencialAgricola}
            </Text>
          </View>
          <View style={[styles.pill, { backgroundColor: RISCO_COLOR[desmatamento.risco] + '22' }]}>
            <Text style={[styles.pillLabel, { color: RISCO_COLOR[desmatamento.risco] }]}>
              Risco desmatamento: {desmatamento.risco}
            </Text>
          </View>
          <View style={[styles.pill, { backgroundColor: CONSERVACAO_COLOR[a.vegetacao.estadoConservacao] + '22' }]}>
            <Text style={[styles.pillLabel, { color: CONSERVACAO_COLOR[a.vegetacao.estadoConservacao] }]}>
              {a.vegetacao.estadoConservacao}
            </Text>
          </View>
        </View>

        {/* Observação geral */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔍 Análise Geral</Text>
          <Text style={styles.cardText}>{a.observacoes}</Text>
        </View>

        {/* Vegetação */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🌿 Vegetação</Text>
          <Text style={styles.cardText}>{a.vegetacao.descricao}</Text>
          <View style={styles.boolRow}>
            <BoolTag label="Mata galeria" value={a.vegetacao.presencaMataGaleria} />
            <BoolTag label="Cerrado nativo" value={a.vegetacao.presencaCerradoNativo} />
          </View>
        </View>

        {/* Solo */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🪨 Solo</Text>
          <Text style={styles.cardText}>{a.solo.aparencia}</Text>
          <View style={styles.boolRow}>
            <BoolTag label="Sinais de erosão" value={a.solo.sinaisErosao} negative />
            <BoolTag label="Compactação" value={a.solo.sinaisCompactacao} negative />
          </View>
        </View>

        {/* Água e Infra */}
        <View style={styles.row}>
          <View style={[styles.card, { flex: 1, marginRight: 6 }]}>
            <Text style={styles.cardTitle}>💧 Água</Text>
            <Text style={styles.cardText}>{a.aguaSuperficie.presenca ? a.aguaSuperficie.tipo : 'Não visível'}</Text>
            {hidrologia.bacia !== 'Não identificada' && (
              <Text style={styles.cardSub}>Bacia: {hidrologia.bacia}</Text>
            )}
          </View>
          <View style={[styles.card, { flex: 1, marginLeft: 6 }]}>
            <Text style={styles.cardTitle}>🏗️ Infraestrutura</Text>
            <View style={styles.boolCol}>
              <BoolTag label="Estradas" value={a.infraestrutura.estradas} />
              <BoolTag label="Pivô central" value={a.infraestrutura.pivoCentral} />
              <BoolTag label="Irrigação" value={a.infraestrutura.sistemaIrrigacao} />
            </View>
          </View>
        </View>

        {/* Riscos */}
        {a.riscos.length > 0 && (
          <View style={[styles.card, styles.cardWarning]}>
            <Text style={[styles.cardTitle, { color: '#b45309' }]}>⚠️ Riscos Identificados</Text>
            {a.riscos.map((r, i) => (
              <Text key={i} style={styles.riskItem}>• {r}</Text>
            ))}
          </View>
        )}

        {/* Recomendações */}
        <View style={[styles.card, styles.cardGreen]}>
          <Text style={[styles.cardTitle, { color: '#166534' }]}>✅ Recomendações</Text>
          {a.recomendacoes.map((r, i) => (
            <Text key={i} style={styles.recItem}>{i + 1}. {r}</Text>
          ))}
        </View>

        {/* Fontes */}
        <Text style={styles.fontes}>
          Fontes: {metadados.fontes.join(' · ')}
        </Text>
        <Text style={styles.fontes}>
          Confiança da análise: {a.confianca} · {new Date(metadados.geradoEm).toLocaleString('pt-BR')}
        </Text>

        <TouchableOpacity style={styles.btnNewScan} onPress={resetScan}>
          <Ionicons name="camera-outline" size={20} color={Colors.primary} />
          <Text style={styles.btnNewScanText}>Nova análise</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  )
}

function BoolTag({ label, value, negative }: { label: string; value: boolean; negative?: boolean }) {
  const isGood = negative ? !value : value
  return (
    <View style={[tagStyles.wrap, { backgroundColor: isGood ? '#dcfce7' : '#fee2e2' }]}>
      <Ionicons name={value ? 'checkmark-circle' : 'close-circle'} size={13}
        color={isGood ? '#16a34a' : '#dc2626'} />
      <Text style={[tagStyles.text, { color: isGood ? '#166534' : '#991b1b' }]}>{label}</Text>
    </View>
  )
}

const tagStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, marginRight: 6, marginTop: 6 },
  text: { fontSize: 11, fontWeight: '600' },
})

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f7f4' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: { paddingTop: 60, paddingBottom: 32, alignItems: 'center', paddingHorizontal: 24, gap: 8 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginTop: 8 },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 20 },
  body: { padding: 20, gap: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1c1917', marginBottom: 8 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  featureIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center' },
  featureText: { fontSize: 14, color: '#44403c', flex: 1 },
  btnPrimary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: Colors.primary, borderRadius: 16, padding: 16, marginTop: 16 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  btnSecondary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#f0fdf4', borderWidth: 1.5, borderColor: Colors.primary, borderRadius: 16, padding: 14, marginTop: 10 },
  btnSecText: { color: Colors.primary, fontSize: 15, fontWeight: '600' },
  preview: { width: '100%', height: 340 },
  previewActions: { flexDirection: 'row', padding: 16, gap: 12, backgroundColor: '#fff' },
  btnCancel: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: '#e2e8f0' },
  btnCancelText: { color: '#64748b', fontWeight: '600' },
  btnAnalyze: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, padding: 14, borderRadius: 14 },
  btnAnalyzeText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  loadingCard: { borderRadius: 24, padding: 40, alignItems: 'center', gap: 16, margin: 24, width: '85%' },
  loadingTitle: { fontSize: 18, fontWeight: '700', color: '#166534' },
  loadingText: { fontSize: 14, color: '#4ade80', textAlign: 'center', lineHeight: 22 },
  resultImageWrap: { height: 260, position: 'relative' },
  resultImage: { width: '100%', height: '100%' },
  resultOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16 },
  resultTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  resultSub: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  resultBody: { padding: 16 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  pill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  pillLabel: { fontSize: 12, fontWeight: '700' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  cardWarning: { backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a' },
  cardGreen: { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0' },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#1c1917', marginBottom: 6 },
  cardText: { fontSize: 14, color: '#44403c', lineHeight: 20 },
  cardSub: { fontSize: 12, color: '#78716c', marginTop: 4 },
  boolRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  boolCol: { gap: 4, marginTop: 4 },
  row: { flexDirection: 'row', marginBottom: 10 },
  riskItem: { fontSize: 13, color: '#92400e', marginTop: 4, lineHeight: 20 },
  recItem: { fontSize: 13, color: '#166534', marginTop: 6, lineHeight: 20 },
  fontes: { fontSize: 11, color: '#a8a29e', textAlign: 'center', marginTop: 6 },
  btnNewScan: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.primary },
  btnNewScanText: { color: Colors.primary, fontWeight: '700', fontSize: 15 },
})
