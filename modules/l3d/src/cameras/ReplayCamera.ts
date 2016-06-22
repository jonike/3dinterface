import * as mth from 'mth';
import * as THREE from 'three';
import { BaseCamera } from './BaseCamera';
import { CameraItf } from '../utils/Logger';
import { BaseRecommendation } from '../recommendations/BaseRecommendation';

module l3d {

    export class ReplayCamera extends BaseCamera {

        coins : any;

        /**
         * Indicates if the replay has started
         */
        started : boolean;

        counter : number;

        position : THREE.Vector3;

        target : THREE.Vector3;

        newPosition : THREE.Vector3;

        newTarget : THREE.Vector3;

        oldPosition : THREE.Vector3;

        oldTarget : THREE.Vector3;

        moving : boolean;
        movingHermite : boolean;

        hermitePosition : any;
        hermiteAngles : any;

        forward : THREE.Vector3;

        t : number;

        data : any;

        callback : () => any;
        recoverCallback : () => any;

        recovering : boolean;

        path : any;

        theta : number;
        phi : number;

        shouldRecover : boolean;

        recommendationClicked : number;

        isArrow : boolean;

        totalTime : number;

        quittingTime : number;

        event : any;

        finished : boolean;

        cameras : BaseRecommendation[];

        logReco : (b : boolean, n : number) => any;

        resetElements : {
            position : THREE.Vector3,
            target : THREE.Vector3
        };

        constructor(
            arg0: any,
            arg1: any,
            arg2: any,
            arg3: any,
            arg4: any,
            arg5: any,
            arg6: () => any
        ) {

            super(arg0, arg1, arg2, arg3);
            this.coins = arguments[4];

            this.started = false;
            this.counter = 0;

            this.position = new THREE.Vector3();
            this.target = new THREE.Vector3();
            this.newPosition = new THREE.Vector3();
            this.newTarget = new THREE.Vector3();

            this.data = arguments[5];
            this.callback = arguments[6];

            this.started = true;
            this.path = this.data.events;

            // Set Position
            this.theta = Math.PI;
            this.phi = Math.PI;

            this.shouldRecover = false;

            this.recommendationClicked = null;

            this.isArrow = false;

            this.totalTime = 0;

            this.quittingTime = Infinity;

        }

        look() {
            this.lookAt(this.target);
        }

        start() {
            this.counter = 0;
            this.started = true;
            this.nextEvent();
        }

        update(time : number) : boolean {
            this.totalTime += time;
            if (this.totalTime > this.quittingTime) {
                process.exit(0);
            }
            if (this.started) {
                if (this.event.type == 'camera') {
                    this.cameraMotion(time);
                } else if (this.event.type == 'previousnext') {
                    this.linearMotion(time / 5);
                } else if (this.event.type == 'arrow') {
                    this.hermiteMotion(time);
                }
                // } else if (this.event.type == 'coin') {
                //     // Nothing to do
                // } else if (this.event.type == 'reset') {
                //     // Nothing to do
                // }
            }

            return this.finished;
        }

        linearMotion(time : number) {
            var tmp = mth.sum(mth.mul(this.oldPosition, 1-this.t), mth.mul(this.newPosition, this.t));
            this.position.copy(tmp);
            this.t += 0.1 * time / 20;

            if (this.t > 1) {
                this.nextEvent();
            }
        }

        cameraMotion(time : number) {

            var tmp = mth.sum(mth.mul(this.oldPosition, 1-this.t), mth.mul(this.newPosition, this.t));
            this.position.copy(tmp);
            this.target = mth.sum(mth.mul(this.oldTarget, 1-this.t), mth.mul(this.newTarget, this.t));
            this.t += this.recovering ? 0.01 : 1 / (((new Date(this.path[this.counter].time)).getTime() - (new Date(this.path[this.counter-1].time)).getTime()) / 20);

            if (this.t > 1) {
                this.recommendationClicked = null;
                if (typeof this.recoverCallback === 'function') {
                    this.recoverCallback();
                    this.recoverCallback = null;
                } else {
                    this.nextEvent();
                }

            }
        }

        hermiteMotion(time : number) {
            var e = this.hermitePosition.eval(this.t);
            this.position.copy(e);

            this.target = mth.sum(this.position, this.hermiteAngles.eval(this.t));

            this.t += 0.01 * time / 20;

            if (this.t > 1) {
                this.recommendationClicked = null;
                this.nextEvent();
            }
        }

        nextEvent() {

            var self = this;

            if (self.isArrow) {
                self.isArrow = false;
                if (typeof self.logReco === 'function') {
                    var info = self.logReco(false, self.totalTime);
                    // require('fs').appendFileSync(info.path, info.value);
                }
                // process.stderr.write('\033[31mArrowclicked finished !\033[0m\n');
            }

            this.counter++;

            // Finished
            if (this.counter >= this.path.length) {
                this.started = false;
                this.finished = true;
                // console.log('The replay is finished');
                if (typeof this.callback === 'function') {
                    this.callback();
                }
                return;
            }

            this.event = this.path[this.counter];
            // console.log(this.event.type);

            if (this.event.type == 'camera') {
                this.move(this.event);
            } else if (this.event.type == 'coin') {
                // Get the coin with the same id of event
                for (var i = 0; i < this.coins.length; i++) {
                    if (this.coins[i].id === this.event.id)
                        this.coins[i].get();
                }
                this.nextEvent();
                // Wait a little before launching nextEvent
                // (function(self) {
                //     setTimeout(function() {
                //         self.nextEvent();
                //     },500);
                // })(this);
            } else if (this.event.type == 'arrow') {
                self.isArrow = true;
                if (typeof self.logReco === 'function') {
                    var info = self.logReco(true, self.totalTime);
                    // require('fs').appendFileSync(info.path, info.value);
                }
                // process.stderr.write('\033[33mArrowclicked ! ' + JSON.stringify(self.cameras[self.event.id].camera.position) + '\033[0m\n');
                if (self.quittingTime === Infinity)
                    self.quittingTime = self.totalTime + 6000;
                if (this.shouldRecover) {
                    (function(self : ReplayCamera, tmp : number) {
                        self.event.type = 'camera';
                        self.recovering = true;
                        self.move({
                            position: self.position.clone(),
                            target: self.cameras[self.event.id].camera.position.clone()
                        }, function() {
                            self.recovering = false;
                            self.event.type = 'arrow';
                            self.moveReco(tmp);
                        });
                    })(this, this.event.id);
                } else {
                    this.moveReco(this.event.id);
                }
            } else if (this.event.type == 'reset') {
                this.reset();
                this.nextEvent();
                //(function (self) {
                //    setTimeout(function() {
                //        self.nextEvent();
                //    },500);
                //})(this);
            } else if (this.event.type == 'previousnext') {
                this.move(this.event);
            } else {
                // Ignore other events
                this.nextEvent();
            }
        }

        reset() {
            this.resetPosition();
            this.moving = false;
            this.movingHermite = false;
        }

        resetPosition() {
            this.position.copy(this.resetElements.position);
            this.target.copy(this.resetElements.target);
            this.anglesFromVectors();
        }

        vectorsFromAngles() {
            // Update direction
            this.forward.y = Math.sin(this.phi);

            var cos = Math.cos(this.phi);
            this.forward.z = cos * Math.cos(this.theta);
            this.forward.x = cos * Math.sin(this.theta);
            this.forward.normalize();
        }

        anglesFromVectors() {
            // Update phi and theta so that return to reality does not hurt
            var forward = mth.diff(this.target, this.position);
            forward.normalize();

            this.phi = Math.asin(forward.y);

            // Don't know why this line works... But thanks Thierry-san and
            // Bastien because it seems to work...
            this.theta = Math.atan2(forward.x, forward.z);
        }

        move(recommendation : BaseRecommendation | CameraItf, callback ?: () => any) {

            if (typeof callback === 'function') {

                this.recoverCallback = callback;

            }

            var otherCamera : CameraItf = (<BaseRecommendation>recommendation).camera || <CameraItf>recommendation;

            this.moving = true;
            this.oldTarget =   this.target.clone();
            this.oldPosition = this.position.clone();
            this.newTarget =   new THREE.Vector3(otherCamera.target.x, otherCamera.target.y, otherCamera.target.z);
            this.newPosition = new THREE.Vector3(otherCamera.position.x, otherCamera.position.y, otherCamera.position.z);

            this.t = 0;

        }

        moveHermite(recommendation : BaseRecommendation | CameraItf) {

            if (this.shouldRecover === false) {
                this.shouldRecover = true;
            }

            var otherCamera  : CameraItf = (<BaseRecommendation>recommendation).camera || <CameraItf>recommendation;

            this.movingHermite = true;
            this.t = 0;

            this.hermitePosition = new mth.Hermite.special.Polynom(
                mth.copy(this.position),
                mth.copy(otherCamera.position),
                mth.mul(mth.diff(otherCamera.target, otherCamera.position).normalize(),4)
            );

            this.hermiteAngles = new mth.Hermite.special.Polynom(
                mth.diff(this.target, this.position),
                mth.diff(otherCamera.target, otherCamera.position),
                new THREE.Vector3()
            );
        }

        moveReco(recommendationId : number) {

            this.recommendationClicked = recommendationId;

            // process.stderr.write('Moving to ' + JSON.stringify(this.cameras[recommendationId].camera.position) + '\n');
            this.moveHermite(this.cameras[recommendationId]);

        }

        save() {

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
