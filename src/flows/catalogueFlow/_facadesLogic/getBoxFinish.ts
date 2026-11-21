import type { IBoxFinish } from '@flows/catalogueFlow/_types'

// The dearer the box, the more it shines: every box is metal under a lacquer; the dearer the box, the smoother and the more mirror-like it is.
export const getBoxFinish = (priceInCents: number): IBoxFinish => {
  if (priceInCents < 10_000) {
    return { roughness: 0.6, metallic: 0.15, clearCoat: 0.85 }
  }

  if (priceInCents < 30_000) {
    return { roughness: 0.55, metallic: 0.2, clearCoat: 0.9 }
  }

  if (priceInCents < 70_000) {
    return { roughness: 0.5, metallic: 0.25, clearCoat: 0.95 }
  }

  return { roughness: 0.45, metallic: 0.3, clearCoat: 1 }
}
