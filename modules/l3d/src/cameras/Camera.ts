import * as THREE from 'three';

import { BaseCamera } from './BaseCamera';

module l3d {

    /**
     * Reprensents a simple rotating camera
     * @constructor
     * @memberof l3d
     * @extends THREE.PerspectiveCamera
     */
    export class Camera extends BaseCamera {

        theta : number;
        position : THREE.Vector3;

        constructor(fov : number, aspect : number, near : number, far : number) {

            super(fov, aspect, near, far);

            this.theta = 0;

            this.position.set(Camera.DISTANCE_X, 0, Camera.DISTANCE_Z);

            this.position.x = Camera.DISTANCE_X;
            this.position.z = Camera.DISTANCE_Z;

            this.up = new THREE.Vector3(0,0,1);

            /**
             * @type {THREE.Vector3}
             * @description Position where the camera is looking at
             */
            this.target = new THREE.Vector3();

        }

        /**
         * Updates the position of the camera
         * @param time {Number} time elapsed since the last update in millisec
         */
        update(time : number) : void {

            if (time === undefined) {
                time = 20;
            }

            this.theta += 0.01 * time / 20;
            this.position.x = Camera.DISTANCE_X * Math.cos(this.theta);
            this.position.y = Camera.DISTANCE_X * Math.sin(this.theta);
        }

        /**
         * look function. Just like OpenGL gluLookAt
         */
        look() : void {
            this.lookAt(this.target);
        };

        /**
         * @static
         * @type {Number}
         * @description radiusof the circle where the camera is rotating
         */
        static DISTANCE_X = 1000;

        /**
         * @static
         * @type {Number}
         * @description Altitude of the camera
         */
        static DISTANCE_Z = 300;

    }

}

export = l3d;
