import * as mth from 'mth';
import * as THREE from 'three';
import { BaseCamera } from './BaseCamera';
import { CameraItf } from '../utils/Logger';
import { BaseRecommendation } from '../recommendations/BaseRecommendation';
import { SphericCamera } from './SphericCamera';

module l3d {

    export class ReplayCamera extends SphericCamera {

        coins : any;

        /**
         * Indicates if the replay has started
         */
        started : boolean;

        counter : number;

        data : any;

        callback : () => any;
        recoverCallback : () => any;

        recovering : boolean;

        path : any;

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

            this.data = arguments[5];
            this.callback = arguments[6];

            this.started = true;
            this.path = this.data.events;

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

            super.update(time);

            this.totalTime += time;

            if (this.totalTime > this.quittingTime) {
                process.exit(0);
            }

            if (this.started) {

            }

            return this.finished;
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
                this.startLinearMotion(this.event);
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
                        self.startLinearMotion({
                            position: self.position.clone(),
                            target: self.cameras[self.event.id].camera.position.clone()
                        }/*, function() {
                            self.recovering = false;
                            self.event.type = 'arrow';
                            self.moveReco(tmp);
                        }*/);
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
                this.startLinearMotion(this.event);
            } else {
                // Ignore other events
                this.nextEvent();
            }
        }

        reset() {
            this.resetPosition();
        }

        resetPosition() {
            this.position.copy(this.resetElements.position);
            this.target.copy(this.resetElements.target);
            this.anglesFromVectors();
        }

        moveReco(recommendationId : number) {

            this.recommendationClicked = recommendationId;

            // process.stderr.write('Moving to ' + JSON.stringify(this.cameras[recommendationId].camera.position) + '\n');
            this.startHermiteMotion(this.cameras[recommendationId].camera);

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
