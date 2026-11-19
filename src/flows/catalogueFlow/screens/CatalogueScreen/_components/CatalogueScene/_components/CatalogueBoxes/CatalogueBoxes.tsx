import type { Synchronizable } from 'react-native-worklets'

import { RenderOnDemand } from '@components/RenderOnDemand'
import type { ICatalogueCard } from '@flows/catalogueFlow/_types'
import { useFacadeCatalogueBoxes } from '@flows/catalogueFlow/screens/CatalogueScreen/_components/CatalogueScene/_components/CatalogueBoxes/_facades/useFacadeCatalogueBoxes'

interface ICatalogueBoxesProps {
  cards: ICatalogueCard[]
  viewportHeight: number
  scrollOffset: Synchronizable<number>
  isScrolling: boolean
}

// Renders nothing itself: it loads the box model and keeps the instances in sync with the list.
export const CatalogueBoxes = ({ cards, viewportHeight, scrollOffset, isScrolling }: ICatalogueBoxesProps) => {
  const { modelState } = useFacadeCatalogueBoxes({ cards, viewportHeight, scrollOffset })

  // Keeps the renderer running while the list moves; idle lists stop rendering (battery).
  return (
    <RenderOnDemand
      activityKey={`${cards.length}|${viewportHeight}|${modelState}`}
      warmupKey={modelState}
      isContinuous={isScrolling}
    />
  )
}
