import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ScrollView, TextInput, ActivityIndicator, Platform,
} from 'react-native'
import MapView, { Polygon, Marker, PROVIDER_GOOGLE } from 'react-native-maps'
import { router } from 'expo-router'
import { useState, useRef } from 'react'
import * as Location from 'expo-location'
import { Ionicons } from '@expo/vector-icons'
import { useAreasStore } from '../../src/store/areas.store'
import { Colors, cultureLabel } from '../../src/utils/colors'
import type { CultureType, BiomeType, GeoPolygon } from '../../src/types'

interface Coordinate { latitude: number; longitude: number }

const CULTURES: CultureType[] = ['SOJA', 'MILHO', 'CAFE', 'CANA', 'ALGODAO', 'ARROZ', 'FEIJAO', 'TRIGO', 'MANDIOCA', 'PASTAGEM', 'OUTRO']
const BIOMES: BiomeType[] = ['CERRADO', 'AMAZONIA', 'MATA_ATLANTICA', 'CAATINGA', 'PAMPA', 'PANTANAL']
const BIOME_LABELS: Record<string, string> = { CERRADO: 'Cerrado', AMAZONIA: 'Amazônia', MATA_ATLANTICA: 'Mata Atlântica', CAATINGA: 'Caatinga', PAMPA: 'Pampa', PANTANAL: 'Pantanal' }

export default function NewAreaScreen() {
  const { createArea } = useAreasStore()
  const mapRef = useRef<MapView>(null)

  const [step, setStep] = useState<'map' | 'info'>('map')
  const [points, setPoints] = useState<Coordinate[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLocating, setIsLocating] = useState(false)
  const [region, setRegion] = useState({
    latitude: -12.5, longitude: -55.7,
    latitudeDelta: 0.08, longitudeDelta: 0.08,
  })

  // Formulário
  const [name, setName] = useState('')
  const [culture, setCulture] = useState<CultureType | ''>('')
  const [customCulture, setCustomCulture] = useState('')
  const [biome, setBiome] = useState<BiomeType | ''>('')
  const [state, setState] = useState('')
  const [city, setCity] = useState('')
  const [description, setDescription] = useState('')

  // ── Localização atual ──
  async function goToMyLocation() {
    setIsLocating(true)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') { Alert.alert('Permissão negada', 'Habilite a localização nas configurações.'); return }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
      const { latitude, longitude } = loc.coords
      setRegion({ latitude, longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 })
      mapRef.current?.animateToRegion({ latitude, longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 800)
    } catch {
      Alert.alert('Erro', 'Não foi possível obter sua localização.')
    } finally {
      setIsLocating(false)
    }
  }

  // ── Toque no mapa → adiciona ponto ──
  function handleMapPress(e: any) {
    if (!isDrawing) return
    const coord = e.nativeEvent.coordinate
    setPoints((prev) => [...prev, coord])
  }

  function undoLastPoint() { setPoints((prev) => prev.slice(0, -1)) }
  function clearPoints() { setPoints([]) }

  // ── Polígono como GeoJSON ──
  function toGeoJSON(): GeoPolygon {
    const coords = points.map((p) => [p.longitude, p.latitude])
    // Fecha o polígono
    if (coords.length > 0) coords.push(coords[0])
    return { type: 'Polygon', coordinates: [coords] }
  }

  // ── Vai para o formulário ──
  function goToInfo() {
    if (points.length < 3) {
      Alert.alert('Polígono incompleto', 'Marque pelo menos 3 pontos no mapa para formar a área.')
      return
    }
    setStep('info')
  }

  // ── Salva a área ──
  async function handleSave() {
    if (!name.trim()) { Alert.alert('Atenção', 'Digite o nome da área.'); return }
    if (culture === 'OUTRO' && !customCulture.trim()) {
      Alert.alert('Atenção', 'Como você selecionou "Outro", informe qual é a cultura.')
      return
    }
    setIsSaving(true)
    try {
      const polygon = toGeoJSON()
      const finalDescription =
        culture === 'OUTRO' && customCulture.trim()
          ? `Cultura: ${customCulture.trim()}${description.trim() ? ` — ${description.trim()}` : ''}`
          : description.trim() || undefined
      await createArea({
        name: name.trim(),
        description: finalDescription,
        culture: culture as CultureType || undefined,
        biome: biome as BiomeType || undefined,
        state: state.toUpperCase() || undefined,
        city: city.trim() || undefined,
        polygon,
      })
      Alert.alert('✅ Área cadastrada!', 'Sua área foi cadastrada. Agora você pode analisá-la via satélite.', [
        { text: 'OK', onPress: () => router.back() },
      ])
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.error ?? 'Tente novamente.')
    } finally {
      setIsSaving(false)
    }
  }

  // ───────────────────────────────
  // STEP 1: Mapa
  // ───────────────────────────────
  if (step === 'map') {
    return (
      <View style={styles.container}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          initialRegion={region}
          onPress={handleMapPress}
          mapType="satellite"
          showsUserLocation
          showsMyLocationButton={false}
        >
          {points.map((p, i) => (
            <Marker key={i} coordinate={p} anchor={{ x: 0.5, y: 0.5 }}>
              <View style={styles.dot} />
            </Marker>
          ))}
          {points.length >= 3 && (
            <Polygon
              coordinates={points}
              strokeColor={Colors.primary}
              strokeWidth={3}
              fillColor="rgba(22,163,74,0.25)"
            />
          )}
        </MapView>

        {/* Instruções */}
        <View style={styles.instruction}>
          <Text style={styles.instructionText}>
            {isDrawing
              ? `📍 Toque no mapa para marcar pontos (${points.length} marcados)`
              : 'Ative o desenho para delimitar sua área'
            }
          </Text>
        </View>

        {/* Toolbar */}
        <View style={styles.toolbar}>
          <TouchableOpacity style={[styles.toolBtn, isDrawing && styles.toolBtnActive]} onPress={() => setIsDrawing(!isDrawing)}>
            <Ionicons name={isDrawing ? 'stop-circle' : 'pencil'} size={22} color={isDrawing ? Colors.white : Colors.primary} />
            <Text style={[styles.toolBtnText, isDrawing && { color: Colors.white }]}>{isDrawing ? 'Pausar' : 'Desenhar'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.toolBtn} onPress={undoLastPoint} disabled={points.length === 0}>
            <Ionicons name="arrow-undo" size={22} color={points.length === 0 ? Colors.gray300 : Colors.gray700} />
            <Text style={styles.toolBtnText}>Desfazer</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.toolBtn} onPress={clearPoints} disabled={points.length === 0}>
            <Ionicons name="trash-outline" size={22} color={points.length === 0 ? Colors.gray300 : Colors.danger} />
            <Text style={[styles.toolBtnText, { color: points.length === 0 ? Colors.gray300 : Colors.danger }]}>Limpar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.toolBtn} onPress={goToMyLocation}>
            {isLocating
              ? <ActivityIndicator size="small" color={Colors.primary} />
              : <Ionicons name="locate" size={22} color={Colors.primary} />
            }
            <Text style={styles.toolBtnText}>Localizar</Text>
          </TouchableOpacity>
        </View>

        {/* Botão próximo */}
        {points.length >= 3 && (
          <TouchableOpacity style={styles.nextBtn} onPress={goToInfo}>
            <Text style={styles.nextBtnText}>Próximo — Dados da área</Text>
            <Ionicons name="arrow-forward" size={20} color={Colors.white} />
          </TouchableOpacity>
        )}
      </View>
    )
  }

  // ───────────────────────────────
  // STEP 2: Dados da área
  // ───────────────────────────────
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.formContent}>
      <TouchableOpacity style={styles.backToMap} onPress={() => setStep('map')}>
        <Ionicons name="arrow-back" size={18} color={Colors.primary} />
        <Text style={styles.backToMapText}>Voltar ao mapa ({points.length} pontos)</Text>
      </TouchableOpacity>

      <Text style={styles.formTitle}>Dados da Área</Text>

      {/* Nome */}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Nome da área *</Text>
        <TextInput style={styles.fieldInput} placeholder="Ex: Fazenda Boa Vista — Talhão 1"
          placeholderTextColor={Colors.gray400} value={name} onChangeText={setName} />
      </View>

      {/* Descrição */}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Descrição</Text>
        <TextInput style={[styles.fieldInput, styles.textArea]} placeholder="Observações sobre o solo, histórico, etc."
          placeholderTextColor={Colors.gray400} value={description} onChangeText={setDescription} multiline numberOfLines={3} />
      </View>

      {/* Cultura */}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Cultura atual</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
          {CULTURES.map((c) => (
            <TouchableOpacity key={c} style={[styles.chip, culture === c && styles.chipActive]} onPress={() => setCulture(c === culture ? '' : c)}>
              <Text style={[styles.chipText, culture === c && styles.chipTextActive]}>{cultureLabel(c)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {culture === 'OUTRO' && (
          <TextInput
            style={[styles.fieldInput, { marginTop: 10 }]}
            placeholder="Especifique a cultura (ex.: Uva, Tomate, Banana)"
            placeholderTextColor={Colors.gray400}
            value={customCulture}
            onChangeText={setCustomCulture}
            autoCapitalize="words"
          />
        )}
      </View>

      {/* Bioma */}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Bioma</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
          {BIOMES.map((b) => (
            <TouchableOpacity key={b} style={[styles.chip, biome === b && styles.chipActive]} onPress={() => setBiome(b === biome ? '' : b)}>
              <Text style={[styles.chipText, biome === b && styles.chipTextActive]}>{BIOME_LABELS[b]}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Estado / Cidade */}
      <View style={styles.fieldRow}>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.fieldLabel}>Estado (UF)</Text>
          <TextInput style={styles.fieldInput} placeholder="MT" placeholderTextColor={Colors.gray400}
            value={state} onChangeText={(t) => setState(t.toUpperCase().slice(0, 2))} autoCapitalize="characters" maxLength={2} />
        </View>
        <View style={{ width: 12 }} />
        <View style={[styles.field, { flex: 2 }]}>
          <Text style={styles.fieldLabel}>Cidade</Text>
          <TextInput style={styles.fieldInput} placeholder="Sorriso" placeholderTextColor={Colors.gray400}
            value={city} onChangeText={setCity} autoCapitalize="words" />
        </View>
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isSaving}>
        {isSaving
          ? <ActivityIndicator color={Colors.white} />
          : (
            <>
              <Ionicons name="checkmark-circle" size={22} color={Colors.white} />
              <Text style={styles.saveBtnText}>Cadastrar área</Text>
            </>
          )
        }
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  map: { flex: 1 },
  instruction: { position: 'absolute', top: 16, left: 16, right: 16, backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: 12, padding: 10 },
  instructionText: { color: Colors.white, fontSize: 13, textAlign: 'center', fontWeight: '600' },
  toolbar: { position: 'absolute', bottom: 100, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-around', backgroundColor: Colors.white, borderRadius: 16, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  toolBtn: { alignItems: 'center', padding: 8, borderRadius: 10, minWidth: 64 },
  toolBtnActive: { backgroundColor: Colors.primary },
  toolBtnText: { fontSize: 10, color: Colors.gray700, marginTop: 4, fontWeight: '600' },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.primary, borderWidth: 2, borderColor: Colors.white },
  nextBtn: { position: 'absolute', bottom: 24, left: 16, right: 16, backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, borderRadius: 14, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
  nextBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  formContent: { padding: 20, paddingBottom: 40 },
  backToMap: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  backToMapText: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
  formTitle: { fontSize: 22, fontWeight: '800', color: Colors.gray900, marginBottom: 20 },
  field: { marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: Colors.gray700, marginBottom: 6 },
  fieldInput: { backgroundColor: Colors.white, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: Colors.gray900 },
  textArea: { height: 80, textAlignVertical: 'top' },
  fieldRow: { flexDirection: 'row' },
  chipsRow: { marginTop: 2 },
  chip: { marginRight: 8, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white },
  chipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryBg },
  chipText: { fontSize: 13, color: Colors.gray600, fontWeight: '500' },
  chipTextActive: { color: Colors.primary, fontWeight: '700' },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 14, height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 5 },
  saveBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
})
