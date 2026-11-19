import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { AppText } from '@components/AppText'
import { makeStyles } from '@components/PerformanceOverlay/PerformanceOverlay.styles'
import type { IRenderFrameStats } from '@services/performance/summarizeFrameDeltas'
import { theme } from '@utils/designSystem/Theme'

interface IPerformanceOverlayProps {
  renderFrameStats: IRenderFrameStats | null
}

export const PerformanceOverlay = ({ renderFrameStats }: IPerformanceOverlayProps) => {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const styles = useMemo(() => makeStyles(theme, insets.top), [insets.top])

  const overlayText = useMemo(() => {
    if (!renderFrameStats) {
      return t('performance.measuring')
    }

    return t('performance.summary', {
      fps: renderFrameStats.averageFps.toFixed(1),
      average: renderFrameStats.averageFrameMilliseconds.toFixed(1),
      p95: renderFrameStats.p95FrameMilliseconds.toFixed(1),
      slow: renderFrameStats.slowFrames,
    })
  }, [t, renderFrameStats])

  return (
    <View style={styles.container} pointerEvents="none" testID="performanceOverlay">
      <AppText style={styles.text}>{overlayText}</AppText>
    </View>
  )
}
