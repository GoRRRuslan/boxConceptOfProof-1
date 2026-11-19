# Mystery Watch PoC — development plan (stage-by-stage review)

Each stage ends with a **review gate**: stop, show the result, wait for approval.
Budget from the estimate: 17–24 h total.

## Stack decisions
- Expo **SDK 58** (RN 0.88, React 19.3, new architecture), TypeScript strict, development build (`expo-dev-client`) — Expo Go cannot run Filament.
- Node 26 (works with this toolchain), yarn classic 1.22.22.
- Architecture copied from the reference project `fitpilotai-frontend`: flow-based folders, logic-less UI, `useXxxFacade` + `_facadesLogic` + `_adapters`, Zustand (no persist: session-scoped), React Query for the mock API, i18next, path aliases (`@flows`, `@components`, …), ESLint 9 flat + Prettier, `yarn ciPipeline = lint + ts`.
- Not taken from the reference: Firebase, Sentry, HealthKit, EAS, multi-environment config, MMKV.

## Key risks
| # | Risk | Mitigation |
|---|---|---|
| R1 | `react-native-filament` 1.11 depends on `react-native-worklets-core`; Reanimated 4 depends on `react-native-worklets`. Open Filament issues mention `TurboModuleRegistry 'Worklets'` errors and Expo 54 + New Arch crashes | Stage 1 spike with go/no-go. Options: pinned versions + `patch-package`; Filament v2 branch (run on `react-native-worklets`); gestures via Gesture Handler shared values; last resort `three` + `expo-gl` |
| R2 | Several live 3D views in a scrolling list | Render live only the visible cards (viewability), freeze/placeholder others, lower preview cost |
| R3 | Lid + wordmark must rotate about pivot `[0, 0.914876, 0.359181]` around +X, nodes have identity transforms | Pure function `T(p)·Rx(θ)·T(−p)` applied to both parts, unit-tested |
| R4 | Scene lifecycle (background/foreground, teardown, source change) | One scene owner per screen, explicit dispose, manual checklist |

## Stages
**Stage 0 — Scaffold & environment (done in this commit)**: Expo SDK 58 project, reference structure and aliases, lint/ts/jest, assets, runs on iOS simulator and Android emulator.
Gate A: structure + both devices running.

**Stage 1 — Filament spike (≈3 h)**: install Filament, resolve R1, load `box.glb`, camera + lighting, hinge slider 0…115°, FPS with 1 vs 3–4 views on both platforms. Gate B: go/no-go.

**Stage 2 — Domain, mock API, state (≈2 h)**: types/enums, mock API (`getBoxes`, `purchaseBox` with latency, failure switch, idempotency key), Wallet/Collection/Purchase stores, purchase mutation (one deduction + one watch, only on success; repeated taps ignored; failure changes nothing). Unit tests: success, insufficient balance, failure, repeated taps. Gate C.

**Stage 3 — Live 3D catalogue (≈3–4 h)**: FlashList, `BoxCard` with Filament preview, per-box material colors, price, prize pool, balance header, visibility-gated rendering. Gate D.

**Stage 4 — Opening experience (≈4–5 h)**: state machine (inspect → purchasing → ready → opening → revealed), drag-to-inspect (Gesture Handler → Reanimated → Filament), lid animation + camera + light, watch PNG reveal, haptics, error handling. Gate E.

**Stage 5 — Collection & navigation (≈1–2 h)**: bottom tabs, collection list of won watches, empty state, visual consistency. Gate F.

**Stage 6 — Tests, polish, handoff (≈5–7 h)**: facade/pure-function tests, manual iOS + Android checklist, fixes, README with build/run/test instructions. Gate G.

Definition of done: full flow on both platforms; each successful purchase = one balance deduction + one watch; a failed purchase leaves balance and collection unchanged.
