import { useMemo } from 'react'
import { Camera, DefaultLight, FilamentView, type FrameInfo } from 'react-native-filament'
import type { Synchronizable } from 'react-native-worklets'

import {
  CAMERA_DISTANCE,
  CAMERA_FOCAL_LENGTH_MILLIMETERS,
} from '@flows/catalogueFlow/_config/catalogueLayoutConfig'
import type { ICatalogueCard, ICatalogueViewport } from '@flows/catalogueFlow/_types'
import { CatalogueBoxes } from '@flows/catalogueFlow/screens/CatalogueScreen/_components/CatalogueScene/_components/CatalogueBoxes/CatalogueBoxes'
import { makeStyles } from '@flows/catalogueFlow/screens/CatalogueScreen/_components/CatalogueScene/CatalogueScene.styles'

interface ICatalogueSceneProps {
  cards: ICatalogueCard[]
  viewport: ICatalogueViewport | null
  scrollOffset: Synchronizable<number>
  isScrolling: boolean
  renderCallback: (frameInfo: FrameInfo) => void
}

// The ONE 3D canvas of the catalogue; it fills the list area and sits behind the transparent cards.
export const CatalogueScene = ({ cards, viewport, scrollOffset, isScrolling, renderCallback }: ICatalogueSceneProps) => {
  const styles = useMemo(() => makeStyles(), [])

  return (
    <FilamentView style={styles.filamentView} renderCallback={renderCallback} testID="catalogueFilamentView">
      <Camera
        cameraPosition={[0, 0, CAMERA_DISTANCE]}
        cameraTarget={[0, 0, 0]}
        focalLengthInMillimeters={CAMERA_FOCAL_LENGTH_MILLIMETERS}
      />
      <DefaultLight />
      {cards.length > 0 && viewport ? (
        <CatalogueBoxes
          key={cards.length}
          cards={cards}
          viewportHeight={viewport.height}
          scrollOffset={scrollOffset}
          isScrolling={isScrolling}
        />
      ) : null}
    </FilamentView>
  )
}
