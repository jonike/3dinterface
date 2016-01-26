export class PeachScene extends SceneWithCoins {

    coinScale : number;

    constructor() {

        super();
        this.coinScale = 0.001;

    }

    load(prefetch : string) {

        if (prefetch !== undefined) {
            this.prefetchType = prefetch;
        }

        this.loader = new L3D.ProgressiveLoader(
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
            ()=>{},// L3D.LogFunction,
            false,
            this.prefetchType
        );

        this.loader.onFinished = () => this.finish();
        this.loader.load();

        this.collidableObjects.push(this.loader.obj);
        this.clickableObjects.push(this.loader.obj);
        this.loader.obj.raycastable = true;

    }

    setCamera(camera : L3D.PointerCamera) {

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

    createCoin(position : L3D.Vector3, scale = this.coinScale, visible = true, callback = ()=>{}) {

        var coin = new Coin(position, scale, visible, callback);
        this.add(coin);
        this.coins.push(coin);
        this.collidableObjects.push(coin);
        this.clickableObjects.push(coin);

    }

    addRecommendations(ClassToInstanciate : any, width : number, height : number) {

        return super.addRecommendations(ClassToInstanciate, width, height, 0.2);

    }

    createRecommendation(ClassToInstanciate : any, width : number, height : number, id : number) {

        return super.createRecommendation(ClassToInstanciate, width, height, id, 0.2);

    }

}
