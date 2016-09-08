import * as config from 'config';
import * as THREE from 'three';
import * as io from 'socket.io';
import * as mth from 'mth';

import { SphericCamera } from '../cameras/SphericCamera';
import { BaseRecommendation } from '../recommendations/BaseRecommendation';

import { StreamedElementType, StreamedElement, parseList, parseLine } from './LoaderFunctions';
import { BaseLoader } from './BaseLoader';

if (typeof module !== undefined && module.exports) {
    var XMLHttpRequest = eval("require('xmlhttprequest')");
}
// var XMLHttpRequest : {
//     prototype: XMLHttpRequest;
//     new (): XMLHttpRequest;
//     LOADING: number;
//     DONE: number;
//     UNSENT: number;
//     OPENED: number;
//     HEADERS_RECEIVED: number;
// } = require('xmlhttprequest').XMLHttpRequest;

module l3d {

    /**
     * Loads a mesh from socket.io
     */
    export class XHRProgressiveLoader extends BaseLoader {

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
         * Size of the chunk for each xhr
         */
        chunkSize : number;

        /**
         * The index of the byte we're loading
         */
        currentByte : number;

        /**
         * The begining of the last line if it is broken
         */
        beginingOfCurrentLine : string;

        /**
         * The size of the obj file in bytes
         */
        size : number;

        /**
         * Stores the materials
         */
        materialCreator : THREE.MTLLoader.MaterialCreator;

        constructor(path : string, callback ?: Function, log ?: Function) {

            super(path, null, callback, log);

            this.texturesPath = this.objPath.substring(0, path.lastIndexOf('/')) + '/';
            this.mtlPath = this.objPath.replace('.obj', '.mtl');

            this.parts = [];
            this.mtlLoader = typeof THREE.MTLLoader === 'function' ? new THREE.MTLLoader(this.texturesPath) : null;

            this.numberOfFaces = -1;
            this.numberOfFacesReceived = 0;

            this.chunkSize = 1000;
            this.currentByte = 0;
            this.beginingOfCurrentLine = '';

            this.size = Infinity;

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

                    this.loadModel();

                });

            } else {

                this.loadModel();

            }

        }

        /**
         * Loads the geometry and topology of the model
         */
        loadModel() { this.askNewElements(); }

        onReadyStateChange(xhr : any) {

            if (xhr.readyState != 4) {
                return;
            }

            let lines = xhr.responseText.split('\n');
            this.currentByte += this.chunkSize;

            this.addElement(parseLine(this.beginingOfCurrentLine + lines.shift()));

            this.beginingOfCurrentLine = lines[lines.length-1];
            lines.length--;

            for (let line of lines) {
                this.addElement(parseLine(line));
            }

            if (xhr.getResponseHeader("Content-Length") < this.chunkSize) {
                // console.log("Finished !");
                return;
            }

            this.askNewElements();

        }

        askNewElements() {

            // Send a new XHR
            let xhr = new XMLHttpRequest();
            xhr.open('GET', 'http://localhost:8000/' + this.objPath, true);
            xhr.setRequestHeader('Range', 'bytes=' + this.currentByte + '-' + (this.currentByte + this.chunkSize - 1));
            xhr.onreadystatechange = () => { this.onReadyStateChange(xhr); }
            xhr.send(null);

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

            if (elt.type === StreamedElementType.VERTEX) {

                // New vertex arrived
                this.vertices.push(new THREE.Vector3(elt.x, elt.y, elt.z));

                if (this.currentPart !== undefined)
                    (<THREE.Geometry>this.currentPart.mesh.geometry).verticesNeedUpdate = true;

            } else if (elt.type === StreamedElementType.TEX_COORD) {

                // New texCoord arrived
                this.texCoords.push(new THREE.Vector2(elt.x, elt.y));

                if (this.currentPart !== undefined)
                    (<THREE.Geometry>this.currentPart.mesh.geometry).uvsNeedUpdate = true;

            } else if (elt.type === StreamedElementType.NORMAL) {

                // New normal arrived
                this.normals.push(new THREE.Vector3(elt.x, elt.y, elt.z));

            } else if (elt.type === StreamedElementType.USEMTL) {

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

                this.numberOfFacesReceived++;

                if (!this.currentPart.added) {

                    this.currentPart.added = true;
                    this.obj.add(this.currentPart.mesh);

                }

                var currentPart = this.currentPart;
                var currentGeometry = (<THREE.Geometry>currentPart.mesh.geometry);

                if (
                    currentGeometry.vertices[elt.a] === undefined ||
                    currentGeometry.vertices[elt.b] === undefined ||
                    currentGeometry.vertices[elt.c] === undefined)
                {
                    console.log(currentGeometry.vertices);
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
