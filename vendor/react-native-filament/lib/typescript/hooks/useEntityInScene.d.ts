import { Entity, Scene } from '../types';
/**
 * A hook that "on mount" adds the entity to the scene, and "on unmount" removes it.
 */
export declare function useEntityInScene(scene: Scene, entity?: Entity): void;
