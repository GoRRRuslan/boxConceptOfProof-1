import type { IBoxFinish } from '@flows/catalogueFlow/_types'

// The dearer the box, the more it shines: every box is metal under a lacquer; the dearer the box, the smoother and the more mirror-like it is.
export const getBoxFinish = (priceInCents: number): IBoxFinish => {
  if (priceInCents < 10_000) {
    return { roughness: 0.45, metallic: 0.35, clearCoat: 0.6 }
  }

  if (priceInCents < 30_000) {
    return { roughness: 0.4, metallic: 0.4, clearCoat: 0.75 }
  }

  if (priceInCents < 70_000) {
    return { roughness: 0.35, metallic: 0.45, clearCoat: 0.9 }
  }

  return { roughness: 0.3, metallic: 0.5, clearCoat: 1 }
}
