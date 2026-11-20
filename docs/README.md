# Documentation map

Start here. Each row says what a document is for, so you can open the right one at once.

## I want to…

| I want to… | Open |
|---|---|
| Understand the assignment | [ASSIGNMENT.md](ASSIGNMENT.md) |
| Run the app on an emulator or simulator | [../README.md → Just try it](../README.md#just-try-it-recommended-for-reviewers) |
| Understand the architecture and where code lives | [../README.md → Architecture](../README.md#4-project-architecture), [Project Structure](../README.md#9-project-structure) |
| See how the 3D scene works (one scene, hinge, render on demand) | [../README.md → Real-time 3D](../README.md#5-real-time-3d), [MODEL.md](MODEL.md) |
| See every animation, where it lives and how it works | [ANIMATIONS.md](ANIMATIONS.md) |
| See the show around the box (seams, light, sparks, shock waves, camera punch) | [EFFECTS.md](EFFECTS.md) |
| **Test the app (rules, iOS, Android, FPS)** | **[TESTING.md](TESTING.md)** |
| See what was tested and the result, plus bugs found | [TEST_CHECKLIST.md](TEST_CHECKLIST.md) |
| See FPS numbers, method and history | [PERFORMANCE.md](PERFORMANCE.md) |
| **See how the three repositories render and compare (Metal vs OpenGL ES, why expo-gl was dropped)** | **[RENDERING_REPORT.md](RENDERING_REPORT.md)** |

## The most important rule

> **Test on one platform at a time:** either the Android emulator with the iOS simulator shut down, or the iOS simulator with the Android emulator shut down. They share the Mac's GPU and CPU; running both gives false jank and unusable FPS numbers. Full reasoning and the commands to switch: [TESTING.md, rule 1](TESTING.md#rule-1--one-platform-at-a-time).

## All documents

| Document | What it holds |
|---|---|
| [ASSIGNMENT.md](ASSIGNMENT.md) | The original assignment |
| [FILAMENT.md](FILAMENT.md) | Filament: stack, decisions and limits |
| [DOMAIN.md](DOMAIN.md) | Domain types, mock API, stores, the purchase guarantee |
| [CATALOGUE.md](CATALOGUE.md) | The live 3D catalogue over one shared scene |
| [COLLECTION.md](COLLECTION.md) | Tabs and the collection |
| [ANIMATIONS.md](ANIMATIONS.md) | All animations with screenshots |
| [EFFECTS.md](EFFECTS.md) | The show around the box: timeline, rarity table, how it is drawn |
| [TESTING.md](TESTING.md) | Testing guide and the golden rules |
| [TEST_CHECKLIST.md](TEST_CHECKLIST.md) | Cases, results per platform, bugs found, gaps |
| [PERFORMANCE.md](PERFORMANCE.md) | FPS report: numbers, method, history, limits |
| [RENDERING_REPORT.md](RENDERING_REPORT.md) | The three renderers compared; why expo-gl is out |
| [MODEL.md](MODEL.md) | The 3D box model: parts, pivots, materials |
| `data/` | Raw measurement logs |
| `media/` | Screenshots, charts, animation frames |
