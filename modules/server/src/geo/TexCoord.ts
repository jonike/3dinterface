import { Sendable } from './Interfaces';

module geo {

    /**
     * Represent a texture coordinate element
     */
    export class TexCoord implements Sendable {

        /** x coordinate of the texture */
        x : number;

        /** y coordinate of the texture */
        y : number;

        /** Indicates if the element has been sent */
        sent : boolean;

        /** Index of the texture coordinate */
        index : number;

        /**
         * @param {String} a string like in the .obj file (e.g. 'vt 0.5 0.5')
         */
        constructor(arg : string) {

            let split = arg.replace(/\s+/g,' ').split(' ');

            this.x = parseFloat(split[1]);
            this.y = parseFloat(split[2]);

            this.sent = false;
            this.index = null;

        }

        /**
         * Gives a list representation of the texture coordinate
         * @returns An array representing the texture coordinate
         *
         * @example
         * ``` js
         *
         * var texCoord = new geo.TexCoord('vt 3.5 3.6');
         * texture coordinate.index = 5;
         * console.log(texture coordinate.toList()); // Prints ['vt', 5, 3.5, 3.6]
         * ```
         */
        toList() : any[] {
            return ['vt', this.index, this.x, this.y];
        }

        /**
         * Gives a string representation of the texture coordinate
         * @returns A string representing the texture coordinate
         *
         * @example
         * ``` js
         *
         * var texCoord = new geo.TexCoord('vt 3.5 3.6');
         * console.log(texCoord.toString()); // Prints vt 3.5 3.6
         * ```
         */
        toString() : string {
            return 'vt ' + this.x + ' ' + this.y;
        }

    }

}

export = geo;
