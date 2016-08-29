import * as THREE from 'three';

module l3d {

    /**
     * Reprensents a simple rotating camera
     */
    export class BaseCamera extends THREE.PerspectiveCamera {

        /** A Vector that the camera is looking at */
        target : THREE.Vector3;

        /** Set OpenGL matrices to look at the target */
        look() : void { this.lookAt(this.target); };

        /**
         * Moves the camera according to the physics
         * @param time Number of milliseconds for the dt
         */
        update(time : number): void {};

        /**
         * Builds a new BaseCamera
         * @see{THREE.PerspectiveCamera} for the parameters
         */
        constructor(fov : number, aspect : number, near : number, far : number) {

            super(fov, aspect, near, far);

        }

    }

}

export = l3d;
