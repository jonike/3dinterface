import * as fs from 'fs';
import { join } from 'path';

import * as config from 'config';
import * as l3d from 'l3d';
import * as l3dp from 'l3dp';
import { filterInt } from 'mth';
import * as THREE from 'three';

import * as Serial from './lib/serial';
import { pixelsToFile } from './lib/pixelsToFile';
import { selectScene, UndefinedSceneError } from './lib/selectScene';
import { initializeScene } from './lib/initializeScene';
import { analyse } from './lib/analyse';

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

let loader : l3d.TestLoader;

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

    let recommendationId = 1;

    let f = (recommendationId : number) => {

        if (recommendationId > recommendationData.length)
            return;

        if (verbose)
            process.stderr.write('Computing recommendation ' + recommendationId + '\n');

        let reco = recommendationData[recommendationId - 1];
        camera.startInstantMotion(reco);
        camera.recommendationClicked = recommendationId;

        loader = new l3d.TestLoader(
            sceneElements.loaderPath,
            new THREE.Scene(),
            camera,
            () => {},
            () => {},
            {
                prefetchingPolicy: config.PrefetchingPolicy.V_PD,
                chunkSize: 12500
            }
        );

        // loader.socket.emit('reco', recommendationId);

        loader.load(() => {

            console.log("Loading finished, analysing");

            // Analyse the bookmark
            let {array, pixels} = analyse(renderer, scene, camera);

            let output : number[] = [];

            let percentage = 0;

            console.log("Traversing faces received by the loader");

            for (let i in loader.mapFace) {

                let iColor = loader.mapFace[i];

                if (iColor === 0) {
                    continue;
                }

                let correspondingFace = array.map((a) => a.triangle).indexOf(iColor);

                if (correspondingFace !== -1) {
                    percentage += array[correspondingFace].area;
                } else {
                    // console.log(iColor, correspondingFace);
                }

                output.push(percentage);

                if (percentage > 1)
                    break;
            }

            fs.writeFileSync('curves/' + recommendationId + '.json', JSON.stringify(output));

            f(recommendationId + 1);

        });

    };

    f(1);

}

if (require.main === module) {
    let scene = filterInt(argv.s || argv.scene);
    let generateImages = argv.i || argv.images;
    let verbose = argv.v || argv.verbose;

    if (isNaN(scene)) {
        main(1, generateImages, verbose);
        // main(2, generateImages, verbose);
        // main(3, generateImages, verbose);
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
