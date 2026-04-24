import { useEffect } from 'react'
import { Stack, router, useRootNavigationState } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { useAuthStore } from '../src/store/auth.store'
import { Colors } from '../src/utils/colors'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 1000 * 60 * 5 },
  },
})

export default function RootLayout() {
  const { loadUser, isAuthenticated, isLoading } = useAuthStore()
  const navigationState = useRootNavigationState()

  useEffect(() => {
    loadUser()
  }, [])

  useEffect(() => {
    // Aguarda o navigator estar pronto antes de navegar
    if (!navigationState?.key) return
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace('/(tabs)')
      } else {
        router.replace('/(auth)/login')
      }
    }
  }, [isAuthenticated, isLoading, navigationState?.key])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" backgroundColor={Colors.primary} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="area/[id]"
            options={{
              headerShown: true,
              headerTitle: 'Detalhes da Área',
              headerStyle: { backgroundColor: Colors.primary },
              headerTintColor: Colors.white,
            }}
          />
          <Stack.Screen
            name="area/new"
            options={{
              headerShown: true,
              headerTitle: 'Nova Área',
              headerStyle: { backgroundColor: Colors.primary },
              headerTintColor: Colors.white,
            }}
          />
          <Stack.Screen
            name="diagnostic/[id]"
            options={{
              headerShown: true,
              headerTitle: 'Diagnóstico',
              headerStyle: { backgroundColor: Colors.primary },
              headerTintColor: Colors.white,
            }}
          />
          <Stack.Screen
            name="delete-account"
            options={{
              headerShown: true,
              headerTitle: 'Excluir conta',
              headerStyle: { backgroundColor: Colors.danger },
              headerTintColor: Colors.white,
            }}
          />
        </Stack>
      </QueryClientProvider>
    </GestureHandlerRootView>
  )
}
