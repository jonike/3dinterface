// Disable scrolling
window.onscroll = function () { window.scrollTo(0, 0); };

var mesh_number = 25;
var renderer, scene, controls, cube, container, plane, mouse= {x:0, y:0};
var bigmesh;
var raycaster;
var objects = [];
var cameras, cameraSelecter;
var spheres = new Array(mesh_number);
var visible = 0;
var stats;
var previewer;

var loader;
var coins;
var beenFullscreen = false;
var isFullscreen = false;
var previousTime;

var main_section = document.getElementById('main-section');

console.log(document.getElementById('main-div').offsetHeight);
var container_size = {
    width: function() { if (!isFullscreen) return main_section.clientWidth; else return screen.width;},
    height: function() {
        if (!isFullscreen)
            return main_section.clientHeight
                - document.getElementById('nav').offsetHeight
                - document.getElementById('main-div').offsetHeight;
        else
            return screen.height;
    }
};

console.log(container_size.width(), container_size.height());

init();
animate();

function init() {
    BD.disable();

    // Collidable objects to prevent camera from traversing objects
    var collidableObjects = new Array();

    // Initialize renderer
    container = document.getElementById('container');
    container.style.height = container_size.height() + 'px';
    container.style.width = container_size.width() + 'px';
    renderer = new THREE.WebGLRenderer({alpha:true, antialias:true});
    renderer.setSize(container_size.width(), container_size.height());
    // renderer.setSize(container_size.width(), container_size.height());
    renderer.shadowMapEnabled = true;
    renderer.setClearColor(0x87ceeb);

    // Initialize previewer
    previewer = new Previewer(renderer);
    previewer.domElement.style.position ="absolute";
    previewer.domElement.style.cssFloat = 'top-left';
    previewer.domElement.width = container_size.width();
    previewer.domElement.height = container_size.height();

    // Initialize scene
    scene = new THREE.Scene();

    // Initialize stats counter
    stats = new Stats();
    stats.setMode(0);
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.cssFloat = "top-left";

    // Add elements to page
    container.appendChild( stats.domElement );
    container.appendChild(previewer.domElement);
    container.appendChild(renderer.domElement);

    // Initialize pointer camera
    var camera1 = new PointerCamera(50, container_size.width() / container_size.height(), 0.01, 100000, container);

    // initBobomb(camera1, scene, static_path, container_size);
    // initWhomp(camera1, scene, static_path, container_size);
    initMountain(camera1, scene, static_path, container_size);

    // Add listeners
    initListeners();
}

function initListeners() {
    window.addEventListener('resize', onWindowResize, false);

    // Transmit click event to camera selecter
    container.addEventListener('mousedown', function(event) {
        if (event.which == 1)
            cameraSelecter.click(event);
        }, false
    );

    // Update camera selecter when mouse moved
    container.addEventListener('mousemove', function(event) {
            cameraSelecter.update(event);
        }, false
    );

    // Escape key to exit fullscreen mode
    document.addEventListener('keydown', function(event) { if (event.keyCode == 27) { stopFullscreen();} }, false);

    // HTML Bootstrap buttons
    buttonManager = new ButtonManager(cameras, previewer);

    // Camera selecter for hover and clicking recommendations
    cameraSelecter = new CameraSelecter(renderer, cameras, buttonManager);
}

function fullscreen() {
    isFullscreen = true;

    if (!beenFullscreen) {
        beenFullscreen = true;
        alert('To quit fullscren mode, type ESC key');
    }

    container.style.position = "absolute";
    container.style.cssFloat = "top-left";
    container.style.top = "50px";
    container.style.bottom = "0px";
    container.style.left = "0px";
    container.style.right = "0px";
    container.style.width="";
    container.style.height="";
    container.style.overflow = "hidden";

    // canvas.style.position = "absolute";
    // canvas.style.cssFloat = "top-left";
    // canvas.style.top = "0px";
    // canvas.style.bottom = "0px";
    // canvas.style.left = "0px";
    // canvas.style.right = "0px";
    // canvas.width=window.innerWidth;
    // canvas.height=window.innerHeight;
    // canvas.style.overflow = "hidden";

    onWindowResize();
}

function stopFullscreen() {
    isFullscreen = false;

    container.style.position = "";
    container.style.cssFloat = "";
    container.style.top = "";
    container.style.bottom = "";
    container.style.left = "";
    container.style.right = "";
    container.style.width = container_size.width() + "px";
    container.style.height = container_size.height() + "px";

    // canvas.style.position = "";
    // canvas.style.cssFloat = "";
    // canvas.style.top = "";
    // canvas.style.bottom = "";
    // canvas.style.left = "";
    // canvas.style.right = "";
    // canvas.width = container_size.width();
    // canvas.height = container_size.height();
    // canvas.style.overflow = "";

    onWindowResize();
}

function render() {
    cameraSelecter.update();

    // Update recommendations (set raycastable if shown)
    var transform = buttonManager.showArrows ? show : hide;
    cameras.map(function(camera) {
        if (camera instanceof RecommendedCamera) {
            transform(camera);

            camera.traverse(function(elt) {
                elt.raycastable = buttonManager.showArrows;
            });
        }
    });

    // Update coins
    coins.forEach(function(coin) { coin.update(); });

    // Update main camera
    var currentTime = Date.now() - previousTime;
    cameras.updateMainCamera(isNaN(currentTime) ? 20 : currentTime);
    previousTime = Date.now();

    // Update the recommendations
    cameras.update(cameras.mainCamera());


    // Set current position of camera
    cameras.look();

    var left = 0, bottom = 0, width = container_size.width(), height = container_size.height();
    renderer.setScissor(left, bottom, width, height);
    renderer.enableScissorTest(true);
    renderer.setViewport(left, bottom, width, height);
    renderer.render(scene, cameras.mainCamera());

    // Remove borders of preview
    previewer.clear();

    // Hide arrows in recommendation
    cameras.map(function(camera) { if (camera instanceof RecommendedCamera) hide(camera); });

    // Render preview
    previewer.render(cameraSelecter.prev, container_size.width(), container_size.height());
}

function animate() {
    // Render each frame
    requestAnimationFrame(animate);

    // stats count the number of frames per second
    stats.begin();
    render();
    stats.end();
}

function onWindowResize() {

    container.style.width = container_size.width() + "px";
    container.style.height = container_size.height() + "px";

    previewer.domElement.width = container_size.width();
    previewer.domElement.height = container_size.height();

    renderer.setSize(container_size.width(), container_size.height());
    cameras.forEach(function(camera) {camera.aspect = container_size.width() / container_size.height();});
    cameras.forEach(function(camera) {camera.updateProjectionMatrix();});
    render();
}

function hide(object) {
    object.traverse(function(object) {object.visible = false;});
}

function show(object) {
    object.traverse(function(object) {object.visible = true;});
}

