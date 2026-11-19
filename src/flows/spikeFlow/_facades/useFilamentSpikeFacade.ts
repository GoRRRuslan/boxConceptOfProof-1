import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { IFilamentSpikeFacade } from '@flows/spikeFlow/_types'
import { useRenderFpsMeter } from '@services/performance/useRenderFpsMeter'
import {
  LID_FULLY_OPEN_ANGLE_DEGREES,
  computeLidHingeTransform,
} from '@flows/spikeFlow/_facadesLogic/computeLidHingeTransform'

export const useFilamentSpikeFacade = (): IFilamentSpikeFacade => {
  const { t } = useTranslation()

  // ------------------------ Services ----------------------- //
  const { renderCallback, renderFrameStats } = useRenderFpsMeter()

  // --------------------------- State ------------------------- //
  const [lidAngleDegrees, setLidAngleDegrees] = useState<number>(0)
  const [modelCount, setModelCount] = useState<number>(1)

  // -------------------------- Values ------------------------- //
  const lidHingeTransform = useMemo(() => computeLidHingeTransform(lidAngleDegrees), [lidAngleDegrees])
  const angleLabelText = useMemo(
    () => t('spike.angleLabel', { angle: Math.round(lidAngleDegrees) }),
    [t, lidAngleDegrees],
  )
  const modelCountLabelText = useMemo(() => t('spike.modelCount', { count: modelCount }), [t, modelCount])

  // ------------------- Handlers -------------------------- //
  const handleOpenPress = () => {
    setLidAngleDegrees(LID_FULLY_OPEN_ANGLE_DEGREES)
  }

  const handleClosePress = () => {
    setLidAngleDegrees(0)
  }

  const handleToggleModelCountPress = () => {
    setModelCount(previous => (previous === 1 ? 4 : 1))
  }

  const handleIncreasePress = () => {
    setLidAngleDegrees(previous => Math.min(previous + 5, LID_FULLY_OPEN_ANGLE_DEGREES))
  }

  const handleDecreasePress = () => {
    setLidAngleDegrees(previous => Math.max(previous - 5, 0))
  }

  return {
    renderCallback,
    renderFrameStats,
    lidHingeTransform,
    modelCount,
    angleLabelText,
    modelCountLabelText,
    openLabelText: t('spike.open'),
    closeLabelText: t('spike.close'),
    decreaseLabelText: t('spike.decrease'),
    increaseLabelText: t('spike.increase'),
    handleOpenPress,
    handleClosePress,
    handleIncreasePress,
    handleDecreasePress,
    handleToggleModelCountPress,
  }
}
