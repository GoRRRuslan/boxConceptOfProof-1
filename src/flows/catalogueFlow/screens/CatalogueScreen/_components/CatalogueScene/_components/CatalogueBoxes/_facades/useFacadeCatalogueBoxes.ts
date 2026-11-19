import { useMemo } from 'react'
import { RenderCallbackContext, useFilamentContext, useModel, useWorkletEffect } from 'react-native-filament'
import type { Synchronizable } from 'react-native-worklets'

import boxModelSource from '@assets/models/box.glb'
import { BOX_CENTER_HEIGHT_UNITS } from '@flows/catalogueFlow/_config/catalogueLayoutConfig'
import { computeBoxPose } from '@flows/catalogueFlow/_facadesLogic/computeBoxPose'
import type { ICatalogueCard } from '@flows/catalogueFlow/_types'

interface IUseFacadeCatalogueBoxesParams {
  cards: ICatalogueCard[]
  viewportHeight: number
  scrollOffset: Synchronizable<number>
}

// Parts of the model whose first primitive is the outer body surface (docs/MODEL.md: ShellRole_Body_Matte).
enum EBoxPartName {
  Base = 'Shell_Base',
  Lid = 'Shell_Lid',
}

const BODY_PRIMITIVE_BY_PART: Record<string, number> = { [EBoxPartName.Base]: 0, [EBoxPartName.Lid]: 0 }

// One GLB loaded once, one instance per card. Every frame each instance is moved/scaled/turned
// so it sits in the transparent slot of its card for the current scroll offset.
export const useFacadeCatalogueBoxes = ({ cards, viewportHeight, scrollOffset }: IUseFacadeCatalogueBoxesParams) => {
  const { transformManager, renderableManager, nameComponentManager } = useFilamentContext()
  const model = useModel(boxModelSource, { instanceCount: cards.length })

  // -------------------------- Values ------------------------- //
  const instances = useMemo(() => (model.state === 'loaded' ? model.asset.getAssetInstances() : []), [model])
  const rootEntities = useMemo(() => instances.map(instance => instance.getRoot()), [instances])
  const colors = useMemo(() => cards.map(card => card.colorLinearRgba), [cards])

  // ------------------- Side effects ----------------------- //
  // Colour of every box: the outer body (base and lid) of each instance gets the colour of its card.
  useWorkletEffect(() => {
    'worklet'

    instances.forEach((instance, instanceIndex) => {
      instance.getEntities().forEach(entity => {
        const partName = nameComponentManager.getEntityName(entity)
        const bodyPrimitiveIndex = partName === undefined ? undefined : BODY_PRIMITIVE_BY_PART[partName]

        if (bodyPrimitiveIndex !== undefined) {
          renderableManager
            .getMaterialInstanceAt(entity, bodyPrimitiveIndex)
            .setFloat4Parameter('baseColorFactor', colors[instanceIndex])
        }
      })
    })
  })

  // Scroll sync: runs on the Filament runtime right before every frame, no React involved.
  RenderCallbackContext.useRenderCallback(() => {
    'worklet'

    if (viewportHeight === 0) {
      return
    }

    const currentScrollOffset = scrollOffset.getBlocking()

    rootEntities.forEach((rootEntity, cardIndex) => {
      const pose = computeBoxPose({ cardIndex, scrollOffset: currentScrollOffset, viewportHeight })
      const matrix = transformManager
        .createIdentityMatrix()
        .translate([0, -BOX_CENTER_HEIGHT_UNITS, 0])
        .scaling([pose.scale, pose.scale, pose.scale])
        .rotate(pose.pitchRadians, [1, 0, 0])
        .rotate(pose.yawRadians, [0, 1, 0])
        .translate([0, pose.translateY, 0])

      transformManager.setTransform(rootEntity, matrix)
    })
  }, [transformManager, rootEntities, scrollOffset, viewportHeight])

  return { modelState: model.state }
}
