import {
  BENCHMARK_SCENARIOS,
  BENCHMARK_SCENARIO_SECONDS,
  getBenchmarkScenarioAt,
} from '@flows/spikeFlow/_facadesLogic/benchmarkSuite'

describe('benchmarkSuite', () => {
  it('covers 1, 4, 16 and 64 boxes at full quality plus the cheaper profiles at 64', () => {
    expect(BENCHMARK_SCENARIOS.map(scenario => scenario.label)).toEqual([
      '1 boxes | full',
      '4 boxes | full',
      '16 boxes | full',
      '64 boxes | full',
      '64 boxes | balanced',
      '64 boxes | performance',
    ])
  })

  it('picks the scenario by elapsed time and ends after the last one', () => {
    expect(getBenchmarkScenarioAt(0)?.boxCount).toBe(1)

    expect(getBenchmarkScenarioAt(BENCHMARK_SCENARIO_SECONDS - 1)?.boxCount).toBe(1)

    expect(getBenchmarkScenarioAt(BENCHMARK_SCENARIO_SECONDS)?.boxCount).toBe(4)

    expect(getBenchmarkScenarioAt(BENCHMARK_SCENARIO_SECONDS * 3)?.boxCount).toBe(64)

    expect(getBenchmarkScenarioAt(BENCHMARK_SCENARIO_SECONDS * BENCHMARK_SCENARIOS.length)).toBeNull()
  })
})
