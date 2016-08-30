module l3d {

    /**
     * Types of the streamed element
     */
    export enum StreamedElementType {
        /** A 3d vertex */
        VERTEX,
        /** A 2D texture coordinates*/
        TEX_COORD,
        /** A 3d face with indices of vertices */
        FACE,
        /** A 3d vector that represent a normal */
        NORMAL,
        /** A usemtl instruction */
        USEMTL,
        /** A custom element for giving global information */
        GLOBAL

    }

    /**
     * A streamed element
     */
    export interface StreamedElement {

        /** The type of the streamed element */
        type : StreamedElementType;

        /** The index of the element in the obj file for example */
        index ?: number;

        /** Its x coordinate */
        x ?: number;
        /** Its y coordinate */
        y ?: number;
        /** Its z coordinate */
        z ?: number;

        /** The id of the mesh the elements belongs to */
        mesh ?: number;

        /** The index of the first vertex of the face */
        a ?: number;
        /** The index of the second vertex of the face */
        b ?: number;
        /** The index of the third vertex of the face */
        c ?: number;

        /** The index of the texture coordinate of the first vertex of the face */
        aTexture ?: number;
        /** The index of the texture coordinate of the second vertex of the face */
        bTexture ?: number;
        /** The index of the texture coordinate of the third vertex of the face */
        cTexture ?: number;

        /** The index of the normal of the first vertex of the face */
        aNormal ?: number;
        /** The index of the normal of the second vertex of the face */
        bNormal ?: number;
        /** The index of the normal of the third vertex of the face */
        cNormal ?: number;

        /** The name of the material */
        materialName ?: string;

        /** The number of vertices of the current mesh part (which is also the total number of vertices)  */
        vLength ?: number;
        /** The number of faces of the current mesh part */
        fLength ?: number;

        /** Indicates wether the model contains texture coordinates */
        texCoordsExist ?: boolean;

        /** Indicates wether the model contains normals */
        normalsExist ?: boolean;

        /** The number of faces of the mesh */
        numberOfFaces ?: number;

    }


    /**
     * Parse a list as it is sent by the server and gives a slightly more comprehensible result
     * @param arr array corresponding to the line of the mesh file
     * @returns A streamed element easy to manage
     */
    export function parseList(arr : any[]) : StreamedElement {

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

}

export = l3d;
