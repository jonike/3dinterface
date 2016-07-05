import * as config from 'config';
import * as l3d from 'l3d';
import * as l3dp from 'l3dp';
import * as THREE from 'three';

import * as fs from 'fs';

import * as Serial from './Serial';

import { join } from 'path';

let Canvas = require('canvas');
let gl = require('gl');

let width = 1134;
let height = 768;

let imageNumber = 0;
let colorToFace : THREE.Face3[] = [];
let triangleMeshes : { [id:string] : THREE.Mesh } = {};

let pathToGenerated = join(__dirname,'../../../../generated/models-generation/');

function pixelsToFile(pixels : Uint8Array, path : string) {

    let str = 'P3\n' + width + ' ' + height + '\n' + 255 + '\n';

    for (let i = (pixels.length / 4) - 3; i > 0 ; i--) {
        str += pixels[4*i] + ' ' + pixels[4*i+1] + ' ' + pixels[4*i+2] + '\n';
    }

    fs.writeFileSync(path, str);

}

function main(path : string) {

    let canvas = new Canvas(width, height);
    canvas.addEventListener = function(t : any, listener : any) {
        canvas['on' + t] = listener;
    };

    let gl = require('gl')(width, height, { preserveDrawingBuffer: true })

    let renderer = new THREE.WebGLRenderer({canvas:canvas, context:gl});

    let scene = l3dp.createSceneFromConfig({
        scene: config.Scene.BobombBattlefield,
        recommendationStyle: config.RecommendationStyle.BaseRecommendation
    }, width, height);

    let camera = new l3d.SphericCamera(50, width/height, 0.001, 1000000);
    scene.setCamera(camera);

    let modelMap = JSON.parse(fs.readFileSync(join(pathToGenerated, 'maps', 'bobomb battlefeild.json'), 'utf-8'));
    let bigModel = Serial.loadFromFile(join(pathToGenerated, 'models', 'bobomb battlefeild_sub.json'));

    camera.look();

    // For each small triangle
    let counter = 0;
    let material = new THREE.MeshFaceMaterial();
    for (let key in modelMap) {

        let geometry = new THREE.Geometry();
        geometry.vertices = (<THREE.Geometry>(<THREE.Mesh>bigModel.children[0]).geometry).vertices;

        for (let i = 0; i < modelMap[key].length; i++) {
            let face = modelMap[key][i];
            let split = face.split('-').map(function(o : string) { return parseInt(o,10) - 1; });
            let face3 = new THREE.Face3(split[0], split[1], split[2]);

            face3.materialIndex = counter;
            material.materials.push(new THREE.MeshBasicMaterial({color: counter+1}));
            colorToFace[counter] = face3;

            geometry.faces.push(face3);

            counter++;
        }

        // let name = key.split('-').map(function(o) { return parseInt(o,10)-1; }).join('-');
        triangleMeshes[key] = new THREE.Mesh(geometry, material);
        scene.add(triangleMeshes[key]);

    }

    renderer.render(scene, camera);

    let pixels = new Uint8Array(width*height*4);
    gl.readPixels(0,0,width,height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
    pixelsToFile(pixels, path);

}

if (require.main === module) {
    main(process.argv[2]);
}
