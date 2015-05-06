var CameraSelecter = function(renderer, cameras, buttonManager) {
    this.raycaster = new THREE.Raycaster();
    this.renderer = renderer;
    this.mouse = {};
    this.cameras = cameras;
    this.prev = {};
    this.buttonManager = buttonManager;
}

CameraSelecter.prototype.pointedCamera = function() {
    var returnCamera;

    var x = ( this.mouse.x / renderer.domElement.width ) * 2 - 1;
    var y = - (this.mouse.y / renderer.domElement.height) * 2 + 1;

    var camera = this.cameras.mainCamera();

    var vector = new THREE.Vector3(x, y, 0.5);
    vector.unproject(camera);

    this.raycaster.set(camera.position, vector.sub(camera.position).normalize());

    var intersects = this.raycaster.intersectObjects(scene.children, true);

    if ( intersects.length > 0 ) {
        var minDistance;
        var bestIndex;

        // Looking for cameras
        for (i in intersects) {
            if (intersects[i].object.raycastable && !(intersects[i].object instanceof THREE.Line)) {
                if ((intersects[i].distance > 0.5 && minDistance === undefined) || (intersects[i].distance < minDistance )) {
                    if (!(intersects[i].object instanceof THREE.Mesh && intersects[i].object.material.opacity < 0.1)) {
                        minDistance = intersects[i].distance;
                        bestIndex = i;
                    }
                }
            }
        }

        if (bestIndex !== undefined) {
            // if (this.cameras.getById(intersects[bestIndex].object.parent.id) !== undefined) {
                var obj = intersects[bestIndex].object;
                if (Recommendation === FixedCamera) {
                    return this.cameras.getById(intersects[bestIndex].object.parent.id);
                } else {
                    return this.cameras.getById(intersects[bestIndex].object.id);
                    console.log('tata');
                }
            // }
        }
    }
}

CameraSelecter.prototype.update = function(event) {
    if (event !== undefined) {
        this.mouse.x = event.offsetX == undefined ? event.layerX : event.offsetX;
        this.mouse.y = event.offsetY == undefined ? event.layerY : event.offsetY;
    }

    var hovered = this.pointedCamera(event);

    if (hovered !== undefined) {
        this.prev.x = this.mouse.x;
        this.prev.y = this.mouse.y;
        this.prev.camera = hovered;
        this.prev.go = true;
    } else {
        this.prev.go = false;
    }
}

CameraSelecter.prototype.click = function(event) {
    var newCamera = this.pointedCamera(event);
    if (newCamera !== undefined) {
        this.cameras.mainCamera().moveHermite(newCamera);
        buttonManager.updateElements();
    }
}