import * as THREE from 'three';
import * as mth from 'mth';

import { ArrowRecommendation } from './ArrowRecommendation';

module l3d {

    /**
     * Reprensents a recommendation as a viewport (3D representation of a camera)
     */
    export class ViewportRecommendation extends ArrowRecommendation {

        line : THREE.Line;

        collidingObject : THREE.Mesh;

        constructor(arg1:number, arg2:number, arg3:number, arg4:number, position:mth.Vector3, target:mth.Vector3) {

            super(arg1, arg2, arg3, arg4, position, target);

            let direction = mth.copy(target);
            direction.sub(this.camera.position);
            direction.normalize();

            let geometry = new THREE.Geometry();

            let left = mth.cross(direction, this.up);
            let other = mth.cross(direction, left);
            left.normalize();
            other.normalize();
            left = mth.mul(left, 1);
            other  = mth.mul(other, 1);

            geometry.vertices.push(
                mth.sum(mth.sum(this.camera.position, left), other),
                mth.diff(mth.sum(this.camera.position, other),left),
                mth.diff(mth.diff(this.camera.position, left),other),
                mth.sum(mth.diff(this.camera.position, other), left)
            );

            geometry.faces.push(
                new THREE.Face3(0,1,2), // new THREE.Face3(0,2,1),
                new THREE.Face3(0,2,3)  // new THREE.Face3(0,3,2)
            );

            {

                let material = new THREE.LineBasicMaterial({ color: '0x000000', linewidth: 3});
                let geometry = new THREE.Geometry();
                let tmpDirection = mth.mul(direction, -2);
                let target = mth.sum(this.camera.position, tmpDirection);

                geometry.vertices.push(
                    mth.sum(mth.sum(this.camera.position, left), other),
                    mth.diff(mth.sum(this.camera.position, other),left),
                    mth.diff(mth.diff(this.camera.position, left),other),
                    mth.sum(mth.diff(this.camera.position, other), left),
                    mth.sum(mth.sum(this.camera.position, left), other),
                    mth.sum(mth.diff(this.camera.position, other), left),

                    mth.sum(this.camera.position, tmpDirection),
                    mth.sum(mth.sum(this.camera.position, left), other),

                    mth.sum(this.camera.position, tmpDirection),
                    mth.diff(mth.sum(this.camera.position, other),left),

                    mth.sum(this.camera.position, tmpDirection),
                    mth.diff(mth.diff(this.camera.position, left),other),

                    mth.sum(this.camera.position, tmpDirection),
                    mth.sum(mth.diff(this.camera.position, other), left)
                );

                this.line = new THREE.Line(geometry, material);
            }

            {

                let material = new THREE.MeshBasicMaterial();
                let geometry = new THREE.Geometry();
                let tmpDirection = mth.mul(direction, -2);

                geometry.vertices = [
                    mth.sum(mth.sum(this.camera.position, left), other),
                    mth.diff(mth.sum(this.camera.position, other),left),
                    mth.diff(mth.diff(this.camera.position, left),other),
                    mth.sum(mth.diff(this.camera.position, other), left),
                    mth.sum(this.camera.position, tmpDirection)
                ];

                geometry.faces = [

                    new THREE.Face3(0, 1, 2),
                    new THREE.Face3(0, 2, 3),
                    new THREE.Face3(0, 4, 1),
                    new THREE.Face3(1, 4, 2),
                    new THREE.Face3(4, 3, 2),
                    new THREE.Face3(4, 0, 3)

                ];

                this.collidingObject = new THREE.Mesh(geometry, material);

            }

            let material = new THREE.MeshBasicMaterial({
                color : 0x0000ff,
                transparent : true,
                opacity : 1,
                side: THREE.DoubleSide
            });

            this.mesh = new THREE.Mesh(geometry, material);

            this.object3D = new THREE.Object3D();
            this.object3D.add(this.mesh);
            this.object3D.add(this.line);
            this.add(this.object3D);

        }

        raycast(raycaster : THREE.Raycaster, intersects : any[]) {

            let intersectsThis : any[] = [];
            this.collidingObject.raycast(raycaster, intersectsThis);

            if (intersectsThis[0] !== undefined) {

                intersectsThis[0].object = this;
                intersects.push(intersectsThis[0]);

            }

        }

        check() {
            (<THREE.MeshBasicMaterial>this.mesh.material).color.setHex(0x663366);
        }

        initExtremity() : THREE.Mesh {
            // Do nothing
            return;
        }

        // Update function
        update(position : THREE.Camera) {
            // Compute distance between center of camera and position
            let dist = mth.norm2(mth.diff(position.position, this.camera.position));

            let lowBound = 0.5;
            let highBound = 5;
            let newValue : number;
            let maxValue = 0.5;

            if (dist < lowBound)
                newValue = 0;
            else if (dist > highBound)
                newValue = maxValue;
            else
                newValue = maxValue * (dist - lowBound)/(highBound - lowBound);

            this.mesh.material.transparent = newValue < 0.9;
            this.mesh.material.opacity = newValue;

            this.raycastable = this.line.visible = this.mesh.material.transparent = this.mesh.visible = newValue > 0.1;
        }

        setSize(size : number) {

            let direction = this.camera.target.clone();
            direction.sub(this.camera.position);
            direction.normalize();

            let left = mth.cross(direction, this.up);
            let other = mth.cross(direction, left);
            left.normalize();
            other.normalize();
            left = mth.mul(left, size);
            other  = mth.mul(other, size);

            let geometry = <THREE.Geometry>this.mesh.geometry;
            geometry.vertices = [
                mth.sum(mth.sum(this.camera.position, left), other),
                mth.diff(mth.sum(this.camera.position, other),left),
                mth.diff(mth.diff(this.camera.position, left),other),
                mth.sum(mth.diff(this.camera.position, other), left)
            ];

            geometry.verticesNeedUpdate = true;

            {

                let tmpDirection = mth.mul(direction, -2 * size);
                let target = mth.sum(this.camera.position, tmpDirection);

                let vertices = [
                    mth.sum(mth.sum(this.camera.position, left), other),
                    mth.diff(mth.sum(this.camera.position, other),left),
                    mth.diff(mth.diff(this.camera.position, left),other),
                    mth.sum(mth.diff(this.camera.position, other), left),
                    mth.sum(mth.sum(this.camera.position, left), other),
                    mth.sum(mth.diff(this.camera.position, other), left),

                    mth.sum(this.camera.position, tmpDirection),
                    mth.sum(mth.sum(this.camera.position, left), other),

                    mth.sum(this.camera.position, tmpDirection),
                    mth.diff(mth.sum(this.camera.position, other),left),

                    mth.sum(this.camera.position, tmpDirection),
                    mth.diff(mth.diff(this.camera.position, left),other),

                    mth.sum(this.camera.position, tmpDirection),
                    mth.sum(mth.diff(this.camera.position, other), left)
                ];

                let geometry = <THREE.Geometry>this.line.geometry;
                geometry.vertices = vertices;
                geometry.verticesNeedUpdate = true;

            }

            {

                let tmpDirection = mth.mul(direction, -2 * size);

                (<THREE.Geometry>this.collidingObject.geometry).vertices = [
                    mth.sum(mth.sum(this.camera.position, left), other),
                    mth.diff(mth.sum(this.camera.position, other),left),
                    mth.diff(mth.diff(this.camera.position, left),other),
                    mth.sum(mth.diff(this.camera.position, other), left),
                    mth.sum(this.camera.position, tmpDirection)
                ];

            }

            (<THREE.Geometry>this.collidingObject.geometry).verticesNeedUpdate = true;

        }

    }

}

export = l3d;
