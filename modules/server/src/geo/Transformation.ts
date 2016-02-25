import { Vector } from './Interfaces';

module geo {

    export function clone(v : Vector) : Vector { return {x:v.x, y:v.y, z:v.z}; }

    export interface TransformationInfo {

        translation ?: Vector;
        rotation ?: Vector;
        scale ?: number;

    }

    export class Transformation {

        translation : Vector;
        rotation : Vector;
        scale : number;

        constructor(transfo ?: TransformationInfo) {

            if (transfo === undefined)
                transfo = {};

            this.translation = transfo.translation === undefined ? {x:0, y:0, z:0} : transfo.translation;
            this.rotation = transfo.rotation === undefined ? {x:0, y:0, z:0} : transfo.rotation;
            this.scale = transfo.scale === undefined ? 1 : transfo.scale;

        }

        applyTo(v : Vector) : Vector {

            let ret = this.applyRotationTo(v);

            return {
                x: (ret.x + this.translation.x) * this.scale,
                y: (ret.y + this.translation.y) * this.scale,
                z: (ret.z + this.translation.z) * this.scale
            };


        }

        private applyRotationTo(v : Vector) : Vector {

            let x = this.rotation.x, y = this.rotation.y, z = this.rotation.z;

            let cos = Math.cos(z);
            let sin = Math.sin(z);

            let newVec = {x:0, y:0, z:0};
            let oldVec = clone(v);

            newVec.x = cos * oldVec.x - sin * oldVec.y;
            newVec.y = sin * oldVec.x + cos * oldVec.y;
            newVec.z = oldVec.z;

            oldVec = clone(newVec);

            cos = Math.cos(y);
            sin = Math.sin(y);

            newVec.x = cos * oldVec.x + sin * oldVec.z;
            newVec.y = oldVec.y;
            newVec.z = - sin * oldVec.x + cos * oldVec.z;

            cos = Math.cos(x);
            sin = Math.sin(x);

            oldVec = clone(newVec);

            newVec.x = oldVec.x;
            newVec.y = oldVec.y * cos - oldVec.z * sin;
            newVec.z = oldVec.y * sin + oldVec.z * cos;

            return clone(newVec);
        }

    }

}

export = geo;
