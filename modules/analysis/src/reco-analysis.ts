import * as config from 'config';
import * as l3d from 'l3d';
import * as l3dp from 'l3dp';
import * as THREE from 'three';

import * as fs from 'fs';

import * as Serial from './Serial';

import { join } from 'path';
import { pixelsToFile } from './pixelsToFile';
import { selectScene, UndefinedSceneError } from './selectScene';

import { initializeScene } from './initializeScene';

let Canvas = require('canvas');
let gl = require('gl');

let width = 1134;
let height = 768;

let imageNumber = 0;
let colorToFace : THREE.Face3[] = [];
let triangleMeshes : { [id:string] : THREE.Mesh } = {};

let loader : l3d.ProgressiveLoader;

function main(configScene : config.Scene) {

    let {
        sceneElements,
        canvas,
        gl,
        renderer,
        triangleMeshes,
        camera,
        modelMap,
        recommendationData,
        counter,
        scene
    } = initializeScene(configScene, width, height);

    process.stderr.write('Initialization finished : ' + config.Scene[configScene] + ' has ' + counter + ' faces\n');

    for (let recommendationId = 0; recommendationId < recommendationData.length; recommendationId++) {

        process.stderr.write('Computing recommendation ' + recommendationId + '\n');

        if (recommendationId !== 0) {
            let reco = recommendationData[recommendationId - 1];
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

        if (!fs.existsSync('./img/' + config.Scene[configScene])) {
            fs.mkdirSync('img/' + config.Scene[configScene]);
        }

        pixelsToFile(pixels, width, height, 'img/' + config.Scene[configScene] + '/' + recommendationId + '.png');

    }

}

if (require.main === module) {
    let scene = parseInt(process.argv[2], 10) ;

    try {
        main(scene);
    } catch (e) {
        if (e instanceof UndefinedSceneError) {
            process.stderr.write('The scene you asked for is not defined\n');
            process.exit(-1);
        } else {
            throw e;
        }
    }
}
