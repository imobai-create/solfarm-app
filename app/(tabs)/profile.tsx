import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch,
} from 'react-native'
import { router } from 'expo-router'
import { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuthStore } from '../../src/store/auth.store'
import { Colors } from '../../src/utils/colors'

const PLAN_LABELS: Record<string, { label: string; color: string; desc: string }> = {
  FREE: { label: 'Grátis', color: Colors.gray500, desc: '1 área · diagnóstico básico' },
  CAMPO: { label: 'Campo', color: Colors.primary, desc: 'até 5 áreas · diagnóstico completo' },
  FAZENDA: { label: 'Fazenda', color: Colors.earth, desc: 'Ilimitado · IA avançada · API' },
}

export default function ProfileScreen() {
  const { user, logout } = useAuthStore()
  const [notifications, setNotifications] = useState(true)
  const [alerts, setAlerts] = useState(true)

  const plan = PLAN_LABELS[user?.plan ?? 'FREE']

  async function handleLogout() {
    Alert.alert('Sair', 'Deseja sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair', style: 'destructive', onPress: async () => {
          await logout()
          router.replace('/(auth)/login')
        },
      },
    ])
  }

  if (!user) return null

  return (
    <ScrollView style={styles.container}>
      {/* Header com gradiente */}
      <LinearGradient colors={[Colors.primaryDark, Colors.primary]} style={styles.header}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
        {user.city && (
          <Text style={styles.userLocation}>
            <Ionicons name="location-outline" size={12} color="rgba(255,255,255,0.8)" />
            {' '}{user.city}, {user.state}
          </Text>
        )}

        {/* Plano */}
        <View style={[styles.planBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
          <Text style={styles.planText}>Plano {plan.label}</Text>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        {/* Stats */}
        {user._count && (
          <View style={styles.statsRow}>
            <StatCard value={user._count.areas} label="Áreas" icon="map-outline" />
            <StatCard value={user._count.diagnostics} label="Diagnósticos" icon="pulse-outline" />
            <StatCard value={user._count.orders} label="Pedidos" icon="bag-outline" />
          </View>
        )}

        {/* Plano atual */}
        <View style={styles.planSection}>
          <View style={[styles.planCard, { borderColor: plan.color }]}>
            <View style={styles.planCardHeader}>
              <Text style={[styles.planCardTitle, { color: plan.color }]}>🌾 Plano {plan.label}</Text>
              <View style={[styles.planIndicator, { backgroundColor: plan.color }]} />
            </View>
            <Text style={styles.planCardDesc}>{plan.desc}</Text>
            {user.plan === 'FREE' && (
              <TouchableOpacity style={[styles.upgradeBtn, { backgroundColor: Colors.primary }]}
                onPress={() => Alert.alert('Upgrade', 'Upgrade de plano em breve disponível!')}>
                <Text style={styles.upgradeBtnText}>🚀 Fazer Upgrade</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Conta */}
        <Text style={styles.sectionTitle}>Conta</Text>
        <View style={styles.menuSection}>
          <MenuItem icon="person-outline" label="Editar perfil" onPress={() => Alert.alert('Em breve', 'Edição de perfil em desenvolvimento.')} />
          <MenuItem icon="notifications-outline" label="Notificações" right={<Switch value={notifications} onValueChange={setNotifications} trackColor={{ false: Colors.gray200, true: Colors.primary + '60' }} thumbColor={notifications ? Colors.primary : Colors.gray400} />} />
          <MenuItem icon="alert-circle-outline" label="Alertas de pragas e clima" right={<Switch value={alerts} onValueChange={setAlerts} trackColor={{ false: Colors.gray200, true: Colors.primary + '60' }} thumbColor={alerts ? Colors.primary : Colors.gray400} />} />
          <MenuItem icon="shield-checkmark-outline" label="Verificação da conta"
            right={user.isVerified
              ? <View style={styles.verifiedBadge}><Text style={styles.verifiedText}>✓ Verificado</Text></View>
              : <Text style={styles.notVerified}>Verificar</Text>
            }
          />
        </View>

        {/* Sobre */}
        <Text style={styles.sectionTitle}>Sobre</Text>
        <View style={styles.menuSection}>
          <MenuItem icon="help-circle-outline" label="Central de ajuda" onPress={() => Alert.alert('Ajuda', 'Acesse solfarm.com.br/ajuda')} />
          <MenuItem icon="document-text-outline" label="Termos de uso" onPress={() => {}} />
          <MenuItem icon="lock-closed-outline" label="Política de privacidade" onPress={() => {}} />
          <MenuItem icon="information-circle-outline" label="Versão 1.0.0" right={<Text style={styles.versionText}>SolFarm MVP</Text>} />
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
          <Text style={styles.logoutText}>Sair da conta</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

function StatCard({ value, label, icon }: { value: number; label: string; icon: string }) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon as any} size={20} color={Colors.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

function MenuItem({ icon, label, onPress, right }: {
  icon: string; label: string; onPress?: () => void; right?: React.ReactNode
}) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <Ionicons name={icon as any} size={20} color={Colors.gray600} style={styles.menuIcon} />
      <Text style={styles.menuLabel}>{label}</Text>
      <View style={{ flex: 1 }} />
      {right ?? <Ionicons name="chevron-forward" size={16} color={Colors.gray300} />}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingTop: 70, paddingBottom: 28, alignItems: 'center' },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.6)', marginBottom: 12 },
  avatarText: { fontSize: 36, fontWeight: '800', color: Colors.white },
  userName: { fontSize: 20, fontWeight: '800', color: Colors.white },
  userEmail: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  userLocation: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  planBadge: { marginTop: 12, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  planText: { color: Colors.white, fontWeight: '700', fontSize: 13 },
  body: { padding: 16 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: Colors.white, borderRadius: 14, padding: 14, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: Colors.border },
  statValue: { fontSize: 22, fontWeight: '800', color: Colors.gray900 },
  statLabel: { fontSize: 11, color: Colors.gray500, fontWeight: '500' },
  planSection: { marginBottom: 20 },
  planCard: { backgroundColor: Colors.white, borderRadius: 14, padding: 16, borderWidth: 2 },
  planCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  planCardTitle: { fontSize: 16, fontWeight: '800' },
  planIndicator: { width: 10, height: 10, borderRadius: 5 },
  planCardDesc: { fontSize: 13, color: Colors.gray500, marginBottom: 12 },
  upgradeBtn: { borderRadius: 10, height: 42, alignItems: 'center', justifyContent: 'center' },
  upgradeBtnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.gray400, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 },
  menuSection: { backgroundColor: Colors.white, borderRadius: 14, marginBottom: 20, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  menuIcon: { marginRight: 12 },
  menuLabel: { fontSize: 15, color: Colors.gray800 },
  verifiedBadge: { backgroundColor: Colors.successBg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  verifiedText: { fontSize: 11, color: Colors.success, fontWeight: '700' },
  notVerified: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  versionText: { fontSize: 12, color: Colors.gray400 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.dangerBg, borderRadius: 14, height: 50, marginBottom: 40 },
  logoutText: { fontSize: 15, fontWeight: '700', color: Colors.danger },
})
