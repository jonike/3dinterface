module Proto {

    export class SponzaScene extends SceneWithCoins {

        constructor() {
            super();
        }

        setCamera(camera : L3D.PointerCamera) {

            super.setCamera(camera);
            this.camera.speed = 0.002;

        }

        load(prefetch : string) {

            if (prefetch !== undefined) {
                this.prefetchType = prefetch;
            }

            this.loader = new L3D.ProgressiveLoader(
                '/static/data/sponza/sponza.obj',
                this,
                this.camera,
                (object : THREE.Mesh) => {

                    this.clickableObjects.push(object);

                    if (object.material.name === 'chain' ||
                        object.material.name === 'leaf'  ||
                        object.material.name === 'Material__57') {

                        object.material.transparent = true;

                    }

                    object.raycastable = true;

                },
                ()=>{},// L3D.LogFunction,
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
                position: new THREE.Vector3(9.298373669520107,6.08877777990862,1.1130138641670737),
                target: new THREE.Vector3(5.376696417668598,5.609739213575453,0.4877382575136091)
            }

        }

        addRecommendations(ClassToInstanciate : any, width : number, height : number) {

            this.createRecommendations.apply(this, arguments);

            for (var i = 0; i < this.recommendations.length; i++) {

                this.recommendations[i].addToScene(this);
                this.collidableObjects.push(this.recommendations[i]);
                this.clickableObjects.push(this.recommendations[i]);

            }

            return this.recommendations;

        }

        createRecommendations(ClassToInstanciate : any, width : number, height : number) {

            var createRecommendation = function(position : L3D.Vector3, target : L3D.Vector3) {
                return new ClassToInstanciate(
                    50,
                    width/height,
                    1,
                    100000,
                    position,
                    target
                );
            }

            this.recommendations.push(
                createRecommendation(
                    new THREE.Vector3(1.3571661176961554,4.934280286310308,-4.294700794239404),
                    new THREE.Vector3(-31.49512083496389,15.286798072464663,16.04129235749628)
                )
            );

        }

        getRawRecommendations() : L3D.CameraItf[] { return []; }
        getRawCoins() : L3D.Vector3[] { return []; }

    }

}