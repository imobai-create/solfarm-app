import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Platform,
} from 'react-native'
import { useEffect } from 'react'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuthStore } from '../src/store/auth.store'
import { Colors } from '../src/utils/colors'

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
  },
]

const SITE_URL = 'https://solfarm.com.br/planos'

export default function PlanosScreen() {
  const { user } = useAuthStore()
  const planoAtual = user?.plan ?? 'FREE'

  // No iOS, essa tela não deve ser exibida (App Store Guideline 3.1.1 — IAP).
  // Caso alguém caia aqui por link direto, manda de volta.
  useEffect(() => {
    if (Platform.OS === 'ios') {
      if (router.canGoBack()) router.back()
      else router.replace('/(tabs)')
    }
  }, [])

  if (Platform.OS === 'ios') return null

  function verSite() {
    Linking.openURL(SITE_URL)
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

        {/* Info: assinatura via site */}
        <View style={styles.infoBanner}>
          <Ionicons name="globe-outline" size={20} color="#1d4ed8" />
          <Text style={styles.infoText}>
            As assinaturas são gerenciadas em{' '}
            <Text style={styles.infoLink} onPress={() => Linking.openURL(SITE_URL)}>
              solfarm.com.br
            </Text>
          </Text>
        </View>

        {/* Cards dos planos */}
        {PLANOS.map((plano) => {
          const isAtual = plano.id === planoAtual

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

              {/* Badge plano ativo */}
              {isAtual && (
                <View style={[styles.ativoBadge, { backgroundColor: plano.cor + '20', borderColor: plano.cor }]}>
                  <Ionicons name="checkmark-circle" size={16} color={plano.cor} />
                  <Text style={[styles.ativoText, { color: plano.cor }]}>Seu plano atual</Text>
                </View>
              )}
            </View>
          )
        })}

        {/* CTA site */}
        <TouchableOpacity style={styles.siteCta} onPress={verSite}>
          <Ionicons name="globe-outline" size={20} color="#fff" />
          <Text style={styles.siteCtaText}>Gerenciar assinatura em solfarm.com.br</Text>
          <Ionicons name="arrow-forward" size={16} color="#fff" />
        </TouchableOpacity>

        {/* FAQ */}
        <View style={styles.faq}>
          <Text style={styles.faqTitulo}>Dúvidas frequentes</Text>
          {[
            { q: 'Como faço para assinar?', a: 'Acesse solfarm.com.br/planos pelo navegador e conclua sua assinatura.' },
            { q: 'Posso cancelar a qualquer momento?', a: 'Sim. Cancele quando quiser pelo site. Sem multa ou fidelidade.' },
            { q: 'Quais formas de pagamento são aceitas?', a: 'PIX, cartão de crédito e boleto bancário via site.' },
            { q: 'Meu plano ativa na hora?', a: 'Após confirmação do pagamento, o plano ativa em até 5 minutos.' },
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
    backgroundColor: '#dcfce7', borderRadius: 12, padding: 12, marginBottom: 12,
  },
  currentText: { color: '#166534', fontSize: 14 },
  infoBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#eff6ff', borderRadius: 12, padding: 12, marginBottom: 16,
  },
  infoText: { fontSize: 13, color: '#1e40af', flex: 1 },
  infoLink: { fontWeight: '700', textDecorationLine: 'underline' },
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
  ativoBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, margin: 16, marginTop: 4, padding: 12, borderRadius: 12, borderWidth: 1 },
  ativoText: { fontSize: 14, fontWeight: '700' },
  siteCta: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#16a34a', borderRadius: 14, padding: 16, marginBottom: 16 },
  siteCtaText: { flex: 1, color: '#fff', fontSize: 15, fontWeight: '700' },
  faq: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 20 },
  faqTitulo: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 16 },
  faqItem: { marginBottom: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingBottom: 14 },
  faqQ: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 4 },
  faqA: { fontSize: 13, color: '#6b7280', lineHeight: 18 },
})
