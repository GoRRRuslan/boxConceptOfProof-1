# Performance analysis — Stage 1 (Filament spike)

Measured on **iOS Simulator (iPhone 17, iOS 27.2)** and **Android Emulator (Pixel 9 profile, API 37, 6 cores / 6 GB, host GPU)**, development builds, Expo SDK 58 / RN 0.88.1, Filament 2.0.0-rc.6.
Simulators and emulators share the host GPU and are **not representative of device frame rates**; the numbers below are meant for *relative* comparison (1 box vs 4 boxes) and for sizing, not as FPS claims.

## 1. Asset budget

| Asset | Size | Content | Comment |
|---|---|---|---|
| `box.glb` | 1.32 MB | 5 meshes, **23,189 vertices, 31,242 triangles**, 6 PBR materials (`KHR_materials_clearcoat`), 2 wordmark PNG textures (23 KB + 12 KB), no animations/skins | Per box. 4 visible boxes ≈ 125k triangles — trivial for a mobile GPU |
| Watch PNGs (4×) | 0.99 – 1.89 MB each, **5.48 MB total**, 1019 × 1544 RGBA | Reveal + collection | Decoded bitmap ≈ **6.3 MB each** (1019·1544·4 B) → ~25 MB if all four are resident |
| Vendored Filament source | 3.9 MB | `vendor/react-native-filament` | In git |
| Filament + Bullet3 binaries | 331 MB on disk | `node_modules`, fetched by script | Not in git; only the used ABI/arch ends up in the app |
| Android debug APK | **95.4 MiB** (100,084,571 B) | all ABIs, debug | Release + arm64-only will be far smaller |
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

## 3. The important finding: one engine, one canvas

`createEngine` is documented as "call once". On Android a second `<FilamentScene>` (second engine + `TextureView`) never draws, reproducibly, with no error (also on a 6-core / host-GPU AVD, so it is not a resource problem). iOS happens to render several scenes, but it is the same unsupported usage.

**Decision:** the catalogue renders all boxes in **one `FilamentScene` / one `FilamentView`**; card positions are synced from the list scroll offset. This removes the failure mode, keeps cost flat in the number of boxes, and behaves the same on both platforms.

## 4. Measurement limits (honest notes)
- `dumpsys gfxinfo` only sees UI-thread (HWUI) frames. Filament draws on its own thread into a `TextureView`, so a static scene reports almost no UI frames. Do **not** read FPS from it.
- Simulator GPU frame times are meaningless for shipping decisions. A real-device pass (Perfetto + Android GPU Inspector, Xcode Metal System Trace) is part of Stage 6.

## 5. Recommended improvements (ordered by value / effort)

| # | Improvement | Why | Effort |
|---|---|---|---|
| 1 | **Render on demand**: stop the Filament choreographer when nothing moves (idle list, closed screen); resume on scroll/gesture/animation | Filament currently redraws at display rate even for a static scene → battery/thermals | S |
| 2 | **Load the GLB once, instantiate N times** (`useModel(..., { instanceCount })` + `ModelInstance`) | Today every `<Model>` re-parses the 1.3 MB GLB and duplicates vertex buffers (4 parses for 4 boxes) | S |
| 3 | **Resize and re-encode watch images**: ≤ 512 px wide WebP/AVIF thumbnails for lists, full size only for the reveal; load through `expo-image` with disk cache | −90–95 % bytes and decoded memory (6.3 MB → ~0.5 MB per list image) | S |
| 4 | **Cheaper previews**: set `clearCoatFactor=0`, drop shadows and MSAA for the list canvas, lower render resolution (dynamic resolution / 0.75× scale) while scrolling; full quality on the opening screen | Fragment cost is the real mobile bottleneck, not triangle count | M |
| 5 | **Compress the GLB** (meshopt + KTX2/Basis for textures via `gltf-transform`) | 1.32 MB → well under 0.5 MB, faster load; no visual change at this scale | S |
| 6 | **Ship only needed ABIs** (`arm64-v8a` for release; `x86_64` only for emulator builds), enable R8 and Hermes bytecode in release | Largest APK lever (Filament + Bullet are ~270 MB across ABIs) | S |
| 7 | **Virtualise the 3D list**: only boxes whose card is within one screen of the viewport are placed in the scene (others hidden/unloaded) | Keeps GPU/memory bounded for large catalogues | M |
| 8 | **Keep gestures off the JS thread**: Gesture Handler + Reanimated worklets drive shared values; Filament consumes them in its worklet runtime | Smooth drag-to-inspect while JS is busy (mock API, state) | M (Stage 4) |
| 9 | **Idle animation budget**: 30 fps cap for the idle "sway" in the catalogue, 60 fps only during gestures/opening | Halves GPU work for the most common state | S |
| 10 | **Real-device profiling gate** with budgets: frame ≤ 16.6 ms (60 fps), cold start ≤ 2 s to first 3D frame, memory ≤ 450 MB PSS on a mid-range Android | Turns the above into pass/fail criteria | M (Stage 6) |

## 6. Risks to track
- Filament v2 is an unreleased release candidate (PR 349). Mitigation: vendored + pinned, documented in `vendor/react-native-filament/VENDOR.md`; swap to the npm release when published.
- Scene teardown / engine disposal crashes are reported upstream; keep a single long-lived scene and avoid re-mounting `FilamentScene` (also saves startup cost).
