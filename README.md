# `Mystery Watch` - React Native Proof of Concept

[![Expo](https://img.shields.io/badge/Expo-SDK%2058-000020?logo=expo&logoColor=white)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React%20Native-0.88-61dafb?logo=react&logoColor=black)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Filament](https://img.shields.io/badge/3D-Google%20Filament-ea4335)](https://google.github.io/filament/)
[![Reanimated](https://img.shields.io/badge/Reanimated-4.7-8e44ad)](https://docs.swmansion.com/react-native-reanimated/)
[![Zustand](https://img.shields.io/badge/Zustand-5-ffdd57?logoColor=black)](https://zustand-demo.pmnd.rs/)
[![React Query](https://img.shields.io/badge/React%20Query-5-ff4154?logo=react-query&logoColor=white)](https://tanstack.com/query/latest)

## Table of Contents

1. [Introduction](#1-introduction)
2. [Quick Start](#2-quick-start)
3. [Project Architecture](#3-project-architecture)
4. [Real-time 3D](#4-real-time-3d)
5. [Vendored Filament](#5-vendored-filament)
6. [Quality Gates](#6-quality-gates)
7. [Performance](#7-performance)
8. [Project Structure](#8-project-structure)
9. [Roadmap & Status](#9-roadmap--status)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Introduction

**Project Overview:**
Mystery Watch is a proof of concept for discovering, buying and opening mystery boxes that contain watches. A scrollable catalogue shows **real-time rendered 3D boxes**, the opening screen lets the user **inspect and open a live 3D box** with an animated reveal, and a virtual balance pays for it. The assignment is in [docs/ASSIGNMENT.md](docs/ASSIGNMENT.md).

The code base follows the same enterprise-level conventions as the AI Fitness Advisor application: feature-based **flows**, logic-less UI, **facades** for business logic, **adapters** for data mapping, Zustand for client state and React Query for async (mock-API) state.

**Key Features:**

- 🧊 Real-time 3D with **Google Filament** (Metal on iOS, OpenGL ES on Android), driven from Reanimated worklets
- 🔩 Exact **hinge kinematics** for the lid and wordmark from the model documentation (pivot `[0, 0.914876, 0.359181]`, 0° → 115°)
- 🎯 **One shared 3D scene** for the whole catalogue — identical behaviour and flat cost on iOS and Android
- 🏗️ Feature-based (flows) architecture, facades, adapters, typed navigation hooks
- 🔄 Zustand (session-scoped, no persistence) + React Query over an asynchronous mock API
- 📱 Verified on **iOS 27 (Xcode 27) and Android 37**; background/foreground safe
- 🧪 Jest + React Native Testing Library, ESLint 9 + Prettier, `ciPipeline`
- 📦 **Vendored** 3D dependency with a reproducible binary installer — builds on a clean machine
- 📊 Measured performance analysis with a prioritised improvement plan

**Tech Stack:**

| Area | Choice |
|---|---|
| Framework | Expo SDK 58, React Native 0.88.1 (new architecture), React 19.3 |
| Language | TypeScript 6.0 (strict) |
| 3D | `react-native-filament` 2.0.0-rc.6 (vendored) |
| Animation | Reanimated 4.7 + `react-native-worklets` 0.13, Gesture Handler 3 |
| State | Zustand 5 (client), TanStack Query 5 (mock API) |
| Navigation | React Navigation 7 |
| Lists | FlashList 2 |
| i18n | i18next 27 |
| Tests | Jest 30 + React Native Testing Library 14 |
| Quality | ESLint 9 (flat) + Prettier 3, `expo-doctor` |

---

## 2. Quick Start

### Prerequisites

- macOS with **Xcode 27** and an iOS Simulator (Xcode 27 requires Expo SDK 58+)
- **Android Studio**, JDK 17, an AVD with **≥ 4 cores, ≥ 4 GB RAM, `hw.gpu.mode=host`** (see [Troubleshooting](#10-troubleshooting))
- Node 24+ (developed on Node 26), yarn classic 1.22 (`corepack enable`), CocoaPods, watchman
- `export LANG=en_US.UTF-8` (CocoaPods needs a UTF-8 locale)

### Installation

```bash
# Clone the repository
git clone https://github.com/GoRRRuslan/boxConceptOfProof-1
cd boxConceptOfProof-1

# Install node dependencies. The postinstall hook downloads the Filament native
# binaries once (~90 MB archive, cached in .cache/filament) into node_modules.
yarn install

# Generate native projects
yarn iosPrebuild
yarn androidPrebuild

# Build and install the development client, then start Metro
yarn iosRun
yarn androidRun
yarn start
```

### Scripts

| Script | What it does |
|---|---|
| `yarn start` | Metro for the development client |
| `yarn iosPrebuild` / `yarn androidPrebuild` | Clean native project generation (`expo prebuild --clean`) |
| `yarn iosRun` / `yarn androidRun` | Build and install the development client |
| `yarn ciPipeline` | **ESLint + TypeScript** (the gate for every change) |
| `yarn test` | Jest + RNTL |
| `yarn doctor` | `expo-doctor` health check |
| `yarn adbR` | `adb reverse tcp:8081 tcp:8081` |
| `yarn cleanNative` / `cleanCache` / `cleanNode` / `watchman` | Reset helpers |

> Expo Go cannot run Filament — the app is a **development build** (`expo-dev-client`).

---

## 3. Project Architecture

### Core Principles

1. **Feature-Based (flows) Architecture:** code is organised by business feature, not by technical layer
2. **Logic-less UI:** screens contain render methods and one `useFacade` call — nothing else
3. **Separation of Concerns:** UI → facade → adapters/stores/queries → services
4. **Typed everywhere:** strict TypeScript, facade return types live in `_types/`
5. **Testability:** business logic is in hooks and pure functions that are unit-tested without rendering

### Architecture Layers

```
┌─────────────────────────────────────┐
│           Presentation Layer        │
│        (Screens & Components)       │
├─────────────────────────────────────┤
│          Business Logic Layer       │
│       (Facades & Facades logic)     │
├─────────────────────────────────────┤
│         Navigation Logic Layer      │
│           (navigation hooks)        │
├─────────────────────────────────────┤
│              Data Layer             │
│   (Mock API · Zustand · Adapters)   │
├─────────────────────────────────────┤
│           Rendering Layer           │
│   (Filament scene · worklet runtime)│
├─────────────────────────────────────┤
│          Platform (Expo / RN)       │
└─────────────────────────────────────┘
```

### The Facade Pattern (example from the code base)

```ts
// src/flows/spikeFlow/_facades/useFilamentSpikeFacade.ts
export const useFilamentSpikeFacade = (): IFilamentSpikeFacade => {
  const { t } = useTranslation()

  // --------------------------- State ------------------------- //
  const [lidAngleDegrees, setLidAngleDegrees] = useState<number>(0)

  // -------------------------- Values ------------------------- //
  const lidHingeTransform = useMemo(() => computeLidHingeTransform(lidAngleDegrees), [lidAngleDegrees])

  // ------------------- Handlers -------------------------- //
  const handleOpenPress = () => {
    setLidAngleDegrees(LID_FULLY_OPEN_ANGLE_DEGREES)
  }

  return { lidHingeTransform, handleOpenPress /* ... */ }
}
```

```tsx
// Screen: render methods + one facade call, nothing else
const FilamentSpikeScreen = () => {
  const { lidHingeTransform, modelCount, handleOpenPress } = useFilamentSpikeFacade()

  const renderScene = () => (/* <FilamentScene> … */)

  return <ScreenContainer testID="filamentSpikeScreen">{renderScene()}</ScreenContainer>
}
```

### Conventions (enforced by ESLint and `CLAUDE.md`)

- No abbreviations in names; English only in code
- No hard-coded visible strings — everything through `t()`
- No logic in UI files; no fallback substitution (guard → warn → return)
- Facade sections in strict order: translations → navigation → state → store → queries/mutations → adapters → values → handlers → effects
- `FlashList` for lists, `testID` on every interactive element, no inline styles or colour literals
- Path aliases: `@app`, `@flows`, `@components`, `@models`, `@networking`, `@services`, `@utils`, `@assets`, `@i18next`, `@configs`, `@navigation`

---

## 4. Real-time 3D

### One scene, many boxes

Each `<FilamentScene>` creates its own Filament engine, and the library is built for **one engine per app**. On Android a second scene never draws. The catalogue is therefore one scene/canvas that renders every box as a model; card positions follow the list scroll offset, and list cells (price, prize pool) are ordinary React Native views on top.

```
┌──────────────── FlashList (transparent cells) ────────────────┐
│  price · prizes · Buy          ← React Native views           │
├───────────────────────────────────────────────────────────────┤
│  ONE FilamentScene / FilamentView (behind the list)           │
│   box #1   box #2   box #3 …   ← models placed from scroll    │
└───────────────────────────────────────────────────────────────┘
```

### Hinge kinematics

The lid (`Shell_Lid`) and the wordmark (`Shell_Wordmark`) have identity node transforms, so their origins are not hinge pivots. The rotation about the documented pivot `p` is expressed in Filament's *scale → rotate → translate* order:

```
rotate    = [θ, 0, 0]
translate = [0, p.y − (p.y·cosθ − p.z·sinθ), p.z − (p.y·sinθ + p.z·cosθ)]
```

Implemented as a pure, unit-tested function ([`computeLidHingeTransform.ts`](src/flows/spikeFlow/_facadesLogic/computeLidHingeTransform.ts)): identity at 0°, pivot invariant at every angle, correct sweep at 115°.

---

## 5. Vendored Filament

The published `react-native-filament@1.11.0` does not work on React Native 0.88: it depends on `react-native-worklets-core`, which does not compile on iOS (`RCTCxxBridge` was removed) and calls the removed `InteractionManager`. The unreleased **v2 line** runs on `react-native-worklets` (already shipped with Reanimated 4) and removes both problems.

- Source is **vendored** in [`vendor/react-native-filament`](vendor/react-native-filament) (3.9 MB, MIT) — provenance, commit and local changes in [`VENDOR.md`](vendor/react-native-filament/VENDOR.md)
- The ~340 MB prebuilt native binaries are **not committed**; [`scripts/installFilamentBinaries.sh`](scripts/installFilamentBinaries.sh) fetches them from the official npm tarball on `yarn install` (idempotent, cached)
- No source patches; when a stable v2 is published, replace the vendor folder with the npm package

---

## 6. Quality Gates

```bash
yarn ciPipeline   # eslint . && tsc --noEmit        → must be clean
yarn test         # jest                              → 11 tests, 4 suites
yarn doctor       # expo-doctor                       → 20/20 checks
```

| Check | Status |
|---|---|
| ESLint (strict-type-checked, stylistic, react-native, react-hooks) | ✅ clean |
| TypeScript 6 strict | ✅ clean |
| Jest (hinge math, facade, FPS summary, app shell) | ✅ 11 / 11 |
| `expo-doctor` | ✅ 20 / 20 |
| Clean install from an empty `node_modules` (vendor + binary script) | ✅ |
| Clean `prebuild` + build on iOS 27 and Android 37 | ✅ |
| Background → foreground (no crash, scene intact) | ✅ iOS, ✅ Android |

---

## 7. Performance

Plain-English report with charts, screenshots, methodology and limits: [docs/PERFORMANCE.md](docs/PERFORMANCE.md). Frame rate is measured by an **in-app renderer FPS meter** (counts Filament's per-frame callbacks; overlay + `[perf:<platform>]` log) and cross-checked with **Instruments** (iOS) and **Perfetto** (Android).

| Scenario (iOS Simulator, Metal) | Triangles | FPS | Slow frames | RSS |
|---|---|---|---|---|
| 1 box | 31 k | **60.0** | 0 | 582 MB |
| 4 boxes, lids open | 125 k | **60.0** | 0 | 590 MB |
| 16 boxes (stress) | 500 k | **60.0** | 0 | 640 MB |
| 64 boxes (stress) | 2.0 M | **60.0** | 0 | 824 MB |

- 3D path ≈ **9 % of one CPU core** on iOS, entirely off the main/JS threads (JS thread ≈ 1 %)
- Implemented: render on demand, GLB instancing, Draco GLB (1.32 MB → 157 KB), WebP watches (-92 %), arm64-only builds, quality profiles
- **Android Emulator (headless): 60.0 fps in all six scenarios**, 0 slow frames, confirmed by SurfaceFlinger (900 frames / 15 s). The windowed emulator capped at ~24 fps because of its own window compositing, not the app. Measure one platform at a time (shared host GPU)

| Command | Purpose |
|---|---|
| `yarn androidEmulatorStart` / `yarn androidEmulatorStop` | Boot / stop the Android emulator **headless** (needed for correct FPS) |
| `yarn androidRunCatalogueScroll` / `yarn iosRunCatalogueScroll` | Build a release app whose catalogue scrolls by itself |
| `yarn perfAndroidCatalogue` / `yarn perfIosCatalogue` | Measure FPS while the catalogue scrolls (60 s) |
| `yarn perfCharts` | Redraw the SVG charts in `docs/media` from `docs/data` |
| `yarn perfAndroidPresentFps` | Independent FPS from SurfaceFlinger presented frames |
| `yarn iosRestart` / `yarn androidRestart` / `yarn androidRestartRelease` | Relaunch the installed app without rebuilding |
| `yarn iosRunSuite` / `yarn androidRunSuite` | Build + install a release app that runs the 6-scenario benchmark |
| `yarn perfIosSuite` / `yarn perfAndroidSuite` | Restart, collect ~200 s, print the FPS table |
| `yarn perfIosFps` / `yarn perfAndroidFps` | Quick FPS sample of the running app |
| `yarn perfIosProfile [UDID]` | Instruments Time Profiler → CPU per thread |
| `yarn perfAndroidTrace` | Perfetto 10 s trace → CPU per thread, buffer-queue stalls |
| `yarn assetsOptimize` | Re-encode GLB (Draco) and watch images (WebP) from `assets-source/` |

Env vars: `EXPO_PUBLIC_AUTO_BENCHMARK`, `EXPO_PUBLIC_AUTO_BOXES`, `EXPO_PUBLIC_PERF_SINK_URL`, `ANDROID_ARCHITECTURES`. Tip: if `androidRunSuite` seems stale, delete `android/app/build/generated/assets/react` and `intermediates/assets/release`.

---

## 8. Project Structure

```
boxConceptOfProof-1/
├── CLAUDE.md                         # project rules (adapted from the reference app)
├── app.config.ts                     # Expo config (dynamic)
├── babel.config.js · metro.config.js # aliases, worklets plugin, .glb assets
├── eslint.config.mjs · .prettierrc.json
├── docs/                             # ASSIGNMENT, DEVELOPMENT_PLAN, PERFORMANCE, STAGE_1_FINDINGS, STAGE_2_DOMAIN, STAGE_3_CATALOGUE, MODEL, reference.png
├── scripts/
│   ├── installFilamentBinaries.sh
│   └── perf/                         # FPS analysis, Perfetto + Instruments capture
├── vendor/react-native-filament/     # vendored 3D engine binding (+ VENDOR.md)
├── __tests__/                        # app-level tests
└── src/
    ├── app/                          # App.tsx, useAppFacade.ts, App.styles.ts
    ├── assets/                       # models/box.glb · images/watches/*.png · images/app/*
    ├── components/                   # _layout/ScreenContainer · AppText · PerformanceOverlay · buttons/AppButton
    ├── models/mainStorage/           # WalletStore · CollectionStore · PurchaseStore · _storeConfigured (session-scoped Zustand)
    ├── networking/                   # api/MysteryBoxApi (mock) · requests/{queries,mutations} · errorHandling
    ├── flows/
    │   ├── catalogueFlow/            # Stage 3: 3D catalogue (facade, adapter, pose maths, screen)
    │   └── spikeFlow/                # current flow (becomes catalogue/opening/collection)
    │       ├── _facades/             # useFilamentSpikeFacade (+ __tests__)
    │       ├── _facadesLogic/        # computeLidHingeTransform (+ __tests__)
    │       ├── _types/               # facade interfaces
    │       └── screens/FilamentSpikeScreen/
    │           ├── _components/SpikeScene/
    │           └── _config/spikeSceneConfig.ts
    ├── i18next/                      # i18init.ts · translations/en.json
    ├── services/
    │   ├── performance/              # renderer FPS meter (+ tests)
    │   └── reactQuery/               # queryClient
    └── utils/designSystem/           # Theme
```

---

## 9. Roadmap & Status

| Stage | Scope | Status |
|---|---|---|
| 0 | Scaffold on Expo SDK 58, reference structure, lint/ts/jest, both platforms running | ✅ done |
| 1 | Filament spike: GLB, lighting, hinge, multi-box strategy, vendoring, performance analysis | ✅ done |
| 2 | Domain + asynchronous mock API + Zustand stores + purchase mutation (one deduction, one watch, no duplicates) with unit tests — see [docs/STAGE_2_DOMAIN.md](docs/STAGE_2_DOMAIN.md) | ✅ done |
| 3 | Live 3D catalogue: FlashList over one shared Filament canvas, per-box colours, balance header, 60 FPS while scrolling — see [docs/STAGE_3_CATALOGUE.md](docs/STAGE_3_CATALOGUE.md) | ✅ done |
| 4 | Opening experience: drag-to-inspect, animated lid, camera + light, watch reveal, haptics | planned |
| 5 | Collection tab, navigation, visual consistency | planned |
| 6 | Test matrix, device profiling gate, polish, handoff | planned |

Definition of done (from the estimate): the full flow works on both platforms; every successful purchase produces exactly one balance deduction and one watch; a failed purchase leaves balance and collection unchanged. Details: [docs/DEVELOPMENT_PLAN.md](docs/DEVELOPMENT_PLAN.md).

---

## 10. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `pod install` fails with *Unicode Normalization not appropriate for ASCII-8BIT* | `export LANG=en_US.UTF-8` |
| iOS app crashes at launch on iOS 27 | Xcode 27 requires the UIScene lifecycle; use **Expo SDK 58+** (this project) |
| `expo run:ios` ends with an osascript error about the *Simulator* window | Xcode 27 ships **DeviceHub.app** instead of Simulator.app. The app is already installed: run `yarn start` and open it (`xcrun simctl launch booted com.gorrr.mysterywatch`) |
| Only the first 3D view renders on Android | Use one `FilamentScene` per app (see [Real-time 3D](#4-real-time-3d)) |
| Android emulator crawls / UI shows *Updating…* | Use an AVD with ≥ 4 cores / ≥ 4 GB / host GPU; let the post-boot update finish |
| Filament native libraries missing after install | `bash scripts/installFilamentBinaries.sh` (needs network once) |
| Metro cache issues | `yarn cleanCache` |
