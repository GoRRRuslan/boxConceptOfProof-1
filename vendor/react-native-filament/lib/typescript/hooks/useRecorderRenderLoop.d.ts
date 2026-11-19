import { TFilamentRecorder } from '../types/FilamentRecorder';
export interface OffscreenFrameInfo {
    recorder: TFilamentRecorder;
    frameIndex: number;
}
export declare function useRecorderRenderLoop(recorder: TFilamentRecorder, render: (frameInfo: OffscreenFrameInfo) => boolean): void;
