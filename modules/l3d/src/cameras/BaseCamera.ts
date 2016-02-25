import * as THREE from 'three';

module l3d {

    /**
     * Reprensents a simple rotating camera
     * @constructor
     * @memberof l3d
     * @extends THREE.PerspectiveCamera
     */
    export class BaseCamera extends THREE.PerspectiveCamera {

        target : THREE.Vector3;

        look() : void { this.lookAt(this.target); };
        update(time : number): void {};

        constructor(fov : number, aspect : number, near : number, far : number) {

            super(fov, aspect, near, far);

        }

    }

}

export = l3d;
