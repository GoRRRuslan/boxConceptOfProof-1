import { useEffect } from 'react'
import { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'

const FLY_DISTANCE = 150

// The watch rises out of the box, turning half a circle, and settles with a small bounce.
export const useFacadeWatchReveal = () => {
  const progress = useSharedValue<number>(0)

  // ------------------- Side effects ----------------------- //
  useEffect(() => {
    progress.value = withSpring(1, { damping: 11, stiffness: 70, mass: 0.9 })
  }, [progress])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, progress.value * 3),
    transform: [
      { perspective: 800 },
      { translateY: (1 - progress.value) * FLY_DISTANCE },
      { scale: 0.35 + 0.65 * progress.value },
      { rotateY: `${(1 - progress.value) * 180}deg` },
    ],
  }))

  return { animatedStyle }
}
