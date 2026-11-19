import type { ExpoConfig } from 'expo/config'

const config: ExpoConfig = {
  name: 'Mystery Watch',
  slug: 'mystery-watch',
  scheme: 'mysterywatch',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './src/assets/images/app/icon.png',
  userInterfaceStyle: 'dark',
  backgroundColor: '#0B0D12',
  splash: {
    image: './src/assets/images/app/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#0B0D12',
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.gorrr.mysterywatch',
  },
  android: {
    package: 'com.gorrr.mysterywatch',
    predictiveBackGestureEnabled: false,
    adaptiveIcon: {
      backgroundColor: '#0B0D12',
      foregroundImage: './src/assets/images/app/android-icon-foreground.png',
      backgroundImage: './src/assets/images/app/android-icon-background.png',
      monochromeImage: './src/assets/images/app/android-icon-monochrome.png',
    },
  },
  plugins: ['expo-asset', 'expo-font', 'expo-localization', 'expo-dev-client'],
}

export default config
