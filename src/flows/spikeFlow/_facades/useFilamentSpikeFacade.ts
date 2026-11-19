import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { IFilamentSpikeFacade } from '@flows/spikeFlow/_types'
import {
  ERenderQualityProfile,
  RENDER_QUALITY_PROFILES,
  RENDER_QUALITY_PROFILE_ORDER,
} from '@flows/spikeFlow/screens/FilamentSpikeScreen/_config/renderQualityConfig'
import { MODEL_COUNT_STEPS } from '@flows/spikeFlow/screens/FilamentSpikeScreen/_config/spikeSceneConfig'
import { BENCHMARK_SCENARIOS, getBenchmarkScenarioAt } from '@flows/spikeFlow/_facadesLogic/benchmarkSuite'
import { useRenderFpsMeter } from '@services/performance/useRenderFpsMeter'
import {
  LID_FULLY_OPEN_ANGLE_DEGREES,
  computeLidHingeTransform,
} from '@flows/spikeFlow/_facadesLogic/computeLidHingeTransform'

// Measurement builds can start in a benchmark state (inlined at bundle time):
//   EXPO_PUBLIC_AUTO_BENCHMARK=1  EXPO_PUBLIC_AUTO_BOXES=64
const AUTO_BENCHMARK: string | undefined = process.env.EXPO_PUBLIC_AUTO_BENCHMARK
const INITIAL_BENCHMARK_RUNNING = AUTO_BENCHMARK === '1' || AUTO_BENCHMARK === 'suite'
// 'suite' additionally walks through every scenario of the benchmark suite by itself.
const IS_BENCHMARK_SUITE = AUTO_BENCHMARK === 'suite'
const requestedInitialBoxes = Number(process.env.EXPO_PUBLIC_AUTO_BOXES)
const INITIAL_MODEL_COUNT = MODEL_COUNT_STEPS.includes(requestedInitialBoxes) ? requestedInitialBoxes : MODEL_COUNT_STEPS[0]
const BENCHMARK_PERIOD_MILLISECONDS = 3000
const BENCHMARK_TICK_MILLISECONDS = 33

export const useFilamentSpikeFacade = (): IFilamentSpikeFacade => {
  const { t } = useTranslation()

  // ------------------------ Services ----------------------- //
  const [scenarioLabel, setScenarioLabel] = useState<string>('')
  const { renderCallback, renderFrameStats, isRenderPaused } = useRenderFpsMeter(scenarioLabel)

  // --------------------------- State ------------------------- //
  const [lidAngleDegrees, setLidAngleDegrees] = useState<number>(0)
  const [modelCount, setModelCount] = useState<number>(INITIAL_MODEL_COUNT)
  const [isBenchmarkRunning, setIsBenchmarkRunning] = useState<boolean>(INITIAL_BENCHMARK_RUNNING)
  const [qualityProfile, setQualityProfile] = useState<ERenderQualityProfile>(ERenderQualityProfile.Full)

  // -------------------------- Values ------------------------- //
  const lidHingeTransform = useMemo(() => computeLidHingeTransform(lidAngleDegrees), [lidAngleDegrees])
  const angleLabelText = useMemo(
    () => t('spike.angleLabel', { angle: Math.round(lidAngleDegrees) }),
    [t, lidAngleDegrees],
  )
  const modelCountLabelText = useMemo(() => t('spike.modelCount', { count: modelCount }), [t, modelCount])

  const renderActivityKey = useMemo(
    () => `${modelCount}|${Math.round(lidAngleDegrees)}|${qualityProfile}`,
    [modelCount, lidAngleDegrees, qualityProfile],
  )
  const benchmarkLabelText = useMemo(
    () => t(isBenchmarkRunning ? 'spike.benchmarkOn' : 'spike.benchmarkOff'),
    [t, isBenchmarkRunning],
  )
  const qualityLabelText = useMemo(() => t('spike.quality', { profile: qualityProfile }), [t, qualityProfile])

  // ------------------- Handlers -------------------------- //
  const handleOpenPress = () => {
    setLidAngleDegrees(LID_FULLY_OPEN_ANGLE_DEGREES)
  }

  const handleClosePress = () => {
    setLidAngleDegrees(0)
  }

  const handleToggleBenchmarkPress = () => {
    setIsBenchmarkRunning(previous => !previous)
  }

  const handleCycleQualityPress = () => {
    setQualityProfile(previous => {
      const nextIndex = (RENDER_QUALITY_PROFILE_ORDER.indexOf(previous) + 1) % RENDER_QUALITY_PROFILE_ORDER.length

      return RENDER_QUALITY_PROFILE_ORDER[nextIndex]
    })
  }

  const handleToggleModelCountPress = () => {
    setModelCount(previous => MODEL_COUNT_STEPS[(MODEL_COUNT_STEPS.indexOf(previous) + 1) % MODEL_COUNT_STEPS.length])
  }

  const handleIncreasePress = () => {
    setLidAngleDegrees(previous => Math.min(previous + 5, LID_FULLY_OPEN_ANGLE_DEGREES))
  }

  const handleDecreasePress = () => {
    setLidAngleDegrees(previous => Math.max(previous - 5, 0))
  }

  // ------------------- Side effects ----------------------- //
  useEffect(() => {
    if (!isBenchmarkRunning) {
      return
    }

    // Continuous scenario for measurements: swing the lid 0° <-> fully open as a smooth wave, so the
    // renderer never goes idle and the hinge path is exercised the whole time.
    const startedAt = Date.now()
    const animationTimer = setInterval(() => {
      const wave = (1 - Math.cos(((Date.now() - startedAt) / BENCHMARK_PERIOD_MILLISECONDS) * 2 * Math.PI)) / 2

      setLidAngleDegrees(wave * LID_FULLY_OPEN_ANGLE_DEGREES)
    }, BENCHMARK_TICK_MILLISECONDS)

    return () => {
      clearInterval(animationTimer)
    }
  }, [isBenchmarkRunning])

  useEffect(() => {
    if (!IS_BENCHMARK_SUITE) {
      return
    }

    // Walk through the benchmark scenarios on a clock; reports are tagged with the active scenario.
    const startedAt = Date.now()

    const applyScenario = () => {
      const scenario = getBenchmarkScenarioAt((Date.now() - startedAt) / 1000)

      if (!scenario) {
        setScenarioLabel('suite-finished')

        console.info(`[perf-suite] finished ${BENCHMARK_SCENARIOS.length} scenarios`)

        return
      }

      setModelCount(scenario.boxCount)

      setQualityProfile(scenario.qualityProfile)

      setScenarioLabel(scenario.label)
    }

    applyScenario()

    const scenarioTimer = setInterval(applyScenario, 1000)

    return () => {
      clearInterval(scenarioTimer)
    }
  }, [])

  return {
    isBenchmarkRunning,
    benchmarkLabelText,
    handleToggleBenchmarkPress,
    renderQualityProps: RENDER_QUALITY_PROFILES[qualityProfile],
    qualityLabelText,
    handleCycleQualityPress,
    renderCallback,
    renderFrameStats,
    isRenderPaused,
    renderActivityKey,
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
