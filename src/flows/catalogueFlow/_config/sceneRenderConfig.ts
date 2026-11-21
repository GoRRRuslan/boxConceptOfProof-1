import { Platform } from 'react-native'
import type { FilamentProviderProps } from 'react-native-filament'

// How the shared 3D view is rendered (the same on iOS and Android).
export const CATALOGUE_SCENE_RENDER_PROPS: Pick<
  FilamentProviderProps,
  'backend' | 'antiAliasing' | 'dithering' | 'postProcessing' | 'shadowing' | 'ambientOcclusionOptions' | 'bloomOptions'
> = {
  // Android backend. Vulkan by default: the boxes are on screen with the first list frame, while Filament's own pick (OpenGL ES)
  // needed 10-15 s to compile the glTF shaders on a cold emulator. Measured at 60 FPS headless and in the emulator window
  // (docs/PERFORMANCE.md, section 7). EXPO_PUBLIC_ANDROID_BACKEND=opengl switches back. Real devices were not tested.
  backend: Platform.OS === 'android' && process.env.EXPO_PUBLIC_ANDROID_BACKEND !== 'opengl' ? 'vulkan' : 'default',
  antiAliasing: 'FXAA',
  dithering: 'temporal',
  postProcessing: true,
  // Real shadows: the lid shades the inside of the box, the box shades its own lower edge.
  shadowing: true,
  // Soft darkening in corners and creases (between lid and base, around the cushion).
  ambientOcclusionOptions: { enabled: true, radius: 0.35, power: 1.2, intensity: 1, quality: 'LOW' },
  // The light inside an opened box (and bright highlights) bleeds softly into the picture.
  bloomOptions: { enabled: true, strength: 0.3, resolution: 360, levels: 5, quality: 'LOW', threshold: true, highlight: 1000 },
}

// Reflections of the environment (what makes glossy and metallic boxes look glossy and metallic).
export const ENVIRONMENT_LIGHT_INTENSITY = 22_000

export interface ISceneLight {
  intensity: number
  colorKelvin: number
  // The direction the light travels in. The camera looks along -Z at boxes whose fronts face +Z.
  direction: [number, number, number]
  castShadows: boolean
}

// A three-point-ish rig: a warm key light from the upper left in front, a cool rim light from behind on
// the right (bright edges that separate the box from the dark background), and a soft fill from below.
export const SCENE_LIGHTS: ISceneLight[] = [
  { intensity: 11_000, colorKelvin: 5_600, direction: [0.45, -0.75, -0.55], castShadows: true },
  { intensity: 5_500, colorKelvin: 9_000, direction: [-0.65, -0.25, 0.7], castShadows: false },
  { intensity: 1_800, colorKelvin: 6_500, direction: [-0.2, 0.9, -0.4], castShadows: false },
]

export interface IScenePointLight {
  // Lumen.
  intensity: number
  colorKelvin: number
  position: [number, number, number]
  falloffRadius: number
}

// Studio spot lamps: small, close to the boxes, so that a flat lacquered face does not shine all over but carries one bright spot of
// light in a corner (a highlight depends on the angle between the viewer, the surface and the lamp, which differs across a face only
// for a lamp that is near). The camera stands at z = 6, the boxes at z = 0. As the list scrolls, the boxes pass through the light.
export const SCENE_POINT_LIGHTS: IScenePointLight[] = []

// The list is shown (and the loader taken away) only when the scene is really ready: the model is loaded, every box has popped in,
// this many frames have been drawn since (the first frames compile shaders and are uneven) and the picture has settled for a moment.
// Without this the loader ended while the tiles were still empty, and the first scroll right after it rattled.
export const SCENE_READY_MINIMUM_FRAMES = 45
export const SCENE_READY_SETTLE_MILLISECONDS = 400
// Never wait longer than this for the scene (a failed model load must not keep the loader forever).
export const SCENE_READY_TIMEOUT_MILLISECONDS = 8000
export const SCENE_READY_POLL_MILLISECONDS = 100

// After the last activity (scroll, finger, animation) the renderer keeps drawing this long before it rests. Resting after 0.7 s made every
// scroll that began after a short pause start the renderer again, and its first frames take 130 to 570 ms on a device: the list moved while
// the boxes stood still and then jumped. A longer hold means a restart only after a real pause. (The cap is the safety limit.)
export const IDLE_RENDER_HOLD_MILLISECONDS = 12_000
export const IDLE_RENDER_MAXIMUM_MILLISECONDS = 20_000
