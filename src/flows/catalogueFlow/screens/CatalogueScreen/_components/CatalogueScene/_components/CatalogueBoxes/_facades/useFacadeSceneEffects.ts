import { useMemo } from 'react'
import { type Entity, useConfigureAssetShadow, useFilamentContext, useModel } from 'react-native-filament'
import { createSynchronizable } from 'react-native-worklets'

import fxDiscSource from '@assets/models/fx_disc.glb'
import fxRingSource from '@assets/models/fx_ring.glb'
import fxShaftSource from '@assets/models/fx_shaft.glb'
import { BOX_CENTER_HEIGHT_UNITS, BOX_WIDTH_UNITS } from '@flows/catalogueFlow/_config/catalogueLayoutConfig'
import type { ICatalogueCard } from '@flows/catalogueFlow/_types'
import {
  AURA_SCALE,
  BURST_PARTICLE_POOL_SIZE,
  DUST_POOL_SIZE,
  RING_POOL_SIZE,
  SHAFT_ANCHOR_HEIGHT,
} from '@flows/openingFlow/_config/effectsConfig'
import {
  computeAuraAlpha,
  computeBurstParticle,
  computeDustPoint,
  computeRingEffect,
  computeShaftEffect,
  getAnticipationLinear,
  getPopElapsedMilliseconds,
  getRarityProfile,
  transformModelPoint,
} from '@flows/openingFlow/_facadesLogic/computeSceneEffects'
import type { IOpeningPose, IOpeningSceneState } from '@flows/openingFlow/_types'

const PARKED_HEIGHT = -1000
const HIDDEN_SCALE = 0.0001
// How far behind its box (in model units) the aura sits.
const AURA_DEPTH_BEHIND_BOX = 0.9
// The light shaft, the shock waves and the sparks are drawn in front of the open box (this many model units towards the
// camera), so no part of them is cut off by the lid or the walls of the box.
const IN_FRONT_OF_BOX_MODEL_UNITS = 1.3
const AURA_ALPHA_STEP = 0.004

export interface ISceneEffectsFrame {
  scene: IOpeningSceneState
  nowMilliseconds: number
  focusProgress: number
  tuckProgress: number
  seamIntensity: number
  // Pose of every card's box this frame (after the camera punch) and the horizontal shake of the focused one.
  poses: IOpeningPose[]
  focusedPose: IOpeningPose | null
  shakeX: number
}

// The show around the boxes: soft glow behind every box, dust, light shaft, shock waves and
// a burst of sparks. All of it is made of three tiny pre-built meshes (fx_disc, fx_ring, fx_shaft) that are tinted and moved
// every frame; nothing is created while the app runs. The maths is in computeSceneEffects.
export const useFacadeSceneEffects = (cards: ICatalogueCard[]) => {
  const { transformManager, renderableManager, nameComponentManager } = useFilamentContext()
  const discCount = BURST_PARTICLE_POOL_SIZE + DUST_POOL_SIZE + cards.length
  const discModel = useModel(fxDiscSource, { instanceCount: discCount })
  const ringModel = useModel(fxRingSource, { instanceCount: RING_POOL_SIZE })
  const shaftModel = useModel(fxShaftSource, { instanceCount: 1 })
  const auraColors = useMemo(() => cards.map(card => [card.colorLinearRgba[0], card.colorLinearRgba[1], card.colorLinearRgba[2]]), [cards])
  const lastAuraAlpha = useMemo(() => createSynchronizable<number[]>(cards.map(() => -1)), [cards])
  const lastShaftAlpha = useMemo(() => createSynchronizable<number>(-1), [])
  const lastSparkTintLevel = useMemo(() => createSynchronizable<number>(-2), [])
  const lastRingAlpha = useMemo(() => createSynchronizable<number[]>(Array.from({ length: RING_POOL_SIZE }, () => -1)), [])

  // Effect meshes neither cast nor receive shadows.
  useConfigureAssetShadow({
    renderableManager,
    ...(discModel.state === 'loaded' ? { asset: discModel.asset } : {}),
    castShadow: false,
    receiveShadow: false,
  })

  useConfigureAssetShadow({
    renderableManager,
    ...(ringModel.state === 'loaded' ? { asset: ringModel.asset } : {}),
    castShadow: false,
    receiveShadow: false,
  })

  useConfigureAssetShadow({
    renderableManager,
    ...(shaftModel.state === 'loaded' ? { asset: shaftModel.asset } : {}),
    castShadow: false,
    receiveShadow: false,
  })

  const isLoaded = discModel.state === 'loaded' && ringModel.state === 'loaded' && shaftModel.state === 'loaded'
  const discInstances = useMemo(() => (discModel.state === 'loaded' ? discModel.asset.getAssetInstances() : []), [discModel])
  const ringInstances = useMemo(() => (ringModel.state === 'loaded' ? ringModel.asset.getAssetInstances() : []), [ringModel])
  const shaftInstances = useMemo(() => (shaftModel.state === 'loaded' ? shaftModel.asset.getAssetInstances() : []), [shaftModel])
  const discRoots = useMemo(() => discInstances.map(instance => instance.getRoot()), [discInstances])
  const ringRoots = useMemo(() => ringInstances.map(instance => instance.getRoot()), [ringInstances])
  const shaftRoots = useMemo(() => shaftInstances.map(instance => instance.getRoot()), [shaftInstances])
  // The one renderable of each effect instance (the node named Fx_*), whose material is tinted.
  const findRenderable = (entities: Entity[]): Entity | undefined =>
    entities.find(entity => (nameComponentManager.getEntityName(entity) ?? '').startsWith('Fx_'))
  const discRenderables = useMemo(
    () => discInstances.map(instance => findRenderable(instance.getEntities())),

    [discInstances, nameComponentManager],
  )
  const ringRenderables = useMemo(
    () => ringInstances.map(instance => findRenderable(instance.getEntities())),

    [ringInstances, nameComponentManager],
  )
  const shaftRenderables = useMemo(
    () => shaftInstances.map(instance => findRenderable(instance.getEntities())),

    [shaftInstances, nameComponentManager],
  )

  // Called from the render callback (Filament runtime) once per frame, after the box poses have been set.
  const updateSceneEffects = useMemo(() => {
    const place = (root: Entity | undefined, x: number, y: number, z: number, scaleX: number, scaleY: number, scaleZ: number) => {
      'worklet'

      if (!root) {
        return
      }

      const isHidden = scaleX <= HIDDEN_SCALE
      const matrix = transformManager
        .createIdentityMatrix()
        .scaling(isHidden ? [HIDDEN_SCALE, HIDDEN_SCALE, HIDDEN_SCALE] : [scaleX, scaleY, scaleZ])
        .translate([x, isHidden ? PARKED_HEIGHT : y, z])

      transformManager.setTransform(root, matrix)
    }

    const tint = (renderable: Entity | undefined, red: number, green: number, blue: number, alpha: number) => {
      'worklet'

      if (renderable) {
        renderableManager.getMaterialInstanceAt(renderable, 0).setFloat4Parameter('baseColorFactor', [red, green, blue, alpha])
      }
    }

    return (frame: ISceneEffectsFrame) => {
      'worklet'

      const { scene, nowMilliseconds, focusProgress, tuckProgress, seamIntensity, poses, focusedPose, shakeX } = frame
      const popElapsed = getPopElapsedMilliseconds(scene, nowMilliseconds)
      const anticipation = getAnticipationLinear(scene, nowMilliseconds)
      const isArmed = scene.rarityLevel >= 0
      const [glowRed, glowGreen, glowBlue] = scene.glowColorLinear
      const boost = getRarityProfile(scene.rarityLevel).emissiveBoost
      const unit = focusedPose ? focusedPose.scale : 0
      const auraAlphas = lastAuraAlpha.getBlocking()
      let nextAuraAlphas: number[] | null = null

      // Aura: a soft coloured glow behind every box.
      cards.forEach((_, cardIndex) => {
        const pose = poses[cardIndex] as IOpeningPose | undefined

        // The boxes are placed before the effects; until their model has loaded there is nothing to put a glow behind.
        if (!pose) {
          return
        }

        const isFocused = cardIndex === scene.focusedCardIndex
        const alpha = pose.isVisible ? computeAuraAlpha(isFocused, focusProgress, seamIntensity, popElapsed) * (isFocused ? 1 - tuckProgress : 1) : 0
        const diameter = pose.scale * BOX_WIDTH_UNITS * AURA_SCALE

        place(
          discRoots[BURST_PARTICLE_POOL_SIZE + DUST_POOL_SIZE + cardIndex],
          (isFocused ? shakeX : 0),
          pose.translateY,
          pose.translateZ - AURA_DEPTH_BEHIND_BOX * pose.scale,
          alpha > 0 ? diameter : 0,
          diameter,
          1,
        )

        if (Math.abs(alpha - auraAlphas[cardIndex]) > AURA_ALPHA_STEP) {
          const [red, green, blue] = isFocused && isArmed ? [glowRed, glowGreen, glowBlue] : auraColors[cardIndex]

          tint(discRenderables[BURST_PARTICLE_POOL_SIZE + DUST_POOL_SIZE + cardIndex], red, green, blue, alpha)

          nextAuraAlphas = nextAuraAlphas ?? [...auraAlphas]

          nextAuraAlphas[cardIndex] = alpha
        }
      })

      if (nextAuraAlphas) {
        lastAuraAlpha.setBlocking(nextAuraAlphas)
      }

      const pose = focusedPose

      // Everything below belongs to the focused box.
      for (let index = 0; index < discRoots.length - cards.length; index += 1) {
        place(discRoots[index], 0, 0, 0, 0, 0, 0)
      }

      if (!pose || scene.focusedCardIndex < 0) {
        place(shaftRoots[0], 0, 0, 0, 0, 0, 0)

        ringRoots.forEach(root => {
          place(root, 0, 0, 0, 0, 0, 0)
        })

        return
      }

      const [mouthX, mouthY, mouthZ] = transformModelPoint(0, SHAFT_ANCHOR_HEIGHT + BOX_CENTER_HEIGHT_UNITS, 0, BOX_CENTER_HEIGHT_UNITS, pose)
      const sparkRed = glowRed * boost
      const sparkGreen = glowGreen * boost
      const sparkBlue = glowBlue * boost

      // Burst of sparks.
      for (let index = 0; index < BURST_PARTICLE_POOL_SIZE; index += 1) {
        const point = computeBurstParticle(index, popElapsed, scene.rarityLevel)

        place(
          discRoots[index],
          mouthX + shakeX + point.x * unit,
          mouthY + point.y * unit,
          mouthZ + (point.z + IN_FRONT_OF_BOX_MODEL_UNITS) * unit,
          point.scale * unit,
          point.scale * unit,
          1,
        )
      }

      // Dust floating around the box (drawn in while it shakes).
      const dustVisibility = focusProgress * (1 - tuckProgress) * (popElapsed >= 0 ? Math.max(0, 1 - popElapsed / 400) : 1)

      for (let index = 0; index < DUST_POOL_SIZE; index += 1) {
        const point = computeDustPoint(index, nowMilliseconds, anticipation, dustVisibility)

        place(
          discRoots[BURST_PARTICLE_POOL_SIZE + index],
          shakeX + point.x * unit,
          pose.translateY + point.y * unit,
          pose.translateZ + point.z * unit,
          point.scale * unit,
          point.scale * unit,
          1,
        )
      }

      // Tint of everything that sparkles: the colour of the prize (white-hot in the middle of the burst). Only when the prize changes.
      if (lastSparkTintLevel.getBlocking() !== scene.rarityLevel) {
        for (let index = 0; index < BURST_PARTICLE_POOL_SIZE; index += 1) {
          tint(discRenderables[index], sparkRed + 0.15, sparkGreen + 0.15, sparkBlue + 0.15, 0.9)
        }

        // Dust is a cool, dim shimmer.
        for (let index = 0; index < DUST_POOL_SIZE; index += 1) {
          tint(discRenderables[BURST_PARTICLE_POOL_SIZE + index], 0.55, 0.7, 1, 0.22)
        }

        lastSparkTintLevel.setBlocking(scene.rarityLevel)
      }

      // Light shaft.
      const shaft = computeShaftEffect(popElapsed, tuckProgress, nowMilliseconds, scene.rarityLevel)

      place(
        shaftRoots[0],
        mouthX + shakeX,
        mouthY,
        mouthZ + IN_FRONT_OF_BOX_MODEL_UNITS * unit,
        shaft.scaleX * unit * BOX_WIDTH_UNITS,
        shaft.scaleY * unit * BOX_WIDTH_UNITS,
        shaft.scaleX * unit * BOX_WIDTH_UNITS,
      )

      if (Math.abs(shaft.alpha - lastShaftAlpha.getBlocking()) > AURA_ALPHA_STEP) {
        tint(shaftRenderables[0], glowRed * boost, glowGreen * boost, glowBlue * boost, shaft.alpha)

        lastShaftAlpha.setBlocking(shaft.alpha)
      }

      // Shock waves.
      const ringAlphas = lastRingAlpha.getBlocking()
      const nextRingAlphas = [...ringAlphas]

      for (let index = 0; index < RING_POOL_SIZE; index += 1) {
        const ring = computeRingEffect(index, popElapsed, scene.rarityLevel)
        const diameter = ring.scale * unit * BOX_WIDTH_UNITS

        place(ringRoots[index], mouthX + shakeX, mouthY, mouthZ + IN_FRONT_OF_BOX_MODEL_UNITS * unit, ring.alpha > 0 ? diameter : 0, diameter, 1)

        if (Math.abs(ring.alpha - ringAlphas[index]) > AURA_ALPHA_STEP) {
          tint(ringRenderables[index], glowRed * boost + 0.3, glowGreen * boost + 0.3, glowBlue * boost + 0.3, ring.alpha)

          nextRingAlphas[index] = ring.alpha
        }
      }

      lastRingAlpha.setBlocking(nextRingAlphas)
    }
  }, [
    transformManager,
    renderableManager,
    cards,
    auraColors,
    discRoots,
    ringRoots,
    shaftRoots,
    discRenderables,
    ringRenderables,
    shaftRenderables,
    lastAuraAlpha,
    lastShaftAlpha,
    lastRingAlpha,
    lastSparkTintLevel,
  ])

  return { isEffectsLoaded: isLoaded, updateSceneEffects }
}
