import * as config from 'config';
import * as THREE from 'three';
import * as sio from 'socket.io';
import * as mth from 'mth';

import { SphericCamera } from '../cameras/SphericCamera';
import { BaseRecommendation } from '../recommendations/BaseRecommendation';

import { StreamedElementType, StreamedElement, parseList } from './LoaderFunctions';
import { BaseLoader } from './BaseLoader';

module l3d {

    /**
     * Loads a mesh from socket.io
     */
    export class TestLoader extends BaseLoader {

        /**
         * A map that indicates if a face has been already received It maps a
         * string with vertex indices such as "123-562-128" to the index of the
         * corresponding face if it has already been received
         */
        mapFace : {[id:string] : number};

        /**
         * A map that indicates if a face has been already received. It maps
         * the index of the face to a boolean that indicates if the face has
         * been received or not
         */
        reverseMapFace : boolean[];

        constructor(path : string, loadingConfig : config.LoadingConfig, callback ?: Function, log ?: Function) {

            super(path, loadingConfig, callback, log);

            this.mapFace = {};
            this.reverseMapFace = [];

        }

        /**
         * Check if a face has been received
         * @param face the face to test
         * @returns true if the face has already been received, false otherwise
         */
        hasFace(face : mth.Face3) : boolean {

            return this.mapFace[(face.a) + '-' + (face.b) + '-' + (face.c)] !== undefined;

        }

        load(): void {

            // If node, use require, otherwise, use global io
            if (typeof module !== 'undefined') {
                this.socket = require('socket.io-client').connect('http://localhost:4000?isTest=1', {multiplex:false});
            } else {
                this.socket = io();
            }

            this.initIOCallbacks();
            this.start();

        }

        private addElement(elt : StreamedElement) {

            switch(elt.type) {

                case StreamedElementType.VERTEX: {
                    this.vertices[elt.index] = new THREE.Vector3(elt.x, elt.y, elt.z);
                    break;
                }

                case StreamedElementType.TEX_COORD: {
                    this.texCoords[elt.index] = new THREE.Vector2(elt.x, elt.y);
                    break;
                }

                case StreamedElementType.NORMAL: {
                    this.normals[elt.index] = new THREE.Vector3(elt.x, elt.y, elt.z);
                    break;
                }

                case StreamedElementType.FACE: {
                    this.mapFace[elt.a + '-' + elt.b + '-' + elt.c] = elt.index;
                    this.reverseMapFace[elt.index] = true;
                    break;
                }

                default: break;

            }
        }

        onElements(arr : StreamedElement[]) {

            while(arr.length > 0) {
                this.addElement(arr.shift());
            }

            this.askNewElements();

        }

    }

}

export = l3d;
