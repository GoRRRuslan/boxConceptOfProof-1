import React, { DependencyList, PropsWithChildren } from 'react';
import { RenderCallback } from 'react-native-filament';
declare global {
    var __rnfRenderCallbacks: Record<number, Record<number, RenderCallback>> | undefined;
}
/**
 * In react-native-filament we can only have one render callback, which we provide to the FilamentView.
 * This context allows us to have multiple render callbacks, as we call them in the render callback.
 *
 * The callbacks are kept in a registry on the Filament runtime, keyed by context and callback id.
 * Adding and removing are jobs on the Filament runtime, so they are ordered with everything else
 * scheduled there (like releasing the resources a callback uses).
 */
export type RenderContextType = {
    /**
     * The id of this context's entry in the render callback registry on the Filament runtime.
     */
    contextId: number;
    addRenderCallback: (callback: RenderCallback) => () => void;
};
export declare const makeRenderContext: () => {
    useRenderContext: () => RenderContextType;
    RenderContextProvider: ({ children }: PropsWithChildren) => React.JSX.Element;
    useRenderCallback: (callback: RenderCallback, deps: DependencyList) => RenderCallback;
    runRenderCallbacks: (contextId: number, frameInfo: Parameters<RenderCallback>[0]) => void;
};
export declare const RenderCallbackContext: {
    useRenderContext: () => RenderContextType;
    RenderContextProvider: ({ children }: PropsWithChildren) => React.JSX.Element;
    useRenderCallback: (callback: RenderCallback, deps: DependencyList) => RenderCallback;
    runRenderCallbacks: (contextId: number, frameInfo: Parameters<RenderCallback>[0]) => void;
};
