import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ScrollView, ActivityIndicator, Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useState } from 'react'
import { api } from '../../src/services/api'
import { Colors } from '../../src/utils/colors'
import type { Product, ProductCategory } from '../../src/types'

const CATEGORIES: { key: ProductCategory | 'ALL'; label: string; emoji: string }[] = [
  { key: 'ALL', label: 'Todos', emoji: '🛒' },
  { key: 'FERTILIZANTE', label: 'Fertilizantes', emoji: '⚗️' },
  { key: 'DEFENSIVO', label: 'Defensivos', emoji: '🧪' },
  { key: 'SEMENTE', label: 'Sementes', emoji: '🌱' },
  { key: 'INOCULANTE', label: 'Inoculantes', emoji: '🦠' },
  { key: 'MAQUINA', label: 'Máquinas', emoji: '🚜' },
  { key: 'FERRAMENTA', label: 'Ferramentas', emoji: '🔧' },
  { key: 'IRRIGACAO', label: 'Irrigação', emoji: '💧' },
]

export default function MarketplaceScreen() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<ProductCategory | 'ALL'>('ALL')

  useEffect(() => {
    loadProducts()
  }, [])

  async function loadProducts() {
    setIsLoading(true)
    try {
      const res = await api.get('/products', { params: { limit: 20 } })
      setProducts(res.data.data ?? res.data ?? [])
    } catch {
      // Usa dados mock quando a API de produtos não estiver pronta
      setProducts(MOCK_PRODUCTS)
    } finally {
      setIsLoading(false)
    }
  }

  const filtered = products.filter((p) => {
    const matchCategory = category === 'ALL' || p.category === category
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
    return matchCategory && matchSearch
  })

  const featured = products.filter((p) => p.isFeatured)

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={[Colors.primaryDark, Colors.primary]} style={styles.header}>
        <Text style={styles.headerTitle}>🛒 Marketplace</Text>
        <Text style={styles.headerSub}>Insumos, sementes e máquinas</Text>

        {/* Busca */}
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={Colors.gray400} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar produto..."
            placeholderTextColor={Colors.gray400}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={Colors.gray400} />
            </TouchableOpacity>
          ) : null}
        </View>
      </LinearGradient>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            {/* Categorias */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.key}
                  style={[styles.catBtn, category === cat.key && styles.catBtnActive]}
                  onPress={() => setCategory(cat.key)}
                >
                  <Text style={styles.catEmoji}>{cat.emoji}</Text>
                  <Text style={[styles.catLabel, category === cat.key && styles.catLabelActive]}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Destaques */}
            {!search && category === 'ALL' && featured.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>⭐ Em destaque</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.featuredScroll}>
                  {featured.map((p) => (
                    <FeaturedCard key={p.id} product={p} />
                  ))}
                </ScrollView>
                <Text style={styles.sectionTitle}>Todos os produtos</Text>
              </>
            )}

            {isLoading && <ActivityIndicator color={Colors.primary} style={{ marginVertical: 20 }} />}
          </>
        }
        renderItem={({ item }) => <ProductCard product={item} />}
        ListEmptyComponent={!isLoading ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyText}>Nenhum produto encontrado</Text>
          </View>
        ) : null}
      />
    </View>
  )
}

function FeaturedCard({ product }: { product: Product }) {
  return (
    <TouchableOpacity style={styles.featuredCard} onPress={() => Alert.alert(product.name, product.description ?? '')}>
      <View style={styles.featuredEmoji}>
        <Text style={{ fontSize: 32 }}>{categoryEmoji(product.category)}</Text>
      </View>
      <Text style={styles.featuredName} numberOfLines={2}>{product.name}</Text>
      <Text style={styles.featuredBrand}>{product.brand}</Text>
      <Text style={styles.featuredPrice}>R$ {product.price.toFixed(2)}</Text>
      <Text style={styles.featuredUnit}>/{product.unit}</Text>
    </TouchableOpacity>
  )
}

function ProductCard({ product }: { product: Product }) {
  function handleAddCart() {
    Alert.alert('🛒 Adicionado!', `${product.name} foi adicionado ao carrinho.`)
  }

  return (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => Alert.alert(product.name, `${product.description ?? ''}\n\nMarca: ${product.brand ?? 'N/A'}\nEstoque: ${product.stock} ${product.unit}`)}
    >
      <View style={styles.productImagePlaceholder}>
        <Text style={{ fontSize: 36 }}>{categoryEmoji(product.category)}</Text>
      </View>
      {product.isFeatured && (
        <View style={styles.featuredBadge}><Text style={styles.featuredBadgeText}>⭐</Text></View>
      )}
      <View style={styles.productInfo}>
        <Text style={styles.productCategory}>{product.category}</Text>
        <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
        {product.brand && <Text style={styles.productBrand}>{product.brand}</Text>}
        <View style={styles.productFooter}>
          <View>
            <Text style={styles.productPrice}>R$ {product.price.toFixed(2)}</Text>
            <Text style={styles.productUnit}>/{product.unit}</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={handleAddCart}>
            <Ionicons name="add" size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  )
}

function categoryEmoji(cat: ProductCategory): string {
  const map: Record<string, string> = {
    FERTILIZANTE: '⚗️', DEFENSIVO: '🧪', SEMENTE: '🌱', INOCULANTE: '🦠',
    MAQUINA: '🚜', IMPLEMENTO: '⚙️', FERRAMENTA: '🔧', IRRIGACAO: '💧', SERVICO: '👷', OUTRO: '📦',
  }
  return map[cat] ?? '📦'
}

// Mock para quando a API ainda não tem rota de produtos
const MOCK_PRODUCTS: Product[] = [
  { id: '1', name: 'Fertilizante NPK 10-10-10', description: 'Alta performance para gramíneas.', category: 'FERTILIZANTE', price: 189.90, unit: 'saco 50kg', stock: 500, images: [], brand: 'Mosaic', isFeatured: true, state: 'MT', city: 'Cuiabá' },
  { id: '2', name: 'Herbicida Roundup Original', description: 'Controle de plantas daninhas.', category: 'DEFENSIVO', price: 89.50, unit: 'litro', stock: 200, images: [], brand: 'Bayer', isFeatured: true, state: 'MT', city: 'Cuiabá' },
  { id: '3', name: 'Semente de Soja M8349 IPRO', description: 'Alta produtividade, resist. ferrugem.', category: 'SEMENTE', price: 420.00, unit: 'saco 40kg', stock: 150, images: [], brand: 'Monsoy', isFeatured: false, state: 'MT', city: 'Cuiabá' },
  { id: '4', name: 'Inoculante Nitrobacter', description: 'Fixação biológica de nitrogênio.', category: 'INOCULANTE', price: 28.90, unit: 'dose/100kg', stock: 1000, images: [], brand: 'Total Biotecnologia', isFeatured: true, state: 'MT', city: 'Cuiabá' },
  { id: '5', name: 'Pulverizador Costal 20L', description: 'Elétrico, bateria 12V, 6h autonomia.', category: 'FERRAMENTA', price: 650.00, unit: 'unidade', stock: 30, images: [], brand: 'Guarany', isFeatured: false, state: 'MT', city: 'Cuiabá' },
  { id: '6', name: 'Urea Agrícola 45% N', description: 'Fonte de nitrogênio para cobertura.', category: 'FERTILIZANTE', price: 145.00, unit: 'saco 50kg', stock: 800, images: [], brand: 'Petrobras', isFeatured: false, state: 'GO', city: 'Goiânia' },
]

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingTop: 60, paddingHorizontal: 16, paddingBottom: 16 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: Colors.white },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 14 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.white, borderRadius: 12, paddingHorizontal: 12, height: 44 },
  searchInput: { flex: 1, fontSize: 15, color: Colors.gray900 },
  categoriesScroll: { paddingVertical: 12, paddingLeft: 16 },
  catBtn: { marginRight: 8, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.gray100, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: 'transparent' },
  catBtnActive: { backgroundColor: Colors.primaryBg, borderColor: Colors.primary },
  catEmoji: { fontSize: 14 },
  catLabel: { fontSize: 12, color: Colors.gray600, fontWeight: '600' },
  catLabelActive: { color: Colors.primary },
  list: { paddingHorizontal: 12, paddingBottom: 100 },
  row: { gap: 12, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.gray900, paddingHorizontal: 4, marginBottom: 10 },
  featuredScroll: { marginBottom: 20 },
  featuredCard: { width: 150, backgroundColor: Colors.white, borderRadius: 14, padding: 14, marginRight: 10, borderWidth: 1, borderColor: Colors.border },
  featuredEmoji: { width: 52, height: 52, borderRadius: 14, backgroundColor: Colors.primaryBg, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  featuredName: { fontSize: 13, fontWeight: '700', color: Colors.gray900, marginBottom: 2 },
  featuredBrand: { fontSize: 11, color: Colors.gray400, marginBottom: 6 },
  featuredPrice: { fontSize: 16, fontWeight: '800', color: Colors.primary },
  featuredUnit: { fontSize: 10, color: Colors.gray400 },
  productCard: { flex: 1, backgroundColor: Colors.white, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  productImagePlaceholder: { height: 100, backgroundColor: Colors.gray50, alignItems: 'center', justifyContent: 'center' },
  featuredBadge: { position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  featuredBadgeText: { fontSize: 12 },
  productInfo: { padding: 10 },
  productCategory: { fontSize: 9, color: Colors.primary, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 3 },
  productName: { fontSize: 13, fontWeight: '700', color: Colors.gray900, marginBottom: 2 },
  productBrand: { fontSize: 11, color: Colors.gray400, marginBottom: 8 },
  productFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  productPrice: { fontSize: 15, fontWeight: '800', color: Colors.gray900 },
  productUnit: { fontSize: 9, color: Colors.gray400 },
  addBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingTop: 48 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15, color: Colors.gray500 },
})
