type CleanupFn = () => void;
export declare function useWorkletEffect(workletFunction: () => CleanupFn | void): void;
export {};
