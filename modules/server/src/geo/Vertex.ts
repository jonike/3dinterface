import { Sendable } from './Interfaces';

module geo {

    /**
     * Represents a 3D vertex
     */
    export class Vertex implements Sendable {

        /** x coordinate of the vertex */
        x : number;

        /** y coordinate of the vertex */
        y : number;

        /** z coordinate of the vertex */
        z : number;

        /** index of the vertex in a model */
        index : number;

        /** indicates wether the vertex has already been sent or not */
        sent : boolean;

       /**
        * Builds a 3D vertex
        * @param arg A string like in the .obj file (e.g. 'v 1.1 0.2 3.4')
        */
        constructor(arg : string | String) {

            let split = arg.replace(/[ \t]+/g, ' ').split(' ');

            // Apparently, *1 is better than parseFloat
            this.x = (<any>split[1]) * 1;
            this.y = (<any>split[2]) * 1;
            this.z = (<any>split[3]) * 1;

            if (isNaN(this.x)) {
                console.log(split[1]);
            }
            if (isNaN(this.y)) {
                console.log(split[2]);
            }
            if (isNaN(this.z)) {
                console.log(split[3]);
            }

            this.index = null;

            this.sent = false;

        }
        /**
         * Gives a list representation of the vertex
         * @returns An array representing the vertex
         *
         * @example
         * ``` js
         *
         * var vertex = new geo.Vertex('v 3.5 3.6 3.7');
         * vertex.index = 5;
         * console.log(vertex.toList()); // Prints ['v', 5, 3.5, 3.6, 3.7]
         * ```
         */
        toList() : [string, number, number, number, number] {
            return ['v', this.index, this.x, this.y, this.z];
        }

        /**
         * Gives a string representation of the vertex
         * @returns A string representing the vertex
         *
         * @example
         * ``` js
         *
         * var vertex = new geo.Vertex('v 3.5 3.6 3.7');
         * console.log(vertex.toString()); // Prints v 3.5 3.6 3.7
         * ```
         */
        toString() : string {
            return 'v ' + this.x + ' ' + this.y + ' ' + this.z;
        }

    }

}

export = geo;
