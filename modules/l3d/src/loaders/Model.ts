import * as THREE from 'three';

import { StreamedElementType, StreamedElement, parseList } from './LoaderFunctions';
import { BaseLoader } from './BaseLoader';

module l3d {

    export interface Model {

        object: THREE.Object3D;
        addElement(elt : StreamedElement) : void;

    }

    export class Part {

        parent: BufferGeometryModel;
        geometry: THREE.BufferGeometry;
        currentFace: number;
        verticesArray: Float32Array;
        mesh : THREE.Mesh;
        faceNumber : number;

        constructor(parent : BufferGeometryModel, material : THREE.Material, faceNumber : number) {
            this.faceNumber = faceNumber;
            this.parent = parent;
            this.geometry = new THREE.BufferGeometry();
            this.verticesArray = new Float32Array(faceNumber * 3 * 3);
            this.currentFace = 0;
            this.mesh = new THREE.Mesh(this.geometry, material);

            for (let i = 0, len = this.verticesArray.length; i < len; i++) {
                this.verticesArray[i] = 0;
            }

            this.geometry.addAttribute('position', new THREE.BufferAttribute(this.verticesArray, 3));

        }

        addFace(elt : StreamedElement) {

            let vertices = this.parent.vertices;

            let i = this.currentFace * 9;

            this.verticesArray[i  ] = vertices[elt.a].x;
            this.verticesArray[i+1] = vertices[elt.a].y;
            this.verticesArray[i+2] = vertices[elt.a].z;
            this.verticesArray[i+3] = vertices[elt.b].x;
            this.verticesArray[i+4] = vertices[elt.b].y;
            this.verticesArray[i+5] = vertices[elt.b].z;
            this.verticesArray[i+6] = vertices[elt.c].x;
            this.verticesArray[i+7] = vertices[elt.c].y;
            this.verticesArray[i+8] = vertices[elt.c].z;

            this.currentFace++;
        }

    }

    export class BufferGeometryModel implements Model {

        material : any;
        parts : Part[];
        currentPart : Part;
        vertices : THREE.Vector3[];
        texCoords : THREE.Vector2[];
        normals : THREE.Vector3[];
        object : THREE.Object3D;
        numberOfFaces : number;

        constructor() {
            this.material = null;
            this.parts = [];
            this.vertices = [];
            this.texCoords = [];
            this.object = new THREE.Object3D();
        }

        addElement(elt : StreamedElement) {

            switch (elt.type) {
                case StreamedElementType.VERTEX:    this.addVertex(elt);                    break;
                case StreamedElementType.TEX_COORD: this.addTexCoord(elt);                  break;
                case StreamedElementType.NORMAL:    this.addNormal(elt);                    break;
                case StreamedElementType.FACE:      this.addFace(elt);                      break;
                case StreamedElementType.USEMTL:    this.addMaterial(elt);                  break;
                case StreamedElementType.GLOBAL:    this.numberOfFaces = elt.numberOfFaces; break;
            }

        }

        addVertex(elt : StreamedElement) {
            this.vertices[elt.index] = new THREE.Vector3(elt.x, elt.y, elt.z);
        }

        addTexCoord(elt : StreamedElement) {
            this.texCoords[elt.index] = new THREE.Vector2(elt.x, elt.y);
        }

        addNormal(elt : StreamedElement) {
            this.normals[elt.index] = new THREE.Vector3(elt.x, elt.y, elt.z);
        }

        addFace(elt : StreamedElement) {
            this.parts[elt.mesh].addFace(elt);
        }

        addMaterial(elt : StreamedElement) {

            // Create mesh material
            let material : THREE.Material;

            // If no material, create a default material
            material = new THREE.MeshLambertMaterial({color: 'red'});

            let part = new Part(this, material, elt.fLength);

            this.parts.push(part);
            this.currentPart = part;

            this.object.add(part.mesh);

        }

    }

}

export = l3d;
