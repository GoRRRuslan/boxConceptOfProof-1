# Stage 1 — Filament spike findings

Branch: `feat/stage-1-filament-spike` (on top of `sdk-58`). Date: 2026-11-19.

## Stack that works
Expo SDK 58 · RN 0.88.1 · React 19.3 · Reanimated 4.7 + `react-native-worklets` 0.13 · **react-native-filament 2.0.0-rc.6** (unreleased branch, PR margelo/react-native-filament#349 "run on react-native-worklets").

## Why not Filament 1.11 (latest on npm)
| Problem | Platform |
|---|---|
| `react-native-worklets-core` 1.6.3 uses `RCTCxxBridge` (removed in RN 0.88) → does not compile | iOS |
| Filament 1.11 calls `InteractionManager` (removed in RN 0.88) → runtime invariant | iOS + Android |
| `react-native-worklets-core` has no release since Feb 2026, no upstream fix | — |

Filament v2 (PR 349) drops `worklets-core` and runs on the `react-native-worklets` that Reanimated 4 already ships. Both problems disappear without local patches. The native Filament binaries are taken from the published 1.11 npm package (same procedure as the branch's own `setup-filament-quick.sh`); type declarations were generated with `tsc` from the branch sources.

## Verified
| Check | iOS (iPhone 17, iOS 27) | Android (Medium_Phone_API_37) |
|---|---|---|
| Build | ok | ok |
| `box.glb` loads, materials/clearcoat/wordmark texture render | ok | ok |
| Lid + wordmark rotate together around pivot `[0, 0.914876, 0.359181]`, 0° → 115° | ok | ok |
| 4 simultaneous live `FilamentScene`s (4 engines) | ok, all 4 render | **only the first renders**, reproducible on a 6-core/6 GB AVD with host GPU, no errors in logcat |
| **4 models inside ONE `FilamentScene`** (1 engine, 1 surface) | **ok** | **ok**, all 4 render and all 4 lids open |
| Lid open at 115° on all 4 models | ok | ok |
| Background → foreground (no reload) | ok, same process, scene intact | ok, scene intact, no crash |

## Android multi-view: root cause and decision
`createEngine` is documented as "call once": every `<FilamentScene>` creates its own Filament engine + `TextureView` surface. On Android only the first engine/surface ends up drawing. This is **not** an emulator-resource problem (reproduced on a 6-core / 6 GB / host-GPU AVD after the stock 1-core / 2 GB AVD) and not a JS error.

**Architecture decision (replaces the "one live view per card" idea):** the catalogue uses **one shared `FilamentScene` + one `FilamentView`** (single canvas) and renders every visible box as a model in that scene. Card positions are synced from the list scroll offset (shared value) to model transforms; list cells stay React Native views on top (transparent). Benefits: one engine, one surface, identical behaviour on iOS and Android, cost does not grow with the number of boxes (emulator frame time: 61 ms median for 1 model and for 4 models).
Materials per box colour: `EntitySelector` `materialParameters`.

## Emulator note
The stock `Medium_Phone_API_37.0` AVD has 1 CPU core / 2 GB RAM, which makes Filament scenes crawl. Use an AVD with ≥ 4 cores, ≥ 4 GB and `hw.gpu.mode=host` (created here as `MW_Pixel9_API_37`).

## Open points
1. ~~Local `file:` dependency~~ — **resolved**: vendored in `vendor/react-native-filament` (3.9 MB) + `scripts/installFilamentBinaries.sh`; verified with a clean `node_modules` install and clean prebuild/build on both platforms.
2. Camera framing: the open lid leaves the frame at the top; tune for the opening screen in Stage 4.
3. Real-device performance (emulator frame stats are not representative) — see `docs/PERFORMANCE.md`.
4. Hinge/lid transform is applied per `EntitySelector` with `multiplyWithCurrentTransform={false}`; keep this when moving to Reanimated shared values in Stage 4.
