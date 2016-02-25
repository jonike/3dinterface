module geo {

    /**
     * Represents a material name
     */
    export class Material {

        /** Name of the material */
        name : string;

        /**
         * Builds a material from a name
         * @param {string} line the string representing the material
         */
        constructor(arg : string) {

            let split = arg.replace(/\s+/g, ' ').trim().split(' ');
            this.name = split[1];

        }

        /**
          Gives a string representation of the material
         * @returns {string} obj representation of usemtl
         */
        toString() : string {
            return 'u ' + this.name;
        }

        /**
         * Gives a list representation of the material
         * @returns {array} an array representing the material
         * @example
         * ``` js
         *
         * var material = new geo.Material('usemtl MyMaterial');
         * console.log(material.toList()); // Logs ['u', 'MyMaterial']
         * ```
         */
        toList() : any[] {
            return ['u', this.name];
        }

    }

}

export = geo;
