# Mystery Watch PoC — development plan (stage-by-stage review)

> **Status: all stages (0–7) are done.** See the README for the result, [TEST_CHECKLIST.md](TEST_CHECKLIST.md) for what was verified, and [TESTING.md](TESTING.md) for how to test. Stage 7 (animation and visual polish) was added after the original plan. The plan below is kept as it was written; the table of risks notes how each was resolved.

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
| R2 | Several live 3D views in a scrolling list | **Resolved in Stage 1:** several `FilamentScene`s do not work on Android (only the first draws). Use ONE shared scene/canvas; box models positioned from the list scroll offset |
| R3 | Lid + wordmark must rotate about pivot `[0, 0.914876, 0.359181]` around +X, nodes have identity transforms | Pure function `T(p)·Rx(θ)·T(−p)` applied to both parts, unit-tested |
| R4 | Scene lifecycle (background/foreground, teardown, source change) | One scene owner per screen, explicit dispose, manual checklist. **Resolved in Stage 6:** one long-lived scene for the whole app; background → foreground keeps the scene and the frame rate (no duplicated frame loops) on both platforms |

## Stages
**Stage 0 — Scaffold & environment (done in this commit)**: Expo SDK 58 project, reference structure and aliases, lint/ts/jest, assets, runs on iOS simulator and Android emulator.
Gate A: structure + both devices running.

**Stage 1 — Filament spike (≈3 h)**: install Filament, resolve R1, load `box.glb`, camera + lighting, hinge slider 0…115°, FPS with 1 vs 3–4 views on both platforms. Gate B: go/no-go.

**Stage 2 — Domain, mock API, state (≈2 h)**: types/enums, mock API (`getBoxes`, `purchaseBox` with latency, failure switch, idempotency key), Wallet/Collection/Purchase stores, purchase mutation (one deduction + one watch, only on success; repeated taps ignored; failure changes nothing). Unit tests: success, insufficient balance, failure, repeated taps. Gate C.

**Stage 3 — Live 3D catalogue (≈3–4 h)**: FlashList with transparent cells over ONE shared Filament canvas (box models synced to scroll offset), per-box material colors, price, prize pool, balance header, visibility-gated rendering. Gate D.

**Stage 4 — Opening experience (≈4–5 h)**: state machine (inspect → purchasing → ready → opening → revealed), drag-to-inspect (Gesture Handler → Reanimated → Filament), lid animation + camera + light, watch PNG reveal, haptics, error handling. Gate E.

**Stage 5 — Collection & navigation (≈1–2 h)**: bottom tabs, collection list of won watches, empty state, visual consistency. Gate F.

**Stage 6 — Tests, polish, handoff (≈5–7 h)**: facade/pure-function tests, manual iOS + Android checklist, fixes, README with build/run/test instructions. Gate G.

Definition of done: full flow on both platforms; each successful purchase = one balance deduction + one watch; a failed purchase leaves balance and collection unchanged.

**Stage 7 — Animation and visual polish (added after the plan)**: render-on-demand watchdog and foreground resync (a frozen renderer after the iOS display link was left paused); anticipation, light from inside the box, flying watch, rarity-based reveal (pill, hero price, glowing circles, flash, particles), swipe up / pinch / double tap / auto-turn / device tilt, camera push-in, staggered entrance, press squeeze, finishes by price, tab fade, animated numbers, collection detail sheet, sounds and haptics; three-light rig, shadows, ambient occlusion and bloom; the opened box is put away after the reveal and Done appears after that; code review fixes. Write-up: [ANIMATIONS.md](ANIMATIONS.md). Verified on both platforms: [TEST_CHECKLIST.md](TEST_CHECKLIST.md).
