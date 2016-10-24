import { Vertex }   from './Vertex';
import { Normal }   from './Normal';
import { TexCoord } from './TexCoord';
import { Face } from './Face';

module geo {

    /**
     * Reprensents an elementary mesh (only one material, e.g., a part of an .obj file)
     */
    export class Mesh {

        vertices: Vertex[];
        faces: Face[];
        texCoords: TexCoord[];
        normals: Normal[];
        material: string;

        /**
         * Builds an empty mesh
         */
        constructor() {

            this.vertices = [];
            this.faces = [];
            this.texCoords = [];
            this.normals = [];
            this.material = null;

        }

        /**
         * Checks if there are normals in the mesh
         * @returns true if there are normals in the mesh, false otherwise
         */
        hasNormals() : boolean {

            return this.normals.length > 0;

        }

        /**
         * Adds a vertex to the mesh
         * @param vertex Vertex to add to the mesh
         * @return the object added
         */
        addVertex(vertex : Vertex) : Vertex;

        /**
         * Adds a vertex to the mesh
         * @param vertex String representation of vertex to add to the mesh
         * @return the object added
         */
        addVertex(vertex : string) : Vertex;

        addVertex(vertex : any) : Vertex {

            if (vertex instanceof Vertex) {
                this.vertices.push(vertex);
            } else if (typeof vertex === 'string' || vertex instanceof String) {
                this.vertices.push(new Vertex(vertex));
            } else {
                throw new Error('Can only add vertex from geo.Vertex or string');
            }

            return this.vertices[this.vertices.length - 1];

        }

        /**
         * Adds a face to the mesh
         * @param face Face to add to the mesh
         * @return the object added
         */
        addFaces(face : Face) : Face[];

        /**
         * Adds one or two faces to the mesh
         * @param face String representation of the face (3 or 4 vertices) to add to the mesh
         * If the face has 4 vertices, it will be split in two faces
         * @return the object added
         */
        addFaces(face : string) : Face[];

        addFaces(face : any) : Face[] {

            if (face instanceof Face) {
                this.faces.push(face);
                return [this.faces[this.faces.length - 1]];
            } else if (typeof face === 'string' || face instanceof String) {
                let faces = Face.parseFace(face);
                this.faces.push.apply(this.faces, faces);
                return faces;
            } else {
                throw new Error('Can only add face from geo.Face or string');
            }


        }

        /**
         * Adds a texture coordinate to the mesh
         * @param texCoord Texture coordinate to add to the mesh
         * @return the object added
         */
        addTexCoord(texCoord : TexCoord) : TexCoord;

        /**
         * Adds a texture coordinate to the mesh
         * @param texCoord String representation of the texture coordinate to add to the mesh
         * @return the object added
         */
        addTexCoord(texCoord : string) : TexCoord;

        addTexCoord(texCoord : any) : TexCoord {

            if (texCoord instanceof TexCoord) {
                this.texCoords.push(texCoord);
            } else if (typeof texCoord === 'string' || texCoord instanceof String) {
                this.texCoords.push(new TexCoord(texCoord));
            } else {
                throw new Error('Can only add texCoord from geo.TexCoord or string');
            }

            return this.texCoords[this.texCoords.length - 1];

        }

        /**
         * Adds a normal to the mesh
         * @param normal Normal to add to the mesh
         * @return the object added
         */
        addNormal(normal : Normal) : Normal;

        /**
         * Adds a normal to the mesh
         * @param normal String representation of the normal to add to the mesh
         * @return the object added
         */
        addNormal(normal : string) : Normal;

        addNormal(normal : any) : Normal {

            if (normal instanceof Normal) {
                this.normals.push(normal);
            } else if (typeof normal === 'string' || normal instanceof String) {
                this.normals.push(new Normal(normal));
            } else {
                throw new Error('Can only add normal from geo.Normal or string');
            }

            return this.normals[this.normals.length - 1];

        }

    }

}

export = geo;
