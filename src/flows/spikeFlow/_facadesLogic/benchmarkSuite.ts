import { ERenderQualityProfile } from '@flows/spikeFlow/screens/FilamentSpikeScreen/_config/renderQualityConfig'

export interface IBenchmarkScenario {
  label: string
  boxCount: number
  qualityProfile: ERenderQualityProfile
}

// How long each scenario runs, and how many of its first 1-second windows are warm-up (shader
// compilation, model load) and must be ignored by the analysis.
export const BENCHMARK_SCENARIO_SECONDS = 30
export const BENCHMARK_WARMUP_WINDOWS = 12

// Box counts x quality profiles the suite walks through automatically while the lid keeps swinging.
export const BENCHMARK_SCENARIOS: IBenchmarkScenario[] = [
  { boxCount: 1, qualityProfile: ERenderQualityProfile.Full },
  { boxCount: 4, qualityProfile: ERenderQualityProfile.Full },
  { boxCount: 16, qualityProfile: ERenderQualityProfile.Full },
  { boxCount: 64, qualityProfile: ERenderQualityProfile.Full },
  { boxCount: 64, qualityProfile: ERenderQualityProfile.Balanced },
  { boxCount: 64, qualityProfile: ERenderQualityProfile.Performance },
].map(scenario => ({ ...scenario, label: `${scenario.boxCount} boxes | ${scenario.qualityProfile}` }))

// Which scenario is active `elapsedSeconds` after the suite started; null once it is finished.
export const getBenchmarkScenarioAt = (elapsedSeconds: number): IBenchmarkScenario | null => {
  const scenarioIndex = Math.floor(elapsedSeconds / BENCHMARK_SCENARIO_SECONDS)

  return BENCHMARK_SCENARIOS[scenarioIndex] ?? null
}
