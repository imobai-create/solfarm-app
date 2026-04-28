import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ScrollView, RefreshControl, Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useState } from 'react'
import { Colors } from '../../src/utils/colors'
import type { Post, PostCategory } from '../../src/types'

const CATEGORIES: { key: PostCategory | 'ALL'; label: string; emoji: string }[] = [
  { key: 'ALL', label: 'Tudo', emoji: '🌐' },
  { key: 'ALERTA', label: 'Alertas', emoji: '⚠️' },
  { key: 'DICA', label: 'Dicas', emoji: '💡' },
  { key: 'RESULTADO', label: 'Resultados', emoji: '📊' },
  { key: 'DUVIDA', label: 'Dúvidas', emoji: '❓' },
  { key: 'VENDA', label: 'Ofertas', emoji: '💰' },
]

export default function CommunityScreen() {
  const [posts, setPosts] = useState<Post[]>([])
  const [category, setCategory] = useState<PostCategory | 'ALL'>('ALL')
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')

  async function onRefresh() {
    setRefreshing(true)
    await new Promise((r) => setTimeout(r, 800))
    setRefreshing(false)
  }

  const filtered = posts.filter((p) => {
    const matchCat = category === 'ALL' || p.category === category
    const matchSearch = !search || p.content.toLowerCase().includes(search.toLowerCase()) || (p.title ?? '').toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.primaryDark, Colors.primary]} style={styles.header}>
        <Text style={styles.headerTitle}>👥 Comunidade</Text>
        <Text style={styles.headerSub}>Troca de conhecimento entre produtores</Text>
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={Colors.gray400} />
          <TextInput style={styles.searchInput} placeholder="Buscar posts..." placeholderTextColor={Colors.gray400} value={search} onChangeText={setSearch} />
        </View>
      </LinearGradient>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        ListHeaderComponent={
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catsScroll}>
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
        }
        renderItem={({ item }) => <PostCard post={item} onLike={() => setPosts((ps) => ps.map((p) => p.id === item.id ? { ...p, likes: p.likes + 1 } : p))} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🌾</Text>
            <Text style={styles.emptyText}>Comunidade em construção</Text>
            <Text style={styles.emptySub}>
              Em breve você vai poder trocar dicas, alertas e resultados com outros produtores.
            </Text>
          </View>
        }
      />

      {/* FAB novo post */}
      <TouchableOpacity style={styles.fab} onPress={() => Alert.alert('Em breve!', 'A publicação de posts estará disponível em breve.')}>
        <Ionicons name="add" size={28} color={Colors.white} />
      </TouchableOpacity>
    </View>
  )
}

function PostCard({ post, onLike }: { post: Post; onLike: () => void }) {
  const catConfig = CATEGORIES.find((c) => c.key === post.category)
  const timeAgo = formatTimeAgo(post.createdAt)

  return (
    <View style={styles.card}>
      {/* Categoria badge */}
      <View style={[styles.catBadge, { backgroundColor: categoryBg(post.category) }]}>
        <Text style={styles.catBadgeText}>{catConfig?.emoji} {post.category}</Text>
      </View>

      {/* Autor */}
      <View style={styles.authorRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{post.user.name.charAt(0)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.authorName}>{post.user.name}</Text>
          {post.user.city && (
            <Text style={styles.authorLocation}>
              <Ionicons name="location-outline" size={10} color={Colors.gray400} />
              {' '}{post.user.city}, {post.user.state} · {timeAgo}
            </Text>
          )}
        </View>
      </View>

      {/* Conteúdo */}
      {post.title && <Text style={styles.postTitle}>{post.title}</Text>}
      <Text style={styles.postContent} numberOfLines={4}>{post.content}</Text>

      {/* Footer */}
      <View style={styles.cardFooter}>
        <TouchableOpacity style={styles.likeBtn} onPress={onLike}>
          <Ionicons name="heart-outline" size={18} color={Colors.danger} />
          <Text style={styles.likeCount}>{post.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.commentBtn} onPress={() => Alert.alert('Em breve!', 'Comentários em desenvolvimento.')}>
          <Ionicons name="chatbubble-outline" size={18} color={Colors.gray500} />
          <Text style={styles.commentText}>Comentar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Alert.alert('Compartilhar', 'Compartilhando...')}>
          <Ionicons name="share-outline" size={18} color={Colors.gray500} />
        </TouchableOpacity>
      </View>
    </View>
  )
}

function categoryBg(cat: PostCategory): string {
  const map: Record<PostCategory, string> = {
    ALERTA: '#fef2f2', DICA: '#eff6ff', RESULTADO: '#f0fdf4',
    DUVIDA: '#fefce8', VENDA: '#fff7ed', GERAL: Colors.gray50,
  }
  return map[cat] ?? Colors.gray50
}

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}min atrás`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h atrás`
  const days = Math.floor(hours / 24)
  return `${days}d atrás`
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingTop: 60, paddingHorizontal: 16, paddingBottom: 16 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: Colors.white },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 14 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.white, borderRadius: 12, paddingHorizontal: 12, height: 44 },
  searchInput: { flex: 1, fontSize: 15, color: Colors.gray900 },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  catsScroll: { paddingVertical: 12 },
  catBtn: { marginRight: 8, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.gray100, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: 'transparent' },
  catBtnActive: { backgroundColor: Colors.primaryBg, borderColor: Colors.primary },
  catEmoji: { fontSize: 14 },
  catLabel: { fontSize: 12, color: Colors.gray600, fontWeight: '600' },
  catLabelActive: { color: Colors.primary },
  card: { backgroundColor: Colors.white, borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  catBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 10 },
  catBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.gray700 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: Colors.white, fontWeight: '800', fontSize: 15 },
  authorName: { fontSize: 14, fontWeight: '700', color: Colors.gray900 },
  authorLocation: { fontSize: 11, color: Colors.gray400, marginTop: 1 },
  postTitle: { fontSize: 15, fontWeight: '700', color: Colors.gray900, marginBottom: 6 },
  postContent: { fontSize: 13, color: Colors.gray700, lineHeight: 20, marginBottom: 12 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 16, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 10 },
  likeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  likeCount: { fontSize: 13, color: Colors.danger, fontWeight: '600' },
  commentBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  commentText: { fontSize: 13, color: Colors.gray500 },
  fab: { position: 'absolute', bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
  empty: { alignItems: 'center', paddingTop: 48, paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: Colors.gray700, fontWeight: '600', textAlign: 'center' },
  emptySub: { fontSize: 13, color: Colors.gray500, textAlign: 'center', marginTop: 6, lineHeight: 18 },
})
