import * as fs from 'fs';
import * as THREE from 'three';
import * as l3d from 'l3d';

export function serialize(object : THREE.Mesh) {

    let data : {
        vertices: THREE.Vector3[],
        children: {faces : THREE.Face3[]}[]
    } = {
        vertices: null,
        children: []
    };

    if (object.geometry instanceof THREE.Geometry) {

        let threeGeometry = <THREE.Geometry>object.geometry;
        data.vertices = threeGeometry.vertices;

    } else {

        process.stderr.write('Error : first obj of mesh has no vertices');
        process.exit(-1);

    }

    for (let objChild of object.children) {

        if (objChild instanceof THREE.Mesh && (<THREE.Mesh>objChild).geometry instanceof THREE.Geometry) {

            let threeGeometry = <THREE.Geometry>objChild.geometry;
            let newChild = { faces: threeGeometry.faces };
            data.children.push(newChild);

        }

    }

    return JSON.stringify(data);

}

export function deserialize(str : string) {

    let parse = JSON.parse(str);
    let vertices : THREE.Vector3[] = [];
    let material = new THREE.MeshBasicMaterial();

    let ret = new THREE.Mesh();

    for (let vertex of parse.vertices) {
        vertices.push(new THREE.Vector3(vertex.x, vertex.y, vertex.z));
    }


    for (let parseChild of parse.children) {

        let geometry = new THREE.Geometry();
        geometry.vertices = vertices;

        for (let face of parseChild.faces) {
            geometry.faces.push(new THREE.Face3(face.a, face.b, face.c));
        }

        geometry.computeBoundingSphere();
        let newChild = new THREE.Mesh(geometry, material);

        ret.children.push(newChild);
    }

    return ret;

}

export function serializeToFile(path : string, obj : THREE.Mesh) {

    fs.writeFileSync(path, serialize(obj));

}

export function loadFromFile(path : string) {

    return deserialize(fs.readFileSync(path, 'utf-8'));

}
