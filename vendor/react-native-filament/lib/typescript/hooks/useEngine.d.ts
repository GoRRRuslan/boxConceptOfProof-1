import { type WorkletRuntime } from 'react-native-worklets';
import type { Engine, EngineBackend, EngineConfig } from '../types';
export interface EngineProps {
    /**
     * The backend to be used. By default it picks "opengl" for android and "metal" for ios.
     */
    backend?: EngineBackend;
    /**
     * The engine config. Can be used to tweak buffer sizes.
     * You probably don't need that unless you do a lot and ran into engine crashes.
     */
    config?: EngineConfig;
    runtime: WorkletRuntime;
}
export declare function useEngine({ backend, config, runtime }: EngineProps): Engine | undefined;
