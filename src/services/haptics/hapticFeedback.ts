import * as Haptics from 'expo-haptics'

// Thin wrapper so screens and facades never talk to expo-haptics directly (and tests can mock it).
export const hapticFeedback = {
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  lidOpening: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
  selection: () => Haptics.selectionAsync(),
}
