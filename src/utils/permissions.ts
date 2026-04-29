import { Alert, Linking, Platform } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import * as Location from 'expo-location'

type EnsureResult = boolean

function showSettingsAlert(title: string, message: string): Promise<EnsureResult> {
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
        {
          text: 'Abrir ajustes',
          onPress: () => {
            Linking.openSettings().catch(() => {})
            resolve(false)
          },
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    )
  })
}

export async function ensureCameraPermission(): Promise<EnsureResult> {
  const current = await ImagePicker.getCameraPermissionsAsync()
  if (current.granted) return true

  if (current.canAskAgain) {
    const asked = await ImagePicker.requestCameraPermissionsAsync()
    if (asked.granted) return true
    if (!asked.canAskAgain) {
      return showSettingsAlert(
        'Câmera bloqueada',
        Platform.OS === 'ios'
          ? 'Para fotografar, vá em Ajustes › SolFarm › Câmera e ative o acesso.'
          : 'Para fotografar, abra os ajustes do app e ative a permissão de Câmera.',
      )
    }
    return false
  }

  return showSettingsAlert(
    'Câmera bloqueada',
    Platform.OS === 'ios'
      ? 'Para fotografar, vá em Ajustes › SolFarm › Câmera e ative o acesso.'
      : 'Para fotografar, abra os ajustes do app e ative a permissão de Câmera.',
  )
}

export async function ensureMediaLibraryPermission(): Promise<EnsureResult> {
  const current = await ImagePicker.getMediaLibraryPermissionsAsync()
  if (current.granted) return true

  if (current.canAskAgain) {
    const asked = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (asked.granted) return true
    if (!asked.canAskAgain) {
      return showSettingsAlert(
        'Acesso à galeria bloqueado',
        Platform.OS === 'ios'
          ? 'Para escolher fotos da galeria, vá em Ajustes › SolFarm › Fotos e libere o acesso.'
          : 'Para escolher fotos da galeria, abra os ajustes do app e ative a permissão de Fotos.',
      )
    }
    return false
  }

  return showSettingsAlert(
    'Acesso à galeria bloqueado',
    Platform.OS === 'ios'
      ? 'Para escolher fotos da galeria, vá em Ajustes › SolFarm › Fotos e libere o acesso.'
      : 'Para escolher fotos da galeria, abra os ajustes do app e ative a permissão de Fotos.',
  )
}

export async function ensureLocationPermission(): Promise<EnsureResult> {
  const current = await Location.getForegroundPermissionsAsync()
  if (current.granted) return true

  if (current.canAskAgain) {
    const asked = await Location.requestForegroundPermissionsAsync()
    if (asked.granted) return true
    if (!asked.canAskAgain) {
      return showSettingsAlert(
        'Localização bloqueada',
        Platform.OS === 'ios'
          ? 'Para usar sua localização, vá em Ajustes › SolFarm › Localização e ative o acesso.'
          : 'Para usar sua localização, abra os ajustes do app e ative a permissão de Localização.',
      )
    }
    return false
  }

  return showSettingsAlert(
    'Localização bloqueada',
    Platform.OS === 'ios'
      ? 'Para usar sua localização, vá em Ajustes › SolFarm › Localização e ative o acesso.'
      : 'Para usar sua localização, abra os ajustes do app e ative a permissão de Localização.',
  )
}
