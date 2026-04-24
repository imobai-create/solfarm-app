import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '../src/store/auth.store'
import { Colors } from '../src/utils/colors'
import { getApiError } from '../src/services/api'

const CONFIRM_WORD = 'EXCLUIR'

export default function DeleteAccountScreen() {
  const { user, deleteAccount } = useAuthStore()
  const [confirmText, setConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const canDelete = confirmText.trim().toUpperCase() === CONFIRM_WORD && !isDeleting

  function requestConfirmation() {
    Alert.alert(
      'Excluir conta permanentemente?',
      'Esta ação não pode ser desfeita. Todos os seus dados serão apagados definitivamente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: performDelete },
      ],
    )
  }

  async function performDelete() {
    setIsDeleting(true)
    try {
      await deleteAccount()
      router.replace('/(auth)/login')
    } catch (err) {
      Alert.alert('Erro', getApiError(err))
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.iconWrap}>
        <Ionicons name="warning" size={56} color={Colors.danger} />
      </View>

      <Text style={styles.title}>Excluir minha conta</Text>
      <Text style={styles.subtitle}>
        Esta ação é permanente e não pode ser desfeita.
      </Text>

      <View style={styles.warningCard}>
        <Text style={styles.warningTitle}>O que será perdido:</Text>
        <LossItem icon="person-remove-outline" text="Seu perfil e dados pessoais" />
        <LossItem icon="map-outline" text="Todas as áreas cadastradas" />
        <LossItem icon="pulse-outline" text="Todos os diagnósticos salvos" />
        <LossItem icon="document-text-outline" text="Receitas agronômicas e históricos" />
        <LossItem icon="bag-outline" text="Pedidos e interações no marketplace" />
        <LossItem icon="leaf-outline" text="Saldo e histórico de FARMCOINs" />
        <LossItem icon="card-outline" text="Assinatura ativa (sem reembolso de período já pago)" />
      </View>

      {user && (
        <View style={styles.accountBox}>
          <Text style={styles.accountLabel}>Conta a ser excluída</Text>
          <Text style={styles.accountName}>{user.name}</Text>
          <Text style={styles.accountEmail}>{user.email}</Text>
        </View>
      )}

      <Text style={styles.confirmLabel}>
        Para confirmar, digite <Text style={styles.confirmWord}>{CONFIRM_WORD}</Text> abaixo:
      </Text>
      <TextInput
        style={styles.input}
        value={confirmText}
        onChangeText={setConfirmText}
        placeholder={CONFIRM_WORD}
        placeholderTextColor={Colors.gray400}
        autoCapitalize="characters"
        autoCorrect={false}
        editable={!isDeleting}
      />

      <TouchableOpacity
        style={[styles.deleteBtn, !canDelete && styles.deleteBtnDisabled]}
        onPress={requestConfirmation}
        disabled={!canDelete}
        activeOpacity={0.8}
      >
        {isDeleting ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <>
            <Ionicons name="trash-outline" size={20} color={Colors.white} />
            <Text style={styles.deleteBtnText}>Excluir minha conta</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.cancelBtn}
        onPress={() => router.back()}
        disabled={isDeleting}
        activeOpacity={0.7}
      >
        <Text style={styles.cancelBtnText}>Cancelar</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

function LossItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.lossRow}>
      <Ionicons name={icon as any} size={18} color={Colors.danger} style={styles.lossIcon} />
      <Text style={styles.lossText}>{text}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 40 },
  iconWrap: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: Colors.dangerBg,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginTop: 12, marginBottom: 16,
  },
  title: { fontSize: 22, fontWeight: '800', color: Colors.gray900, textAlign: 'center' },
  subtitle: {
    fontSize: 14, color: Colors.gray600,
    textAlign: 'center', marginTop: 6, marginBottom: 24,
  },
  warningCard: {
    backgroundColor: Colors.dangerBg,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.danger + '40',
    marginBottom: 20,
  },
  warningTitle: {
    fontSize: 14, fontWeight: '700', color: Colors.danger,
    marginBottom: 10,
  },
  lossRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  lossIcon: { marginRight: 10 },
  lossText: { fontSize: 14, color: Colors.gray800, flex: 1 },
  accountBox: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  accountLabel: {
    fontSize: 11, color: Colors.gray500, fontWeight: '700',
    letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4,
  },
  accountName: { fontSize: 15, fontWeight: '700', color: Colors.gray900 },
  accountEmail: { fontSize: 13, color: Colors.gray600, marginTop: 2 },
  confirmLabel: { fontSize: 14, color: Colors.gray700, marginBottom: 8 },
  confirmWord: { fontWeight: '800', color: Colors.danger },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 15,
    color: Colors.gray900,
    marginBottom: 20,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.danger,
    borderRadius: 14,
    height: 52,
    marginBottom: 12,
  },
  deleteBtnDisabled: { backgroundColor: Colors.gray300 },
  deleteBtnText: { color: Colors.white, fontSize: 15, fontWeight: '800' },
  cancelBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
  },
  cancelBtnText: { color: Colors.gray600, fontSize: 15, fontWeight: '600' },
})
