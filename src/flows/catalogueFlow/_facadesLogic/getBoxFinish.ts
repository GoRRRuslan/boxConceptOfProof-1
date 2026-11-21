import type { IBoxFinish } from '@flows/catalogueFlow/_types'

// The dearer the box, the more it shines: every box is metal under a lacquer; the dearer the box, the smoother and the more mirror-like it is.
export const getBoxFinish = (priceInCents: number): IBoxFinish => {
  if (priceInCents < 10_000) {
    return { roughness: 0.42, metallic: 0.55, clearCoat: 0.35 }
  }

  if (priceInCents < 30_000) {
    return { roughness: 0.32, metallic: 0.7, clearCoat: 0.6 }
  }

  if (priceInCents < 70_000) {
    return { roughness: 0.24, metallic: 0.85, clearCoat: 0.85 }
  }

  return { roughness: 0.14, metallic: 1, clearCoat: 1 }
}
