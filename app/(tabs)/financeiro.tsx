import {
  View, Text, ScrollView, StyleSheet, TextInput,
  TouchableOpacity, Alert,
} from 'react-native'
import { useState, useMemo } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../src/utils/colors'

interface Custo {
  id: string
  descricao: string
  valor: number
  categoria: string
}

interface Receita {
  id: string
  descricao: string
  quantidade: number
  precoUnitario: number
}

function uid() { return Math.random().toString(36).slice(2) }

function moeda(v: number) {
  return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const CORES_CAT: Record<string, string> = {
  'Insumo': Colors.primary,
  'Mão de Obra': '#2563eb',
  'Maquinário': '#d97706',
  'Arrendamento': '#7c3aed',
  'Outros': '#64748b',
}

export default function FinanceiroScreen() {
  const [cultura, setCultura] = useState('Soja')
  const [area, setArea] = useState('450')
  const [safra, setSafra] = useState('2025/2026')
  const [aba, setAba] = useState<'receitas' | 'custos' | 'resultado'>('resultado')

  const [receitas, setReceitas] = useState<Receita[]>([
    { id: uid(), descricao: 'Soja — produção estimada', quantidade: 2700, precoUnitario: 130 },
  ])

  const [custos, setCustos] = useState<Custo[]>([
    { id: uid(), descricao: 'Sementes certificadas', valor: 18000, categoria: 'Insumo' },
    { id: uid(), descricao: 'Fertilizantes NPK', valor: 42000, categoria: 'Insumo' },
    { id: uid(), descricao: 'Defensivos / inoculante', valor: 31000, categoria: 'Insumo' },
    { id: uid(), descricao: 'Funcionários temporários', valor: 12000, categoria: 'Mão de Obra' },
    { id: uid(), descricao: 'Aluguel de colheitadeira', valor: 22500, categoria: 'Maquinário' },
    { id: uid(), descricao: 'Arrendamento da terra', valor: 36000, categoria: 'Arrendamento' },
    { id: uid(), descricao: 'Transporte e logística', valor: 9000, categoria: 'Outros' },
  ])

  const totalReceitas = useMemo(() =>
    receitas.reduce((s, r) => s + r.quantidade * r.precoUnitario, 0), [receitas])
  const totalCustos = useMemo(() =>
    custos.reduce((s, c) => s + c.valor, 0), [custos])
  const lucro = totalReceitas - totalCustos
  const margem = totalReceitas > 0 ? (lucro / totalReceitas) * 100 : 0
  const lucrativo = lucro >= 0

  function addReceita() {
    setReceitas(p => [...p, { id: uid(), descricao: '', quantidade: 0, precoUnitario: 0 }])
  }

  function removeReceita(id: string) {
    setReceitas(p => p.filter(r => r.id !== id))
  }

  function addCusto() {
    setCustos(p => [...p, { id: uid(), descricao: '', valor: 0, categoria: 'Insumo' }])
  }

  function removeCusto(id: string) {
    setCustos(p => p.filter(c => c.id !== id))
  }

  // Custos por categoria
  const custosPorCat = useMemo(() => {
    const m: Record<string, number> = {}
    custos.forEach(c => { m[c.categoria] = (m[c.categoria] ?? 0) + c.valor })
    return Object.entries(m).sort((a, b) => b[1] - a[1])
  }, [custos])

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: lucrativo ? Colors.primaryDark : '#dc2626' }]}>
        <Text style={styles.headerTitle}>💰 Fluxo de Caixa</Text>
        <Text style={styles.headerSub}>{cultura} · {area} ha · Safra {safra}</Text>
        <View style={styles.resultRow}>
          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>Receita</Text>
            <Text style={styles.resultValue}>{moeda(totalReceitas)}</Text>
          </View>
          <View style={styles.resultDivider} />
          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>Custo</Text>
            <Text style={styles.resultValue}>{moeda(totalCustos)}</Text>
          </View>
          <View style={styles.resultDivider} />
          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>Lucro</Text>
            <Text style={[styles.resultValue, styles.lucroValue]}>{moeda(lucro)}</Text>
          </View>
        </View>
        <View style={styles.margemBadge}>
          <Text style={styles.margemText}>
            {lucrativo ? '✅' : '⚠️'} Margem: {margem.toFixed(1)}% · {moeda(area ? lucro / Number(area) : 0)}/ha
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['resultado', 'receitas', 'custos'] as const).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, aba === t && styles.tabActive]}
            onPress={() => setAba(t)}
          >
            <Text style={[styles.tabText, aba === t && styles.tabTextActive]}>
              {t === 'resultado' ? 'Resumo' : t === 'receitas' ? `Receitas (${receitas.length})` : `Custos (${custos.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* ABA RESULTADO */}
        {aba === 'resultado' && (
          <View style={styles.section}>
            {/* Config */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>📋 Dados da Safra</Text>
              {[
                { label: 'Cultura', value: cultura, set: setCultura },
                { label: 'Área (ha)', value: area, set: setArea, numeric: true },
                { label: 'Safra', value: safra, set: setSafra },
              ].map(({ label, value, set, numeric }) => (
                <View key={label} style={styles.inputRow}>
                  <Text style={styles.inputLabel}>{label}</Text>
                  <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={set}
                    keyboardType={numeric ? 'numeric' : 'default'}
                    placeholderTextColor={Colors.gray400}
                  />
                </View>
              ))}
            </View>

            {/* Breakdown custos */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>📊 Custos por Categoria</Text>
              {custosPorCat.map(([cat, val]) => {
                const pct = totalCustos > 0 ? val / totalCustos : 0
                return (
                  <View key={cat} style={styles.barRow}>
                    <View style={styles.barHeader}>
                      <Text style={styles.barLabel}>{cat}</Text>
                      <Text style={styles.barValue}>{moeda(val)} ({(pct * 100).toFixed(0)}%)</Text>
                    </View>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, {
                        width: `${pct * 100}%` as any,
                        backgroundColor: CORES_CAT[cat] ?? Colors.primary
                      }]} />
                    </View>
                  </View>
                )
              })}
            </View>

            {/* Resumo financeiro */}
            <View style={[styles.card, { borderColor: lucrativo ? Colors.primary : '#dc2626', borderWidth: 1.5 }]}>
              <Text style={styles.cardTitle}>💼 Resultado Final</Text>
              {[
                { label: 'Receita bruta', val: totalReceitas, color: Colors.primary },
                { label: '(-) Total de custos', val: -totalCustos, color: '#ef4444' },
              ].map(({ label, val, color }) => (
                <View key={label} style={styles.resumoRow}>
                  <Text style={styles.resumoLabel}>{label}</Text>
                  <Text style={[styles.resumoVal, { color }]}>{moeda(val)}</Text>
                </View>
              ))}
              <View style={styles.resumoDivider} />
              <View style={styles.resumoRow}>
                <Text style={[styles.resumoLabel, styles.resumoTotal]}>= Lucro líquido</Text>
                <Text style={[styles.resumoVal, styles.resumoTotal, { color: lucrativo ? Colors.primary : '#dc2626' }]}>
                  {moeda(lucro)}
                </Text>
              </View>
              <View style={styles.resumoRow}>
                <Text style={styles.resumoMeta}>Margem de lucro</Text>
                <Text style={[styles.resumoMeta, { color: lucrativo ? Colors.primary : '#dc2626' }]}>{margem.toFixed(1)}%</Text>
              </View>
              <View style={styles.resumoRow}>
                <Text style={styles.resumoMeta}>Lucro por hectare</Text>
                <Text style={[styles.resumoMeta, { color: lucrativo ? Colors.primary : '#dc2626' }]}>
                  {moeda(area ? lucro / Number(area) : 0)}/ha
                </Text>
              </View>
            </View>

            {/* Dica */}
            <View style={styles.dica}>
              <Text style={styles.dicaTitle}>💡 Dica SolFarm</Text>
              <Text style={styles.dicaText}>
                {margem > 30
                  ? 'Excelente margem! Use o diagnóstico NDVI para manter a produtividade e reduzir desperdício com insumos.'
                  : margem > 10
                  ? 'Margem razoável. Aplique VRA (taxa variável) para reduzir até 25% no custo de fertilizantes.'
                  : 'Margem baixa. Revise insumos com base no plano de fertilização do diagnóstico por satélite.'}
              </Text>
            </View>
          </View>
        )}

        {/* ABA RECEITAS */}
        {aba === 'receitas' && (
          <View style={styles.section}>
            {receitas.map((r, i) => (
              <View key={r.id} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemNum}>#{i + 1}</Text>
                  <TouchableOpacity onPress={() => removeReceita(r.id)}>
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={styles.itemInput}
                  placeholder="Descrição (ex: Soja safra)"
                  value={r.descricao}
                  onChangeText={v => setReceitas(p => p.map(x => x.id === r.id ? { ...x, descricao: v } : x))}
                  placeholderTextColor={Colors.gray400}
                />
                <View style={styles.itemRow}>
                  <View style={styles.itemHalf}>
                    <Text style={styles.itemLabel}>Quantidade</Text>
                    <TextInput
                      style={styles.itemInput}
                      placeholder="0"
                      value={r.quantidade > 0 ? String(r.quantidade) : ''}
                      onChangeText={v => setReceitas(p => p.map(x => x.id === r.id ? { ...x, quantidade: Number(v) || 0 } : x))}
                      keyboardType="numeric"
                      placeholderTextColor={Colors.gray400}
                    />
                  </View>
                  <View style={styles.itemHalf}>
                    <Text style={styles.itemLabel}>Preço unitário (R$)</Text>
                    <TextInput
                      style={styles.itemInput}
                      placeholder="0"
                      value={r.precoUnitario > 0 ? String(r.precoUnitario) : ''}
                      onChangeText={v => setReceitas(p => p.map(x => x.id === r.id ? { ...x, precoUnitario: Number(v) || 0 } : x))}
                      keyboardType="numeric"
                      placeholderTextColor={Colors.gray400}
                    />
                  </View>
                </View>
                <Text style={styles.itemTotal}>Total: {moeda(r.quantidade * r.precoUnitario)}</Text>
              </View>
            ))}
            <TouchableOpacity style={styles.addBtn} onPress={addReceita}>
              <Ionicons name="add-circle" size={20} color={Colors.primary} />
              <Text style={styles.addBtnText}>Adicionar receita</Text>
            </TouchableOpacity>
            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>Total de receitas</Text>
              <Text style={[styles.totalValue, { color: Colors.primary }]}>{moeda(totalReceitas)}</Text>
            </View>
          </View>
        )}

        {/* ABA CUSTOS */}
        {aba === 'custos' && (
          <View style={styles.section}>
            {custos.map((c, i) => (
              <View key={c.id} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemNum}>#{i + 1}</Text>
                  <TouchableOpacity onPress={() => removeCusto(c.id)}>
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={styles.itemInput}
                  placeholder="Descrição (ex: Fertilizante NPK)"
                  value={c.descricao}
                  onChangeText={v => setCustos(p => p.map(x => x.id === c.id ? { ...x, descricao: v } : x))}
                  placeholderTextColor={Colors.gray400}
                />
                <View style={styles.itemRow}>
                  <View style={styles.itemHalf}>
                    <Text style={styles.itemLabel}>Categoria</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={styles.catRow}>
                        {Object.keys(CORES_CAT).map(cat => (
                          <TouchableOpacity
                            key={cat}
                            onPress={() => setCustos(p => p.map(x => x.id === c.id ? { ...x, categoria: cat } : x))}
                            style={[styles.catChip, c.categoria === cat && { backgroundColor: CORES_CAT[cat] }]}
                          >
                            <Text style={[styles.catChipText, c.categoria === cat && { color: '#fff' }]}>{cat}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                  <View style={styles.itemHalf}>
                    <Text style={styles.itemLabel}>Valor (R$)</Text>
                    <TextInput
                      style={styles.itemInput}
                      placeholder="0"
                      value={c.valor > 0 ? String(c.valor) : ''}
                      onChangeText={v => setCustos(p => p.map(x => x.id === c.id ? { ...x, valor: Number(v) || 0 } : x))}
                      keyboardType="numeric"
                      placeholderTextColor={Colors.gray400}
                    />
                  </View>
                </View>
              </View>
            ))}
            <TouchableOpacity style={styles.addBtn} onPress={addCusto}>
              <Ionicons name="add-circle" size={20} color="#ef4444" />
              <Text style={[styles.addBtnText, { color: '#ef4444' }]}>Adicionar custo</Text>
            </TouchableOpacity>
            <View style={[styles.totalBox, { borderColor: '#fecaca' }]}>
              <Text style={styles.totalLabel}>Total de custos</Text>
              <Text style={[styles.totalValue, { color: '#ef4444' }]}>{moeda(totalCustos)}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f3ee' },
  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 20 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#fff', marginBottom: 2 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 16 },
  resultRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: 16, gap: 8 },
  resultItem: { flex: 1, alignItems: 'center' },
  resultDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
  resultLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginBottom: 4 },
  resultValue: { fontSize: 14, fontWeight: '800', color: '#fff' },
  lucroValue: { fontSize: 15 },
  margemBadge: { marginTop: 10, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, alignSelf: 'flex-start' },
  margemText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2ddd6' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.primary },
  tabText: { fontSize: 12, color: '#9ca3af', fontWeight: '600' },
  tabTextActive: { color: Colors.primary, fontWeight: '700' },
  body: { flex: 1 },
  section: { padding: 16, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 4 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#1c1917', marginBottom: 14 },
  inputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  inputLabel: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  input: { borderWidth: 1, borderColor: '#e2ddd6', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, fontWeight: '600', color: '#1c1917', minWidth: 120, textAlign: 'right' },
  barRow: { marginBottom: 12 },
  barHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  barLabel: { fontSize: 12, color: '#6b7280', fontWeight: '600' },
  barValue: { fontSize: 12, color: '#1c1917', fontWeight: '700' },
  barTrack: { height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },
  resumoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  resumoLabel: { fontSize: 14, color: '#6b7280' },
  resumoVal: { fontSize: 14, fontWeight: '700' },
  resumoTotal: { fontSize: 17, fontWeight: '900', color: '#1c1917' },
  resumoDivider: { height: 1, backgroundColor: '#e2ddd6', marginVertical: 8 },
  resumoMeta: { fontSize: 12, color: '#9ca3af', marginBottom: 2 },
  dica: { backgroundColor: '#fffbeb', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#fef08a' },
  dicaTitle: { fontSize: 13, fontWeight: '800', color: '#92400e', marginBottom: 6 },
  dicaText: { fontSize: 12, color: '#92400e', lineHeight: 18 },
  itemCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 8 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  itemNum: { fontSize: 12, fontWeight: '700', color: '#9ca3af' },
  itemInput: { borderWidth: 1, borderColor: '#e2ddd6', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: '#1c1917', marginBottom: 8 },
  itemRow: { flexDirection: 'row', gap: 8 },
  itemHalf: { flex: 1 },
  itemLabel: { fontSize: 11, color: '#9ca3af', fontWeight: '600', marginBottom: 4 },
  itemTotal: { fontSize: 13, fontWeight: '800', color: Colors.primary, textAlign: 'right' },
  catRow: { flexDirection: 'row', gap: 6, paddingBottom: 4 },
  catChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  catChipText: { fontSize: 11, fontWeight: '600', color: '#64748b' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1.5, borderColor: Colors.primary, borderStyle: 'dashed', justifyContent: 'center', marginBottom: 8 },
  addBtnText: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  totalBox: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: '#bbf7d0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 14, color: '#6b7280', fontWeight: '600' },
  totalValue: { fontSize: 18, fontWeight: '900' },
})
