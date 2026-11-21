import type { IBoxFinish } from '@flows/catalogueFlow/_types'

// The dearer the box, the more it shines: every box is metal under a lacquer; the dearer the box, the smoother and the more mirror-like it is.
export const getBoxFinish = (priceInCents: number): IBoxFinish => {
  if (priceInCents < 10_000) {
    return { roughness: 0.34, metallic: 0.8, clearCoat: 0.5 }
  }

  if (priceInCents < 30_000) {
    return { roughness: 0.27, metallic: 0.9, clearCoat: 0.7 }
  }

  if (priceInCents < 70_000) {
    return { roughness: 0.2, metallic: 1, clearCoat: 0.85 }
  }

  return { roughness: 0.12, metallic: 1, clearCoat: 1 }
}
