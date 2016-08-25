import * as fs from 'fs';
import { join } from 'path';

import * as config from 'config';
import * as l3d from 'l3d';
import * as l3dp from 'l3dp';
import { filterInt } from 'mth';
import * as THREE from 'three';

import * as Serial from './lib/serial';
import { pixelsToFile } from './lib/pixelsToFile';
import { selectScene, UndefinedSceneError, UndefinedPrefetchingPolicyError } from './lib/selectScene';
import { initializeScene } from './lib/initializeScene';
import { analyse } from './lib/analyse';

// Redeclare XMLHttpRequest so we can use it with node (and its require)
let XMLHttpRequest : {
    prototype: XMLHttpRequest;
    new (): XMLHttpRequest;
    LOADING: number;
    DONE: number;
    UNSENT: number;
    OPENED: number;
    HEADERS_RECEIVED: number;
} = require('xmlhttprequest').XMLHttpRequest;

let Canvas = require('canvas');
let gl = require('gl');

let argv = require('yargs')
    .usage('Usage : reco-analysis.js [options]')
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

const width = 1134;
const height = 768;

export function main(camera : l3d.ReplayCamera, replayId : number, loadingConfig : config.LoadingConfig, verbose : boolean, next ?: Function) {

    if (verbose)
        process.stderr.write('Initializing elements, please wait...\n');

    let configScene : config.Scene = camera.data.sceneInfo.sceneId;
    let dirName = (loadingConfig.prefetchingPolicy === config.PrefetchingPolicy.NV_PN) ? 'NV_PN' : 'V_PD';


    let {
        sceneElements,
        canvas,
        gl,
        renderer,
        triangleMeshes,
        modelMap,
        recommendationData,
        counter,
        scene
    } = initializeScene(configScene, width, height);

    scene.setCamera(camera);
    camera.start();

    let iterations = 0;
    let curve : number[] = [];

    if (verbose)
        process.stderr.write(`Initialization finished : ${config.Scene[configScene]} has ${counter} faces\n`);

    let loader = new l3d.TestLoader(
        sceneElements.loaderPath,
        new THREE.Scene(),
        camera,
        () => {},
        () => {},
        loadingConfig,
        false
    );

    loader.onBeforeEmit = () => {

        process.stderr.write("Computing frame " + iterations + "... ");

        // update camera
        for (let i = 0; i < 10; i++)
            camera.update(20);

        camera.look();
        camera.updateMatrixWorld(true);

        // Compute rendering
        let { array, pixels } = analyse(renderer, scene, camera);
        // pixelsToFile(pixels, width, height, 'img/' + iterations + '.png');
        iterations++;

        let num = 0;
        let denom = 0;

        // Traverse the array and compute the number of correct pixels (i.e. that belongs to a face in mapFace)
        for (let elt of array) {

            if (loader.reverseMapFace[elt.triangle]) {
                num++;
            }

            denom++;

        }

        let score = num / denom;
        process.stderr.write(100 * score + '\n');
        curve.push(score);


    };

    loader.load(() => {

        console.log("Done !");

        // Write curve to file
        fs.writeFileSync(
            'curves/' + dirName + '/' + replayId + '.txt',
            'expId=' + replayId + '\nsceneId='  + configScene  + '\nprefetch=' + dirName +
                curve.reduce((a,b)=>a+'\n'+b,'')
        );

        process.exit(0);

    });

}

if (require.main === module) {
    let generateImages = argv.i || argv.images;
    let verbose = argv.v || argv.verbose;
    let replayId = argv.id;

    let scene : config.Scene = argv.scene || argv.s;
    let prefetchName = argv.p || argv.prefetch;

    let prefetchingPolicy : config.PrefetchingPolicy;
    let camera = new l3d.ReplayCamera(50, width/height,0.001, 1000000, [], "{}",()=>{});

    switch(argv.p || argv.prefetch) {
        case 'NV-PN': prefetchingPolicy = config.PrefetchingPolicy.NV_PN; break;
        case 'V-PD':  prefetchingPolicy = config.PrefetchingPolicy.V_PD;  break;
        default:      throw new UndefinedPrefetchingPolicyError('Only NV-PN or V-PD is allowed here');
    };

    let xhr = new XMLHttpRequest();
    xhr.open("GET", 'http://localhost:4000/prototype/replay-info/' + replayId, true);

    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if(xhr.status === 200) {
                camera.data = JSON.parse(xhr.responseText);
                camera.path = camera.data.events;
                main(camera, replayId, {prefetchingPolicy:prefetchingPolicy, chunkSize:1250}, verbose);
            } else {
                process.stderr.write("Could not connect to the server... is it running ?\n");
                process.exit(-1);
            }
        }
    };

    xhr.send();


}
