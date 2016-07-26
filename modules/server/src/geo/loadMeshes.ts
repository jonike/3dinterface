import { join } from 'path';
import * as THREE from 'three';
import * as l3d from 'l3d';

import { MeshContainer } from './MeshContainer';
import { MeshNames } from './MeshesInfo';
import log = require('../lib/log');

module geo {

    export module Meshes {

        export var dict : {[id:string] :  MeshContainer} = {};

    }


    module MeshLoader {

        function isLoaded() : boolean {

            for (let name in MeshNames.dict) {

                if (MeshNames.dict[name].done === false) {
                    return false;
                }

            }

            return true;

        }

        function trySetLoaded() : void {

            if (isLoaded()) {

                log.ready('All meshes loaded in ' + (Date.now() - startedTime) + 'ms');

            }

        }

        function load(name? : string) : void {

            if (name !== undefined) {

                // Load corresponding model
                let container = new MeshContainer(
                    join(__dirname, '../', name.substring(1, name.length)),
                    MeshNames.dict[name].transformation,
                    () => {

                        if (MeshNames.dict[name].recommendations !== undefined) {

                            for (var i = 0; i < MeshNames.dict[name].recommendations.length; i++) {

                                var cam = MeshNames.dict[name].recommendations[i];
                                var reco = new l3d.BaseRecommendation(
                                    50,
                                    1134 / 768,
                                    1,
                                    100000,
                                    cam.position,
                                    cam.target
                                ).camera;

                                reco.aspect = 1134 / 768;

                                reco.lookAt(reco.target);

                                reco.updateMatrix();
                                reco.updateProjectionMatrix();
                                reco.updateMatrixWorld(true);

                                reco.matrixWorldInverse.getInverse( reco.matrixWorld );

                                var frustum = new THREE.Frustum();
                                frustum.setFromMatrix(new THREE.Matrix4().multiplyMatrices(reco.projectionMatrix, reco.matrixWorldInverse));

                                Meshes.dict[name].recommendations.push({
                                    position: reco.position,
                                    target: reco.target,
                                    planes: frustum.planes
                                });

                            }

                        }

                        MeshNames.dict[name].done = true;
                        log.debug(name + ' is loaded');
                        trySetLoaded();
                    }
                );
                Meshes.dict[name] = container;


            } else {

                if (!isLoading) {

                    isLoading = true;
                    startedTime = Date.now();

                    for (let name in MeshNames.dict) {

                        // Load everything
                        load(name);

                    }

                }

            }

        }

        var isLoading : boolean = false;
        var meshesLoaded = {};
        var startedTime : number;

        load();

    }

}

export = geo;
