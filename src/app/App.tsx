import { useMemo } from 'react'
import { Text, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { QueryClientProvider } from '@tanstack/react-query'

import { makeStyles } from '@app/App.styles'
import { useAppFacade } from '@app/useAppFacade'

const App = () => {
  const { theme, queryClient, titleText, subtitleText } = useAppFacade()
  const styles = useMemo(() => makeStyles(theme), [theme])

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <View style={styles.container} testID="appRoot">
            <Text style={styles.title}>{titleText}</Text>
            <Text style={styles.subtitle}>{subtitleText}</Text>
          </View>
          <StatusBar style="light" />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

export default App
