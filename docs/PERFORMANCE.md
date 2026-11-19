# Performance analysis — Stage 1 (Filament spike)

Measured on **iOS Simulator (iPhone 17, iOS 27.2)** and **Android Emulator (Pixel 9 profile, API 37, 6 cores / 6 GB, host GPU)**, development builds, Expo SDK 58 / RN 0.88.1, Filament 2.0.0-rc.6.
Simulators and emulators share the host GPU and are **not representative of device frame rates**; the numbers below are meant for *relative* comparison (1 box vs 4 boxes) and for sizing, not as FPS claims.

## 1. Asset budget

| Asset | Size | Content | Comment |
|---|---|---|---|
| `box.glb` | 1.32 MB source → **157 KB** shipped (Draco) | 5 meshes, **23,189 vertices, 31,242 triangles**, 6 PBR materials (`KHR_materials_clearcoat`), 2 wordmark PNG textures (23 KB + 12 KB), no animations/skins | Per box. 4 visible boxes ≈ 125k triangles — trivial for a mobile GPU |
| Watch PNGs (4×) | 0.99 – 1.89 MB each, **5.48 MB total**, 1019 × 1544 RGBA | Reveal + collection | Decoded bitmap ≈ **6.3 MB each** (1019·1544·4 B) → ~25 MB if all four are resident |
| Vendored Filament source | 3.9 MB | `vendor/react-native-filament` | In git |
| Filament + Bullet3 binaries | 331 MB on disk | `node_modules`, fetched by script | Not in git; only the used ABI/arch ends up in the app |
| Android debug APK | 95.4 MiB (100,084,571 B) | arm64-only, debug | Release APK: **36.4 MB** |
| iOS simulator `.app` | 142 MB | debug | |

## 2. Runtime cost: 1 box vs 4 boxes

| Metric | 1 box | 4 boxes | Δ for +3 boxes |
|---|---|---|---|
| iOS process RSS (simulator) | 582 MB | 587 MB | **+5 MB** (≈ +1.7 MB per box) |
| iOS CPU (simulator, idle scene) | ~14–16 % | ~16–18 % | ≈ 0 |
| Android total PSS | 350 MB | 361 MB | **+11 MB** (≈ +3.7 MB per box) |
| Android native heap | 182 MB | 188 MB | +5.5 MB |
| Android Java heap | 16 MB | 21 MB | +4.7 MB |

Take-aways
- **Per-box cost is small and linear**; the baseline (React Native + Hermes + one Filament engine) dominates memory.
- A scene with several boxes **in one engine** costs almost nothing extra. Several engines do not work on Android at all (see below).
- Lifecycle: backgrounding and resuming keeps the same process and an intact scene on both platforms; no crash (iOS: same PID after resume; Android: resumed without reload).

## 2b. Frame rate (measured with the in-app meter)

The meter counts the callbacks Filament's choreographer fires — **one per rendered frame, on the renderer's own thread** — and reports a 1-second summary (`[perf:<platform>] {...}` in the Metro log and an on-screen overlay). It is the same code path on iOS and Android, so numbers are comparable. Slow frame = longer than 25 ms (a missed vsync on a 60 Hz display).

### iOS Simulator (Apple M5 Pro Metal), 20 s per scenario, 1,200 frames each

| Scenario | Triangles | Average FPS | Min window FPS | p95 frame | Worst frame | Slow frames | RSS | CPU |
|---|---|---|---|---|---|---|---|---|
| 1 box, idle | 31 k | **60.0** | 60.0 | 16.7 ms | 17 ms | 0 | 582 MB | 14 % |
| 4 boxes, idle | 125 k | **60.0** | 60.0 | 16.7 ms | 17 ms | 0 | 587 MB | 17 % |
| 4 boxes, lids open (115°) | 125 k | **60.0** | 60.0 | 16.7 ms | 17 ms | 0 | 590 MB | 16 % |
| 16 boxes (stress), lids open | 500 k | **60.0** | 60.0 | 16.7 ms | 17 ms | 0 | 640 MB | 17.5 % |
| 64 boxes (stress), lids open | 2.0 M | **60.0** | 60.0 | 16.7 ms | 17 ms | 0 | 824 MB | 32 % |

Reading: the Mac GPU has a very large headroom — the knee was **not reached at 64 boxes / 2 M triangles**. The cost that does grow is **memory: ≈ 4.4 MB per additional box**, because every `<Model>` loads and keeps its own copy of the GLB (see improvement #2). The simulator GPU is far faster than a phone GPU, so this proves the pipeline (single scene, hinge, worklet runtime) is not the bottleneck, not that a phone will hit 60 fps at 64 boxes.

### Android Emulator (gfxstream → Apple M5 Pro Metal, ES 3.0 translator)

| Scenario | Average FPS | Min / max window | Worst frame |
|---|---|---|---|
| 1 box, emulator alone | 23.0 – 24.6 | 17 – 31 | 200 ms |
| **Empty scene** (camera + light, no model) | 24.6 | 18 – 31 | 200 ms |

The **empty scene is as slow as the box**, so the ~24 fps ceiling comes from the emulator's GL translation layer, not from our content. The guest is not CPU-starved (Perfetto: 0.55 cores busy of 6). A different emulator backend (`angle_indirect`) falls back to CPU SwiftShader and is worse. **Android frame rates therefore must be measured on a physical device**; the meter and scripts below work unchanged on one.

## 2c. Native profilers

### iOS — Instruments (`xcrun xctrace`), `yarn perfIosProfile`
Time Profiler, 10 s, steady state, 1 box:

| Thread | CPU in 10 s | Share of one core |
|---|---|---|
| `FEngine::loop` (Filament backend) | 486 ms | 4.9 % |
| `filament.render.queue` | 419 ms | 4.2 % |
| Main thread (UI) | 213 ms | 2.1 % |
| React Native JS thread | 85 ms | 0.9 % |
| **Total process** | **1,854 ms** | **18.5 %** |

The 3D path (≈ 9 % of a core) runs entirely **off the main and JS threads**; the JS thread is ~1 %, so the mock API and state will have ample headroom. A Metal System Trace (8 s) showed the simulator's Metal host busy ≈ 9 % on its default queue.
On a real device the same script profiles over `devicectl` (`yarn perfIosProfile <UDID>`); the owner's iPhone 17 Pro and iPad Pro are registered but were not connected during this pass.

### Android — Perfetto, `yarn perfAndroidTrace`
10 s system trace (sched + ftrace + `gfx`/`view` atrace for the app), quiet run, 1 box:

| Thread | CPU | Share of one core |
|---|---|---|
| `FEngine::loop` (Filament GL backend) | 1,842 ms | 18.7 % |
| `RenderThread` (HWUI) | 1,429 ms | 14.5 % |
| main thread | 659 ms | 6.7 % |
| `FilamentRendere…` | 585 ms | 5.9 % |
| `mqt_v_js` (React Native JS) | 289 ms | 2.9 % |
| **Process, top-10 threads** | 5,469 ms | **0.55 cores** |

Buffer queue: 972 `queueBuffer` (avg 0.45 ms) and 486 `dequeueBuffer` (avg 2.0 ms, **max 130 ms**). The dequeue stalls are the emulator waiting for the host GPU — the cause of the ~24 fps.
A first run while the iOS simulator was drawing at the same time showed `FEngine::loop` at 73 % of a core (7,038 ms): the two simulators **compete for the same host GPU**, so measure one platform at a time.

## 3. The important finding: one engine, one canvas

`createEngine` is documented as "call once". On Android a second `<FilamentScene>` (second engine + `TextureView`) never draws, reproducibly, with no error (also on a 6-core / host-GPU AVD, so it is not a resource problem). iOS happens to render several scenes, but it is the same unsupported usage.

**Decision:** the catalogue renders all boxes in **one `FilamentScene` / one `FilamentView`**; card positions are synced from the list scroll offset. This removes the failure mode, keeps cost flat in the number of boxes, and behaves the same on both platforms.

## 4. How to measure (reproducible) and its limits

| Tool | Command | What it gives |
|---|---|---|
| In-app renderer FPS meter | run the app, `yarn start \| tee /tmp/metro.log`, then `python3 scripts/perf/analyzeRenderFps.py <ios\|android> <startLine> [endLine]` | Real renderer FPS, frame-time p95/max, slow frames. Overlay on screen in the spike |
| Instruments Time Profiler | `yarn perfIosProfile [UDID]` | CPU per thread (simulator or device) |
| Perfetto | `yarn perfAndroidTrace` | CPU per thread, buffer-queue stalls, frame slices |
| `ps` / `dumpsys meminfo` | see scripts | RSS (iOS) / PSS (Android) |

Limits and traps
- `dumpsys gfxinfo` only sees UI-thread (HWUI) frames; Filament draws on its own thread, so a static scene reports almost no UI frames. **Do not read FPS from gfxinfo.**
- Simulator/emulator GPUs are not phone GPUs. iOS numbers prove headroom; **Android numbers from the emulator are not usable as FPS**.
- Measure one simulator at a time (shared host GPU). Let the app settle ≥ 15 s after launch (the first window contains startup work).
- The very first choreographer callback reports the time since engine start, not a frame; the meter discards it.

## 5. Recommended improvements (ordered by value / effort)

| # | Improvement | Why | Effort |
|---|---|---|---|
| 1 | **Render on demand**: stop the Filament choreographer when nothing moves (idle list, closed screen); resume on scroll/gesture/animation | Filament currently redraws at display rate even for a static scene → battery/thermals | S |
| 2 | **Load the GLB once, instantiate N times** (`useModel(..., { instanceCount })` + `ModelInstance`) | Measured: **+4.4 MB RSS per extra box** (64 boxes = 824 MB) because every `<Model>` re-parses the 1.3 MB GLB and duplicates vertex buffers | S |
| 3 | **Resize and re-encode watch images**: ≤ 512 px wide WebP/AVIF thumbnails for lists, full size only for the reveal; load through `expo-image` with disk cache | −90–95 % bytes and decoded memory (6.3 MB → ~0.5 MB per list image) | S |
| 4 | **Cheaper previews**: set `clearCoatFactor=0`, drop shadows and MSAA for the list canvas, lower render resolution (dynamic resolution / 0.75× scale) while scrolling; full quality on the opening screen | Fragment cost is the real mobile bottleneck, not triangle count | M |
| 5 | **Compress the GLB** (meshopt + KTX2/Basis for textures via `gltf-transform`) | 1.32 MB → well under 0.5 MB, faster load; no visual change at this scale | S |
| 6 | **Ship only needed ABIs** (`arm64-v8a` for release; `x86_64` only for emulator builds), enable R8 and Hermes bytecode in release | Largest APK lever (Filament + Bullet are ~270 MB across ABIs) | S |
| 7 | **Virtualise the 3D list**: only boxes whose card is within one screen of the viewport are placed in the scene (others hidden/unloaded) | Keeps GPU/memory bounded for large catalogues | M |
| 8 | **Keep gestures off the JS thread**: Gesture Handler + Reanimated worklets drive shared values; Filament consumes them in its worklet runtime | Smooth drag-to-inspect while JS is busy (mock API, state) | M (Stage 4) |
| 9 | **Idle animation budget**: 30 fps cap for the idle "sway" in the catalogue, 60 fps only during gestures/opening | Halves GPU work for the most common state | S |
| 10 | **Real-device profiling gate** with budgets: frame ≤ 16.6 ms (60 fps), cold start ≤ 2 s to first 3D frame, memory ≤ 450 MB PSS on a mid-range Android. Tooling already exists (meter + `perfIosProfile` + `perfAndroidTrace`); it needs a physical Android phone and a connected iPhone | Turns the above into pass/fail criteria | S (tools done) |

## 6. Risks to track
- Filament v2 is an unreleased release candidate (PR 349). Mitigation: vendored + pinned, documented in `vendor/react-native-filament/VENDOR.md`; swap to the npm release when published.
- Scene teardown / engine disposal crashes are reported upstream; keep a single long-lived scene and avoid re-mounting `FilamentScene` (also saves startup cost).

## 7. Final result: stable 60 FPS on iOS and Android

Release builds, 30 s per scenario, one platform at a time (the other simulator shut down).

| Scenario | Triangles | iOS Simulator | Android Emulator (headless) |
|---|---|---|---|
| 1 box | 31 k | 60.0 fps, 0 % slow | 60.0 fps, 0 % slow |
| 4 boxes | 125 k | 60.0 | 60.0 |
| 16 boxes | 500 k | 60.0 | 60.0 |
| 64 boxes, full quality | 2.0 M | 60.0 | 60.0 |
| 64 boxes, balanced | 2.0 M | 60.0 | 60.0 |
| 64 boxes, performance | 2.0 M | 60.0 | 60.0 |

Worst frame 17 ms, p95 16.7 ms everywhere. Cross-check on Android with a second, independent counter (`yarn perfAndroidPresentFps`, SurfaceFlinger `--timestats`): 900 frames presented in 15 s = 60 fps.

### What the Android "24 fps ceiling" really was
Earlier sections report 22-25 fps on the emulator. Root cause, found by elimination:
- Not the app: an empty scene was equally slow; quartering the pixel count (`wm size 540x1212`) changed nothing, so it was not fill rate either.
- Not the GL backend: Vulkan/ANGLE/feature flags made no difference.
- **The emulator's own window.** The windowed emulator composites every guest frame into a macOS window (and the system UI itself scrolled janky). Started with `-no-window` (`yarn androidEmulatorStart`) the same build renders at 60.0 fps in all scenarios, with no code change.
- Running the iOS Simulator and the Android Emulator together also made them fight for the host GPU, so each platform is now measured alone.

Visual proof: `docs/media/android-spike.png` (64 boxes, 60 fps overlay). Screen recordings: `adb shell screenrecord` from the headless emulator.

### Improvements that got us here
Render on demand (idle CPU iOS 0.5 %, Android 0.02 cores); one GLB instanced N times; Draco GLB 1.32 MB → 157 KB; WebP watches -92 % (thumbs -98 %); arm64-only builds (release APK 36.4 MB); quality profiles; single `FilamentScene`. Library bug found and mitigated: Android `FilamentChoreographer.stop()` does not cancel the queued callback, so `stop()` + `start()` in one frame multiplied frame loops (111-255 fps) - guarded by never starting a running choreographer, a 300 ms restart gap and a continuous mode for benchmarks.

### Remaining caveats
Emulator and simulator share the host GPU, so these numbers show the pipeline is not the bottleneck, not that every phone reaches 60 fps at 64 boxes. Real-device runs use the same scripts (`yarn perfAndroidSuite`, `yarn perfIosSuite`) and are planned later.
