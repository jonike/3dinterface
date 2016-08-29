import * as THREE from 'three';
import * as mth from 'mth';

import { BaseCamera } from './BaseCamera';

module l3d {

    /**
     * Represents a fixed camera
     */
    export class FixedCamera extends BaseCamera {

        /**
         * Creates a fixed camera
         * @param position Center of the camera
         * @param target Point that the camera is looking at
         */
        constructor(
            arg1:number, arg2:number, arg3:number, arg4:number,
            position : mth.Vector3 = {x:0, y:0, z:0},
            target : mth.Vector3 = {x:0, y:0, z:0}
        ) {

            super(arg1, arg2, arg3, arg4)

            mth.copy(position, this.position);
            this.target = mth.copy(target);

        }

    }

}

export = l3d;
