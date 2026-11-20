import type { SharedValue } from 'react-native-reanimated';
declare global {
    var __rnfSharedValueListeners: Record<number, (_value: any) => void> | undefined;
}
/**
 * Runs `apply` (a worklet) on the Filament runtime with the current value of a reanimated shared
 * value, and again every time the value changes.
 *
 * Reanimated only allows listeners on the UI runtime, so the listener lives there and forwards
 * every change to the Filament runtime. A worklet that was captured from JS can't be handed from the
 * UI runtime to another runtime, so `apply` is registered on the Filament runtime by id from JS and
 * the UI listener only sends the id and the new value.
 */
export declare function useSharedValueListener<T>(value: SharedValue<T> | undefined, apply: (value: T) => void): void;
