import type { FrameInfo } from 'react-native-filament'

import type {
  ERenderQualityProfile,
  RENDER_QUALITY_PROFILES,
} from '@flows/spikeFlow/screens/FilamentSpikeScreen/_config/renderQualityConfig'
import type { IRenderFrameStats } from '@services/performance/summarizeFrameDeltas'
import type { ILidHingeTransform } from '@flows/spikeFlow/_facadesLogic/computeLidHingeTransform'

export interface IFilamentSpikeFacade {
  isBenchmarkRunning: boolean
  benchmarkLabelText: string
  handleToggleBenchmarkPress: () => void
  renderQualityProps: (typeof RENDER_QUALITY_PROFILES)[ERenderQualityProfile]
  qualityLabelText: string
  handleCycleQualityPress: () => void
  renderCallback: (frameInfo: FrameInfo) => void
  renderFrameStats: IRenderFrameStats | null
  isRenderPaused: boolean
  renderActivityKey: string
  lidHingeTransform: ILidHingeTransform
  modelCount: number
  angleLabelText: string
  modelCountLabelText: string
  openLabelText: string
  closeLabelText: string
  decreaseLabelText: string
  increaseLabelText: string
  handleOpenPress: () => void
  handleClosePress: () => void
  handleIncreasePress: () => void
  handleDecreasePress: () => void
  handleToggleModelCountPress: () => void
}
