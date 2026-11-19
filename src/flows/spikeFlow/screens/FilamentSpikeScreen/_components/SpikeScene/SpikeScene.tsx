import { useMemo } from 'react'
import {
  Camera,
  DefaultLight,
  EntitySelector,
  FilamentView,
  type FrameInfo,
  ModelInstance,
  ModelRenderer,
  useModel,
} from 'react-native-filament'

import { RenderOnDemand } from '@components/RenderOnDemand'

import type { ILidHingeTransform } from '@flows/spikeFlow/_facadesLogic/computeLidHingeTransform'
import { computeBoxGridLayout } from '@flows/spikeFlow/_facadesLogic/computeBoxGridLayout'
import { makeStyles } from '@flows/spikeFlow/screens/FilamentSpikeScreen/_components/SpikeScene/SpikeScene.styles'
import boxModelSource from '@assets/models/box.glb'

interface ISpikeSceneProps {
  lidHingeTransform: ILidHingeTransform
  modelCount: number
  renderActivityKey: string
  isRenderContinuous: boolean
  renderCallback: (frameInfo: FrameInfo) => void
}

interface IInstancedBoxesProps {
  lidHingeTransform: ILidHingeTransform
  modelCount: number
  renderActivityKey: string
  isRenderContinuous: boolean
}

// Loads the GLB once and instantiates it `modelCount` times. Lives in its own component so the
// whole model (and its instances) is re-created, keyed by the count, when the count changes.
const InstancedBoxes = ({ lidHingeTransform, modelCount, renderActivityKey, isRenderContinuous }: IInstancedBoxesProps) => {
  const model = useModel(boxModelSource, { instanceCount: modelCount })
  const layout = useMemo(() => computeBoxGridLayout(modelCount), [modelCount])

  return (
    <>
      <ModelRenderer model={model}>
        {layout.positions.map((position, instanceIndex) => (
          <ModelInstance key={instanceIndex} index={instanceIndex} translate={position} scale={layout.scale}>
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
          </ModelInstance>
        ))}
      </ModelRenderer>
      {/* Wakes the renderer on every change and when the model finishes loading. */}
      <RenderOnDemand activityKey={`${renderActivityKey}|${model.state}`} warmupKey={model.state} isContinuous={isRenderContinuous} />
    </>
  )
}

export const SpikeScene = ({
  lidHingeTransform,
  modelCount,
  renderActivityKey,
  isRenderContinuous,
  renderCallback,
}: ISpikeSceneProps) => {
  const styles = useMemo(() => makeStyles(), [])
  const layout = useMemo(() => computeBoxGridLayout(modelCount), [modelCount])

  return (
    <FilamentView style={styles.filamentView} renderCallback={renderCallback} testID="filamentView">
      <Camera cameraPosition={layout.cameraPosition} cameraTarget={layout.cameraTarget} />
      <DefaultLight />
      <InstancedBoxes
        key={modelCount}
        lidHingeTransform={lidHingeTransform}
        modelCount={modelCount}
        renderActivityKey={renderActivityKey}
        isRenderContinuous={isRenderContinuous}
      />
    </FilamentView>
  )
}
