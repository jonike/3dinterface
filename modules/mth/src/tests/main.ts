declare var exports : any;

import * as t from 'nodeunit';
import * as THREE from 'three';
import * as mth from '../mth';

let v1 = new THREE.Vector3(1,2,3);
let v2 = new THREE.Vector3(2,3,4);
let v1Bak = v1.clone();
let v2Bak = v2.clone();

function cmp_vector(test : t.Test, v1 : mth.Vector3, v2 : mth.Vector3) {

    test.equal(v1.x, v2.x);
    test.equal(v1.y, v2.y);
    test.equal(v1.z, v2.z);

}

export function equals_test(test : t.Test) {

    test.ok(mth.equals(v1,v1));
    test.ok(mth.equals(v2,v2));
    test.ok(!mth.equals(v1,v2));
    test.ok(!mth.equals(v2,v1));

    test.done();

}

export function sum_test(test : t.Test) {

    let v3 = mth.sum(v1,v2);

    test.equal(v3.x, v1.x + v2.x);
    test.equal(v3.y, v1.y + v2.y);
    test.equal(v3.z, v1.z + v2.z);

    cmp_vector(test, v1, v1Bak);
    cmp_vector(test, v2, v2Bak);

    test.done();

}

export function diff_test(test : t.Test) {

    let v5 = mth.dot(v1,v2);

    test.equal(v5, v1.x * v2.x + v1.y * v2.y + v1.z * v2.z);

    cmp_vector(test, v1, v1Bak);
    cmp_vector(test, v2, v2Bak);

    test.done();

}

export function dot_test(test : t.Test) {

    let v5 = mth.dot(v1,v2);

    test.equal(v5, v1.x * v2.x + v1.y * v2.y + v1.z * v2.z);

    cmp_vector(test, v1, v1Bak);
    cmp_vector(test, v2, v2Bak);

    test.done();

}

for (let lambda = 0; lambda < 5; lambda += 0.5) {

    exports['mul_test_' + (2*lambda+1)] = function(test : t.Test) {

        v1 = v1Bak.clone();
        v2 = v2Bak.clone();

        let v7 = mth.mul(v1, lambda);

        test.equal(v7.x, v1Bak.x*lambda);
        test.equal(v7.y, v1Bak.y*lambda);
        test.equal(v7.z, v1Bak.z*lambda);

        cmp_vector(test, v1, v1Bak);

        v1 = v1Bak.clone();
        v2 = v2Bak.clone();

        let v8 = mth.mul(v1, lambda);

        test.equal(v8.x, v1Bak.x * lambda);
        test.equal(v8.y, v1Bak.y * lambda);
        test.equal(v8.z, v1Bak.z * lambda);

        cmp_vector(test, v1, v1Bak);

        v1 = v1Bak.clone();
        v2 = v2Bak.clone();

        // Try into v1
        v1 = mth.mul(v1, lambda);

        test.equal(v7.x, v1Bak.x*lambda);
        test.equal(v7.y, v1Bak.y*lambda);
        test.equal(v7.z, v1Bak.z*lambda);

        test.done();

    };

}
