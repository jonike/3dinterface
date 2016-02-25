import { Sendable } from './Interfaces';
import { Vertex } from './Vertex';

module geo {

    /**
     * Represent a 3D normal
     */
    export class Normal extends Vertex implements Sendable {

        /**
         * @param arg A string like in the .obj file (e.g. 'vn 1.1 2.2 3.3')
         */
        constructor(arg : string) {
            super(arg);
        }

        /**
         * Gives a list representation of the normal
         * @returns An array representing the normal
         *
         * @example
         * ``` js
         *
         * var normal = new geo.Normal('vn 3.5 3.6 3.7');
         * normal.index = 5;
         * console.log(normal.toList()); // Prints ['vn', 5, 3.5, 3.6, 3.7]
         * ```
         */
        toList() : [string, number, number, number, number] {
            let superObject = super.toList();
            superObject[0] = 'vn';
            return superObject;
        }
        /**
         * Gives a string representation of the normal
         * @returns A string representing the normal
         *
         * @example
         * ``` js
         * var normal = new geo.Normal('vn 3.5 3.6 3.7');
         * console.log(normal.toString()); // Prints vn 3.5 3.6 3.7
         * ```
         */
        toString() : string {
            return super.toString().replace('v', 'vn');
        }

    }

}

export = geo;
