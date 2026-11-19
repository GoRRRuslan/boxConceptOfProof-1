import { EMockFailureMode } from '@networking/api/MysteryBoxApi/_types'

// Knobs of the simulated backend. Changed at runtime by the dev controls and by tests.
export const mockApiSettings = {
  latencyInMilliseconds: 700,
  purchaseFailureMode: EMockFailureMode.None as EMockFailureMode,
}

export const resetMockApiSettings = () => {
  mockApiSettings.latencyInMilliseconds = 700

  mockApiSettings.purchaseFailureMode = EMockFailureMode.None
}
