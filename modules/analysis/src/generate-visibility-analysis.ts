import * as fs from 'fs';
import * as child_process from 'child_process';

import * as config from 'config';
import * as l3dp from 'l3dp';

import * as visibility from './visibility-analysis';

function main() {

    let options : config.LoadingConfig[] = [
        {
            prefetchingPolicy: config.PrefetchingPolicy.NV_PN,
            HPR: false,
        },
        {
            prefetchingPolicy: config.PrefetchingPolicy.NV_PN,
            HPR: true,
        },
        {
            prefetchingPolicy: config.PrefetchingPolicy.V_PD,
            HPR: false,
        },
    ];

    let NV_PN_curves : number[][] = [];
    let NV_PN_HPR_curves : number[][] = [];
    let V_PD_curves : number[][] = [];

    let max_length = 0;

    let NV_PN_avg : number[] = [];
    let NV_PN_HPR_avg : number[] = [];
    let V_PD_avg : number[] = [];

    // Get every information
    for (let scene of [config.Scene.BobombBattlefield, config.Scene.WhompFortress, config.Scene.CoolCoolMountain]) {

        for (let bookmarkId = 0; bookmarkId < l3dp.RecommendationData.dict[scene].length + 1; bookmarkId++) {

            for (let optionIndex in options) {

                let option = options[optionIndex];
                let dirName : string;
                let curves : number[][];

                if (option.prefetchingPolicy === config.PrefetchingPolicy.NV_PN) {

                    if (option.HPR === true) {
                        // NV_PN_HPR
                        dirName = 'NV_PN_HPR';
                        curves = NV_PN_HPR_curves;
                    } else {
                        // NV_PN
                        dirName = 'NV_PN';
                        curves = NV_PN_curves;
                    }

                } else {
                    // V_PD
                    dirName = 'V_PD';
                    curves = V_PD_curves;
                }

                let curve : number[];

                try {

                    // Try to read the curve from the file
                    curve =
                        JSON.parse(
                            fs.readFileSync(
                                './curves/' + dirName + '/' + config.Scene[scene] + bookmarkId + '.json',
                                'utf-8'
                            )
                        );

                } catch (e) {

                    // If it fails, generate the file by spawning the right script ...
                    process.stderr.write('Data not existing, generating...\n');

                    child_process.spawnSync('node', [
                        'visibility-analysis',
                        '-v',
                        '-i', 'img',
                        '-s', scene + '',
                        '-p', config.PrefetchingPolicy[option.prefetchingPolicy].replace('_','-'),
                        option.HPR ? '--HPR': ''
                    ], {
                        cwd: __dirname,
                        stdio: 'pipe'
                    });

                    // ... and then read the data from the file
                    curve =
                        JSON.parse(
                            fs.readFileSync(
                                './curves/' + dirName + '/' + config.Scene[scene] + bookmarkId + '.json',
                                'utf-8'
                            )
                        );

                }

                curves.push(curve);
                max_length = Math.max(max_length, curve.length);

            }

        }

    }

    process.stderr.write('Generating finished : computing averages\n');

    // Compute the averages
    for (let j = 0; j < max_length; j++) {

        let NV_PN_sum = 0;
        let NV_PN_HPR_sum = 0;
        let V_PD_sum = 0;

        for (let i = 0; i < NV_PN_curves.length; i++) {

            NV_PN_sum     += NV_PN_curves[i][j]     === undefined ? 1 : NV_PN_curves[i][j];
            NV_PN_HPR_sum += NV_PN_HPR_curves[i][j] === undefined ? 1 : NV_PN_HPR_curves[i][j];
            V_PD_sum      += V_PD_curves[i][j]      === undefined ? 1 : V_PD_curves[i][j];

        }

        NV_PN_avg.push(NV_PN_sum / NV_PN_curves.length);
        NV_PN_HPR_avg.push(NV_PN_HPR_sum / NV_PN_curves.length);
        V_PD_avg.push(V_PD_sum / NV_PN_curves.length);

    }

    fs.writeFileSync('curves/NV_PN.json',     JSON.stringify(NV_PN_avg));
    fs.writeFileSync('curves/NV_PN_HPR.json', JSON.stringify(NV_PN_HPR_avg));
    fs.writeFileSync('curves/V_PD.json',      JSON.stringify(V_PD_avg));

    fs.writeFileSync('curves/NV_PN.txt',     NV_PN_avg    .reduce((a,b) => a + '\n' + b, ''));
    fs.writeFileSync('curves/NV_PN_HPR.txt', NV_PN_HPR_avg.reduce((a,b) => a + '\n' + b, ''));
    fs.writeFileSync('curves/V_PD.txt',      V_PD_avg     .reduce((a,b) => a + '\n' + b, ''));

}

if (require.main === module) {

    main();

}
