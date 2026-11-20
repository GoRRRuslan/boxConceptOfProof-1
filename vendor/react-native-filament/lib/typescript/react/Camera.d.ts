import { CameraManipulator, Float3 } from '../types';
export type CameraProps = {
    /**
     * Lens's focal length in millimeters.focalLength > 0.
     */
    focalLengthInMillimeters?: number;
    /**
     * The aspect ratio.
     * Uses the views aspect ratio by default.
     */
    aspect?: number;
    /**
     * Distance in world units from the camera to the near plane. near > 0.
     */
    near?: number;
    /**
     * Distance in world units from the camera to the far plane. far > near.
     */
    far?: number;
    /**
     * "eye" The position of the camera in space
     */
    cameraPosition?: Float3;
    /**
     * The target position to look at
     */
    cameraTarget?: Float3;
    /**
     * The up vector of the camera (Usually `[0, 1, 0]`)
     */
    cameraUp?: Float3;
    /**
     * The camera can optionally be owned by a {@linkcode CameraManipulator}.
     * In this case the manipulators state will be used to update the camera.
     */
    cameraManipulator?: CameraManipulator;
};
export declare function Camera({ cameraManipulator, ...cameraConfig }: CameraProps): null;
