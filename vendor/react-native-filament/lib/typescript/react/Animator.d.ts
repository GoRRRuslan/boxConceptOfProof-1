import React from 'react';
import type { SharedValue } from 'react-native-reanimated';
export type AnimationItem = {
    index: number;
    duration: number;
    name: string;
};
export type AnimatorProps = {
    /**
     * The index of the animation to play. To find out the index for the animation you want to play, you can use the `onAnimationsLoaded` callback.
     * @default 0
     **/
    animationIndex?: number | SharedValue<number>;
    /**
     * Returns a list of all animations for the model.
     */
    onAnimationsLoaded?: (animations: AnimationItem[]) => unknown;
    /**
     * The time it takes transitioning from one animation to another.
     * At 0 the transition is immediate. Unit is seconds.
     * @default 0
     */
    transitionDuration?: number;
};
/**
 * Can be used to control the animation of a Model.
 * For pausing, playing, it is recommended to conditionally render the Animator component.
 *
 * @example
 * ```jsx
 * <Model source={DroneGlb}>
 *  <Animator animationIndex={2} />
 * </Model>
 * ```
 */
export declare function Animator(props: AnimatorProps): React.JSX.Element;
