import * as THREE from 'three';

module mth {

    export interface Vector3 {

        x : number;
        y : number;
        z : number;

    }

    export interface Face3 {

        a : number;
        b : number;
        c : number;

    }

    /**
     * Clamp a number between two others
     * @param num number to clamp
     * @param min minimum bound for clamping
     * @param max maximum bound for clamping
     */
    export function clamp(num : number, min : number, max : number) {
        return Math.max(Math.min(num, max), min);
    }


    /**
     * Computes the sum of two vectors
     * @param v1 first vector of the sum
     * @param v2 second vector of the sum
     * @returns v1 + v2
     */
    export function sum(v1 : Vector3, v2 : Vector3) : THREE.Vector3 {
        return new THREE.Vector3(v1.x + v2.x, v1.y + v2.y, v1.z + v2.z);
    }

    /**
     * Computes the difference between two vectors
     * @param v1 first vector of the difference
     * @param v2 second vector of the difference
     * @returns v1 - v2
     */
    export function diff(v1 : Vector3, v2 : Vector3) : THREE.Vector3 {
        return new THREE.Vector3(v1.x - v2.x, v1.y - v2.y, v1.z - v2.z);
    }

    /**
     * Computes the dot product of two vectors
     * @param v1 first vector of the dot product
     * @param v2 second vector of the dot product
     * @returns v1 * v2
     */
    export function dot(v1 : Vector3, v2 : Vector3) : number {
        return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
    }

    /**
     * Computes the cross product of two vectors
     * @param v1 first vector of the cross product
     * @param v2 second vector of the cross product
     * @returns v1 ^ v2
     */
    export function cross(v1 : Vector3, v2 : Vector3) : THREE.Vector3 {
        return new THREE.Vector3(
            v1.y * v2.z - v1.z * v2.y,
            v1.z * v2.x - v1.x * v2.z,
            v1.x * v2.y - v1.y * v2.x
        );
    }

    /**
     * Computes the product of a vector and a number
     * @param v1 vector of the product
     * @param lambda {Number} number of the product
     * @returns v1 * lambda
     */
    export function mul(v1 : Vector3, lambda : number) : THREE.Vector3 {
        return new THREE.Vector3(v1.x * lambda, v1.y * lambda, v1.z * lambda);
    }

    /**
     * Computes the square norm of a vector
     * @param v vector you want to compute the norm of
     * @returns ||v||²
     */
    export function norm2(v : Vector3) : number {
        return v.x * v.x + v.y * v.y + v.z * v.z;
    }

    /**
     * Computes the norm of a vector
     * @param v vector you want to compute the norm of
     * @returns ||v||
     */
    export function norm(v : Vector3) : number {
        return Math.sqrt(norm2(v));
    }

    /**
     * Creates a copy of a vector
     * @param v vector to copy
     * @param v2 vector to copy to
     * @returns the new vector
     */
    export function copy(v : Vector3) : THREE.Vector3;
    export function copy(v : Vector3, v2 : Vector3) : void;
    export function copy(v : Vector3, v2 : THREE.Vector3) : void;

    export function copy(v : any, v2 ?: any) : any {

        if (v2 === undefined)
            v2 = new THREE.Vector3();

        v2.x = v.x; v2.y = v.y; v2.z = v.z;

        return v2;
    }

    export function equals(v1 : Vector3, v2 : Vector3) : boolean {
        return v1.x === v2.x && v1.y === v2.y && v1.z === v2.z;
    }

}

export = mth;
