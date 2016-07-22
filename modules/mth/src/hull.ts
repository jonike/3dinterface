import * as THREE from 'three';
import QuickHull = require('quickhull3d');

import { Vector3, sum, diff, mul, dot, cross, copy } from './Tools';

module mth {

    export function belongsToTriangle(P : Vector3, [A,B,C] : [Vector3, Vector3, Vector3], epsilon : number) {

        let AP = diff(P,A);
        let AB = diff(B,A);
        let AC = diff(C,A);

        let up = cross(AB, AC);
        let normUp2 = dot(up, up);
        let normUp = Math.sqrt(normUp2);

        let upN = mul(up, 1/normUp);
        let tmp = dot(AP,upN);
        let verticalDistance = Math.abs(tmp);

        let H = diff(P, mul(up, tmp));

        let HA = diff(A,H);
        let HB = diff(B,H);
        let HC = diff(C,H);

        let coeffs = new THREE.Vector3(
            dot(cross(HC, HB), up),
            dot(cross(HB, HA), up),
            dot(cross(HA, HC), up)
        );

        let sum = coeffs.x + coeffs.y + coeffs.z;

        coeffs.multiplyScalar(1/sum);

        return coeffs.x >= -epsilon && coeffs.y >= -epsilon && coeffs.z >= -epsilon && verticalDistance <= epsilon;

    }

    export function belongsToHull(point : Vector3, hull : number[][], trianglesCoordinates : Vector3[], epsilon = 0.0001) {

        for (var triangle of hull) {
            if (belongsToTriangle(
                    point,
                    [
                        trianglesCoordinates[triangle[0]],
                        trianglesCoordinates[triangle[1]],
                        trianglesCoordinates[triangle[2]]
                    ],
                    epsilon)
           ) {
               return true;
           }
        }

        return false;
    }

    export function computeVisiblePoints(points : Vector3[], cameraCenter : Vector3, param = 1) {

        // Compute norms and max norm
        let tmpVertices : THREE.Vector3[] = [];
        let newPoints : Vector3[] = [];
        let norms : number[] = [];
        let maxNorm : number = Infinity;

        let numPoints = points.length;
        let returnValue : Vector3[] = [];

        // First loop : compute norms and maxNorm
        for (let i = 0; i < numPoints; i++) {

            let vertex = diff(points[i], cameraCenter);
            let norm = vertex.length();

            tmpVertices.push(vertex);
            norms.push(norm);

            if (norm > maxNorm)
                maxNorm = norm;

        }

        let R = maxNorm * Math.pow(10, param);

        // Second loop, transform vertices
        for (let i = 0; i < numPoints; i++) {

            let vertex = tmpVertices[i];
            let norm = norms[i];

            let coeff = 1 + 2 * (R - norm) / norm;

            vertex.multiplyScalar(coeff);

            newPoints.push(vertex);

        }

        newPoints.push(new THREE.Vector3());

        // Build the convex hull
        let hull : [number,number,number][] = new QuickHull(newPoints.map((v)=><[number, number, number]>[v.x, v.y, v.z]));

        for (let i = 0; i < numPoints; i++) {
            if (belongsToHull(newPoints[i], hull, newPoints)) {
                returnValue.push(points[i]);
            }
        }

        return returnValue;

    }

}

export = mth;
