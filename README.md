# Mystery Watch — Proof of Concept

React Native (Expo SDK 58) + TypeScript app for browsing, buying and opening 3D mystery boxes with watches.
Assignment: [docs/ASSIGNMENT.md](docs/ASSIGNMENT.md) · Model notes: [docs/MODEL.md](docs/MODEL.md) · Plan: [docs/DEVELOPMENT_PLAN.md](docs/DEVELOPMENT_PLAN.md)

## Requirements
- macOS, Node 24+ (developed on Node 26), yarn classic 1.22 (`corepack enable`)
- Xcode + iOS Simulator, CocoaPods
- Android Studio, JDK 17, an AVD (developed on `Medium_Phone_API_37.0`)
- `export LANG=en_US.UTF-8` (CocoaPods requires a UTF-8 locale)

## Run
```bash
yarn install
yarn iosRun        # builds the development client and installs it on a simulator
yarn androidRun    # same for the Android emulator (start the AVD first)
yarn start         # Metro for the development client
```

Notes:
- Xcode 27 / iOS 27 requires Expo SDK 58 (earlier SDKs crash on launch: UIScene lifecycle). Xcode 27 ships `DeviceHub.app` instead of `Simulator.app`; at the very end `expo run:ios` may print an osascript error about activating the Simulator window. The app is already installed at that point — start Metro (`yarn start`) and open the app from DeviceHub / `xcrun simctl launch booted com.gorrr.mysterywatch`.
- First native build downloads ~300 MB of prebuilt React Native binaries (cached afterwards).

## Checks
```bash
yarn ciPipeline    # eslint + tsc
yarn test          # jest
```

## Structure
`src/app` app root · `src/flows/<flow>Flow` screens + facades + adapters · `src/components` shared UI · `src/models/mainStorage` Zustand stores · `src/networking` mock API + React Query · `src/services` · `src/utils/designSystem` · `src/i18next`.
UI files contain render methods only; logic lives in `use…Facade` hooks.
