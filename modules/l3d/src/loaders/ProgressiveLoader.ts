import * as config from 'config';
import * as THREE from 'three';
import * as io from 'socket.io';
import * as mth from 'mth';

import { SphericCamera } from '../cameras/SphericCamera';
import { BaseRecommendation } from '../recommendations/BaseRecommendation';

import { StreamedElementType, StreamedElement, parseList } from './LoaderFunctions';
import { BaseLoader } from './BaseLoader';

module l3d {

    /**
     * Loads a mesh from socket.io
     */
    export class ProgressiveLoader extends BaseLoader {

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

        constructor(path : string, loadingConfig : config.LoadingConfig, callback ?: Function, log ?: Function) {

            super(path, loadingConfig, callback, log);

            this.texturesPath = this.objPath.substring(0, path.lastIndexOf('/')) + '/';
            this.mtlPath = this.objPath.replace('.obj', '.mtl');

            this.parts = [];
            this.mtlLoader = typeof THREE.MTLLoader === 'function' ? new THREE.MTLLoader(this.texturesPath) : null;

            this.numberOfFaces = -1;
            this.numberOfFacesReceived = 0;

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

            console.log(StreamedElementType[elt.type]);

            if (elt.type === StreamedElementType.VERTEX) {

                // New vertex arrived

                // Fill the array of vertices with null vector (to avoid undefined)
                while (elt.index > this.vertices.length) {

                    this.vertices.push(new THREE.Vector3());

                }

                this.vertices[elt.index] = new THREE.Vector3(elt.x, elt.y, elt.z);

                if (this.currentPart !== undefined)
                    (<THREE.Geometry>this.currentPart.mesh.geometry).verticesNeedUpdate = true;

            } else if (elt.type === StreamedElementType.TEX_COORD) {

                // New texCoord arrived
                this.texCoords[elt.index] = new THREE.Vector2(elt.x, elt.y);

                if (this.currentPart !== undefined)
                    (<THREE.Geometry>this.currentPart.mesh.geometry).uvsNeedUpdate = true;

            } else if (elt.type === StreamedElementType.NORMAL) {

                // New normal arrived
                this.normals[elt.index] = new THREE.Vector3(elt.x, elt.y, elt.z);

            } else if (elt.type === StreamedElementType.USEMTL) {

                console.log("USEMTL");

                // Create mesh material
                var material : THREE.Material;

                if (elt.materialName === null || this.materialCreator === undefined) {

                    // If no material, create a default material
                    material = new THREE.MeshLambertMaterial({color: 'red'});

                } else {

                    // If material name exists, load if from material, and do a couple of settings
                    material = this.materialCreator.materials[elt.materialName.trim()];

                    material.side = THREE.DoubleSide;

                    if (material.map)
                        material.map.wrapS = material.map.wrapT = THREE.RepeatWrapping;
                }

                // Create mesh geometry
                this.uvs = [];
                var geometry = new THREE.Geometry();
                geometry.vertices = this.vertices;
                geometry.faces = [];

                // If texture coords, init faceVertexUvs attribute
                if (elt.texCoordsExist) {
                    geometry.faceVertexUvs = [this.uvs];
                }

                // Create mesh
                var mesh = new THREE.Mesh(geometry, material);
                this.parts.push({mesh : mesh, added : false, faceNumber : elt.fLength});
                this.currentPart = this.parts[this.parts.length - 1];

                if (typeof this.callback === 'function') {
                    this.callback(mesh);
                }

            } else if (elt.type === StreamedElementType.FACE) {

                console.log(elt);
                console.log(this.parts);

                this.numberOfFacesReceived++;

                if (!this.parts[elt.mesh].added) {

                    this.parts[elt.mesh].added = true;
                    this.obj.add(this.parts[elt.mesh].mesh);

                }

                var currentPart = this.parts[elt.mesh];
                var currentGeometry = (<THREE.Geometry>currentPart.mesh.geometry);

                if (
                    currentGeometry.vertices[elt.a] === undefined ||
                    currentGeometry.vertices[elt.b] === undefined ||
                    currentGeometry.vertices[elt.c] === undefined)
                {
                    console.warn("Face received before vertex");
                }

                if (elt.aNormal !== undefined) {
                    currentGeometry.faces.push(new THREE.Face3(elt.a, elt.b, elt.c, [this.normals[elt.aNormal], this.normals[elt.bNormal], this.normals[elt.cNormal]]));
                } else {
                    currentGeometry.faces.push(new THREE.Face3(elt.a, elt.b, elt.c));
                    currentGeometry.computeFaceNormals();
                    currentGeometry.computeVertexNormals();
                }

                if (elt.aTexture !== undefined) {

                    currentGeometry.faceVertexUvs[0].push([this.texCoords[elt.aTexture], this.texCoords[elt.bTexture], this.texCoords[elt.cTexture]]);

                }

                currentGeometry.verticesNeedUpdate = true;
                currentGeometry.uvsNeedUpdate = true;
                currentGeometry.normalsNeedUpdate = true;
                currentGeometry.groupsNeedUpdate = true;

                if (currentPart.faceNumber === currentGeometry.faces.length || typeof module === 'object') {

                    currentGeometry.computeBoundingSphere();

                }

            } else if (elt.type === StreamedElementType.GLOBAL) {

                this.numberOfFaces = elt.numberOfFaces;
                this.modulus = Math.floor(this.numberOfFaces / 200);

            }
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
            for (var m of this.parts) {
                (<THREE.Geometry>m.mesh.geometry).computeBoundingSphere();
            }
        }

    }

}

export = l3d;
