import { Frustum, Data } from '../Interfaces';
import { ConfigGenerator, Config } from './ConfigGenerator';
import { MeshStreamer } from '../MeshStreamer';

module geo {

    /**
     * Class that represents a generator that streams first the frustum of the
     * camera, and then linearly according to the .obj file
     */
    export class CullingGenerator extends ConfigGenerator {
        /**
         * @param streamer the parent mesh streamer
         */
        constructor(streamer : MeshStreamer) {

            super(streamer);

        }

        /**
         * Generates a configuration with only the camera frustum, with proportion of 1
         * @returns a configuration with one element corresponding to the camera frustum
         */
        generateMainConfig(cameraFrustum : Frustum, recommendationClicked? : number) : Config {

            var config : Config;

                // Case without prefetch
                console.log("No prefetching");
                return [{ frustum: cameraFrustum, proportion: 1}];

        }

        /**
         * Generates an empty configuration
         * @returns an empty array
         */
        generateFillingConfig(previousConfig? : Config, previousData? : Data, cameraFrustum? : Frustum, recommendationClicked? : number) : Config {

            return [];

        }

    }

}

export = geo;
