import { TFilamentRecorder } from '../types/FilamentRecorder';
import { SwapChain } from '../types';
export type RecorderOptions = {
    width: number;
    height: number;
    fps: number;
    bitRate: number;
};
type Result = {
    recorder: TFilamentRecorder;
    swapChain: SwapChain | undefined;
};
export declare function useRecorder({ width, height, fps, bitRate }: RecorderOptions): Result;
export {};
