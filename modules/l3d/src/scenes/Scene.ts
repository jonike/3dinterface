import * as config from 'config';
import * as THREE from 'three';
import * as mth from 'mth';

import { PointerCamera } from '../cameras/PointerCamera';
import { ProgressiveLoader } from '../loaders/ProgressiveLoader';
import { BaseRecommendation } from '../recommendations/BaseRecommendation';
import { CameraItf } from '../utils/Logger';

module l3d {
    /**
     * Class that represents a scene that can contain recommendations
     */
    export abstract class Scene extends THREE.Scene {
        /**
         * The objects that the camera can collide
         */
        collidableObjects : THREE.Object3D[];

        /**
         * The objects that the click can collide. Every object that could hide
         * another from the click should be in array
         */
        clickableObjects : THREE.Object3D[];

        /**
         * The pointer camera associated with the scene (and the loading)
         */
        protected camera : PointerCamera;

        /**
         * The progressive loader that will load the elements from the scene
         */
        protected loader : ProgressiveLoader;

        /**
         * Default prefetching policy
         */
        prefetchType : config.PrefetchingPolicy;

        /**
         * Array for recommendations
         */
        recommendations : BaseRecommendation[];

        /**
         * Functions to call when loading is finished
         */
        onLoad : Function[];

        constructor() {

            super();

            this.collidableObjects = [];
            this.clickableObjects = [];
            this.camera = null;
            this.loader = null;
            this.prefetchType = config.PrefetchingPolicy.NV_PN;
            this.recommendations = [];
            this.onLoad = [];


            var directionalLight = new THREE.DirectionalLight(0x777777);
            directionalLight.position.set(1, 1, 0).normalize();
            directionalLight.castShadow = false;
            this.add(directionalLight);

            var ambientLight = new THREE.AmbientLight(0xbbbbbb);
            this.add(ambientLight);

        }

        /**
         * Sets the camera of the scene
         * @param camera the camera associated with the loading of the scene
         */
        setCamera(camera : PointerCamera) {

            this.camera = camera;
            this.camera.resetElements = this.getResetElements();
            this.camera.reset();

            if (this.loader instanceof ProgressiveLoader)
                this.loader.camera = camera;

        }

        /**
         * Loads the models from the scene
         * @param prefetch prefetching policy
         */
        load(prefetch : config.PrefetchingPolicy, lowRes : boolean) {

            // Nothing to load for an empty scene

        }

        /**
         * Gets the reset elements of the scene
         * @return {Object} an object containing position and target, two THREE.Vector3
         */
        getResetElements() {

            return {
                position: new THREE.Vector3(),
                target:   new THREE.Vector3()
            }

        }

        addRecommendations(ClassToInstanciate : any, width : number, height : number, recoSize ?: number) {

            var createRecommendation = function(position : CameraItf) {
                return new ClassToInstanciate(
                    50,
                    width/height,
                    1,
                    100000,
                    mth.copy(position.position),
                    mth.copy(position.target)
                );
            }

            // Access local recommendations
            for (var i = 0; i < this.getRawRecommendations().length; i++) {

                var reco = createRecommendation(this.getRawRecommendations()[i]);
                this.recommendations.push(reco);
                reco.addToScene(this);
                this.clickableObjects.push(reco);

                if (recoSize !== undefined)
                    reco.setSize(recoSize);

            }

            return this.recommendations;

        }

        createRecommendation(ClassToInstanciate : any, width : number, height : number, id : number, recoSize ?: number) {

            var createRecommendation = function(position : CameraItf) {
                return new ClassToInstanciate(
                    50,
                    width/height,
                    1,
                    100000,
                    mth.copy(position.position),
                    mth.copy(position.target)
                );
            }

            var reco = createRecommendation(this.getRawRecommendations()[id]);
            this.recommendations.push(reco);
            reco.addToScene(this);
            this.clickableObjects.push(reco);

            if (recoSize !== undefined)
                reco.setSize(recoSize);
        }

        addEventListener(event : any, callback : Function) {

            switch (event) {
                case 'onload':
                    this.onLoad.push(callback);
                break;
                default:
                    console.warn('Event ignored');
                break;
            }

        }

        finish() {

            this.onLoad.map(function(f) { f(); });

        }

        abstract getRawRecommendations() : CameraItf[];

    }
}

export = l3d;
