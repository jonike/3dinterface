import * as config from 'config';
import * as THREE from 'three';
import * as l3d from 'l3d';
import * as mth from 'mth';

import { SceneWithCoins } from './SceneWithCoins';
import { CoinConfig } from 'config';
import { RecommendationData } from './RecommendationData';
import { CoinData } from './CoinData';
import { Coin } from './Coin';

module l3dp {

    export class PeachScene extends SceneWithCoins {

        coinScale : number;
        loader : l3d.ProgressiveLoader;

        constructor() {

            super();
            this.coinScale = 0.001;

        }

        load(prefetch : config.PrefetchingPolicy) {

            if (prefetch !== undefined) {
                this.prefetchType = prefetch;
            }

            this.loader = new l3d.ProgressiveLoader(
                '/static/data/castle/princess peaches castle (outside).obj',
                this,
                this.camera,
                (object : THREE.Mesh) => {

                    this.clickableObjects.push(object);
                    object.raycastable = true;

                    if (object.material.name === 'Material.103_princess_peaches_cast') {

                        object.raycastable = false;
                        object.material.transparent = false;

                    } else if (object.material.name === 'Material.136_princess_peaches_cast' ||
                               object.material.name === 'Material.135_princess_peaches_cast') {

                        object.raycastable = false;
                        object.material.transparent = false;

                        object.material.opacity = 0.5;
                        object.raycastable = false;
                        object.material.side = THREE.FrontSide;
                    }
                },
                ()=>{},// l3d.LogFunction,
                    false,
                this.prefetchType
            );

            this.loader.onFinished = () => this.finish();
            this.loader.load();

            this.collidableObjects.push(this.loader.obj);
            this.clickableObjects.push(this.loader.obj);
            this.loader.obj.raycastable = true;

        }

        setCamera(camera : l3d.PointerCamera) {

            super.setCamera(camera);
            this.camera.speed = 0.001;

        }

        getResetElements() {

            return {
                position: new THREE.Vector3(0.24120226734236713,0.2009624547018851,-0.5998422840047036),
                target: new THREE.Vector3(0.24120226734232672,0.20096245470190008,-40.5998422840047)
            }

        }

        addCoins(coinConfig :CoinConfig) {

            super.addCoins(coinConfig, 0.001);

        }

        createCoin(position : mth.Vector3, scale = this.coinScale, visible = true, callback = ()=>{}) {

            var coin = new Coin(position, scale, visible, callback);
            this.add(coin);
            this.coins.push(coin);
            this.collidableObjects.push(coin);
            this.clickableObjects.push(coin);

        }

        getRawRecommendations() : l3d.RecommendationInfo[] {
            return RecommendationData.peachRecommendations;
        }

        getRawCoins() : mth.Vector3[] {
            return CoinData.peachCoins;
        }

    }

}

export = l3dp;
