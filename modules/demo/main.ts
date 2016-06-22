import * as THREE from 'three';
import * as l3d from 'l3d';
import * as l3dp from 'l3dp';
import * as Config from 'config';
// import Stats = require('Stats');
declare var Stats : any;

declare var CONFIG : Config.ExpConfig;
declare var LOADING_CONFIG : Config.LoadingConfig;

$(function() {

    // Disable scrolling
    window.onscroll = () => { window.scrollTo(0,0); };

    let stats : any,
        renderer : THREE.WebGLRenderer,
        scene : l3dp.SceneWithCoins,
        container : HTMLElement,
        clickableObjects : THREE.Object3D[] = [],
        recommendations : l3d.BaseRecommendation[],
        objectClicker : l3d.ObjectClicker,
        previewer : l3d.Previewer,
        camera : l3d.PointerCamera,
        coins : l3dp.Coin[] = [],
        previousTime : number,
        pointer : l3d.MousePointer,
        startCanvas : l3d.StartCanvas,
        loadingCanvas : l3d.LoadingCanvas,
        coinCanvas : l3dp.CoinCanvas,
        buttonManager : l3dp.ButtonManager;

    main();

    function main() {

        // Main container that holds everything
        container = document.getElementById('container');

        // Initialization
        initThreeElements();
        initCanvases();
        // initModels();
        initListeners();

        // if (GLOB.hideBeforeLoading === true) {
        //     l3dp.appendTo(container)(stats, coinCanvas, startCanvas, pointer, previewer, loadingCanvas, renderer);
        //     loadingCanvas.render();
        // } else
        l3dp.appendTo(container)(startCanvas, pointer, previewer, renderer);

        // Set the good size of cameras
        onWindowResize();

        coinCanvas.update();


        // if (GLOB.locked !== undefined && GLOB.locked)
        startCanvas.render();

        // startCanvas.render(l3d.StartCanvas.Black);

        // Bind previewer to renderer (for fixed option)
        function bind() {
            if (document.pointerLockElement || document.mozPointerLockElement || document.webkitPointerLockElement) {
                // Lock event
                previewer.fixed = true;
            } else {
                // Unlock event
                previewer.fixed = false;
            }
        }
        document.addEventListener('pointerlockchange', bind);
        document.addEventListener('mozpointerlockchange', bind);
        document.addEventListener('webkitpointerlockchange', bind);

        // Start rendering
        setInterval(render, 20);

    }

    function initThreeElements() {

        // Initialize scene

        scene = l3dp.createSceneFromConfig(CONFIG);
        scene.load(LOADING_CONFIG.prefetchingPolicy, LOADING_CONFIG.lowRes);

        // scene = new GLOB.SceneClass();
        scene.addEventListener('onload', function() { loadingCanvas.clear(); });
        renderer = new THREE.WebGLRenderer({alpha:true, antialias:true});
        renderer.setClearColor(0x87ceeb);

        // Initialize pointer camera
        camera = new l3d.PointerCamera(
            50,
            window.containerSize.width() / window.containerSize.height(),
            0.01, 100000, renderer, container
        );

        scene.setCamera(camera);

        // scene.load(GLOB.prefetch, GLOB.lowRes);

        // scene.addRecommendations(GLOB.Recommendation);

        // scene.addCoins(GLOB.coinConfig);

        camera.collidableObjects = scene.collidableObjects;
        camera.collisions = true;

        // Get default param for camera lock
        $('#lock').prop('checked', true);
        camera.shouldLock = true;
        camera.onPointerLockChange();
    }

    function initCanvases() {

        // Initialize previewer
        previewer = new l3d.Previewer(renderer, scene);
        previewer.domElement.style.position ="absolute";
        previewer.domElement.style.cssFloat = 'top-left';

        // Initialize stats counter
        stats = new Stats();
        stats.setMode(0);
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.cssFloat = "top-left";

        // Initialize coin counter
        coinCanvas = new l3dp.CoinCanvas();
        coinCanvas.domElement.style.position = 'absolute';
        coinCanvas.domElement.style.cssFloat = 'top-left';

        // Initialize pointer for pointer lock
        pointer = new l3d.MousePointer(camera);

        // Init start canvas
        startCanvas = new l3d.StartCanvas(camera);

        loadingCanvas = new l3d.LoadingCanvas();
    }


    function initListeners() {

        // Add listeners
        window.addEventListener('resize', onWindowResize, false);

        // HTML Bootstrap buttons
        buttonManager = new l3dp.ButtonManager(camera, recommendations, previewer);

        // Object clicker for hover and clicking recommendations
        objectClicker = new l3d.ObjectClicker(container);

        scene.recommendations.map(function(a) {

            a.onMouseEnter = function(event : { x : number, y : number }) : boolean {
                previewer.setCamera(a.camera);
                previewer.setPosition(event.x, event.y);
                return true;
            };

            a.onMouseLeave = function() {
                previewer.setCamera(null);
            };

            a.onClick = function() {
                camera.moveHermite(a, true);
            }

            objectClicker.objects.push(a);

        });

        objectClicker.camera = camera;

    }


    function render() {

        // Stats for render
        stats.begin();

        objectClicker.update();

        // Update recommendations (set raycastable if shown)
        scene.recommendations.map(function(reco : l3d.BaseRecommendation) {
            if (reco instanceof l3d.BaseRecommendation) {
                reco.traverse(function(elt : THREE.Object3D) {
                    elt.visible = elt.raycastable = buttonManager.showArrows;
                });
            }
        });

        // Update coins
        scene.coins.forEach(function(coin : l3dp.Coin) { coin.update(); });

        // Update main camera
        var currentTime = Date.now() - previousTime;
        camera.update(isNaN(currentTime) ? 20 : currentTime);
        previousTime = Date.now();

        coinCanvas.update();
        coinCanvas.render();

        // Update the recommendations
        scene.recommendations.map(function(reco : l3d.BaseRecommendation) { reco.update(camera);});

        // Set current position of camera
        camera.look();

        var left = 0, bottom = 0, width = window.containerSize.width(), height = window.containerSize.height();
        renderer.setScissor(left, bottom, width, height);
        renderer.enableScissorTest(true);
        renderer.setViewport(left, bottom, width, height);
        renderer.render(scene, camera);

        // Remove borders of preview
        previewer.clear();

        // Hide arrows in recommendation
        scene.recommendations.map(function(reco : l3d.BaseRecommendation) {
            if (reco instanceof l3d.BaseRecommendation)
                l3dp.hide(reco);
        });

        // Update transparent elements
        // THREEx.Transparency.update(camera);

        // Render preview
        previewer.render(window.containerSize.width(), window.containerSize.height());


        // Finish stats
        stats.end();

    }

    function onWindowResize() {

        l3dp.resizeElements(renderer, container, previewer, coinCanvas, pointer, startCanvas, loadingCanvas);

        scene.recommendations.forEach(function(reco : l3d.BaseRecommendation) {
            l3dp.resetCameraAspect(reco.camera, window.containerSize.width(), window.containerSize.height());
        });

        render();

    }
});
