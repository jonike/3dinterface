import * as config from 'config';
import * as l3d from 'l3d';
import * as l3dp from 'l3dp';
import * as THREE from 'three';

import * as fs from 'fs';

import * as Serial from './Serial';

import { join } from 'path';

import { pixelsToFile } from './pixelsToFile';

let Canvas = require('canvas');
let gl = require('gl');

let width = 1134;
let height = 768;

let imageNumber = 0;
let colorToFace : THREE.Face3[] = [];
let triangleMeshes : { [id:string] : THREE.Mesh } = {};

let pathToGenerated = join(__dirname,'../../../../generated/models-generation/');

let loader : l3d.ProgressiveLoader;

function main(recommendationIds ?: number[]) {

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

        triangleMeshes[key] = new THREE.Mesh(geometry, material);
        scene.add(triangleMeshes[key]);

    }

    if (recommendationIds === undefined) {
        recommendationIds = [0];
        for (let i = 0; i < l3dp.RecommendationData.bobombRecommendations.length; i++) {
            recommendationIds.push(i+1);
        }
    }

    process.stderr.write('Initialization finished : ' + counter + ' faces\n');

    for (let recommendationId of recommendationIds) {

        process.stderr.write('Computing recommendation ' + recommendationId + '\n');

        if (recommendationId !== 0) {
            let reco = l3dp.RecommendationData.bobombRecommendations[recommendationId - 1];
            camera.startInstantMotion(reco);
        }

        camera.recommendationClicked = recommendationId;

        camera.look();

        let previousTime = Date.now();
        renderer.render(scene, camera);
        process.stderr.write('Rendering complete : ' + (Date.now() - previousTime) + 'ms\n');

        let pixels = new Uint8Array(width*height*4);
        gl.readPixels(0,0,width,height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);

        if (!fs.existsSync('./img')) {
            fs.mkdirSync('img');
        }

        pixelsToFile(pixels, width, height, 'img/' + recommendationId + '.ppm');

    }

}

if (require.main === module) {
    let recommendationId = parseInt(process.argv[2], 10);
    if (!isNaN(recommendationId)) {
        main([recommendationId]);
    } else {
        main();
    }

}
