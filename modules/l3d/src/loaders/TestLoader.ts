import * as config from 'config';
import * as THREE from 'three';
import * as io from 'socket.io';
import * as mth from 'mth';

import { SphericCamera } from '../cameras/SphericCamera';
import { BaseRecommendation } from '../recommendations/BaseRecommendation';

import { StreamedElementType, StreamedElement, parseList } from './LoaderFunctions';

module l3d {

    /**
     * Loads a mesh from socket.io
     */
    export class TestLoader {

        /**
         * Path to the .obj file
         */
        objPath : string;

        /**
         * Group where the sub-objects will be added
         */
        obj : THREE.Object3D;

        /**
         * Array of the vertices of the mesh
         */
        vertices : THREE.Vector3[];

        /**
         * Array of the texture coordinates of the mesh
         */
        texCoords : THREE.Vector2[];

        /**
         * Array of the normal of the mesh
         */
        normals : THREE.Vector3[];

        /**
         * Array of the UV mapping
         * Each element is an array of 3 elements that are the indices
         * of the element in <code>this.texCoords</code> that should be
         * used as texture coordinates for the current vertex of the face
         */
        uvs : THREE.Vector2[][];

        /**
         * Socket to connect to get the mesh
         */
        socket : SocketIO.Socket;

        /**
         * Reference to the camera
         */
        camera : SphericCamera;

        /**
         * A map that indicates if a face has been already received
         */
        mapFace : {[id:string] : number};

        /**
         * Indicates which type of prefetch is used
         */
        loadingConfig : config.LoadingConfig;

        /** Indicates if the download is finished */
        finished : boolean;

        callback : Function;

        /**
         * @param path path to the .obj file
         * @param scene to add the object
         * @param camera the camera that will be sent to server for smart
         * streaming (can be null, then the server will stream the mesh in the .obj
         * order)
         * @param callback callback to call on the objects when they're created
         */
        constructor(path : string, scene : THREE.Scene, camera : SphericCamera, callback : Function, log : Function, loadingConfig : config.LoadingConfig) {

            this.objPath = path;

            this.obj = new THREE.Object3D();

            this.vertices = [];
            this.texCoords = [];
            this.normals = [];
            this.uvs = [];
            this.loadingConfig = loadingConfig;

            // If node, use require, otherwise, use global io
            this.socket = typeof module !== 'undefined' && module.exports ? require('socket.io-client').connect('http://localhost:4000?isTest=1', {multiplex: false}) : io();

            this.initIOCallbacks();

            this.camera = camera;

            this.mapFace = {};

        }

        hasFace(face : mth.Face3) : boolean {

            return this.mapFace[(face.a) + '-' + (face.b) + '-' + (face.c)] !== undefined;

        }

        /**
         * Starts the loading of the mesh
         */
        load(callback : () => void = ()=>{}) {

                this.start();
                this.callback = callback;

        }

        /**
         * Will return a list representation of the camera (to be sent to the server)
         */
        getCamera() : any[] {
            if (this.camera === null || typeof this.camera.toList !== 'function')
                return null;

            return this.camera.toList();
        };

        private addElement(elt : StreamedElement) {

            if (elt.type === StreamedElementType.VERTEX) {

                // New vertex arrived
                this.vertices[elt.index] = new THREE.Vector3(elt.x, elt.y, elt.z);

            } else if (elt.type === StreamedElementType.TEX_COORD) {

                // New texCoord arrived
                this.texCoords[elt.index] = new THREE.Vector2(elt.x, elt.y);

            } else if (elt.type === StreamedElementType.NORMAL) {

                // New normal arrived
                this.normals[elt.index] = new THREE.Vector3(elt.x, elt.y, elt.z);

            } else if (elt.type === StreamedElementType.USEMTL) {

                // Like a give a ****

            } else if (elt.type === StreamedElementType.FACE) {

                this.mapFace[elt.a + '-' + elt.b + '-' + elt.c] = elt.index;

            } else if (elt.type === StreamedElementType.GLOBAL) {

                // Still don't give a ****

            }
        }

        /**
         * Initializes the socket.io functions so that it can discuss with the server
         */
        initIOCallbacks() {

            this.socket.on('ok', () => {
                this.socket.emit('next', this.getCamera());
            });

            this.socket.on('elements', (arr : any[]) => {

                // process.stderr.write('Received ' + arr.length + '\n');

                while(arr.length > 0) {

                    var elt = parseList(arr.shift());
                    this.addElement(elt);

                }

                this.socket.emit('next', this.getCamera());

            });

            this.socket.on('disconnect', () => {

                this.socket.disconnect();

                this.finished = true;
                this.callback();

                if (typeof TestLoader.onFinished === 'function') {
                    TestLoader.onFinished();
                }

                if (typeof this.onFinished === 'function') {
                    this.onFinished();
                }

            });
        }

        /**
         * Starts the communication with the server
         */
        start() {
            this.socket.emit('request', this.objPath, this.loadingConfig);
        }

        onFinished() {}
        _callback() {}
        onBeforeEmit() { }

        static onFinished() { }

    }

}

export = l3d;
