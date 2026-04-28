import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native'
import { router } from 'expo-router'
import { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuthStore } from '../src/store/auth.store'
import { api } from '../src/services/api'
import { Colors } from '../src/utils/colors'

export default function EditProfileScreen() {
  const { user, loadUser } = useAuthStore()

  const [name, setName] = useState(user?.name ?? '')
  const [state, setState] = useState(user?.state ?? '')
  const [city, setCity] = useState(user?.city ?? '')
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Campo obrigatório', 'O nome completo não pode estar vazio.')
      return
    }

    setLoading(true)
    try {
      await api.patch('/auth/me', {
        name: name.trim(),
        state: state.trim() || undefined,
        city: city.trim() || undefined,
      })

      await loadUser()
      Alert.alert('Perfil atualizado!', 'Suas informações foram salvas com sucesso.', [
        { text: 'OK', onPress: () => router.back() },
      ])
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? err?.message ?? 'Não foi possível salvar o perfil. Tente novamente.'
      Alert.alert('Erro', msg)
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <LinearGradient colors={[Colors.primaryDark, Colors.primary]} style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{(name || user.name).charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.headerTitle}>Editar Perfil</Text>
        </LinearGradient>

        <View style={styles.body}>
          {/* Nome */}
          <Text style={styles.label}>Nome completo</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="person-outline" size={18} color={Colors.gray400} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Seu nome completo"
              placeholderTextColor={Colors.gray400}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>

          {/* Email (somente leitura) */}
          <Text style={styles.label}>E-mail</Text>
          <View style={[styles.inputWrap, styles.inputReadonly]}>
            <Ionicons name="mail-outline" size={18} color={Colors.gray400} style={styles.inputIcon} />
            <Text style={styles.readonlyText}>{user.email}</Text>
          </View>
          <Text style={styles.helperText}>O e-mail não pode ser alterado.</Text>

          {/* Estado */}
          <Text style={styles.label}>Estado (UF)</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="map-outline" size={18} color={Colors.gray400} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={state}
              onChangeText={(v) => setState(v.toUpperCase().slice(0, 2))}
              placeholder="Ex: MT"
              placeholderTextColor={Colors.gray400}
              autoCapitalize="characters"
              maxLength={2}
              returnKeyType="next"
            />
          </View>

          {/* Cidade */}
          <Text style={styles.label}>Cidade</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="location-outline" size={18} color={Colors.gray400} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={city}
              onChangeText={setCity}
              placeholder="Ex: Sorriso"
              placeholderTextColor={Colors.gray400}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />
          </View>

          {/* Botão salvar */}
          <TouchableOpacity
            style={[styles.saveBtn, loading && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={Colors.white} />
              : <Text style={styles.saveBtnText}>Salvar alterações</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()} disabled={loading}>
            <Text style={styles.cancelBtnText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingTop: 60, paddingBottom: 28, alignItems: 'center', position: 'relative' },
  backBtn: { position: 'absolute', top: 60, left: 16, padding: 4 },
  avatarCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.6)', marginBottom: 10 },
  avatarText: { fontSize: 32, fontWeight: '800', color: Colors.white },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.white },
  body: { padding: 20 },
  label: { fontSize: 13, fontWeight: '700', color: Colors.gray600, marginBottom: 6, marginTop: 16, textTransform: 'uppercase', letterSpacing: 0.4 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, height: 50 },
  inputReadonly: { backgroundColor: Colors.gray50 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: Colors.gray900 },
  readonlyText: { flex: 1, fontSize: 15, color: Colors.gray400 },
  helperText: { fontSize: 11, color: Colors.gray400, marginTop: 4, marginLeft: 2 },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 32, marginBottom: 12 },
  saveBtnText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
  cancelBtn: { alignItems: 'center', paddingVertical: 12, marginBottom: 40 },
  cancelBtnText: { color: Colors.gray500, fontWeight: '600', fontSize: 15 },
})
