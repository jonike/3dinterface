import * as config from 'config';
import * as l3dp from 'l3dp';

import { join } from 'path';

let pathToGenerated = join(__dirname,'../../../../generated/models-generation/');

export class UndefinedSceneError extends Error {

    name : string = "UndefinedSceneError";

    constructor(message ?: string) {
        super(message);
    }

}

export class UndefinedPrefetchingPolicyError extends Error {

    name : string = "UndefinedPrefetchingPolicyError";

    constructor(message ?: string) {
        super(message);
    }

}

export function selectScene(scene : config.Scene) {

    let ret = {
        modelMapPath: '',
        bigModelPath: '',
        loaderPath: '',
        recommendationData: l3dp.RecommendationData.dict[scene]
    };

    switch (scene) {
        case config.Scene.BobombBattlefield: {
            ret.modelMapPath = join(pathToGenerated, 'maps', 'bobomb battlefeild.json');
            ret.bigModelPath = join(pathToGenerated, 'models', 'bobomb battlefeild_sub.json');
            ret.loaderPath = '/static/data/bobomb/bobomb battlefeild_sub.obj';
            return ret;
        }

        case config.Scene.WhompFortress: {
            ret.modelMapPath = join(pathToGenerated, 'maps', 'Whomps Fortress.json');
            ret.bigModelPath = join(pathToGenerated, 'models', 'Whomps Fortress_sub.json');
            ret.loaderPath = '/static/data/whomp/Whomps Fortress_sub.obj';
            return ret;
        }

        case config.Scene.CoolCoolMountain: {
            ret.modelMapPath = join(pathToGenerated, 'maps', 'coocoolmountain.json');
            ret.bigModelPath = join(pathToGenerated, 'models', 'coocoolmountain_sub.json');
            ret.loaderPath = '/static/data/mountain/coocoolmountain_sub.obj';
            return ret;
        }

        default:
            console.log("Scene not available for recommendation elements " + scene)
            throw new UndefinedSceneError("Scene not available for recommendation elements");

    }
}
