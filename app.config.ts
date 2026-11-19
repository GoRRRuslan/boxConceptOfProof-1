import type { ExpoConfig } from 'expo/config'

// Native ABIs to build. arm64-v8a covers every modern phone and Apple-Silicon emulators; the other
// ABIs only add ~190 MB of Filament/Bullet libraries to debug builds. Intel Macs: ANDROID_ARCHITECTURES=x86_64
const androidArchitectures = (process.env.ANDROID_ARCHITECTURES ?? 'arm64-v8a').split(',')

const config: ExpoConfig = {
  name: 'Mystery Watch',
  slug: 'mystery-watch',
  scheme: 'mysterywatch',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './src/assets/images/app/icon.png',
  userInterfaceStyle: 'dark',
  backgroundColor: '#0B0D12',
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
  plugins: [
    'expo-asset',
    'expo-font',
    'expo-localization',
    'expo-status-bar',
    'expo-dev-client',
    ['expo-build-properties', { android: { buildArchs: androidArchitectures } }],
    [
      'expo-splash-screen',
      {
        image: './src/assets/images/app/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#0B0D12',
      },
    ],
  ],
}

export default config
