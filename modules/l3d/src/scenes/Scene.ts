import * as config from 'config';
import * as THREE from 'three';
import * as mth from 'mth';

import { PointerCamera, TargetMove } from '../cameras/PointerCamera';
import { SphericCamera } from '../cameras/SphericCamera';
import { ProgressiveLoader } from '../loaders/ProgressiveLoader';
import { GenericLoader } from '../loaders/GenericLoader';
import { BaseLoader } from '../loaders/BaseLoader';
import { BaseRecommendation, RecommendationInfo } from '../recommendations/BaseRecommendation';
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
        protected camera : SphericCamera;

        /**
         * The progressive loader that will load the elements from the scene
         */
        protected loader : BaseLoader;

        /**
         * Default prefetching policy
         */
        loadingConfig : config.LoadingConfig;

        /**
         * Array for recommendations
         */
        recommendations : BaseRecommendation[];

        /**
         * Functions to call when loading is finished
         */
        onLoad : Function[];

        /**
         * Initializes the attributes and add lights to the scene
         */
        constructor() {

            super();

            this.collidableObjects = [];
            this.clickableObjects = [];
            this.camera = null;
            this.loader = null;
            this.loadingConfig = {
                prefetchingPolicy : config.PrefetchingPolicy.NV_PN
            };
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
        setCamera(camera : SphericCamera) {

            this.camera = camera;
            this.camera.resetElements = this.getResetElements();
            this.camera.reset();

            if (this.loader instanceof BaseLoader) {
                this.loader.setCamera(camera);
            }

        }

        /**
         * Loads the models from the scene
         * @param prefetch prefetching policy
         */
        abstract load(loadingConfig : config.LoadingConfig) : void;

        /**
         * Gets the reset elements of the scene
         * @return an object containing position and target, two THREE.Vector3
         */
        getResetElements() : CameraItf {

            return {
                position: new THREE.Vector3(),
                target:   new THREE.Vector3()
            }

        }

        /**
         * Add the recommendations to the scene
         * @param ClassToInstanciate class to use as recommendation. Should inherit BaseRecommendation
         * @param width width of the view of the camera of the recommendation
         * @param height height of the view of the camera of the recommendation
         * @param recoSize size of the recommendation
         * @returns the array of recommendations
         */
        addRecommendations(ClassToInstanciate : any, width : number, height : number, recoSize ?: number) {

            // Access local recommendations
            for (var i = 0; i < this.getRawRecommendations().length; i++) {

                this.addRecommendation(ClassToInstanciate, width, height, i);

            }

            return this.recommendations;

        }

        /**
         * Adds a single recommendation to the scene
         * @param ClassToInstanciate class to use as recommendation. Should inherit BaseRecommendation
         * @param width width of the view of the camera of the recommendation
         * @param height height of the view of the camera of the recommendation
         * @param id the id of the recommendation in the raw recommendations
         * @param recoSize size of the recommendation
         * @returns the recommendation created
         */
        addRecommendation(ClassToInstanciate : any, width : number, height : number, id : number, recoSize ?: number) {

            var reco = this.createRecommendation(ClassToInstanciate, width, height, this.getRawRecommendations()[id], recoSize);
            this.recommendations.push(reco);
            reco.addToScene(this);
            this.clickableObjects.push(reco);

            return reco;

        }

        /**
         * Adds a function that will be called on a certain event
         * @param event a string representing the event (for the moment, only `onload` is supported)
         * @param callback the function that will be called when the event occur
         */
        addEventListener(event : string, callback : Function) {

            switch (event) {
                case 'onload':
                    this.onLoad.push(callback);
                break;
                default:
                    console.warn('Event ignored');
                break;
            }

        }

        /**
         * Calls the functions that must be called when the scene is fully loaded
         */
        finish() {

            this.onLoad.map(function(f) { f(); });

        }

        /**
         * Returns the raw recommendations
         * @returns the array of the positions of the recommendations
         */
        abstract getRawRecommendations() : RecommendationInfo[];

        /**
         * Creates and return  a single recommendation
         * @param ClassToInstanciate class to use as recommendation. Should inherit BaseRecommendation
         * @param width width of the view of the camera of the recommendation
         * @param height height of the view of the camera of the recommendation
         * @param position the position of the recommendation
         * @param recoSize size of the recommendation
         * @returns the recommendation created
         */
        private createRecommendation(ClassToInstanciate : any, width : number, height : number, position : RecommendationInfo, recoSize ?: number)  : BaseRecommendation {

            var ret = new ClassToInstanciate(
                    50,
                    width/height,
                    1,
                    100000,
                    mth.copy(position.position),
                    mth.copy(position.target)
            );

            ret.recommendationId = position.recommendationId;

            if (recoSize !== undefined)
                ret.setSize(recoSize)

            return ret;
        }

    }
}

export = l3d;
