# Test checklist

What was checked, how, and the result. Release builds on the **iOS Simulator (iPhone 17, iOS 27)** and the **Android Emulator (Pixel 9 profile, API 37, headless)**, one at a time.

## 1. Automated

| Check | Command | Result |
|---|---|---|
| Lint + types | `yarn ciPipeline` | ✅ clean |
| Unit + component tests | `yarn test` | ✅ 163 tests, 34 suites |
| Clean clone: install → lint → types → tests | see section 4 | ✅ |

## 2. Manual — functional

Test ids refer to the `testID`s used by the scripts (`scripts/app/tapAndroidTestId.sh`).

| # | Case | Expected | Android | iOS |
|---|---|---|---|---|
| F1 | Start the app | Boxes tab, 8 coloured 3D boxes, balance $1,000 | ✅ | ✅ |
| F2 | Scroll the list | Boxes stay in their cards, turn slightly, text in sync | ✅ | ✅ |
| F3 | Tap a box | It flies to the middle, Back / Buy appear, drag hint | ✅ | ✅ |
| F4 | Drag the box | It turns with the finger and keeps turning after release | ✅ | ✅ |
| F5 | Buy an affordable box | Button disabled while running, then "Open the box"; balance −price once | ✅ | ✅ |
| F6 | Open the box | Lid opens about the hinge, watch image + name + value appear | ✅ | ✅ |
| F7 | Done | Back in the list, balance updated, 3D boxes intact | ✅ | ✅ |
| F8 | Collection tab | Watch listed (newest first), count and total value right | ✅ | ✅ |
| F9 | Empty collection | "No watches yet" + Browse boxes → Boxes tab | ✅ | ✅ |
| F10 | Switch tabs back and forth | 3D boxes are there immediately, no blank scene | ✅ | ✅ |
| F11 | Box above the balance (Legend $1,200) | "Not enough balance", Buy disabled | ✅ | ✅ |

## 3. Manual — edge cases and failures

| # | Case | Expected | Android | iOS |
|---|---|---|---|---|
| E1 | Four rapid taps on Buy | One purchase: −$150 once, one new watch (collection 2, balance $800) | ✅ | covered by unit tests |
| E2 | Spend the balance to $0 (Elite ×2) | Balance $0 exactly; every box says "Not enough balance"; Buy disabled | ✅ | covered by unit tests |
| E3 | Purchase fails (`EXPO_PUBLIC_MOCK_PURCHASE_FAILURE=serverError`) | Error shown, balance and collection unchanged, Buy available again | ✅ | covered by unit tests |
| E4 | Response lost, then retry | Same watch, one deduction (same idempotency key) | unit tests | unit tests |
| E5 | Back during purchase / opening | Back is hidden; nothing can interrupt the flow | ✅ (hidden) | ✅ (hidden) |
| E6 | App to background and back while inspecting | Same screen, scene intact | ✅ | ✅ |
| E7 | Frame rate after resume | ≤ 60 FPS (no duplicated frame loops) | ✅ max 60.0 | ✅ |
| E8 | Select a box while another is flying back | Ignored until the box is home | unit tests | unit tests |
| E9 | Restart the app | New session: $1,000, empty collection | ✅ | ✅ |

Evidence: `docs/media/android-edge-two-purchases.png`, `android-edge-no-balance.png`, `android-opening-failure.png`, `android-lifecycle-resumed.png`, `docs/data/android-lifecycle.log`.

## 4. Clean clone

```bash
git clone <repo> /tmp/clean && cd /tmp/clean
yarn install --frozen-lockfile     # postinstall fetches the Filament binaries
yarn ciPipeline && yarn test
```
Result: {CLEAN_CLONE}

## 5. Performance (final code)

| Scenario (60 s, release, one platform at a time) | iOS | Android |
|---|---|---|
| Catalogue scrolling by itself (8 boxes) | 60.0 FPS, 0 slow frames, worst frame 17 ms | 60.0 FPS, 0 slow frames, worst frame 17 ms (SurfaceFlinger: 600 frames / 10 s) |
| Opening flow (select → drag → buy → open → reveal → done) | 60.0 on screen | avg 59.6, min 58 (the screenshots taken during the flow cost a few frames) |
| Benchmark suite 1–64 boxes × 3 quality profiles | 60.0 in all six | 60.0 in all six |

Details and method: [PERFORMANCE.md](PERFORMANCE.md).

## 6. Not covered

- Physical devices (iPhone / Android phone) — the same scripts work on them, not run yet.
- Accessibility (screen readers, large fonts), landscape and tablets — not part of the assignment.
- Real network: the API is a local mock.
