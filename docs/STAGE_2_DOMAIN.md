# Stage 2 — Domain, mock API and purchase state

## What exists now
| Layer | Location | Content |
|---|---|---|
| Domain types | `src/networking/api/MysteryBoxApi/_types` | Watches, boxes (price in **integer cents**, colour, weighted drop table), purchase request/response, error codes, failure modes |
| Mock data | `.../MysteryBoxApi/_mockData` | 4 watches, 4 boxes (Starter $50, Classic $150, Elite $400, Legend $1,200 — Legend is above the $1,000 start balance on purpose) |
| Mock API | `.../MysteryBoxApi/MysteryBoxApiImplementation.ts` | Async (`latencyInMilliseconds`, default 700 ms), `getBoxes`, `purchaseBox`; failure switch `EMockFailureMode` (`none`, `networkError`, `serverError`, `responseLost`); **idempotent per key**; weighted prize roll is deterministic per key |
| Stores | `src/models/mainStorage/{WalletStore,CollectionStore,PurchaseStore}` | Session-scoped Zustand slices (immer), no persistence, reset helper |
| Requests | `src/networking/requests` | `useGetBoxesQuery`, `usePostPurchaseBoxMutation`, pure `runBoxPurchase` |

## The purchase guarantee
Balance and collection change in exactly one place: `PurchaseStore.completePurchase`, in **one state update**, and only when the API succeeded and the response belongs to the running purchase and its key was not applied before.

| Case | Result |
|---|---|
| Success | one deduction + one watch |
| Insufficient balance | rejected before the API; nothing changes |
| Network / server error | nothing changes, next purchase is unlocked |
| Repeated taps while a purchase runs | extra taps are ignored (synchronous lock), API called once |
| Response lost (server processed, client got an error) | retry re-uses the idempotency key → same watch, still **one** deduction |

All of it is covered by unit tests (`yarn test`): store rules, API mock, `runBoxPurchase` end to end against the mock API, and the mutation hook with React Query.

## Dev switches (for the manual checks and the demo)
`mockApiSettings.purchaseFailureMode` and `mockApiSettings.latencyInMilliseconds` in `src/networking/api/MysteryBoxApi/_config/mockApiSettings.ts`. A visible control for them comes with the catalogue UI (Stage 3).

## Jest note
`immer` ships ESM only for the default entry; `package.json` maps `^immer$` to its CJS build for Jest.
