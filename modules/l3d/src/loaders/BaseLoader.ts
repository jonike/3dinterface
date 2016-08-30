import * as config from 'config';
import * as THREE from 'three';
import * as sio from 'socket.io';
import * as mth from 'mth';

import { SphericCamera } from '../cameras/SphericCamera';
import { BaseRecommendation } from '../recommendations/BaseRecommendation';

import { StreamedElementType, StreamedElement, parseList } from './LoaderFunctions';

module l3d {

    /**
     * A base class for the progressive loaders
     */
    export abstract class BaseLoader {

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
        socket : SocketIOClient.Socket;

        /**
         * Reference to the camera
         */
        camera : SphericCamera;

        /**
         * Callback to call on the object when they're created
         */
        callback : Function

        /**
         * Indicates which type of prefetch is used
         */
        loadingConfig : config.LoadingConfig;

        /** Indicates if the download is finished */
        finished : boolean;

        /** Function to be called when the loading is completed */
        onFinished : Function;

        /** Function to be called when the loading is completed */
        static onFinished : Function;

        /** Function to be called before asking for new elements */
        onBeforeEmit : Function;

        /** We will log one time out of modulus */
        modulus : number;

        /** Function called with parameters that indicate the progress of the loading */
        log : Function;

        /**
         * Builds a progressive loader
         * @param path path to the model
         * @param loadingConfig the loading config and prefetching policy
         * @param callback callback to call on each part of the model when they are loadedd
         * @param log callback to call from time to time to know the progress of the loading
         */
        constructor(path : string, loadingConfig : config.LoadingConfig, callback ?: Function, log ?: Function) {

            this.objPath = path;

            this.obj = new THREE.Object3D();

            this.vertices = [];
            this.texCoords = [];
            this.normals = [];
            this.uvs = [];
            this.loadingConfig = loadingConfig;

            this.onFinished = callback;

            this.finished = false;
            this.modulus = 150;
            this.log = log;

        }


        /**
         * Will return a list representation of the camera (to be sent to the server)
         */
        getCamera() : any[] {
            if (this.camera === null || typeof this.camera.toList !== 'function')
                return null;

            return this.camera.toList();
        };

        /**
         * Sets the camera of the loader. Important if the loading policy depends on the camera's position
         * @param camera camera to use for the loading
         */
        setCamera(camera : SphericCamera) {
            this.camera = camera;
        }

        /**
         * Creates the socket, initializes the io callbacks and starts the loading of the model
         */
        load() : void {

            // If node, use require, otherwise, use global io
            if (typeof module !== 'undefined') {
                this.socket = require('socket.io-client').connect('http://localhost:4000?isTest=1', {multiplex:false});
            } else {
                this.socket = io();
            }

            this.initIOCallbacks();
            this.start();

        }

        /**
         * Starts the communication with the server
         */
        start() {
            this.socket.emit('request', this.objPath, this.loadingConfig);
        }

        /**
         * Function called when elements arrive
         * This function must ask for other elements when it's finished
         * @param arr list of the streamed elements that arrived
         */
        abstract onElements(arr : StreamedElement[]) : void;

        /**
         * Initializes the socket.io functions so that it can discuss with the server
         */
        initIOCallbacks() {

            this.socket.on('ok', () => {
                this.socket.emit('materials', this.getCamera());
            });

            this.socket.on('elements', (arr : any[]) => {
                this.onElements(arr.map(parseList));
            });

            this.socket.on('disconnect', () => {

                this.socket.disconnect();

                this.finished = true;

                if (typeof BaseLoader.onFinished === 'function') {
                    BaseLoader.onFinished();
                }

                if (typeof this.onFinished === 'function') {
                    this.onFinished();
                }

            });
        }

        /**
         * Send a message to the server to ask for new elements
         */
        askNewElements() {

            if (typeof this.onBeforeEmit === 'function') {
                this.onBeforeEmit();
            }

            this.socket.emit('next', this.getCamera());
        }

    }

}

export = l3d;
