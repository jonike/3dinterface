import * as THREE from 'three';

import * as l3d from 'l3d';

export class Cube extends THREE.Mesh {

    constructor(size : number, style : THREE.Material = new THREE.MeshLambertMaterial()) {

        super();

        this.geometry = new THREE.BoxGeometry(size, size, size);
        this.material = style;

    }

}

export class Plane extends THREE.Mesh {

    constructor(width : number, length : number, material : THREE.Material = new THREE.MeshLambertMaterial()) {

        super();

        this.geometry = new THREE.PlaneBufferGeometry(width, length);
        this.material = material;

    };

}

export class BouncingCube extends Cube {

    speed : THREE.Vector3;

    static DT : number = 0.1;
    static FRICTION : THREE.Vector3 = new THREE.Vector3(1, 1, -0.5);
    static G : THREE.Vector3 = new THREE.Vector3(0, 0, -10);

    constructor(size : number, material? : THREE.Material) {

        super(size, material);

        this.speed = new THREE.Vector3(0,0,300);

    }

    update(time : number) {

        var speedClone = this.speed.clone();
        speedClone.multiplyScalar(BouncingCube.DT);

        this.speed.add(BouncingCube.G);

        if (this.speed.dot(this.speed) > 100) {
            this.position.add(speedClone);
        }

        if (this.position.z < 0) {
            this.speed.multiply(BouncingCube.FRICTION);
            this.position.z = 0;
        }

    }

}
