import * as config from 'config';
import * as fs from 'fs';
import * as THREE from 'three';
import * as l3d from 'l3d';
import * as l3dp from 'l3dp';
import * as log from '../lib/log';
import * as mth from 'mth';

import { Vertex } from './Vertex';
import { TexCoord } from './TexCoord';
import { Normal } from './Normal';
import { Face } from './Face';
import { Vector, Sendable, CameraItf, Frustum, Data, Plane } from './Interfaces';
import { MeshContainer } from './MeshContainer';
import { Transformation } from './Transformation';
import { ConfigGenerator, Config } from './ConfigGenerators/ConfigGenerator';
import { CullingGenerator } from './ConfigGenerators/Culling';
import { createConfigFromPolicy } from './ConfigGenerators/createConfigFromPolicy';

import { Meshes } from './loadMeshes';

import { MeshStreamerBase, isInFrustum, predictionTables, facesToSend } from './MeshStreamerBase';

module geo {

    /**
     * A class that streams easily a mesh via socket.io
     */
    export class MeshStreamer extends MeshStreamerBase {

        /**
         * @param {string} path to the mesh
         */
        constructor(path? : string) {

            super(path);

        }

        onMaterials() {
            var data = this.nextMaterials();
            this.socket.emit('elements', data);
        }

        onNext(_camera ?: any[]) {

            var oldTime = Date.now();

            var cameraFrustum : Frustum;
            var beginning = this.beginning;
            var cameraExists = false;

            // Clean camera attribute
            if (_camera !== null) {

                cameraFrustum = {
                    position: {
                        x: _camera[0][0],
                        y: _camera[0][1],
                        z: _camera[0][2]
                    },
                    target: {
                        x: _camera[1][0],
                        y: _camera[1][1],
                        z: _camera[1][2]
                    },
                    planes: []
                };

                var recommendationClicked = _camera[2];

                if (recommendationClicked !== null) {

                    this.previousReco = recommendationClicked;

                }

                for (let i = 3; i < _camera.length; i++) {

                    cameraFrustum.planes.push({
                        normal: {
                            x: _camera[i][0],
                            y: _camera[i][1],
                            z: _camera[i][2]
                        },
                        constant: _camera[i][3]
                    });

                }

                cameraExists = true;

            }

            if (cameraExists) {

                // Create config for proportions of chunks
                var didPrefetch = false;
                var config = this.generator.generateMainConfig(cameraFrustum, recommendationClicked);

                // Send next elements
                var next = this.nextElements(config);

                // console.log(
                //     'Adding ' +
                //     next.size +
                //     ' for newConfig : '
                //     + JSON.stringify(config.map(function(o) { return o.proportion}))
                // );


                if (this.beginning === true && next.size < this.chunk) {

                    this.beginning = false;
                    config = this.generator.generateMainConfig(cameraFrustum, recommendationClicked);

                }

                var fillElements = this.nextElements(config, this.chunk - next.size);

                next.buffers = fillElements.buffers;
                next.data.push.apply(next.data, fillElements.data);
                next.size += fillElements.size;

                // Chunk is not empty, compute fill config
                if (next.size < this.chunk) {

                    config = this.generator.generateFillingConfig(config, next, cameraFrustum, recommendationClicked);
                    fillElements = this.nextElements(config, this.chunk - next.size);

                    next.data.push.apply(next.data, fillElements.data);
                    next.size += fillElements.size;

                }

                // If still not empty, fill linear
                if (next.size < this.chunk) {

                    fillElements = this.nextElements([], this.chunk - next.size);

                    next.data.push.apply(next.data, fillElements.data);
                    next.size += fillElements.size;

                }

            } else {

                config = this.backupGenerator.generateMainConfig();
                next = this.nextElements(config, this.chunk);

            }

            log.debug('Chunk of size ' + next.size + ' (generated in ' + (Date.now() - oldTime) + 'ms)');

            if (next.data.length === 0) {

                this.socket.disconnect();

            } else {

                this.socket.emit('elements', next.data);

            }

        }

    }

}

export = geo;
