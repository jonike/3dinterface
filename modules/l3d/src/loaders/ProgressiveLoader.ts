import * as config from 'config';
import * as THREE from 'three';
import * as io from 'socket.io';
import * as mth from 'mth';

import { PointerCamera } from '../cameras/PointerCamera';

module l3d {

    enum StreamedElementType {

        VERTEX,
        TEX_COORD,
        FACE,
        NORMAL,
        USEMTL,
        GLOBAL

    }

    interface StreamedElement {

        type : StreamedElementType;

        index ?: number;

        x ?: number;
        y ?: number;
        z ?: number;

        mesh ?: number;

        a ?: number;
        b ?: number;
        c ?: number;

        aTexture ?: number;
        bTexture ?: number;
        cTexture ?: number;

        aNormal ?: number;
        bNormal ?: number;
        cNormal ?: number;

        materialName ?: string;
        vLength ?: number;
        fLength ?: number;
        texCoordsExist ?: boolean;
        normalsExist ?: boolean;

        numberOfFaces ?: number;

    }


    /**
     * Parse a list as it is sent by the server and gives a slightly more comprehensible result
     * @param arr array corresponding to the line of the mesh file
     * @returns A streamed element easy to manage
     */
    function parseList(arr : any[]) : StreamedElement {

        var ret : StreamedElement = { type : null };
        ret.index = arr[1];

        if (arr[0] === 'v') {

            ret.type = StreamedElementType.VERTEX;
            ret.x = arr[2];
            ret.y = arr[3];
            ret.z = arr[4];

        } else if (arr[0] === 'vt') {

            ret.type = StreamedElementType.TEX_COORD;
            ret.x = arr[2];
            ret.y = arr[3];

        } else if (arr[0] === 'f') {

            ret.type = StreamedElementType.FACE;
            ret.mesh = arr[2];

            // Only Face3 are allowed
            var vertexIndices  = arr[3];
            var textureIndices = arr[4];
            var normalIndices  = arr[5];

            // Vertex indices
            ret.a = vertexIndices[0];
            ret.b = vertexIndices[1];
            ret.c = vertexIndices[2];

            // Texutre indices (if they exist)
            if (textureIndices.length > 0) {
                ret.aTexture = textureIndices[0];
                ret.bTexture = textureIndices[1];
                ret.cTexture = textureIndices[2];
            }

            // Normal indices (if they exist)
            if (normalIndices.length > 0) {
                ret.aNormal = normalIndices[0];
                ret.bNormal = normalIndices[1];
                ret.cNormal = normalIndices[2];
            }

        } else if (arr[0] === 'vn') {

            // Normal
            ret.type = StreamedElementType.NORMAL;
            ret.x = arr[2];
            ret.y = arr[3];
            ret.z = arr[4];

        } else if (arr[0] === 'u') {

            // usemtl
            ret.index = -1;
            ret.type = StreamedElementType.USEMTL;
            ret.materialName = arr[1];
            ret.vLength = arr[2];
            ret.fLength = arr[3];
            ret.texCoordsExist = arr[4];
            ret.normalsExist = arr[5];

        } else if (arr[0] === 'g') {

            ret.type = StreamedElementType.GLOBAL;
            ret.index = null;
            ret.numberOfFaces = arr[1];

        }

        return ret;
    };


    /**
     * Loads a mesh from socket.io
     */
    export class ProgressiveLoader {

        /**
         * Path to the .obj file
         */
        objPath : string;

        /**
         * Path to the folder where the textures are
         */
        texturesPath : string;

        /**
         * Path to the .mtl file
         */
        mtlPath : string;

        /**
         * Reference to the scene in which the object should be added
         */
        scene : THREE.Scene;

        /**
         * Callback to call on the object when they're created
         */
        callback : Function

        /**
         * Boolean indicate that we want extra lag for testing purposes
         */
        laggy : boolean;

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
        loader : THREE.MTLLoader;

        /**
         * Socket to connect to get the mesh
         */
        socket : SocketIO.Socket;

        /**
         * Reference to the camera
         */
        camera : PointerCamera;

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
         * A map that indicates if a face has been already received
         */
        mapFace : {[id:string] : boolean};

        /**
         * Indicates which type of prefetch is used
         */
        prefetch : config.PrefetchingPolicy;

        /**
         * Stores the materials
         */
        materialCreator : THREE.MTLLoader.MaterialCreator;

        /** Indicates if the download is finished */
        finished : boolean;

        /**
         * @param {string} path path to the .obj file
         * @param {THREE.Scene} scene to add the object
         * @param {PointerCamera} camera the camera that will be sent to server for smart
         * streaming (can be null, then the server will stream the mesh in the .obj
         * order)
         * @param {function} callback callback to call on the objects when they're created
         */
        constructor(path : string, scene : THREE.Scene, camera : PointerCamera, callback : Function, log : Function, laggy : boolean, prefetch : config.PrefetchingPolicy) {

            this.objPath = path;
            this.texturesPath = path.substring(0, path.lastIndexOf('/')) + '/';
            this.mtlPath = path.replace('.obj', '.mtl');

            this.scene = scene;
            this.callback = callback;
            this.laggy = laggy;

            this.obj = new THREE.Object3D();
            scene.add(this.obj);

            this.vertices = [];
            this.texCoords = [];
            this.normals = [];
            this.uvs = [];

            this.parts = [];

            this.loader = typeof THREE.MTLLoader === 'function' ? new THREE.MTLLoader(this.texturesPath) : null;

            this.socket = typeof io === 'function' ? io() : require('socket.io-client').connect('http://localhost:4000', {multiplex: false});

            this.initIOCallbacks();

            this.camera = camera;

            // if (this.camera instanceof ReplayCamera) {
            //     var _moveReco = this.camera.moveReco;

            //     this.camera.moveReco = (param : any) => {
            //         this.socket.emit('reco', param);
            //         _moveReco.apply(this.camera, [param]);
            //     };

            if (this.camera instanceof PointerCamera) {

                // Only good for sponza model
                var _moveHermite = this.camera.moveHermite;

                this.camera.moveHermite = (a:any, b:any, c:any) => {
                    this.socket.emit('reco', c);
                    _moveHermite.apply(this.camera, [a,b,c]);
                };

            }

            this.numberOfFaces = -1;
            this.numberOfFacesReceived = 0;
            this.modulus = 150;
            this.log = log;

            this.mapFace = {};

            this.prefetch = prefetch;

        }

        hasFace(face : mth.Face3) : boolean {

            return this.mapFace[(face.a) + '-' + (face.b) + '-' + (face.c)] === true;

        }

        /**
         * Starts the loading of the mesh
         */
        load(callback : () => void = ()=>{}) {

            this._callback = callback;

            if (this.loader !== null) {
                this.loader.load(this.mtlPath, (materialCreator : THREE.MTLLoader.MaterialCreator) => {

                    this.materialCreator = materialCreator;

                    materialCreator.preload();

                    this.start();

                });

            } else {

                this.start();

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

        private addElement(elt : StreamedElement) {

            if (elt.type === StreamedElementType.VERTEX) {

                // New vertex arrived

                // Fill the array of vertices with null vector (to avoid undefined)
                while (elt.index > this.vertices.length) {

                    this.vertices.push(new THREE.Vector3());

                }

                this.vertices[elt.index] = new THREE.Vector3(elt.x, elt.y, elt.z);
                (<THREE.Geometry>this.currentPart.mesh.geometry).verticesNeedUpdate = true;

            } else if (elt.type === StreamedElementType.TEX_COORD) {

                // New texCoord arrived
                this.texCoords[elt.index] = new THREE.Vector2(elt.x, elt.y);
                (<THREE.Geometry>this.currentPart.mesh.geometry).uvsNeedUpdate = true;

            } else if (elt.type === StreamedElementType.NORMAL) {

                // New normal arrived
                this.normals[elt.index] = new THREE.Vector3(elt.x, elt.y, elt.z);

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

                this.mapFace[elt.a + '-' + elt.b + '-' + elt.c] = true;

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

        addElements(arr : any[], callback : Function) {

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

                    var elt = parseList(arr.shift());
                    this.addElement(elt);

                }

                // console.log('Time to add : ' + (Date.now() - currentTime) + 'ms');
                setTimeout(() => { this.addElements(arr, callback); }, 50);
            }

        }

        /**
         * Initializes the socket.io functions so that it can discuss with the server
         */
        initIOCallbacks() {

            this.socket.on('ok', () => {
                this.socket.emit('materials');
            });

            this.socket.on('elements', (arr : any[]) => {

                // process.stderr.write('Received ' + arr.length + '\n');

                this.addElements(arr, () => {

                    var param : any;
                    if (typeof this.onBeforeEmit === 'function') {

                        param = this.onBeforeEmit();
                        this.socket.emit('next', this.getCamera(), param);

                    } else {

                        // Ask for next elements
                        if (!this.laggy) {
                            this.socket.emit('next', this.getCamera(), param);
                        } else {
                            this.socket.emit('next', this.getCamera());
                            // setTimeout(function() { this.socket.emit('next', this.getCamera());}, 100);
                        }
                    }

                });
            });

            this.socket.on('disconnect', () => {
                if (typeof this.log === 'function')
                    this.log(this.numberOfFaces, this.numberOfFaces);

                this.finished = true;

                if (typeof ProgressiveLoader.onFinished === 'function') {
                    ProgressiveLoader.onFinished();
                }

                if (typeof this.onFinished === 'function') {
                    this.onFinished();
                }

                if (typeof this._callback === 'function') {
                    this._callback();
                }

            });
        }

        computeBoundingSphere() {
            for (var m of this.parts) {
                (<THREE.Geometry>m.mesh.geometry).computeBoundingSphere();
            }
        }

        /**
         * Starts the communication with the server
         */
        start() {
            this.socket.emit('request', this.objPath, this.laggy, this.prefetch);
        }

        onFinished() {}
        _callback() {}
        onBeforeEmit() { }

        static onFinished() { }

    }

}

export = l3d;
