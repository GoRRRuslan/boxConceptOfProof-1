import type { SharedValue } from 'react-native-reanimated';
import { Float3 } from '../types';
export declare const areFloat3Equal: (a: Float3, b?: Float3) => boolean;
export declare const isWorkletSharedValue: (value: any) => value is SharedValue<any>;
