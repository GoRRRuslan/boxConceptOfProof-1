import type { FrameInfo } from 'react-native-filament'

import type { IRenderFrameStats } from '@services/performance/summarizeFrameDeltas'
import type { ILidHingeTransform } from '@flows/spikeFlow/_facadesLogic/computeLidHingeTransform'

export interface IFilamentSpikeFacade {
  renderCallback: (frameInfo: FrameInfo) => void
  renderFrameStats: IRenderFrameStats | null
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
