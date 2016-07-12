module l3d {

    export enum StreamedElementType {

        VERTEX,
        TEX_COORD,
        FACE,
        NORMAL,
        USEMTL,
        GLOBAL

    }

    export interface StreamedElement {

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
