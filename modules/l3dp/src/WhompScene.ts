import * as config from 'config';
import * as THREE from 'three';
import * as l3d from 'l3d';
import * as mth from 'mth';

import { SceneWithCoins } from './SceneWithCoins';
import { CoinConfig } from 'config';
import { RecommendationData } from './RecommendationData';
import { CoinData } from './CoinData';

module l3dp {

    export class WhompScene extends SceneWithCoins {

        constructor() {
            super();
        }

        setCamera(camera : l3d.PointerCamera) {

            super.setCamera(camera);
            this.camera.speed = 0.002;

        }

        load(loadingConfig : config.LoadingConfig, lowRes = false) {

            if (loadingConfig !== undefined) {
                this.loadingConfig = loadingConfig;
            }

            var path = lowRes === true ?
                '/static/data/whomp/Whomps Fortress.obj':
                '/static/data/whomp/Whomps Fortress_sub.obj';

            this.loader = new l3d.ProgressiveLoader(
                path,
                this,
                this.camera,
                (object : THREE.Mesh) => {

                    this.clickableObjects.push(object);
                    object.raycastable = true;
                    if (object.material.name === 'Shape_088' ||
                        object.material.name === 'Shape_089') {

                        object.raycastable = false;
                        object.material.transparent = true;

                    } else if (object.material.name === 'Shape_113') {

                        object.raycastable = false;
                        object.material.transparent = true;
                        object.material.opacity = 0.5;

                    } else if (object.material.name === 'Shape_076' ||
                               object.material.name === 'Shape_098' ||
                               object.material.name === 'Shape_092') {
                        object.visible = false;
                    }

                },
                ()=>{},// l3d.LogFunction,
                this.loadingConfig
            );

            this.loader.onFinished = () => { this.finish(); }
            this.loader.load();

            this.collidableObjects.push(this.loader.obj);
            this.clickableObjects.push(this.loader.obj);
            this.loader.obj.raycastable = true;

        }

        getResetElements() {

            return {
                position : new THREE.Vector3(-6.725817925071645,1.4993570618328055,-10.356480813212423),
                target : new THREE.Vector3(-4.8541705829784604,1.3192268872752742,-6.825972443720941)
            }

        }

        addCoins(coinConfig : CoinConfig) {

            return super.addCoins(coinConfig, 0.002);

        }

        addRecommendations(ClassToInstanciate : any, width : number, height : number) : l3d.BaseRecommendation[] {

            return super.addRecommendations(ClassToInstanciate, width, height, 0.2);

        }

        getRawRecommendations() : l3d.RecommendationInfo[] {
            return RecommendationData.whompRecommendations;
        }

        getRawCoins() : mth.Vector3[] {
            return CoinData.whompCoins;
        }

    }

}

export = l3dp;
