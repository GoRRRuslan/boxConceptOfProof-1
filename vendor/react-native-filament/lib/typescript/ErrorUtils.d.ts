/**
 * Report an error to react native's `ErrorUtils` if available, or log to console otherwise.
 */
export declare function reportError(error: unknown, fatal: boolean): void;
export declare const reportWorkletError: (error: unknown, fatal?: boolean) => void;
export declare const wrapWithErrorHandler: <T extends (...args: any[]) => any>(callback: T) => ((...args: Parameters<T>) => ReturnType<T>);
