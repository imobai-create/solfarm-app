import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, Linking,
} from 'react-native'
import { router } from 'expo-router'
import { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuthStore } from '../src/store/auth.store'
import { Colors } from '../src/utils/colors'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://solfarm-api-production.up.railway.app'

const PLANOS = [
  {
    id: 'FREE',
    nome: 'Grátis',
    preco: 0,
    periodo: 'sempre',
    cor: Colors.gray500,
    gradient: ['#6b7280', '#4b5563'] as [string, string],
    icone: '🌱',
    recursos: [
      '1 área cadastrada',
      'Diagnóstico NDVI básico',
      'Histórico 30 dias',
      'Marketplace (visualização)',
      'Comunidade',
    ],
    limites: { areas: 1, diagnosticos: 3 },
  },
  {
    id: 'CAMPO',
    nome: 'Campo',
    preco: 49,
    periodo: 'mês',
    cor: Colors.primary,
    gradient: ['#16a34a', '#15803d'] as [string, string],
    icone: '🌾',
    popular: true,
    recursos: [
      'Até 5 áreas cadastradas',
      'NDVI + NDRE + NDWI + EVI',
      'Plano VRA de fertilização',
      'Marketplace com compra/venda',
      'Alertas automáticos de pragas',
      'Histórico 12 meses',
      'Suporte por email',
    ],
    limites: { areas: 5, diagnosticos: 20 },
  },
  {
    id: 'FAZENDA',
    nome: 'Fazenda',
    preco: 149,
    periodo: 'mês',
    cor: '#b45309',
    gradient: ['#d97706', '#b45309'] as [string, string],
    icone: '🏡',
    recursos: [
      'Áreas ilimitadas',
      'IA avançada (Claude Vision)',
      'Score agrícola + crédito rural',
      'API para integração ERP',
      'Relatórios PDF automáticos',
      'Gerente dedicado',
      'FARMCOIN bônus mensal',
    ],
    limites: { areas: 999, diagnosticos: 999 },
  },
]

export default function PlanosScreen() {
  const { user, token } = useAuthStore()
  const [loading, setLoading] = useState<string | null>(null)

  const planoAtual = user?.plan ?? 'FREE'

  async function assinar(planoId: string) {
    if (planoId === 'FREE') return
    if (planoId === planoAtual) {
      Alert.alert('Plano atual', 'Você já está neste plano.')
      return
    }

    setLoading(planoId)

    try {
      const res = await fetch(`${API_URL}/payments/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          plan: planoId,
          billingType: 'UNDEFINED', // link universal: PIX + cartão + boleto
          recurrent: true,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error ?? 'Erro ao gerar cobrança')
      }

      if (data.payment?.invoiceUrl) {
        // Abre a página segura do Asaas (aceita PIX, cartão e boleto)
        await Linking.openURL(data.payment.invoiceUrl)
        Alert.alert(
          '✅ Link de pagamento aberto',
          'Após confirmar o pagamento, seu plano será ativado automaticamente em até 5 minutos.',
          [{ text: 'OK', onPress: () => router.back() }]
        )
      } else if (data.payment?.pixQrCode?.payload) {
        Alert.alert('PIX', `Copie o código PIX:\n\n${data.payment.pixQrCode.payload}`)
      } else {
        Alert.alert('Pagamento', 'Link de pagamento gerado. Verifique seu email.')
      }
    } catch (err: any) {
      Alert.alert('Erro', err.message ?? 'Não foi possível iniciar o pagamento.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#145232', '#16a34a']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Planos SolFarm</Text>
        <Text style={styles.headerSub}>Escolha o plano ideal para sua propriedade</Text>
      </LinearGradient>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

        {/* Plano atual */}
        {planoAtual !== 'FREE' && (
          <View style={styles.currentBanner}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
            <Text style={styles.currentText}>
              Plano atual: <Text style={{ fontWeight: '700' }}>
                {PLANOS.find(p => p.id === planoAtual)?.nome}
              </Text>
            </Text>
          </View>
        )}

        {/* Cards dos planos */}
        {PLANOS.map((plano) => {
          const isAtual = plano.id === planoAtual
          const isLoading = loading === plano.id

          return (
            <View key={plano.id} style={[styles.card, isAtual && styles.cardAtual]}>
              {plano.popular && !isAtual && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>⭐ MAIS POPULAR</Text>
                </View>
              )}
              {isAtual && (
                <View style={[styles.popularBadge, { backgroundColor: Colors.primary }]}>
                  <Text style={styles.popularText}>✓ SEU PLANO ATUAL</Text>
                </View>
              )}

              {/* Header do card */}
              <LinearGradient colors={plano.gradient} style={styles.cardHeader}>
                <Text style={styles.cardIcone}>{plano.icone}</Text>
                <Text style={styles.cardNome}>{plano.nome}</Text>
                <View style={styles.precoRow}>
                  {plano.preco === 0 ? (
                    <Text style={styles.precoGratis}>Gratuito</Text>
                  ) : (
                    <>
                      <Text style={styles.precoCifrao}>R$</Text>
                      <Text style={styles.precoValor}>{plano.preco}</Text>
                      <Text style={styles.precoPeriodo}>/{plano.periodo}</Text>
                    </>
                  )}
                </View>
              </LinearGradient>

              {/* Recursos */}
              <View style={styles.recursos}>
                {plano.recursos.map((r) => (
                  <View key={r} style={styles.recursoRow}>
                    <Ionicons name="checkmark-circle" size={18} color={plano.cor} />
                    <Text style={styles.recursoText}>{r}</Text>
                  </View>
                ))}
              </View>

              {/* Botão */}
              {plano.id !== 'FREE' && (
                <TouchableOpacity
                  style={[
                    styles.btn,
                    { backgroundColor: isAtual ? '#e5e7eb' : plano.cor },
                  ]}
                  onPress={() => assinar(plano.id)}
                  disabled={isAtual || isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={[styles.btnText, isAtual && { color: '#6b7280' }]}>
                      {isAtual ? 'Plano ativo' : `Assinar ${plano.nome} — R$${plano.preco}/mês`}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )
        })}

        {/* Métodos de pagamento */}
        <View style={styles.metodos}>
          <Text style={styles.metodosTitulo}>💳 Métodos de pagamento aceitos</Text>
          <View style={styles.metodosRow}>
            {['Cartão de crédito', 'PIX', 'Boleto'].map((m) => (
              <View key={m} style={styles.metodoBadge}>
                <Text style={styles.metodoText}>{m}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.segurancaText}>
            🔒 Pagamento 100% seguro via Asaas. Seus dados de cartão nunca passam pelos nossos servidores.
          </Text>
        </View>

        {/* FAQ */}
        <View style={styles.faq}>
          <Text style={styles.faqTitulo}>Dúvidas frequentes</Text>
          {[
            { q: 'Posso cancelar a qualquer momento?', a: 'Sim. Cancele quando quiser pelo app. Sem multa ou fidelidade.' },
            { q: 'O cartão é cobrado todo mês?', a: 'Sim, a assinatura é renovada automaticamente todo mês.' },
            { q: 'Posso pagar com PIX?', a: 'Sim! PIX, cartão de crédito e boleto bancário são aceitos.' },
            { q: 'Meu plano ativa na hora?', a: 'Após confirmação do pagamento (instantâneo no PIX e cartão), o plano ativa em até 5 minutos.' },
          ].map(({ q, a }) => (
            <View key={q} style={styles.faqItem}>
              <Text style={styles.faqQ}>{q}</Text>
              <Text style={styles.faqA}>{a}</Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { paddingTop: 60, paddingBottom: 24, paddingHorizontal: 20 },
  backBtn: { marginBottom: 12 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  currentBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#dcfce7', borderRadius: 12, padding: 12, marginBottom: 16,
  },
  currentText: { color: '#166534', fontSize: 14 },
  card: {
    backgroundColor: '#fff', borderRadius: 20, marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  cardAtual: { borderWidth: 2, borderColor: Colors.primary },
  popularBadge: {
    backgroundColor: '#f59e0b', paddingVertical: 6, paddingHorizontal: 16,
    alignItems: 'center',
  },
  popularText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  cardHeader: { padding: 24, alignItems: 'center' },
  cardIcone: { fontSize: 36, marginBottom: 8 },
  cardNome: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 12 },
  precoRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  precoGratis: { fontSize: 28, fontWeight: '800', color: '#fff' },
  precoCifrao: { fontSize: 18, color: 'rgba(255,255,255,0.9)', marginBottom: 4 },
  precoValor: { fontSize: 48, fontWeight: '900', color: '#fff', lineHeight: 52 },
  precoPeriodo: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginBottom: 6 },
  recursos: { padding: 20, gap: 10 },
  recursoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  recursoText: { fontSize: 14, color: '#374151', flex: 1 },
  btn: {
    margin: 16, marginTop: 4, padding: 16, borderRadius: 14, alignItems: 'center',
  },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  metodos: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 20,
  },
  metodosTitulo: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 12 },
  metodosRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 12 },
  metodoBadge: {
    backgroundColor: '#f3f4f6', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12,
  },
  metodoText: { fontSize: 13, color: '#374151', fontWeight: '600' },
  segurancaText: { fontSize: 12, color: '#6b7280', lineHeight: 18 },
  faq: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 20 },
  faqTitulo: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 16 },
  faqItem: { marginBottom: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingBottom: 14 },
  faqQ: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 4 },
  faqA: { fontSize: 13, color: '#6b7280', lineHeight: 18 },
})
