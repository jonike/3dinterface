import { Frustum, Data } from '../Interfaces';
import { ConfigGenerator, Config } from './ConfigGenerator';
import { MeshStreamer } from '../MeshStreamer';
import { V_PP_Generator } from './V_PP';

import * as log from '../../lib/log';

module geo {

    /**
     * Class that represents a generator that streams the current recommendation clicked if any, or the frustum, and tries to preload recommendations that might be clicked
     */
    export class V_PP_PD_Generator extends V_PP_Generator {
        /**
         * @param streamer {geo.MeshStreamer} the parent mesh streamer
         */
        constructor(streamer : MeshStreamer) {

            super(streamer);

        }


        /**
         * Generates a config that streams partly the frustum, and splits the rest of the chunk among the recommendations that are likely to be clicked
         * @param cameraFrustum the frustum of the camera (with its position, target, and planes)
         * @param recommendationClicked id of the recommendation (can be null if no recommendations are clicked)
         * @returns an array with one element corresponding the current recommendation or the camera frustum, and others for eventual recommendations to preload
         */
        generateMainConfig(cameraFrustum? : Frustum, recommendationClicked? : number) : Config {

            var config : Config;

            if (recommendationClicked != null) {

                if (this.streamer.beginning === true) {
                    this.streamer.beginning = false;
                }

                // Case full reco
                log.debug("Going to " + recommendationClicked);
                // log.debug("Recommendation is clicking : full for " + JSON.stringify(this.streamer.mesh.recommendations[recommendationClicked].position));
                config = [{recommendationId : recommendationClicked, proportion: 1, smart:true}];



            } else if (this.streamer.beginning === true) {

                log.debug('Begining : full init');
                config = [{recommendationId : 0, proportion:1, smart: true}];


            } else {

                // Case full prefetch
                log.debug("Allow some prefetching");

                config = [{ frustum: cameraFrustum, proportion : this.streamer.frustumPercentage}];

                // Find best recommendation
                var bestReco : any;
                var bestScore = -Infinity;
                var bestIndex : number = null;

                if (this.streamer.predictionTable !== undefined) {

                    var sum = 0;

                    for (var i = 1; i <= this.streamer.mesh.recommendations.length; i++) {

                        sum += this.streamer.predictionTable[this.streamer.previousReco][i];

                    }

                    for (var i = 1; i <= this.streamer.mesh.recommendations.length; i++) {

                        if (this.streamer.predictionTable[this.streamer.previousReco][i] > 0) {

                            config.push({

                                proportion : this.streamer.predictionTable[this.streamer.previousReco][i] * this.streamer.prefetchPercentage / sum,
                                recommendationId : i,
                                smart: true

                            });

                        }

                    }

                } else {

                    process.stderr.write('ERROR : PREDICTION TABLE IF UNDEFINED');

                }

            }

            return config;

        }

        /**
         * Generates a config that depends on the previous configuration and that tries to fill the recommendations that were not already filled.
         * @param previousConfig the previous configuration list (that was launched on <code>generateMainConfig</code>
         * @param previousData the data that were given by the <code>nextElements</code> method on {@link MeshStreamer}
         * @param cameraFrustum the frustum of the camera, containing its position, target and planes
         * @returns a configuration that tries to fill what was not filled before
         */
        generateFillingConfig(previousConfig? : Config, previousData? : Data, cameraFrustum? : Frustum, recommendationClicked? : number) : Config {

            var sum = 0;
            var newConfig : Config = [];

            for (var i = 0; i < previousConfig.length; i++) {

                // Check if previousConfig was full
                if (previousData.buffers[i].size >= this.streamer.chunk * previousConfig[i].proportion) {

                    newConfig.push(previousConfig[i]);
                    sum += previousConfig[i].proportion;

                }

            }

            // Normalize previousConfig probabilities
            for (var i = 0; i < newConfig.length; i++) {

                newConfig[i].proportion /= sum;

            }

            return newConfig;

        }

    }

}

export = geo;
