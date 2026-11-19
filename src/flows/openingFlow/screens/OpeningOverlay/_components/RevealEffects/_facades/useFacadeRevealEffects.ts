import { useEffect } from 'react'
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'

// The flash when the watch appears (quick up, slow down) and the glow behind the watch (a soft, endless pulse).
export const useFacadeRevealEffects = (flashOpacity: number) => {
  const flash = useSharedValue<number>(0)
  const glowPulse = useSharedValue<number>(0)

  // ------------------- Side effects ----------------------- //
  useEffect(() => {
    flash.value = withSequence(withTiming(flashOpacity, { duration: 90 }), withTiming(0, { duration: 700, easing: Easing.out(Easing.quad) }))

    glowPulse.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }), -1, true)
  }, [flash, glowPulse, flashOpacity])

  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value }))
  const innerGlowStyle = useAnimatedStyle(() => ({ opacity: 0.12 + 0.12 * glowPulse.value, transform: [{ scale: 0.95 + 0.1 * glowPulse.value }] }))
  const outerGlowStyle = useAnimatedStyle(() => ({ opacity: 0.35 + 0.3 * glowPulse.value, transform: [{ scale: 1 + 0.12 * glowPulse.value }] }))

  return { flashStyle, innerGlowStyle, outerGlowStyle }
}
