import * as config from 'config';
import * as THREE from 'three';
import * as l3d from 'l3d';
import * as mth from 'mth';

import { SceneWithCoins } from './SceneWithCoins';
import { CoinConfig } from 'config';
import { RecommendationData } from './RecommendationData';
import { CoinData } from './CoinData';

module l3dp {

    export class MountainScene extends SceneWithCoins {

        constructor() {
            super();
        }

        setCamera(camera : l3d.PointerCamera) {

            super.setCamera(camera);
            this.camera.speed = 0.005;

        }

        load(prefetch : config.PrefetchingPolicy, lowRes = false) {

            if (prefetch !== undefined) {
                this.prefetchType = prefetch;
            }

            var path = lowRes === true ?
                '/static/data/mountain/coocoolmountain.obj':
                '/static/data/mountain/coocoolmountain_sub.obj';


            this.loader = new l3d.ProgressiveLoader(
                path,
                this,
                this.camera,
                (object : THREE.Mesh) => {

                    this.clickableObjects.push(object);

                    object.raycastable = true;

                    if (object.material.name === 'Material.070_13F025D5_c2.png' ||
                        object.material.name === 'Material.068_5972FC88_c.bmp' ||
                        object.material.name === 'Material.073_76F611AD_c.bmp' ||
                        object.material.name === 'Material.071_76F611AD_c.bmp' ||
                        object.material.name === 'Material.072_1723CCC7_c.bmp' ||
                        object.material.name === 'Material.069_78B64DC7_c.bmp' ||
                        object.material.name === 'Material.070_13F025D5_c.bmp' ||
                        object.material.name === 'Material.078_3165B23A_c.bmp' ||
                        object.material.name === 'Material.067_1723CCC7_c.bmp' ||
                        object.material.name === 'Material.066_36DB292F_c.bmp') {

                            object.raycastable = false;
                            object.material.transparent = true;

                    } else if (object.material.name === 'Material.082_6DAF90F6_c.bmp') {
                        object.raycastable = false;
                        object.material.transparent = true;
                        object.material.opacity = 0.5;
                    }

                },
                ()=>{},// l3d.LogFunction,
                false,
                this.prefetchType
            );

            this.loader.onFinished = () => { this.finish(); }
            this.loader.load();

            this.collidableObjects.push(this.loader.obj);
            this.clickableObjects.push(this.loader.obj);
            this.loader.obj.raycastable = true;

        }

        getResetElements() {

            return {
                position : new THREE.Vector3(-20.558328115300082,23.601312087942762,-10.220633604814038),
                target : new THREE.Vector3(11.025356711105232,11.969889531789319,11.393733425161644)
            }

        }

        getRawRecommendations() : l3d.RecommendationInfo[] {
            return RecommendationData.mountainRecommendations;
        }

        getRawCoins() : mth.Vector3[] {
            return CoinData.mountainCoins;
        }

    }

}

export = l3dp;
