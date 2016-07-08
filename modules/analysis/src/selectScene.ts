import * as config from 'config';
import * as l3dp from 'l3dp';

import { join } from 'path';

let pathToGenerated = join(__dirname,'../../../generated/models-generation/');

export class UndefinedSceneError extends Error {

}

export function selectScene(scene : config.Scene) {

    switch (scene) {
        case config.Scene.BobombBattlefield:
            return {
                modelMapPath : join(pathToGenerated, 'maps', 'bobomb battlefeild.json'),
                bigModelPath : join(pathToGenerated, 'models', 'bobomb battlefeild_sub.json'),
                recommendationData : l3dp.RecommendationData.bobombRecommendations
            };

        case config.Scene.WhompFortress:
            return {
                modelMapPath : join(pathToGenerated, 'maps', 'Whomps Fortress.json'),
                bigModelPath : join(pathToGenerated, 'models', 'Whomps Fortress_sub.json'),
                recommendationData : l3dp.RecommendationData.whompRecommendations
            };

        case config.Scene.CoolCoolMountain:
            return {
                modelMapPath : join(pathToGenerated, 'maps', 'coocoolmountain.json'),
                bigModelPath : join(pathToGenerated, 'models', 'coocoolmountain_sub.json'),
                recommendationData : l3dp.RecommendationData.mountainRecommendations
            };

        default:
            throw new UndefinedSceneError("Scene not available for recommendation elements");

    }
}
