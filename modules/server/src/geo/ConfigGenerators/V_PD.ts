import { Frustum, Data } from '../Interfaces';
import { ConfigGenerator, Config } from './ConfigGenerator';
import { MeshStreamer } from '../MeshStreamer';

module geo {

    /**
     * Class that represents a generator that streams the recommendation clicked if any, of the frustum
     */
    export class V_PD_Generator extends ConfigGenerator {
        /**
         * @param streamer the parent mesh streamer
         */
        constructor(streamer : MeshStreamer) {

            super(streamer);

        }

        /**
         * Generates a config that streams everything on the recommendation clicked if any, or full on the frustum
         * @param cameraFrustum the frustum of the camera (with its position, target, and planes)
         * @param recommendationClicked id of the recommendation (can be null if no recommendations are clicked)
         * @returns an array with one element corresponding to the recommendation clicked, or the camera frustum if there are no recommendations clicked
         */
        generateMainConfig(cameraFrustum : Frustum, recommendationClicked? : number) : Config {

            var config : Config;
            if (recommendationClicked != null) {

                if (this.streamer.beginning === true) {
                    this.streamer.beginning = false;
                }

                // Case full reco
                console.log("Going to " + recommendationClicked);
                console.log("Recommendation is clicking : full for " + JSON.stringify(this.streamer.mesh.recommendations[recommendationClicked].position));
                config = [{recommendationId : recommendationClicked, proportion: 1, smart:true}];

            } else if (this.streamer.beginning === true) {

                console.log('Begining : full init');
                config = [{recommendationId : 0, proportion:1, smart: true}];


            } else {

                // Case without prefetch
                console.log("No prefetching");
                config = [{ frustum: cameraFrustum, proportion: 1}];

            }

            return config;

        }

        /**
         * Generates a configuration with only the camera frustum, with proportion of 1
         * @returns an array with one element corresponding to the camera frustum
         */
        generateFillingConfig(previousConfig? : Config, previousData? : Data, cameraFrustum? : Frustum, recommendationClicked? : number) : Config {

            return [{proportion:1, frustum: cameraFrustum}];

        };

    }

}

export = geo;
