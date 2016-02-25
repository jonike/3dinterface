import * as THREE from 'three';
import * as l3d from 'l3d';
import * as mth from 'mth';

import { SceneWithCoins } from './SceneWithCoins';
import { Coin } from './Coin';
import { ConfigType, CoinConfig, ExpConfig, Scene, RecommendationStyle } from 'config';
import { PeachScene } from './PeachScene';
import { WhompScene } from './WhompScene';
import { BobombScene } from './BobombScene';
import { MountainScene } from './MountainScene';

module l3dp {

    export function createSceneFromConfig(config : ExpConfig) {

        let scene : SceneWithCoins;

        switch(config.scene) {

            case Scene.PeachCastle:       scene = new PeachScene();    break;
            case Scene.CoolCoolMountain:  scene = new MountainScene(); break;
            case Scene.BobombBattlefield: scene = new BobombScene();   break;
            case Scene.WhompFortress:     scene = new WhompScene();    break;

        }

        scene.addCoins(config.coinConfig);

        let params : [any, number, number] =
            [undefined, window.containerSize.width(), window.containerSize.height()];

        switch(config.recommendationStyle) {

            case RecommendationStyle.BaseRecommendation:
                params[0] = l3d.BaseRecommendation;
            break;
            case RecommendationStyle.ViewportRecommendation:
                params[0] = l3d.ViewportRecommendation;
            break;
            case RecommendationStyle.ArrowRecommendation:
                params[0] = l3d.ArrowRecommendation;
            break;

        }

        scene.addRecommendations.apply(scene, params);

        return scene;

    }

}

export = l3dp;
