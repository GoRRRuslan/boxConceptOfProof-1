/**
 * Wraps a worklet in a JS function that runs it on the engine's worklet runtime and resolves with its result.
 *
 * Call the returned function from JS. Do not capture it inside another worklet or hand it to native code
 * (e.g. a collision callback): on the worklet runtime it is a remote function and cannot be invoked.
 * Pass the plain `'worklet'` function in those cases.
 */
export declare function useWorkletCallback<T extends (...args: any[]) => any>(callback: T): (...args: Parameters<T>) => Promise<ReturnType<T>>;
