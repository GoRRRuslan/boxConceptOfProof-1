import { EBoxIdentifier, EWatchIdentifier, type IMysteryBox } from '@networking/api/MysteryBoxApi/_types'

export const BOX_CATALOGUE: IMysteryBox[] = [
  {
    identifier: EBoxIdentifier.Starter,
    name: 'Starter Box',
    priceInCents: 5_000,
    colorHex: '#5B8DEF',
    dropTable: [
      { watchIdentifier: EWatchIdentifier.Casio, weight: 70 },
      { watchIdentifier: EWatchIdentifier.Perpetual, weight: 25 },
      { watchIdentifier: EWatchIdentifier.Gmt, weight: 5 },
    ],
  },
  {
    identifier: EBoxIdentifier.Classic,
    name: 'Classic Box',
    priceInCents: 15_000,
    colorHex: '#2AA876',
    dropTable: [
      { watchIdentifier: EWatchIdentifier.Casio, weight: 40 },
      { watchIdentifier: EWatchIdentifier.Perpetual, weight: 40 },
      { watchIdentifier: EWatchIdentifier.Gmt, weight: 18 },
      { watchIdentifier: EWatchIdentifier.SkyDweller, weight: 2 },
    ],
  },
  {
    identifier: EBoxIdentifier.Elite,
    name: 'Elite Box',
    priceInCents: 40_000,
    colorHex: '#9B59D0',
    dropTable: [
      { watchIdentifier: EWatchIdentifier.Perpetual, weight: 50 },
      { watchIdentifier: EWatchIdentifier.Gmt, weight: 40 },
      { watchIdentifier: EWatchIdentifier.SkyDweller, weight: 10 },
    ],
  },
  {
    // More expensive than the starting balance on purpose: exercises the "cannot afford" state.
    identifier: EBoxIdentifier.Legend,
    name: 'Legend Box',
    priceInCents: 120_000,
    colorHex: '#E0A526',
    dropTable: [
      { watchIdentifier: EWatchIdentifier.Gmt, weight: 55 },
      { watchIdentifier: EWatchIdentifier.SkyDweller, weight: 45 },
    ],
  },
]
