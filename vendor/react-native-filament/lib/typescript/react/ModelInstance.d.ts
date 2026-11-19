import React from 'react';
import { PropsWithChildren } from 'react';
import { TransformationProps } from '../types/TransformProps';
export type ModelInstanceProps = PropsWithChildren<TransformationProps & {
    index: number;
}>;
/**
 * You can render multiple instances of the same model. If you use a model multiple times this is recommended,
 * as it will only be loaded once into memory.
 * This component helps with applying configs to a specific instance of a model.
 *
 * @example
 * ```tsx
 * <Model source={require('model.glb')} instanceCount={2}>
 *   <ModelInstance index={0} scale={[1, 1, 1]} />
 *   <ModelInstance index={1} scale={[2, 2, 2]} />
 * </Model>
 * ```
 *
 */
export declare function ModelInstance({ index, ...restProps }: ModelInstanceProps): React.JSX.Element;
