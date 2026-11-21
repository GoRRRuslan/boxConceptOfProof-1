const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)

// 3D models and the reflection environment are bundled as assets
config.resolver.assetExts = [...config.resolver.assetExts, 'glb', 'gltf', 'ktx']

module.exports = config
