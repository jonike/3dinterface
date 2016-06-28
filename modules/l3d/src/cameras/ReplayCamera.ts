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

        motionDuration : number;

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

            this.motionDuration = 1;

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

            var wasNaN = isNaN(this.t);
            super.update(time / this.motionDuration);

            this.totalTime += time;
            this.transitionDuration = 1;

            if (this.totalTime > this.quittingTime) {
                process.exit(0);
            }

            if (this.started) {

                if (!wasNaN && isNaN(this.t)) {
                    this.nextEvent();
                }

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
                this.motionDuration = ((new Date(this.event.time)).getTime() - (new Date(this.path[this.counter - 1].time)).getTime()) / 1000;

            } else if (this.event.type == 'coin') {

                // Get the coin with the same id of event
                for (var i = 0; i < this.coins.length; i++) {
                    if (this.coins[i].id === this.event.id)
                        this.coins[i].get();
                }

                this.nextEvent();

            } else if (this.event.type == 'arrow') {

                this.startHermiteMotion(this.cameras[this.event.id].camera);
                this.motionDuration = 2;

            } else if (this.event.type == 'reset') {

                this.reset();
                this.nextEvent();

            } else if (this.event.type == 'previousnext') {

                this.startLinearMotion(this.event);
                this.motionDuration = 2;

            } else {

                // Ignore other events
                this.nextEvent();

            }
        }

        moveHermite(recommendation : BaseRecommendation, toSave ?: boolean) : void {

            this.recommendationClicked = recommendation.recommendationId + 1;

            var otherCamera = recommendation.camera;

            super.startHermiteMotion(otherCamera);

        }

        moveReco(recommendationId : number) {

            this.recommendationClicked = recommendationId;

            // process.stderr.write('Moving to ' + JSON.stringify(this.cameras[recommendationId].camera.position) + '\n');
            this.startHermiteMotion(this.cameras[recommendationId].camera);

        }

        save() {

        }

    }

}

export = l3d;
