import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, Linking,
} from 'react-native'
import { Link, router } from 'expo-router'
import { useState } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '../../src/store/auth.store'
import { Colors } from '../../src/utils/colors'

const STATES = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

export default function RegisterScreen() {
  const { register, isLoading } = useAuthStore()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [state, setState] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState<'PRODUCER' | 'SUPPLIER'>('PRODUCER')
  const [agreeTerms, setAgreeTerms] = useState(false)

  async function handleRegister() {
    if (!name || !email || !password) {
      Alert.alert('Atenção', 'Nome, e-mail e senha são obrigatórios.')
      return
    }
    if (password.length < 8) {
      Alert.alert('Senha fraca', 'A senha precisa ter pelo menos 8 caracteres, 1 maiúscula e 1 número.')
      return
    }
    if (!agreeTerms) {
      Alert.alert('Aceite os termos', 'É necessário aceitar os Termos de uso e a Política de privacidade para criar sua conta.')
      return
    }
    try {
      await register({ name, email: email.toLowerCase().trim(), password, phone, state, role })
      router.replace('/(tabs)')
    } catch (err: any) {
      Alert.alert('Erro no cadastro', err?.response?.data?.error ?? 'Tente novamente.')
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient
        colors={[Colors.primaryDark, Colors.primary]}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.logo}>🌿 SolFarm</Text>
        <Text style={styles.tagline}>Crie sua conta gratuita</Text>
      </LinearGradient>

      <ScrollView style={styles.form} contentContainerStyle={styles.formContent}>
        {/* Tipo de conta */}
        <Text style={styles.sectionLabel}>Você é:</Text>
        <View style={styles.roleRow}>
          {([['PRODUCER', '🌱', 'Produtor Rural'], ['SUPPLIER', '🏪', 'Fornecedor']] as const).map(([val, emoji, label]) => (
            <TouchableOpacity
              key={val}
              style={[styles.roleBtn, role === val && styles.roleBtnActive]}
              onPress={() => setRole(val)}
            >
              <Text style={styles.roleEmoji}>{emoji}</Text>
              <Text style={[styles.roleLabel, role === val && styles.roleLabelActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Nome */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nome completo *</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="person-outline" size={20} color={Colors.gray400} style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="João da Silva" placeholderTextColor={Colors.gray400}
              value={name} onChangeText={setName} autoCapitalize="words" />
          </View>
        </View>

        {/* E-mail */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>E-mail *</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="mail-outline" size={20} color={Colors.gray400} style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="seu@email.com.br" placeholderTextColor={Colors.gray400}
              value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          </View>
        </View>

        {/* Telefone */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>WhatsApp</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="phone-portrait-outline" size={20} color={Colors.gray400} style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="(65) 99999-9999" placeholderTextColor={Colors.gray400}
              value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          </View>
        </View>

        {/* Estado */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Estado (UF)</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="location-outline" size={20} color={Colors.gray400} style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="MT" placeholderTextColor={Colors.gray400}
              value={state} onChangeText={(t) => setState(t.toUpperCase().slice(0, 2))}
              autoCapitalize="characters" maxLength={2} />
          </View>
        </View>

        {/* Senha */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Senha *</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={20} color={Colors.gray400} style={styles.inputIcon} />
            <TextInput style={[styles.input, { flex: 1 }]} placeholder="Mín. 8 caracteres" placeholderTextColor={Colors.gray400}
              value={password} onChangeText={setPassword} secureTextEntry={!showPassword} autoCapitalize="none" />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.gray400} />
            </TouchableOpacity>
          </View>
          <Text style={styles.hint}>Mínimo 8 caracteres, 1 maiúscula e 1 número</Text>
        </View>

        {/* Aceite de Termos e Privacidade */}
        <TouchableOpacity
          style={styles.termsRow}
          onPress={() => setAgreeTerms(!agreeTerms)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={agreeTerms ? 'checkbox' : 'square-outline'}
            size={22}
            color={agreeTerms ? Colors.primary : Colors.gray400}
          />
          <Text style={styles.termsText}>
            Li e aceito os{' '}
            <Text style={styles.termsLink} onPress={() => Linking.openURL('https://solfarm.com.br/termos')}>
              Termos de uso
            </Text>
            {' '}e a{' '}
            <Text style={styles.termsLink} onPress={() => Linking.openURL('https://solfarm.com.br/privacidade')}>
              Política de privacidade
            </Text>
            .
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, !agreeTerms && styles.btnDisabled]}
          onPress={handleRegister}
          disabled={isLoading || !agreeTerms}
        >
          {isLoading
            ? <ActivityIndicator color={Colors.white} />
            : <Text style={styles.btnText}>Criar conta grátis</Text>
          }
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Já tem conta? </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity><Text style={styles.footerLink}>Entrar</Text></TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  header: { paddingTop: 60, paddingBottom: 32, alignItems: 'center', borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  backBtn: { position: 'absolute', top: 60, left: 20, padding: 8 },
  logo: { fontSize: 32, fontWeight: '800', color: Colors.white },
  tagline: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  form: { flex: 1, backgroundColor: Colors.background },
  formContent: { padding: 24 },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: Colors.gray700, marginBottom: 10 },
  roleRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  roleBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 2, borderColor: Colors.border, backgroundColor: Colors.white, alignItems: 'center' },
  roleBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryBg },
  roleEmoji: { fontSize: 24, marginBottom: 4 },
  roleLabel: { fontSize: 13, fontWeight: '600', color: Colors.gray600 },
  roleLabelActive: { color: Colors.primary },
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.gray700, marginBottom: 6 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12 },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, height: 48, fontSize: 15, color: Colors.gray900 },
  eyeBtn: { padding: 4 },
  hint: { fontSize: 11, color: Colors.gray400, marginTop: 4, marginLeft: 4 },
  btn: { backgroundColor: Colors.primary, borderRadius: 12, height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 8, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  btnDisabled: { backgroundColor: Colors.gray300, shadowOpacity: 0 },
  btnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 16, marginBottom: 4, gap: 10 },
  termsText: { flex: 1, fontSize: 13, color: Colors.gray700, lineHeight: 18 },
  termsLink: { color: Colors.primary, fontWeight: '600', textDecorationLine: 'underline' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20, marginBottom: 40 },
  footerText: { color: Colors.gray500, fontSize: 14 },
  footerLink: { color: Colors.primary, fontSize: 14, fontWeight: '700' },
})
