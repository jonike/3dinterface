import * as config from 'config';
import * as l3d from 'l3d';
import * as l3dp from 'l3dp';
import * as THREE from 'three';

import * as fs from 'fs';

import * as Serial from './Serial';

import { filterInt } from 'mth';
import { join } from 'path';
import { pixelsToFile } from './pixelsToFile';
import { selectScene, UndefinedSceneError } from './selectScene';

import { initializeScene } from './initializeScene';
import { analyse } from './analyse';

let Canvas = require('canvas');
let gl = require('gl');

let argv = require('yargs')
    .usage('Usage : reco-analysis.js [options]')
    .alias('i', 'images')
    .describe('i', 'Path to the place where the images should be generated, leave empty for no generation')
    .string('i')
    .alias('s','scene')
    .describe('s', 'Scene id, between 1 and 3')
    .number('s')
    .alias('v', 'verbose')
    .describe('v', 'Verbose output')
    .help('h')
    .alias('h', 'help')
    .describe('h', 'Show this help and quit')
    .locale('en')
    .argv;

let width = 1134;
let height = 768;

let imageNumber = 0;
let colorToFace : THREE.Face3[] = [];
let triangleMeshes : { [id:string] : THREE.Mesh } = {};

let loader : l3d.ProgressiveLoader;

function main(configScene : config.Scene, generateImages : string, verbose : boolean) {

    if (verbose)
        process.stderr.write('Initializing elements, please wait...\n');

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

    if (verbose)
        process.stderr.write(`Initialization finished : ${config.Scene[configScene]} has ${counter} faces\n`);

    for (let recommendationId = 0; recommendationId < recommendationData.length; recommendationId++) {

        if (verbose)
            process.stderr.write('Computing recommendation ' + recommendationId + '\n');

        if (recommendationId !== 0) {
            let reco = recommendationData[recommendationId - 1];
            camera.startInstantMotion(reco);
        }

        // Analyse the bookmark
        let {array, pixels} = analyse(renderer, scene, camera);

        // Save the image if required
        if (generateImages !== undefined) {
            if (!fs.existsSync(generateImages)) {
                fs.mkdirSync(generateImages);
            }

            if (!fs.existsSync(join(generateImages, config.Scene[configScene]))) {
                fs.mkdirSync(join(generateImages, config.Scene[configScene]));
            }

            pixelsToFile(
                pixels, width, height,
                join(generateImages, config.Scene[configScene], recommendationId + '.png')
            );
        }

        if (!fs.existsSync('./generated')) {
            fs.mkdirSync('generated');
        }

        if (!fs.existsSync('./generated/' + config.Scene[configScene])) {
            fs.mkdirSync('generated/' + config.Scene[configScene]);
        }

        // Unzip the analysis and generate the JSON file
        let triangles = array.map((a) => a.triangle);
        let areas = array.map((a) => a.area);

        fs.writeFileSync(
            './generated/' + config.Scene[configScene] + '/bookmark' + recommendationId + '.json',
            JSON.stringify({triangles:triangles, areas:areas})
        );

    }

}

if (require.main === module) {
    let scene = filterInt(argv.s || argv.scene);
    let generateImages = argv.i || argv.images;
    let verbose = argv.v || argv.verbose;

    if (isNaN(scene)) {
        main(1, generateImages, verbose);
        main(2, generateImages, verbose);
        main(3, generateImages, verbose);
    } else {

        try {
            main(scene, generateImages, verbose);
        } catch(e) {
            if (e instanceof UndefinedSceneError) {
                process.stderr.write('The scene you asked for is not defined\n');
                process.exit(-1);
            } else {
                throw e;
            }
        }
    }
}
