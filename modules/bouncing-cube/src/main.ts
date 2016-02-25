import * as THREE from 'three';
import * as geo from './BouncingCube';

import * as l3d from 'l3d';

(function() {

    let mouse = {x:0, y:0};
    let previousTime = 0;
    let objects : THREE.Object3D[] = [];

    let containerSize =  {width: 1067, height: 600};

    // on initialise le moteur de rendu
    let container = document.getElementById('container');
    container.style.height = containerSize.height + 'px';
    container.style.width = containerSize.width + 'px';

    let renderer = new THREE.WebGLRenderer({alpha:true});
    renderer.setSize(containerSize.width, containerSize.height);

    document.getElementById('container').appendChild(renderer.domElement);

    // on initialise la scène
    let scene = new THREE.Scene();
    let raycaster = new THREE.Raycaster();

    // init light
    let directionalLight = new THREE.DirectionalLight(0xffffff);
    directionalLight.position.set(1, 0.5, 1).normalize();
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    let ambientLight = new THREE.AmbientLight(0x444444);
    scene.add(ambientLight);

    // on initialise la camera que l’on place ensuite sur la scène
    let camera = new l3d.Camera(50, containerSize.width / containerSize.height, 1, 10000);
    scene.add(camera);

    window.addEventListener('resize', onWindowResize, false);

    container.addEventListener('mousedown', click, false);

    // on créé un  cube au quel on définie un matériau puis on l’ajoute à la scène
    let cube = new geo.BouncingCube(200, new THREE.MeshLambertMaterial({color: "red"}));
    let plane = new geo.Plane(1000,1000);
    plane.position.z -= 100;

    scene.add(cube);
    scene.add(plane);

    objects.push(cube);
    objects.push(plane);

    animate();

    function animate() {

        // on appelle la fonction animate() récursivement à chaque frame
        requestAnimationFrame(animate);

        cube.update(20);

        var currentTime = Date.now() - previousTime;
        camera.update(isNaN(currentTime) ? 20 : currentTime);
        previousTime = Date.now();
        camera.look();

        renderer.render(scene, camera);

    }

    function onWindowResize() {
        camera.aspect = container.offsetWidth / container.offsetHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(container.offsetWidth, container.offsetHeight);
        renderer.render(scene, camera);
    }

    function click(event : any) {
        mouse.x = ( ( event.clientX - renderer.domElement.offsetLeft ) / renderer.domElement.width ) * 2 - 1;
        mouse.y = - ( ( event.clientY - renderer.domElement.offsetTop ) / renderer.domElement.height ) * 2 + 1;

        // For this alternate method, set the canvas position *fixed*; set top > 0, set left > 0; padding must be 0; margin > 0 is OK
        //mouse.x = ( ( event.clientX - container.offsetLeft ) / container.clientWidth ) * 2 - 1;
        //mouse.y = - ( ( event.clientY - container.offsetTop ) / container.clientHeight ) * 2 + 1;

        var vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
        vector.unproject(camera);

        raycaster.set(camera.position, vector.sub(camera.position).normalize());

        let intersects = raycaster.intersectObjects(scene.children);

        if ( intersects.length > 0 ) {
            for (var i in intersects) {
                if (intersects[i].object.id === cube.id) {
                    cube.speed.z = 300;
                }
            }
        }
    }

})();
