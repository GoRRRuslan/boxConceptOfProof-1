/**
 * The values a worklet captured from its surrounding scope.
 * Use them as hook dependencies, so a worklet only re-runs when something it captured changed.
 */
export declare function getWorkletDependencies(worklet: (...args: any[]) => unknown): unknown[];
