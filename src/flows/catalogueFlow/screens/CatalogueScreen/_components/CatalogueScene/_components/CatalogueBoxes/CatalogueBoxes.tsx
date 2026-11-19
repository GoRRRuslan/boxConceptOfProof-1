import type { Synchronizable } from 'react-native-worklets'

import { RenderOnDemand } from '@components/RenderOnDemand'
import type { ICatalogueCard, ICatalogueViewport } from '@flows/catalogueFlow/_types'
import { useFacadeCatalogueBoxes } from '@flows/catalogueFlow/screens/CatalogueScreen/_components/CatalogueScene/_components/CatalogueBoxes/_facades/useFacadeCatalogueBoxes'
import type { IDragState, IOpeningPhaseKey, IOpeningSceneState } from '@flows/openingFlow/_types'

interface ICatalogueBoxesProps {
  cards: ICatalogueCard[]
  viewport: ICatalogueViewport
  scrollOffset: Synchronizable<number>
  openingScene: Synchronizable<IOpeningSceneState>
  dragState: Synchronizable<IDragState>
  phaseKey: IOpeningPhaseKey
  isRenderContinuous: boolean
}

// Renders nothing itself: it loads the box model and keeps the instances in sync with the list and
// with the opening experience.
export const CatalogueBoxes = ({
  cards,
  viewport,
  scrollOffset,
  openingScene,
  dragState,
  phaseKey,
  isRenderContinuous,
}: ICatalogueBoxesProps) => {
  const { modelState } = useFacadeCatalogueBoxes({ cards, viewport, scrollOffset, openingScene, dragState })

  // Keeps the renderer running while something moves; a still screen stops rendering (battery).
  return (
    <RenderOnDemand
      activityKey={`${cards.length}|${viewport.width}x${viewport.height}|${modelState}|${phaseKey}`}
      warmupKey={modelState}
      isContinuous={isRenderContinuous}
    />
  )
}
