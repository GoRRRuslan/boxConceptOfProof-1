import { TransformationProps } from '../../types/TransformProps';
import { AABB, Entity } from '../../types';
type Params = {
    to?: Entity | null;
    transformProps?: TransformationProps;
    aabb?: AABB;
};
/**
 * Takes the next entity from the context and applies all transformations from the next
 * transformation context to it
 */
export declare function useApplyTransformations({ to: entity, transformProps, aabb }: Params): void;
export {};
