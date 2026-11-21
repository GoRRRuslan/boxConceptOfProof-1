import { useIsFocused } from '@react-navigation/native'
import { useEffect } from 'react'

import { RenderOnDemand } from '@components/RenderOnDemand'
import { IDLE_RENDER_HOLD_MILLISECONDS, IDLE_RENDER_MAXIMUM_MILLISECONDS } from '@flows/catalogueFlow/_config/sceneRenderConfig'
import type { ICatalogueCard, ICatalogueSceneSync, ICatalogueViewport } from '@flows/catalogueFlow/_types'
import { useFacadeCatalogueBoxes } from '@flows/catalogueFlow/screens/CatalogueScreen/_components/CatalogueScene/_components/CatalogueBoxes/_facades/useFacadeCatalogueBoxes'
import type { IOpeningPhaseKey } from '@flows/openingFlow/_types'
import { logDiagnostic } from '@services/performance/diagnosticLog'

interface ICatalogueBoxesProps {
  cards: ICatalogueCard[]
  viewport: ICatalogueViewport
  sceneSync: ICatalogueSceneSync
  phaseKey: IOpeningPhaseKey
  isRenderContinuous: boolean
}

// Renders nothing itself: it loads the box model and keeps the instances in sync with the list and
// with the opening experience.
export const CatalogueBoxes = ({
  cards,
  viewport,
  sceneSync,
  phaseKey,
  isRenderContinuous,
}: ICatalogueBoxesProps) => {
  const { modelState } = useFacadeCatalogueBoxes({ cards, viewport, sceneSync })
  const isScreenFocused = useIsFocused()

  useEffect(() => {
    logDiagnostic('scene.model', { modelState, cards: cards.length, viewport: `${viewport.width}x${viewport.height}` })
  }, [modelState, cards.length, viewport.width, viewport.height])

  // Keeps the renderer running while something moves; a still screen stops rendering (battery).
  return (
    <RenderOnDemand
      activityKey={`${cards.length}|${viewport.width}x${viewport.height}|${modelState}|${phaseKey}`}
      warmupKey={modelState}
      minimumMilliseconds={IDLE_RENDER_HOLD_MILLISECONDS}
      maximumMilliseconds={IDLE_RENDER_MAXIMUM_MILLISECONDS}
      isContinuous={isRenderContinuous}
      isScreenFocused={isScreenFocused}
    />
  )
}
