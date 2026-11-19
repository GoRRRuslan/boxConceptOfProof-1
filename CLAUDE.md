# Project rules (adapted from the fitpilotai-frontend reference)

Stack: Expo SDK 58 · TypeScript strict · Zustand 5 · React Query 5 · React Navigation 7 · Reanimated 4 · react-native-filament.

## Architecture
- Flow-based: `src/flows/<name>Flow/{screens,_facades,_facadesLogic,_adapters,_components,_navigation,_types}`.
- Screen = `Screen.tsx` (render methods + one `useXxxFacade()` call), `Screen.styles.ts` (`makeStyles(theme)` with `ScaledSheet`), `index.ts`.
- Facade section order: translations → navigation → state → store → queries/mutations → adapter → values → handlers → effects, each with a divider comment.
- Complex logic → `_facadesLogic/`; data mapping → `_adapters/` (pure, `useMemo`, no stores/mutations).
- Global state in Zustand (session-scoped, no persistence). Server/mock-API state in React Query.

## Blockers
- No abbreviations in names. English only in code and comments.
- No logic in UI files. No hardcoded visible strings — use `t()`.
- No fallback substitution for missing data: guard, warn, early return.
- No functions in hook dependency arrays. `useCallback` only for memoized children.
- Lists use `FlashList`. Interactive elements have `testID`. No inline styles or color literals.
- Enums for string identifiers. No `console.log`.
- Strict scope: touch only files the task needs. Run `yarn ciPipeline` and `yarn test` before calling work done.
