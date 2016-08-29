import * as mth from 'mth';
import * as THREE from 'three';
import { BaseCamera } from './BaseCamera';
import { CameraItf } from '../utils/Logger';
import { BaseRecommendation } from '../recommendations/BaseRecommendation';
import { SphericCamera } from './SphericCamera';

module l3d {

    /** Camera that replays an experiment */
    export class ReplayCamera extends SphericCamera {

        /** Array of the coins that are in this experiment */
        coins : any;

        /** Indicates if the replay has started */
        started : boolean;

        /** Number of the current event */
        counter : number;

        /** The data (JSON object) that has been collected from the server */
        data : any;

        /** Callback that is called when the replay is finished */
        callback : () => any;

        /** The list of the events of the replay */
        path : any;

        /** The number of the recommendation that is clicked */
        recommendationClicked : number;

        /** The total time since the beginning of the replay */
        totalTime : number;

        /** The time when the replay finished*/
        quittingTime : number;

        /** Current event */
        event : any;

        /** Indicates wether the replay is finished */
        finished : boolean;

        /** The recommendations that may be clicked on */
        cameras : BaseRecommendation[];

        /** The duration of a replayed motion */
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

            this.recommendationClicked = null;

            this.totalTime = 0;

            this.quittingTime = Infinity;

            this.motionDuration = 1;

        }

        /** Starts the replay */
        start() {
            this.counter = 0;
            this.started = true;
            this.nextEvent();
        }

        /**
         * Moves the camera for a certain duration
         * @param time time of the step that the camera will make
         */
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

        /** Handle the next event */
        nextEvent() {


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

        /** Starts an hermite motion to a recommendation */
        moveHermite(recommendation : BaseRecommendation, toSave ?: boolean) : void {

            this.recommendationClicked = recommendation.recommendationId + 1;

            var otherCamera = recommendation.camera;

            super.startHermiteMotion(otherCamera);

        }

        /** Starts a motion to a recommendation */
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
