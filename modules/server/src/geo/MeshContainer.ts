import fs = require('fs');

import { Face           } from './Face';
import { Material       } from './Material';
import { Mesh           } from './Mesh';
import { Normal         } from './Normal';
import { TexCoord       } from './TexCoord';
import { Transformation } from './Transformation';
import { Vertex         } from './Vertex';
import * as log from '../lib/log';

module geo {

    /**
     * Represents a mesh. All meshes are loaded once in geo.availableMesh to avoid
     * loading at each mesh request
     */
    export class MeshContainer {

        /** Array of each part of the mesh (corresponding to each material) */
        meshes : Mesh[];

        /** Array of the vertices of the meshes (all merged) */
        vertices : Vertex[];

        /** Array of the faces of the meshes (all merged) */
        faces : Face[];

        /** Array of the normals of the meshes (all merged) */
        normals : Normal[];

        /** Array of the texture coordinates of the meshes (all merged) */
        texCoords : TexCoord[];

        /** Transformation to apply to the vertices */
        transformation : Transformation;

        /** Callback to call after loading is finished */
        callback : Function;

        /** Total number of faces */
        numberOfFaces : number;

        /** Recommendations, used by MeshStreamer */
        recommendations : any[];

        /**
         * Creates a mesh from file (if any) and apply transformation and callback if any
         * @param path path to the .obj file
         * @param transfo a transformation object to apply during the loading
         * @param callback callback to call on the mesh
         */
        constructor(path? : string, transfo? : Transformation, callback? : Function) {

            if (transfo === undefined) transfo = new Transformation();

            this.transformation = transfo;

            this.recommendations = [];
            this.meshes = [];
            this.vertices = [];
            this.faces = [];
            this.normals = [];
            this.texCoords = [];
            this.numberOfFaces = 0;
            this.callback = typeof callback === 'function' ? callback : function(){};

            if (path !== undefined) {
                this.loadFromFile(path);
            }

        }

        /**
         * Loads a obj file and apply the transformation
         * @param {string} path the path to the file
         */
        loadFromFile(path : string) : void {

            // Be carefule : use this
            fs.readFile(path, {encoding : 'utf-8'}, (err : any, data : any) => {

                let lines : string[];

                if (err != null && err.code === 'ENOENT') {

                    let dirs = path.split('/');
                    let filename = dirs[dirs.length-1];

                    log.warning('Model ' + filename + ' could not be loaded !');

                    lines = [];

                } else {

                    lines = data.toString('utf-8').split('\n');

                }

                let currentMesh : Mesh = null;

                for (let i = 0; i < lines.length; i++) {

                    let line = lines[i];

                    if (line[0] === 'v') {

                        if (line[1] === 't') {

                            // Texture coord
                            var texCoord = new TexCoord(line);
                            texCoord.index = this.texCoords.length;
                            this.texCoords.push(texCoord);

                        } else if (line[1] === 'n') {

                            var normal = new Normal(line);
                            normal.index = this.normals.length;
                            this.normals.push(normal);

                        } else {

                            // Just a simple vertex
                            var vertex = new Vertex(line);
                            var vertexTransformed = this.transformation.applyTo(vertex);

                            vertex.x = vertexTransformed.x;
                            vertex.y = vertexTransformed.y;
                            vertex.z = vertexTransformed.z;

                            vertex.index = this.vertices.length;
                            this.vertices.push(vertex);

                        }

                    } else if (line[0] === 'f') {

                        this.numberOfFaces++;

                        // Create mesh if it doesn't exist
                        if (currentMesh === undefined) {
                            currentMesh = new Mesh();
                            this.meshes.push(currentMesh);
                        }

                        // Create faces (two if Face4)
                        var faces = currentMesh.addFaces(line);

                        faces[0].index = this.faces.length;
                        faces[0].meshIndex = this.meshes.length - 1;
                        this.faces.push(faces[0]);

                        if (faces.length === 2) {

                            this.numberOfFaces++;
                            faces[1].index = this.faces.length;
                            faces[1].meshIndex = this.meshes.length - 1;
                            this.faces.push(faces[1]);

                        }

                    } else if (line[0] === 'u') {

                        // usemtl : create a new mesh
                        currentMesh = new Mesh();
                        this.meshes.push(currentMesh);
                        currentMesh.material = (new Material(line)).name;

                    }

                }

                this.callback();

            });

        }


    }

}

export = geo;
