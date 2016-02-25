import * as THREE from 'three';
import * as mth from 'mth';

import { BaseCamera } from './BaseCamera';

module l3d {

    /**
     * Represents a fixed camera
     */
    export class FixedCamera extends BaseCamera {

        constructor(arg1:number, arg2:number, arg3:number, arg4:number, position:mth.Vector3, target:mth.Vector3) {

            super(arg1, arg2, arg3, arg4)

            if (position === undefined) {

                position = new THREE.Vector3(0,0,5);

            }

            if (target === undefined ) {

                target = new THREE.Vector3();

            }

            mth.copy(position, this.position);
            this.target = mth.copy(target);

        }

        /**
         * Look function. Just like OpenGL gluLookAt
         */
        look() {
            this.lookAt(this.target);
        }

    }

}

export = l3d;
