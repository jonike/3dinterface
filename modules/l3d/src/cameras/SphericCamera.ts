import * as THREE from 'three';
import * as mth from 'mth';

import { BaseRecommendation } from '../recommendations/BaseRecommendation';
import { History } from '../utils/History';
import { CameraItf } from '../utils/Logger';
import { MousePointer, Color } from '../canvases/MousePointer';
import { DB } from '../utils/Logger';
import { BaseCamera } from './BaseCamera';
import { TargetMove } from './PointerCamera';

module l3d {

    /**
     * Represents a camera that can be used easily
     */
    export class SphericCamera extends BaseCamera {

        /**
         * Time that it takes to move to a bookmark (in s)
         */
        transitionDuration : number;

        /**
         * Theta angle of the camera
         */
        theta : number;

        /**
         * Phi angle of the camera
         */
        phi : number;

        /**
         * Current position of the camera (optical center)
         */
        position : THREE.Vector3;

        /**
         * Point that the camera is targeting
         */
        target : THREE.Vector3;

        /**
         * The camera we will move to when we'll reset the camera
         */
        resetElements : CameraItf;

        /**
         * Speed of the camera
         */
        speed : number;

        /**
         * Id of the recommendation to move to
         */
        movingToRecommendation : number;

        /**
         * Id of the recommendation that is currently clicked (null if no recommendation are clicked)
         */
        recommendationClicked : number;

        t : number;

        curvePosition  : mth.Curve<THREE.Vector3>;
        curveDirection : mth.Curve<THREE.Vector3>;

        constructor(arg0 : any, arg1 : any, arg2 : any, arg3 : any) {

            super(arg0, arg1, arg2, arg3);

            this.theta = Math.PI;
            this.phi = Math.PI;

            this.target = new THREE.Vector3(0,1,0);

            this.speed = 1;

            this.transitionDuration = 2;

            this.resetElements = {position: new THREE.Vector3(0,1,1), target: new THREE.Vector3()};
        }

        /**
         * Update the position of the camera
         * @param time number of milliseconds between the previous and the next frame
         */
        update(time : number) {

            if (!isNaN(this.t)) {
                this.motion(time);
            }

        }

        /**
         * Update the camera according to its motion
         * @param time number of milliseconds between the previous and the next frame
         */
        motion(time : number) {

            this.position.copy(this.curvePosition.eval(this.t));
            this.target.copy(mth.sum(this.position, this.curveDirection.eval(this.t)));

            this.t += time / (20 * this.transitionDuration * 60);

            if (this.t > 1) {
                this.t = NaN;
                this.anglesFromVectors();
            }

        }

        /**
         * Computes the vectors (forward, left, ...) according to theta and phi
         */
        vectorsFromAngles() {

            // Update direction
            var forward = new THREE.Vector3();
            forward.y = Math.sin(this.phi);

            var cos = Math.cos(this.phi);
            forward.z = cos * Math.cos(this.theta);
            forward.x = cos * Math.sin(this.theta);
            forward.normalize();

            this.target.copy(this.position);
            this.target.add(forward);

        }

        /**
         * Computes theta and phi according to the vectors (forward, left, ...)
         */
        anglesFromVectors() {

            var forward = mth.diff(this.target, this.position);
            forward.normalize();

            this.phi = Math.asin(forward.y);

            // Don't know why this line works... But thanks Thierry-san and
            // Bastien because it seems to work...
            this.theta = Math.atan2(forward.x, forward.z);

        }

        /**
         * Creates a linear motion to another camera
         * @param recommendation Camera to move to
         * @param true if you want to save the current state of the camera
         */
        startLinearMotion(destination : CameraItf) : void {

            this.t = 0;

            this.curvePosition  = new mth.Line<THREE.Vector3>(
                mth.copy(this.position),
                mth.copy(destination.position)
            );

            this.curveDirection = new mth.Line<THREE.Vector3>(
                mth.diff(this.target, this.position),
                mth.diff(destination.target, destination.position)
            );

        }

        /**
         * Creates a hermite motion to another camera
         * @param recommendation Camera to move to
         * @param toSave if you want to save the current state of the camera
         */
        startHermiteMotion(destination : CameraItf) : void {

            this.t = 0;

            this.curvePosition = new mth.Hermite.special.Polynom(
                mth.copy(this.position),
                mth.copy(destination.position),
                mth.mul(mth.diff(destination.target, destination.position).normalize(), 4)
            );

            this.curveDirection = new mth.Hermite.special.Polynom(
                mth.diff(this.target, this.position),
                mth.diff(destination.target, destination.position),
                new THREE.Vector3()
            );

        }

        moveHermite(recommendation : BaseRecommendation, toSave ?: boolean) : void {};

        /**
         * Look method. Equivalent to gluLookAt for the current camera
         */
        look() {
            this.lookAt(this.target);
        }

        /**
         * Adds the camera to the scene
         */
        addToScene(scene : THREE.Scene) {
            scene.add(this);
        }

        /**
         * Reset the camera to its resetElements, and finishes any motion
         */
        reset() {
            this.t = NaN;
            this.resetPosition();
            this.recommendationClicked = 0;
        }

        /**
         * Reset the position of th camera
         */
        resetPosition() {
            mth.copy(this.resetElements.position, this.position);
            mth.copy(this.resetElements.target, this.target);
            this.anglesFromVectors();
        }

        /**
         * Creates a list containing all the elements to send to the server to stream visible part
         * @return {Array} A list containing <ol start="0">
         * <li>the position of the camera</li>
         * <li>the target of the camera</li>
         * <li>and planes defining the frustum of the camera (a,b,c, and d from ax+by+cz+d=0)</li>
         * </ol>
         */
        toList() : any[] {

            var camera = this; // (this.recommendationClicked === null ? this : this.cameras[this.recommendationClicked].camera);

            camera.updateMatrix();
            camera.updateMatrixWorld(true);

            camera.matrixWorldInverse.getInverse(camera.matrixWorld);

            var frustum = new THREE.Frustum();

            frustum.setFromMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));

            var ret =
                [[camera.position.x, camera.position.y, camera.position.z],
                    [camera.target.x,   camera.target.y,   camera.target.z],
                    this.recommendationClicked
            ];

            for (var i = 0; i < frustum.planes.length; i++) {

                var p = frustum.planes[i];

                ret.push([
                    p.normal.x, p.normal.y, p.normal.z, p.constant
                ]);

            }

            return ret;

        }



    }

}

export = l3d;
