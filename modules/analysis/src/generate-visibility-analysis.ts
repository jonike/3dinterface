import * as fs from 'fs';

import * as vm from 'vm';
import * as config from 'config';
import * as l3dp from 'l3dp';

function main() {

    // Merge everything
    console.log("Generation finished : merging");

    let NV_PN_curves : number[][] = [];
    let V_PD_curves : number[][] = [];

    let max_length = 0;

    let NV_PN_avg : number[] = [];
    let V_PD_avg : number[] = [];

    // Get every information
    for (let scene of [config.Scene.BobombBattlefield, config.Scene.WhompFortress, config.Scene.CoolCoolMountain]) {

        for (let bookmarkId = 0; bookmarkId < l3dp.RecommendationData.dict[scene].length + 1; bookmarkId++) {

            let curve : number[] =
                JSON.parse(
                    fs.readFileSync(
                        './curves/NV_PN/' + config.Scene[scene] + bookmarkId + '.json',
                        'utf-8'
                    )
                );

            NV_PN_curves.push(curve);
            max_length = Math.max(max_length, curve.length);

            curve =
                JSON.parse(
                    fs.readFileSync(
                        './curves/V_PD/' + config.Scene[scene] + bookmarkId + '.json',
                        'utf-8'
                    )
                );

            V_PD_curves.push(curve);
            max_length = Math.max(max_length, curve.length);

        }

    }

    // Compute the averages
    for (let j = 0; j < max_length; j++) {

        let NV_PN_sum = 0;
        let V_PD_sum = 0;

        for (let i = 0; i < NV_PN_curves.length; i++) {

            NV_PN_sum += NV_PN_curves[i][j] === undefined ? 1 : NV_PN_curves[i][j];
            V_PD_sum += V_PD_curves[i][j] === undefined ? 1 : V_PD_curves[i][j];

        }

        NV_PN_avg.push(NV_PN_sum / NV_PN_curves.length);
        V_PD_avg.push(V_PD_sum / NV_PN_curves.length);

    }

    fs.writeFileSync('curves/NV_PN.json', JSON.stringify(NV_PN_avg));
    fs.writeFileSync('curves/V_PD.json', JSON.stringify(V_PD_avg));

}

if (require.main === module) {
    main();
}
