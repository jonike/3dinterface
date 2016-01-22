///<reference path="./MeshesInfo.ts" />


module geo {

    module MeshLoader {

        let log = require('./log');

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

                log.ready('Meshes loaded in ' + (Date.now() - startedTime) + 'ms');

            }

        }

        function load(name? : string) : void {

            if (name !== undefined) {

                // Load corresponding model
                let container = new MeshContainer(
                    name.substring(1, name.length),
                    MeshNames.dict[name].transformation,
                    () => { MeshNames.dict[name].done = true; trySetLoaded(); }
                );


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

    export module Meshes {

        export var dict : {[id:string] :  MeshContainer} = {};

    }

}
