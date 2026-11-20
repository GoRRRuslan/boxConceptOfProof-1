# Vendored: react-native-filament 2.0.0-rc.6

This directory is a vendored copy of the **react-native-filament v2 / worklets** line, so the project builds on a clean machine without depending on an unpublished branch.

| | |
|---|---|
| Upstream | https://github.com/margelo/react-native-filament |
| Source | pull request #349 "feat!: run on react-native-worklets instead of react-native-worklets-core" (branch `v2/react-native-worklets`, fork `eduardoborges/react-native-filament`, commit `6ac88f417ab956184b96c977deae96a6a11e9d07`, 2026-09-22) |
| License | MIT (see `LICENSE`) |
| Why | Published `react-native-filament@1.11.0` needs `react-native-worklets-core`, which does not compile on iOS with React Native 0.88 (`RCTCxxBridge` was removed) and calls the removed `InteractionManager`. v2 runs on the `react-native-worklets` that Reanimated 4 already ships. |

## What is NOT in git (fetched on install)
The prebuilt native binaries (~340 MB: `ios/libs/**`, `android/libs/**` — Filament + Bullet3 xcframeworks / static libs) are not committed. `yarn install` runs `scripts/installFilamentBinaries.sh` (root `postinstall`), which downloads the official `react-native-filament@1.11.0` npm tarball once into `.cache/filament/` and copies its `ios/libs` and `android/libs` into `node_modules/react-native-filament`. The 1.11.0 binaries are the same Filament build the v2 branch's own `setup-filament-quick.sh` uses.

## Local changes versus upstream
- Removed development-only files (`scripts/`, `*.patch`, `babel.config.js`, `tsconfig.json`, dotfiles, dev-dependencies in `package.json`).
- Added generated type declarations in `lib/typescript` (`tsc --declaration --emitDeclarationOnly`), because the branch ships sources only.
- No source code was modified.

## Updating
When a stable v2 is published to npm, delete this directory, run `yarn add react-native-filament@^2` and remove the `postinstall` script.
