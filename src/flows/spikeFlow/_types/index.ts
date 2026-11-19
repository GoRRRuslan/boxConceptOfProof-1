import type { ILidHingeTransform } from '@flows/spikeFlow/_facadesLogic/computeLidHingeTransform'

export interface IFilamentSpikeFacade {
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
