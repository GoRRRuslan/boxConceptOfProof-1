import { CylinderShape } from '../types/Shapes';
import { Float3 } from '../../types';
type CylinderShapeProps = {
    half: Float3;
    localScaling?: Float3;
};
export declare function useCylinderShape(props: CylinderShapeProps | undefined): CylinderShape | undefined;
export {};
