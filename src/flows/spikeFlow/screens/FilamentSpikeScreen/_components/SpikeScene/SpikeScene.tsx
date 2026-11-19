import { useMemo } from 'react'
import { Camera, DefaultLight, EntitySelector, FilamentView, Model } from 'react-native-filament'

import type { ILidHingeTransform } from '@flows/spikeFlow/_facadesLogic/computeLidHingeTransform'
import { makeStyles } from '@flows/spikeFlow/screens/FilamentSpikeScreen/_components/SpikeScene/SpikeScene.styles'
import {
  GRID_MODEL_CAMERA_POSITION,
  GRID_MODEL_CAMERA_TARGET,
  GRID_MODEL_POSITIONS,
  GRID_MODEL_SCALE,
  SINGLE_MODEL_CAMERA_POSITION,
  SINGLE_MODEL_CAMERA_TARGET,
  SINGLE_MODEL_POSITIONS,
  SINGLE_MODEL_SCALE,
} from '@flows/spikeFlow/screens/FilamentSpikeScreen/_config/spikeSceneConfig'
import boxModelSource from '@assets/models/box.glb'

interface ISpikeSceneProps {
  lidHingeTransform: ILidHingeTransform
  modelCount: number
}

export const SpikeScene = ({ lidHingeTransform, modelCount }: ISpikeSceneProps) => {
  const styles = useMemo(() => makeStyles(), [])
  const isSingleModel = modelCount === 1
  const modelPositions = isSingleModel ? SINGLE_MODEL_POSITIONS : GRID_MODEL_POSITIONS

  return (
    <FilamentView style={styles.filamentView} testID="filamentView">
      <Camera
        cameraPosition={isSingleModel ? SINGLE_MODEL_CAMERA_POSITION : GRID_MODEL_CAMERA_POSITION}
        cameraTarget={isSingleModel ? SINGLE_MODEL_CAMERA_TARGET : GRID_MODEL_CAMERA_TARGET}
      />
      <DefaultLight />
      {modelPositions.map((modelPosition, modelIndex) => (
        <Model
          key={modelIndex}
          source={boxModelSource}
          translate={modelPosition}
          scale={isSingleModel ? SINGLE_MODEL_SCALE : GRID_MODEL_SCALE}
        >
          <EntitySelector
            byName="Shell_Lid"
            rotate={lidHingeTransform.rotate}
            translate={lidHingeTransform.translate}
            multiplyWithCurrentTransform={false}
          />
          <EntitySelector
            byName="Shell_Wordmark"
            rotate={lidHingeTransform.rotate}
            translate={lidHingeTransform.translate}
            multiplyWithCurrentTransform={false}
          />
        </Model>
      ))}
    </FilamentView>
  )
}
