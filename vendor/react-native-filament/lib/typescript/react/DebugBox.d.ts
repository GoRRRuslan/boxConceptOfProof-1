import { Float3 } from '../types';
import { TransformationProps } from '../types/TransformProps';
export type DebugBoxProps = TransformationProps & {
    halfExtent?: Float3;
};
export declare function DebugBox({ halfExtent: halfExtentProp, ...transformProps }: DebugBoxProps): null;
