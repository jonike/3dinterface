import { Sendable } from './Interfaces';

module geo {

    /**
     * Represents a face. Only triangles are supported. For quadrangular polygons, see {@link parseFace}
     */
    export class Face implements Sendable {

        /** Index of the first vertex of the face */
        a : number;

        /** Index of the second vertex of the face */
        b : number;

        /** Index of the third vertex of the face */
        c : number;

        /** Index of the texture coordinate for the first vertex of the face */
        aTexture : number;

        /** Index of the texture coordinate for the second vertex of the face */
        bTexture : number;

        /** Index of the texture coordinate for the third vertex of the face */
        cTexture : number;

        /** Index of the normal for the first vertex of the face */
        aNormal : number;

        /** Index of the normal for the second vertex of the face */
        bNormal : number;

        /** Index of the normal for the third vertex of the face */
        cNormal : number;

        /** Index of the current face in the model */
        index : number;

        /** Indicates wether the face has been send or not */
        sent : boolean;

        /** Index of the mesh this face belongs to */
        meshIndex : number;

        /**
         * @param {String} A string like in a .obj file (e.g. 'f 1/1/1 2/2/2 3/3/3' or 'f 1 2 3').
         */
        constructor(arg : string | String) {

            if (arg.indexOf('/') === -1) {

                // No / : easy win : "f 1 2 3"  or "f 1 2 3 4"
                let split = arg.replace(/\s+/g, ' ').split(' ');
                this.a = parseInt(split[1]) - 1;
                this.b = parseInt(split[2]) - 1;
                this.c = parseInt(split[3]) - 1;

            } else {

                // There might be textures coords
                let split = arg.replace(/\s+/g, ' ').trim().split(' ');

                // Split elements
                var split1 = split[1].split('/');
                var split2 = split[2].split('/');
                var split3 = split[3].split('/');

                var vIndex = 0;
                var tIndex = 1;
                var nIndex = 2;

                this.a = parseInt(split1[vIndex]) - 1;
                this.b = parseInt(split2[vIndex]) - 1;
                this.c = parseInt(split3[vIndex]) - 1;

                this.aTexture = parseInt(split1[tIndex]) - 1;
                this.bTexture = parseInt(split2[tIndex]) - 1;
                this.cTexture = parseInt(split3[tIndex]) - 1;

                this.aNormal = parseInt(split1[nIndex]) - 1;
                this.bNormal = parseInt(split2[nIndex]) - 1;
                this.cNormal = parseInt(split3[nIndex]) - 1;

                this.index = null;
                this.meshIndex = null;
                this.sent = false;

            }

        }

        /**
         * Gives a list representation of the face
         * @returns An array representing the texture coordinate
         *  <ol start=0>
         *    <li>'f'</li>
         *    <li>the index of the face</li>
         *    <li>the index of the mesh that contains the face</li>
         *    <li>a list containing the indices of the vertex of the face</li>
         *    <li>a list containing the indices of the texture coordinates</li>
         *    <li>a list containing the indices of the normals</li>
         *  </ol>
         * @example
         * ``` js
         *
         * var face = new geo.Face('f 1/2/3 4/5/6 7/8/9');
         * texture coordinate.index = 5;
         * console.log(texture coordinate.toList()); // Prints ['f', 5, null, [1,4,7], [2,5,8], [3,6,9]]
         * ```
         */
        toList() : [string, number, number, number[], number[], number[]] {
            return [
                'f', this.index, this.meshIndex,
                [this.a,        this.b,        this.c       ],
                isNaN(this.aTexture) ? [] : [this.aTexture, this.bTexture, this.cTexture],
                isNaN(this.aNormal ) ? [] : [this.aNormal,  this.bNormal,  this.cNormal ]

            ];
        }

        /**
         * Gives a string representation of the face
         * @returns {string} A string representing the face
         *
         * @example
         * ```js
         *
         * var face = new geo.Face('f 3 5 6');
         * console.log(face.toString()); // Prints f 3 5 6
         * ```
         */
        toString() : string {
            return 'f ' + this.a + ' ' + this.b + ' ' + this.c;
        }
        /**
         * Parse a face line and returns an array of faces
         *
         * @private
         * @param arg a string representing a face
         * @returns a single 3-vertices face or two 3-vertices face if the
         * input was a 4-vertices face
         */
         static parseFace(arg : string | String) : Face[] {

            let split = arg.trim().split(' ');
            let ret : Face[] = [];

            // Face3
            if (split.length >= 4) {
                ret.push(new Face(arg));
            }

            // Face3 == 2 * Face3
            if (split.length >= 5) {
                ret.push(new Face(
                    [
                        split[0],
                        split[1],
                        split[3],
                        split[4]
                    ].join(' ')
                ));
            }

            return ret;

        }

    }

}

export = geo;
