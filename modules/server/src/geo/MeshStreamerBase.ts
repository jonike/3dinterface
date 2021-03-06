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

module geo {

    export function readIt(sceneNumber : number, recoId : number) : {index : number, area : number}[] {

        var toZip = JSON.parse(fs.readFileSync(__dirname + '/../generated/scene-info/' + config.Scene[sceneNumber] + '/bookmark' + recoId + '.json', 'utf-8'));

        var ret : {index: number, area: number}[] = [];

        for (var i = 0; i < toZip.triangles.length; i++) {
            ret.push({
                index: toZip.triangles[i],
                area:  toZip.areas[i]
            });
        }

        return ret;
    }

    export function readAll(sceneNumber : number) : {index : number, area : number}[][] {

        let ret : {index : number, area : number}[][] = [];

        for (var i = 0; i < l3dp.RecommendationData.dict[sceneNumber].length + 1; i++) {
            ret.push(readIt(sceneNumber, i));
        }

        return ret;

    }

    export var predictionTables : number[][][] = [];
    export var facesToSend : {[id : string] : {index : number, area : number}[][]} = {};

    try
    {
        predictionTables = [
            JSON.parse(fs.readFileSync(__dirname + '/../generated/prefetch-info/mat1.json', 'utf-8')),
            JSON.parse(fs.readFileSync(__dirname + '/../generated/prefetch-info/mat2.json', 'utf-8')),
            JSON.parse(fs.readFileSync(__dirname + '/../generated/prefetch-info/mat3.json', 'utf-8')),
            [[1,1],
                [1,2]]
        ];

        facesToSend[config.Scene[1]] = readAll(1);
        facesToSend[config.Scene[2]] = readAll(2);
        facesToSend[config.Scene[3]] = readAll(3);

    } catch (e) {
        log.warning('Error occured while reading prefetching files');
        log.warning('No prefetching will be done !');
    }

    /**
     * Checks quickly if a triangle might be in a frustum
     * @private
     * @param element array of the 3 vertices of the triangle to test
     * @param planes array of planes (Object with normal and constant values)
     * @return false if we can be sure that the triangle is not in the frustum, true oherwise
     */
    export function isInFrustum(element : Vector[], planes : Plane[]) {

        if (element instanceof Array) {

            let outcodes : number[] = [];

            for (let i = 0; i < element.length; i++) {

                let vertex = element[i];
                let currentOutcode = "";

                for (let j = 0; j < planes.length; j++) {

                    let plane = planes[j];

                    let distance =
                        plane.constant !== null ?
                            plane.normal.x * vertex.x +
                            plane.normal.y * vertex.y +
                            plane.normal.z * vertex.z +
                            plane.constant :
                        1;

                    // if (distance < 0) {
                    //     exitToContinue = true;
                    //     break;
                    // }

                    currentOutcode += distance > 0 ? '0' : '1';

                }

                outcodes.push(parseInt(currentOutcode,2));

            }

            // http://vterrain.org/LOD/culling.html
            // I have no idea what i'm doing
            // http://i.kinja-img.com/gawker-media/image/upload/japbcvpavbzau9dbuaxf.jpg
            // But it seems to work
            // EDIT : Not, this should be ok http://www.cs.unc.edu/~blloyd/comp770/Lecture07.pdf

            if ((outcodes[0] | outcodes[1] | outcodes[2]) === 0) {
                return true;
            } else if ((outcodes[0] & outcodes[1] & outcodes[2]) !== 0) {
                return false;
            } else {
                // part of the triangle is inside the viewing volume
                return true;
            }

        }

    }

    /**
     * A class that streams easily a mesh via socket.io
     */
    export class MeshStreamerBase {

        /**
         * array of array telling if the jth face of the ith mesh has already been sent
         *
         * For each mesh, there is an object containing
         * <ul>
         *   <li>`counter` : the number of faces currently sent</li>
         *   <li>`array` : an array boolean telling if the ith face has already been sent</li>
         * </ul>
         */
        meshFaces : {counter: number, array: boolean[]}[];

        /**
         * array of booleans telling if the ith vertex has already been sent
         */
        vertices : boolean[];

        /**
         * array of booleans telling if the ith face has already been sent
         */
        faces : boolean[];

        /**
         * array of booleans telling if the ith normal has already been sent
         */
        normals : boolean[];

        /**
         * array of booleans telling if the ith texCoord has already been sent
         */
        texCoords : boolean[];

        /** Threshold after which we stop fulling loading the inital triangles */
        beginningThreshold : number;

        /** If frustum prefetching, percentage of the bandwidth given to the frustum culling */
        frustumPercentage : number;

        /** If frustum prefetching, percentage of the bandwidth given to the prefetching,
         * 1 - {@link frustumPercentage}
         */
        prefetchPercentage : number;

        /**
         * Number of element to send by packet
         */
        chunk : number;

        /** Previous recommendation clicked. Null if nothing already clicked */
        previousReco : number;

        /** Mesh container representing the mesh to stream */
        mesh : MeshContainer;

        /** Socket on which the data will be streamed */
        socket : SocketIO.Socket;

        /** Table of prediction giving the probabilities of clicking on a recommendation given the previous one */
        predictionTable : number[][];

        /** Faces that we are supposed to send */
        facesToSend : any[];

        /** Indicates whether we should stream the elements at the beginning of the scene or do frustum culling */
        beginning : boolean;

        /** Will generate the different configs for prefetching policies */
        generator : ConfigGenerator;

        /** In case {@link generator} gave an empty data */
        backupGenerator : ConfigGenerator;

        breakAt : number;

        /** Indicates wether we should compute hidden points removal to optimize streaming */
        HPR : boolean;

        /**
         * @param {string} path to the mesh
         */
        constructor(path? : string) {

            this.meshFaces = [];
            this.vertices = [];
            this.faces = [];
            this.normals = [];
            this.texCoords = [];

            this.beginningThreshold = 0.9;

            this.frustumPercentage = 0.6;
            this.prefetchPercentage = 1 - this.frustumPercentage;

            this.chunk = 1250;

            this.previousReco = 0;

            this.breakAt = 0.9;

            this.HPR = false;

            if (path !== undefined) {
                this.mesh = Meshes.dict[path];
            }

        }

        /**
         * Checks if a face is oriented towards the camera
         * @param camera a camera (with a position, and a direction)
         * @param the face to test
         * @return true if the face is in the good orientation, face otherwise
         */
        isBackFace(camera : CameraItf, face: Face) : boolean {

            var directionCamera = mth.diff(
                mth.mul(
                    mth.sum(
                        mth.sum(
                            this.mesh.vertices[face.a],
                            this.mesh.vertices[face.b]
                        ),
                        this.mesh.vertices[face.c]
                    ),
                    1/3),
                    camera.position
            );

            var v1 = mth.diff(this.mesh.vertices[face.b], this.mesh.vertices[face.a]);
            var v2 = mth.diff(this.mesh.vertices[face.c], this.mesh.vertices[face.a]);

            var normal = mth.cross(v1, v2);

            return mth.dot(directionCamera, normal) > 0;

        }

        /**
         * Compute a function that can compare two faces
         * @param camera a camera seeing or not face
         * @returns the function that compares two faces : the higher face is the most interesting for the camera
         */
        faceComparator(camera : CameraItf) : (face1 : Face, face2 : Face) => number {

            return (face1 : Face, face2 : Face) => {

                var center1 = {
                    x: (this.mesh.vertices[face1.a].x + this.mesh.vertices[face1.b].x + this.mesh.vertices[face1.c].x) / 3,
                    y: (this.mesh.vertices[face1.a].y + this.mesh.vertices[face1.b].y + this.mesh.vertices[face1.c].y) / 3,
                    z: (this.mesh.vertices[face1.a].z + this.mesh.vertices[face1.b].z + this.mesh.vertices[face1.c].z) / 3

                };

                var dir1 = {
                    x: center1.x - camera.position.x,
                    y: center1.y - camera.position.y,
                    z: center1.z - camera.position.z
                };

                var dot1 = dir1.x * dir1.x + dir1.y * dir1.y + dir1.z * dir1.z;

                var center2 = {
                    x: (this.mesh.vertices[face2.a].x + this.mesh.vertices[face2.b].x + this.mesh.vertices[face2.c].x) / 3,
                    y: (this.mesh.vertices[face2.a].y + this.mesh.vertices[face2.b].y + this.mesh.vertices[face2.c].y) / 3,
                    z: (this.mesh.vertices[face2.a].z + this.mesh.vertices[face2.b].z + this.mesh.vertices[face2.c].z) / 3
                };

                var dir2 = {
                    x: center2.x - camera.position.x,
                    y: center2.y - camera.position.y,
                    z: center2.z - camera.position.z
                };

                var dot2 = dir2.x * dir2.x + dir2.y * dir2.y + dir2.z * dir2.z;

                // Decreasing order
                if (dot1 < dot2) {
                    return -1;
                }
                if (dot1 > dot2) {
                    return 1;
                }
                return 0;

            };
        }

        onRequest(path : string, loadingConfig : config.LoadingConfig) {

            if (loadingConfig.chunkSize !== undefined) {
                this.chunk = loadingConfig.chunkSize;
            }

            if (loadingConfig.HPR === true) {
                this.HPR = true;
            }

            this.mesh = Meshes.dict[path];

            switch (path) {
                case '/static/data/bobomb/bobomb battlefeild_sub.obj': {
                    this.predictionTable = predictionTables[0];
                    this.facesToSend = facesToSend[config.Scene[config.Scene.BobombBattlefield]];
                    break;
                }
                case '/static/data/mountain/coocoolmountain_sub.obj': {
                    this.predictionTable = predictionTables[1];
                    this.facesToSend = facesToSend[config.Scene[config.Scene.CoolCoolMountain]];
                    break;
                }
                case '/static/data/whomp/Whomps Fortress_sub.obj': {
                    this.predictionTable = predictionTables[2];
                    this.facesToSend = facesToSend[config.Scene[config.Scene.WhompFortress]];
                    break;
                }
                // case '/static/data/sponza/sponza.obj': {
                //     this.predictionTable = predictionTables[3];
                //     this.facesToSend = facesToSend[3];
                //     break;
                // }
                default:
                    this.predictionTable = predictionTables[3];
            };

            if (this.predictionTable !== undefined && this.facesToSend !== undefined) {
                log.debug('Prefetch is : ' + config.PrefetchingPolicy[loadingConfig.prefetchingPolicy]);
                this.generator = createConfigFromPolicy(loadingConfig.prefetchingPolicy, this);
                this.backupGenerator = new ConfigGenerator(this);
            } else {
                log.debug('No info : doing only culling');
                this.generator = new CullingGenerator(this);
                this.backupGenerator = new CullingGenerator(this);
            }

            if (this.mesh === undefined) {
                process.stderr.write('Wrong path for model : ' + path + "\n");
                this.socket.emit('refused');
                this.socket.disconnect();
                return;
            }

            this.meshFaces = new Array(this.mesh.meshes.length);

            for (var i = 0; i < this.meshFaces.length; i++) {

                this.meshFaces[i] = {
                    counter: 0,
                    array: new Array(this.mesh.meshes[i].faces.length)
                };

            }

            this.socket.emit('ok');

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

        /**
         * Initialize the socket.io callbacks
         * @param socket the socket to initialize
         */
        start(socket : SocketIO.Socket) {

            this.socket = socket;

            socket.on('request', this.onRequest.bind(this));
            socket.on('materials', this.onMaterials.bind(this));
            socket.on('next', this.onNext.bind(this));

        }

        /**
         * Prepare the array of materials
         * @return array the array to send with all materials of the current mesh
         */
        nextMaterials() : any[] {

            var data : any[] = [];

            data.push(['g', this.mesh.numberOfFaces]);


            for (var i = 0; i < this.mesh.meshes.length; i++) {

                var currentMesh = this.mesh.meshes[i];

                // Send usemtl
                data.push([
                    'u',
                    currentMesh.material,
                    currentMesh.vertices.length,
                    currentMesh.faces.length,
                    this.mesh.texCoords.length > 0,
                    this.mesh.normals.length > 0
                ]);

            }

            return data;

        }

        fillCullingBuffers(config : Config, buffers : {data:Face[], size:number}[]) {

            faceloop:
            for (var faceIndex = 0; faceIndex < this.mesh.faces.length; faceIndex++) {
                var currentFace = this.mesh.faces[faceIndex];

                if (this.faces[currentFace.index] === true)
                    continue;

                var vertex1 = this.mesh.vertices[currentFace.a];
                var vertex2 = this.mesh.vertices[currentFace.b];
                var vertex3 = this.mesh.vertices[currentFace.c];

                for (var configIndex = 0; configIndex < config.length; configIndex++) {

                    var currentConfig = config[configIndex];
                    var display = false;
                    var exitToContinue = false;
                    var threeVertices = [vertex1, vertex2, vertex3];

                    // Ignore smart config elements
                    if (currentConfig.smart)
                        continue;

                    if (currentConfig.frustum === undefined || isInFrustum(threeVertices, currentConfig.frustum.planes) && !this.isBackFace(currentConfig.frustum, currentFace)) {

                        buffers[configIndex].data.push(currentFace);
                        continue faceloop;

                    }

                }

            }

        }

        truncateHPR(config : Config, buffers : {data:Face[], size:number}[]) {

            // Traverse the faces to collect the vertices
            let verticesToKeep : boolean[] = [];
            let vertexCounter = 0;

            for (let configIndex = 0; configIndex < config.length; configIndex++) {

                let currentConfig = config[configIndex];
                let data : Face[] = buffers[configIndex].data;

                // Do not compute HPR on smart configs
                if (currentConfig.smart === true)
                    continue;

                for (let face of data) {

                    if (!verticesToKeep[face.a]) vertexCounter++;
                    if (!verticesToKeep[face.b]) vertexCounter++;
                    if (!verticesToKeep[face.c]) vertexCounter++;

                    verticesToKeep[face.a] = true;
                    verticesToKeep[face.b] = true;
                    verticesToKeep[face.c] = true;

                }

                // Do not compute HPR if less than 5 vertices
                if (vertexCounter < 5) {
                    continue;
                }


                // Prepare the array of vertices for HPR
                let vertices : mth.Vector3[] = [];

                for (let v in verticesToKeep) {
                    vertices.push(this.mesh.vertices[v]);
                }

                // Compute the HPR
                let visibleVertices = mth.computeVisiblePoints(vertices, currentConfig.frustum.position);

                // Erase elements in buffers
                for (let i = 0; i < data.length; i++) {

                    if (!visibleVertices[data[i].a] && !visibleVertices[data[i].b] && !visibleVertices[data[i].c]) {

                        data[i] = undefined;

                    }

                }

            }

        }

        fillSmartBuffers(config : Config, buffers : {data:Face[],size:number}[]) {

            for (var configIndex = 0; configIndex < config.length; configIndex++) {

                var currentConfig = config[configIndex];

                if (!currentConfig.smart)
                    continue;

                var area = 0;
                var currentArea = 0;

                // Fill buffer using facesToSend
                for (var faceIndex = 0; faceIndex < this.facesToSend[currentConfig.recommendationId].length; faceIndex++) {

                    var faceInfo = this.facesToSend[currentConfig.recommendationId][faceIndex];

                    area += faceInfo.area;

                    if (this.breakAt !== undefined && area > this.breakAt) {
                        break;
                    }

                    if (this.faces[faceInfo.index] !== true) {

                        var face = this.mesh.faces[faceInfo.index];

                        if (face === undefined) {
                            log.faceerror('Trying to get ${faceInfo.index}th face out of ${this.mesh.faces.length}');
                        } else {
                            buffers[configIndex].data.push(face);
                        }

                    } else if (this.beginning === true) {

                        currentArea += faceInfo.area;

                        if (currentArea > this.beginningThreshold) {

                            this.beginning = false;

                        }

                    }

                }

            }

        }

        truncateBuffers(config : Config, buffers : {data:Face[],size:number}[], chunk : number) {

            var data : any[] = [];
            var totalSize = 0;
            var configSize = 0;

            for (var configIndex = 0; configIndex < config.length; configIndex++) {

                // Sort buffer
                if (config[configIndex].frustum !== undefined) {

                    buffers[configIndex].data.sort(this.faceComparator(config[configIndex].frustum));

                } else {

                    // console.log("Did not sort");

                }

                // Fill chunk
                for(var i = 0; i < buffers[configIndex].data.length; i++) {

                    if (buffers[configIndex].data[i] === undefined)
                        continue;

                    // console.log(buffers[configIndex][i]);
                    var size = this.pushFace(buffers[configIndex].data[i], data);

                    totalSize += size;
                    buffers[configIndex].size += size;

                    if (buffers[configIndex].size > chunk * config[configIndex].proportion) {

                        break;

                    }

                }

                if (totalSize > chunk) {

                    // console.log(configIndex, sent/(chunk * currentConfig.proportion));
                    return {data: data, finished:false, buffers: buffers, size: totalSize};

                }

            }

            return {data: data, finished: false, buffers: buffers, size:totalSize};

        }

        /**
         * Prepare the next elements
         * @param config a configuration list
         * @returns an array of elements ready to send
         * @see {@link https://github.com/DragonRock/3dinterface/wiki/Streaming-configuration|Configuration list documentation}
         */
        nextElements(config : Config, chunk? : number) : Data {

            if (chunk === undefined) {
                chunk = this.chunk;
            }

            var buffers : {data : any[], size : number}[] = [];

            if (config.length === 0) {
                config.push({
                    proportion: 1
                });
            }

            for (var configIndex = 0; configIndex < config.length; configIndex++) {
                buffers[configIndex] = {data : [], size : 0};
            }

            this.fillCullingBuffers(config, buffers);

            if (this.HPR === true) {
                this.truncateHPR(config, buffers);
            }

            this.fillSmartBuffers(config, buffers);

            return this.truncateBuffers(config, buffers, chunk);

        }

        pushElement(vertex : any, buffer : any[], toVerify : any[]) {
            if (vertex === undefined || toVerify[vertex.index]) {
                return 0;
            } else {
                buffer.push(vertex.toList());
                toVerify[vertex.index] = true;
                return 1;
            }
        }

        pushVertex(vertex : Vertex, buffer : any[]) {
            return this.pushElement(vertex, buffer, this.vertices);
        }

        pushNormal(normal : Normal, buffer : any[]) {
            return this.pushElement(normal, buffer, this.normals)
        }

        pushTexCoord(texCoord : TexCoord, buffer : any[]) {
            return this.pushElement(texCoord, buffer, this.texCoords);
        }

        pushFace(face : Face, buffer : any[]) {

            var totalSize = 0;

            totalSize += this.pushVertex(this.mesh.vertices[face.a], buffer);
            totalSize += this.pushVertex(this.mesh.vertices[face.b], buffer);
            totalSize += this.pushVertex(this.mesh.vertices[face.c], buffer);

            totalSize += this.pushNormal(this.mesh.normals[face.aNormal], buffer);
            totalSize += this.pushNormal(this.mesh.normals[face.bNormal], buffer);
            totalSize += this.pushNormal(this.mesh.normals[face.cNormal], buffer);

            totalSize += this.pushTexCoord(this.mesh.texCoords[face.aTexture], buffer);
            totalSize += this.pushTexCoord(this.mesh.texCoords[face.bTexture], buffer);
            totalSize += this.pushTexCoord(this.mesh.texCoords[face.cTexture], buffer);

            buffer.push(face.toList());
            this.faces[face.index] = true;
            totalSize+=3;

            return totalSize;
        }

    }

}

export = geo;
