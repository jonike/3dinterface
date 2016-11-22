import * as config from 'config';
import * as THREE from 'three';
import * as io from 'socket.io';
import * as mth from 'mth';

import { SphericCamera } from '../cameras/SphericCamera';
import { BaseRecommendation } from '../recommendations/BaseRecommendation';

import { StreamedElementType, StreamedElement, parseList } from './LoaderFunctions';
import { BaseLoader } from './BaseLoader';
import { Model, BufferGeometryModel } from './Model';

module l3d {

    /**
     * Loads a mesh from socket.io
     */
    export class GenericLoader extends BaseLoader {

        /**
         * Path to the folder where the textures are
         */
        texturesPath : string;

        /**
         * Path to the .mtl file
         */
        mtlPath : string;

        /**
         * Array of all the meshes that will be added to the main object
         */
        parts : {mesh : THREE.Mesh, added : boolean, faceNumber : number}[];

        /**
         * Current part (with its mesh, its geometry, if it was added or not, and the number of its faces)
         */
        currentPart : {mesh : THREE.Mesh, added : boolean, faceNumber : number};

        /**
         * Loader for the material file
         */
        mtlLoader : THREE.MTLLoader;

        /**
         * Reference to the camera
         */
        camera : SphericCamera;

        /**
         * Number of total elements for loading
         */
        numberOfFaces : number;

        /**
         * Number of elements received
         */
        numberOfFacesReceived : number;

        /**
         * Modulus indicator (not to log too often)
         */
        modulus : number;

        /**
         * Log function : called each time with the number of elements currently
         * received and the number of elements in total as parameter
         */
        log : Function;

        /**
         * Stores the materials
         */
        materialCreator : THREE.MTLLoader.MaterialCreator;

        /**
         *
         */
        model : Model;

        constructor(path : string, loadingConfig : config.LoadingConfig, callback ?: Function, log ?: Function) {

            super(path, loadingConfig, callback, log);

            this.texturesPath = this.objPath.substring(0, path.lastIndexOf('/')) + '/';
            this.mtlPath = this.objPath.replace('.obj', '.mtl');

            this.parts = [];
            this.mtlLoader = typeof THREE.MTLLoader === 'function' ? new THREE.MTLLoader(this.texturesPath) : null;

            this.numberOfFaces = -1;
            this.numberOfFacesReceived = 0;

            this.model = new BufferGeometryModel();

        }

        /**
         * Starts the loading of the mesh
         * @param callback function to be called when the model will be fully loaded
         */
        load(callback : () => void = ()=>{}) {

            if (this.mtlLoader !== null) {
                this.mtlLoader.load(this.mtlPath, (materialCreator : THREE.MTLLoader.MaterialCreator) => {

                    this.materialCreator = materialCreator;

                    materialCreator.preload();

                    super.load();

                });

            } else {

                super.load();

            }

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
         * Add an element to the mesh that the loader is loading
         * @param elt element to add
         */
        private addElement(elt : StreamedElement) {
            this.model.addElement(elt);
        }

        /**
         * Add the streamed elements to the model
         * @param arr list of elements that should be added
         * @param callback function to call when the elements are added
         */
        addElements(arr : StreamedElement[], callback : Function) {

            var currentTime = Date.now();

            // console.log(arr.length);

            // Sync version
            // {
            //     for (var i = 0; i < arr.length; i++) {

            //         if (typeof this.log === 'function' && this.numberOfFacesReceived % this.modulus === 0) {
            //             this.log(this.numberOfFacesReceived, this.numberOfFaces);
            //         }

            //         // if (arr.length === 0) {
            //         //     // console.log('Time to add : ' + (Date.now() - currentTime) + 'ms');
            //         //     callback();
            //         //     return;
            //         // }

            //         var elt = parseList(arr[i]);
            //         this.addElement(elt);

            //     }

            //     callback();
            // }

            // Timeout version
            {
                for (var i = 0; i < 100; i++) {

                    if (typeof this.log === 'function' && this.numberOfFacesReceived % this.modulus === 0) {
                        this.log(this.numberOfFacesReceived, this.numberOfFaces);
                    }

                    if (arr.length === 0) {
                        // console.log('Time to add : ' + (Date.now() - currentTime) + 'ms');
                        callback();
                        return;
                    }

                    this.addElement(arr.shift());

                }

                // console.log('Time to add : ' + (Date.now() - currentTime) + 'ms');
                setTimeout(() => { this.addElements(arr, callback); }, 50);
            }

        }

        onElements(arr :  StreamedElement[]) {

            this.addElements(arr, () => {
                this.askNewElements();
            });

        }

        /**
         * Compute the bounding spheres of the sub meshes
         */
        computeBoundingSphere() {
            // for (var m of this.parts) {
            //     (<THREE.Geometry>m.mesh.geometry).computeBoundingSphere();
            // }
        }

    }

}

export = l3d;
