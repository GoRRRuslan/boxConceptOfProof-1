import { Float3 } from '../../types/Math';
import { ActivationState, CollisionCallback, RigidBody } from '../types/RigidBody';
import { BaseShape } from '../types/Shapes';
import { Mat4 } from '../../types/TransformManager';
import { DiscreteDynamicWorld } from '../types/DiscreteDynamicWorld';
export type RigidBodyProps = {
    mass: number;
    shape: BaseShape;
    friction?: number;
    activationState?: ActivationState;
    /** [linearDumping, angularDumping] */
    damping?: [number, number];
    /**
     * If you supply world the rigid body will be added to the world on mount and removed on unmount.
     */
    world?: DiscreteDynamicWorld;
    id: string;
    collisionCallback?: CollisionCallback;
} & ({
    origin: Float3;
} | {
    transform: Mat4;
});
export declare function useRigidBody(props: RigidBodyProps | undefined): RigidBody | undefined;
