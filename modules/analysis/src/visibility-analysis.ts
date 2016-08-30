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

export function main(configScene : config.Scene, loadingConfig : config.LoadingConfig, verbose : boolean, next ?: Function) {

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

    let f = (recommendationId : number) => {

        if (recommendationId > recommendationData.length) {

            // console.log(`-> We are done ${recommendationId}/${recommendationData.length}`);

            // We are done
            if (typeof next === 'function') {
                next();
            }

            return;

        }

        if (verbose)
            process.stderr.write('Computing recommendation ' + recommendationId + '\n');

        if (recommendationId !== 0) {
            let reco = recommendationData[recommendationId - 1];
            camera.startInstantMotion(reco);
            camera.recommendationClicked = recommendationId;
        } else {
            camera.reset();
        }

        camera.look();

        let loader = new l3d.TestLoader(
            sceneElements.loaderPath,
            loadingConfig
        );

        loader.onFinished = () => {

            if (verbose)
                console.log("Loading finished, analysing");

            // Analyse the bookmark
            let array : {triangle : number, area : number}[];

            try {

                array = [];

                let tmp = JSON.parse(
                    fs.readFileSync(
                        './generated/' + config.Scene[configScene] + '/bookmark' + recommendationId  +'.json', 'utf-8'
                    )
                );

                for (let i = 0; i < tmp.triangles.length; i++) {
                    array.push({
                        triangle : tmp.triangles[i],
                        area : tmp.areas[i]
                    });
                }

            } catch(e) {

                process.stderr.write('Could not read serialized file, computing rendering...\n');
                array = analyse(renderer, scene, camera).array;

            }

            let output : number[] = [];

            let percentage = 0;

            if (verbose)
                console.log("Traversing faces received by the loader : " + Object.keys(loader.mapFace).length);

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

            if (!fs.existsSync('curves')) {
                fs.mkdirSync('curves');
            }

            let dirName = config.PrefetchingPolicy[loadingConfig.prefetchingPolicy] + (loadingConfig.HPR ? '_HPR' : '');

            if (!fs.existsSync('curves/' + dirName)) {
                fs.mkdirSync('curves/' + dirName);
            }

            fs.writeFileSync('curves/' + dirName + '/' + config.Scene[configScene] + recommendationId + '.json', JSON.stringify(output));

            f(recommendationId + 1);

        };

        loader.load();

    };

    f(0);

}

if (require.main === module) {
    let generateImages = argv.i || argv.images;
    let verbose = argv.v || argv.verbose;

    let scene : config.Scene = argv.scene || argv.s;
    let prefetchName = argv.p || argv.prefetch;

    let HPR = argv.HPR;

    let prefetchingPolicy : config.PrefetchingPolicy;

    switch(argv.p || argv.prefetch) {
        case 'NV-PN': prefetchingPolicy = config.PrefetchingPolicy.NV_PN; break;
        case 'V-PD':  prefetchingPolicy = config.PrefetchingPolicy.V_PD;  break;
        default:      throw new UndefinedPrefetchingPolicyError('Only NV-PN or V-PD is allowed here');
    };

    main(scene, {prefetchingPolicy:prefetchingPolicy, chunkSize:12500, HPR:HPR}, verbose);

}
