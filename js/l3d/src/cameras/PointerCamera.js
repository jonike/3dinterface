/**
 * Represents a camera that can be used easily
 * @constructor
 * @augments THREE.PerspectiveCamera
 */
L3D.PointerCamera = function() {
    THREE.PerspectiveCamera.apply(this, arguments);

    /**
     * A reference to the renderer
     * @type {THREE.Renderer}
     */
    this.renderer = arguments[4];

    if (arguments[5] === undefined)
        listenerTarget = document;
    else
        listenerTarget = arguments[5];

    /**
     * Theta angle of the camera
     * @type {Number}
     */
    this.theta = Math.PI;

    /**
     * Phi angle of the camera
     * @type {Number}
     */
    this.phi = Math.PI;

    /**
     * Indicates if the camera is following a linear motion
     * @type {Boolean}
     */
    this.moving = false;

    /**
     * Indicates if the user is dragging the camera
     * @type {Boolean}
     */
    this.dragging = false;

    /**
     * Current position of the cursor
     * @type {Object}
     */
    this.mouse = {x: 0, y: 0};

    /**
     * Current movement of the cursor
     * @type {Object}
     */
    this.mouseMove = {x: 0, y: 0};

    /**
     * Current position of the camera (optical center)
     * @type {THREE.Vector}
     */
    this.position = new THREE.Vector3();

    /**
     * Current direction of the camera
     * @type {THREE.Vector}
     */
    this.forward = new THREE.Vector3();

    /**
     * Vector pointing to the left of the camera
     * @type {THREE.Vector}
     */
    this.left = new THREE.Vector3();

    /**
     * Point that the camera is targeting
     * @type {THREE.Vector}
     */
    this.target = new THREE.Vector3(0,1,0);

    /**
     * Indicates the different motions that the camera should have according to the keyboard events
     * @type {Object}
     * @description Contains the following booleans
     * <ul>
     *     <li>increasePhi</li>
     *     <li>decreasePhi</li>
     *     <li>increaseTheta</li>
     *     <li>decreaseTheta</li>
     *     <li>boost</li>
     *     <li>moveForward</li>
     *     <li>moveBackward</li>
     *     <li>moveLeft</li>
     *     <li>moveRight</li>
     * </ul>
     */
    this.motion = {};

    /**
     * Sentitivity of the mouse
     * @type {Number}
     */
    this.sensitivity = 0.05;

    /**
     * Speed of the camera
     * @type {Number}
     */
    this.speed = 1;

    /**
     * Raycaster used to compute collisions
     * @type {THREE.Raycaster}
     */
    this.raycaster = new THREE.Raycaster();

    /**
     * History of the moves of the camera
     * @type {L3D.History}
     */
    this.history = new L3D.History();

    /**
     * Option to enable or disable the pointer lock
     * @type {Boolean}
     */
    this.shouldLock = true;

    /**
     * Current state of the pointer (locked or not)
     * @type {Boolean}
     */
    this.pointerLocked = false;

    /**
     *
     */
    this.listenerTarget = listenerTarget;

    // Set events from the document
    var self = this;
    var onKeyDown = function(event) {self.onKeyDown(event);};
    var onKeyUp = function(event) {self.onKeyUp(event);};
    var onMouseDown = function(event) {if (event.which === 1) self.onMouseDown(event); };
    var onMouseUp = function(event) {if (event.which === 1) self.onMouseUp(event); };
    var onMouseMove = function(event) {self.onMouseMove(event); };

    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);

    document.addEventListener('pointerlockchange', function(event) { self.onPointerLockChange(event); }, false);
    document.addEventListener('mozpointerlockchange', function(event) { self.onPointerLockChange(event); }, false);
    document.addEventListener('webkitpointerlockchange', function(event) { self.onPointerLockChange(event); }, false);

    document.addEventListener('mousemove', function(event) {self.onMouseMovePointer(event);}, false);

    listenerTarget.addEventListener('mousedown', function() {self.lockPointer();}, false);
    listenerTarget.addEventListener('mousedown', onMouseDown, false);
    listenerTarget.addEventListener('mousemove', onMouseMove, false);
    listenerTarget.addEventListener('mouseup', onMouseUp, false);
    listenerTarget.addEventListener('mouseout', onMouseUp, false);

    /**
     * Option to enable or disable the collisions
     * @type {Boolean}
     */
    this.collisions = true;

    /**
     * Is true when we should log the camera angles. It will be set to false
     * once is done, and reset to true after a certain period of time
     * @param {Boolean}
     */
    this.shouldLogCameraAngles = true;

    /**
     * The camera we will move to when we'll reset the camera
     * @param {Object}
     */
    this.resetElements = {position: new THREE.Vector3(0,1,1), target: new THREE.Vector3()};
};
L3D.PointerCamera.prototype = Object.create(THREE.PerspectiveCamera.prototype);
L3D.PointerCamera.prototype.constructor = L3D.PointerCamera;

/**
 * Locks the pointer inside the canvas, and displays a gun sight at the middle of the renderer
 * This method works only if the browser supports requestPointerLock
 */
L3D.PointerCamera.prototype.lockPointer = function() {

    if (this.shouldLock) {
        this.renderer.domElement.requestPointerLock =
            this.renderer.domElement.requestPointerLock ||
            this.renderer.domElement.mozRequestPointerLock ||
            this.renderer.domElement.webkitRequestPointerLock;

        if (this.renderer.domElement.requestPointerLock) {

            this.renderer.domElement.requestPointerLock();

        }

    }

};

/**
 * Check that the pointer is locked or not, and updated locked attribute
 * @returns true if the pointer is locked, false otherwise
 */
L3D.PointerCamera.prototype.isLocked = function() {
    var toto =
        document.pointerLockElement === this.renderer.domElement ||
        document.mozPointerLockElement === this.renderer.domElement ||
        document.webkitPointerLockElement === this.renderer.domElement;

    return toto;

};

/**
 * Update the camera when the pointer lock changes state
 */
L3D.PointerCamera.prototype.onPointerLockChange = function() {

    if (this.isLocked()) {

        // The pointer is locked : adapt the state of the camera
        this.pointerLocked = true;
        this.mousePointer.render();

        this.mouse.x = this.renderer.domElement.width/2;
        this.mouse.y = this.renderer.domElement.height/2;

        // Remove start canvas
        this.startCanvas.clear();

    } else {

        this.pointerLocked = false;
        this.mousePointer.clear();

        this.theta = this.previousTheta;
        this.phi = this.previousPhi;

        this.mouseMove.x = 0;
        this.mouseMove.y = 0;

        // Draw start canvas only if should lock
        if (this.shouldLock)
            this.startCanvas.render();
        else
            this.startCanvas.clear();

    }

};

/**
 * Update the position of the camera
 * @param {Number} time number of milliseconds between the previous and the next frame
 */
L3D.PointerCamera.prototype.update = function(time) {
    if (this.moving) {
        this.linearMotion(time);
    } else if (this.movingHermite) {
        this.hermiteMotion(time);
    } else {
        this.normalMotion(time);
    }
};

/**
 * Update the camera according to its linear motion
 * @param {Number} time number of milliseconds between the previous and the next frame
 */
L3D.PointerCamera.prototype.linearMotion = function(time) {
    var position_direction = L3D.Tools.diff(this.new_position, this.position);
    var target_direction = L3D.Tools.diff(this.new_target, this.target);

    this.position.add(L3D.Tools.mul(position_direction, 0.05 * time / 20));
    this.target.add(L3D.Tools.mul(target_direction, 0.05 * time / 20));

    if (L3D.Tools.norm2(L3D.Tools.diff(this.position, this.new_position)) < 0.01 &&
        L3D.Tools.norm2(L3D.Tools.diff(this.target, this.new_target))  < 0.01) {
        this.moving = false;
        this.anglesFromVectors();
    }
};

/**
 * Update the camera according to its hermite motion
 * @param {Number} time number of milliseconds between the previous and the next frame
 */
L3D.PointerCamera.prototype.hermiteMotion = function(time) {
    var e = this.hermitePosition.eval(this.t);
    this.position.x = e.x;
    this.position.y = e.y;
    this.position.z = e.z;

    this.target = L3D.Tools.sum(this.position, this.hermiteAngles.eval(this.t));

    this.t += 0.01 * time / 20;

    if (this.t > 1) {
        this.movingHermite = false;
        this.anglesFromVectors();
    }
};

/**
 * Update the camera according to the user's input
 * @param {Number} time number of milliseconds between the previous and the next frame
 */
L3D.PointerCamera.prototype.normalMotion = function(time) {

    // Update angles
    if (this.motion.increasePhi)   {this.phi   += this.sensitivity * time / 20; this.changed = true; }
    if (this.motion.decreasePhi)   {this.phi   -= this.sensitivity * time / 20; this.changed = true; }
    if (this.motion.increaseTheta) {this.theta += this.sensitivity * time / 20; this.changed = true; }
    if (this.motion.decreaseTheta) {this.theta -= this.sensitivity * time / 20; this.changed = true; }

    if ( this.isLocked() || this.dragging) {

        this.theta += (this.mouseMove.x * 20 / time);
        this.phi   -= (this.mouseMove.y * 20 / time);

        this.mouseMove.x = 0;
        this.mouseMove.y = 0;

        this.vectorsFromAngles();

        this.changed = true;

        if (this.shouldLogCameraAngles) {

            this.shouldLogCameraAngles = false;

            var self = this;
            setTimeout(function() {
                self.shouldLogCameraAngles = true;
            }, 100);

            var event = new L3D.BD.Event.KeyboardEvent();
            event.camera = this;

        }
    }

    // Clamp phi and theta
    this.phi = Math.min(Math.max(-(Math.PI/2-0.1),this.phi), Math.PI/2-0.1);
    this.theta = ((this.theta - Math.PI) % (2*Math.PI)) + Math.PI;

    // Compute vectors (position and target)
    this.vectorsFromAngles();

    // Update with events
    var delta = 0.1;
    var forward = this.forward.clone();
    forward.multiplyScalar(400.0 * delta);
    var left = this.up.clone();
    left.cross(forward);
    left.normalize();
    left.multiplyScalar(400.0 * delta);

    // Move only if no collisions
    var speed = this.speed * time / 20;
    var direction = new THREE.Vector3();

    if (this.motion.boost) speed *= 10;
    if (this.motion.moveForward)  {direction.add(L3D.Tools.mul(forward, speed)); this.changed = true;}
    if (this.motion.moveBackward) {direction.sub(L3D.Tools.mul(forward, speed)); this.changed = true;}
    if (this.motion.moveLeft)     {direction.add(L3D.Tools.mul(left,    speed)); this.changed = true;}
    if (this.motion.moveRight)    {direction.sub(L3D.Tools.mul(left,    speed)); this.changed = true;}

    if (!this.collisions || !this.isColliding(direction)) {
        this.position.add(direction);
    }

    // Update angle
    this.target = this.position.clone();
    this.target.add(forward);
};

/**
 * Reset the camera to its resetElements, and finishes any motion
 */
L3D.PointerCamera.prototype.reset = function() {
    this.resetPosition();
    this.moving = false;
    this.movingHermite = false;
    (new L3D.BD.Event.ResetClicked()).send();
};

/**
 * Reset the position of th camera
 */
L3D.PointerCamera.prototype.resetPosition = function() {
    this.position.copy(this.resetElements.position);
    this.target.copy(this.resetElements.target);
    this.anglesFromVectors();
};

/**
 * Computes the vectors (forward, left, ...) according to theta and phi
 */
L3D.PointerCamera.prototype.vectorsFromAngles = function() {
    // Update direction
    this.forward.y = Math.sin(this.phi);

    var cos = Math.cos(this.phi);
    this.forward.z = cos * Math.cos(this.theta);
    this.forward.x = cos * Math.sin(this.theta);
    this.forward.normalize();

};

/**
 * Computes theta and phi according to the vectors (forward, left, ...)
 */
L3D.PointerCamera.prototype.anglesFromVectors = function() {
    var forward = L3D.Tools.diff(this.target, this.position);
    forward.normalize();

    this.phi = Math.asin(forward.y);

    // Don't know why this line works... But thanks Thierry-san and
    // Bastien because it seems to work...
    this.theta = Math.atan2(forward.x, forward.z);
};

/**
 * Creates a linear motion to another camera
 * @param {Camera} camera Camera to move to
 * @param {Boolean} [toSave=true] true if you want to save the current state of the camera
 */
L3D.PointerCamera.prototype.move = function(otherCamera, toSave) {
    if (toSave === undefined)
        toSave = true;

    this.moving = true;
    this.new_target = otherCamera.target.clone();
    this.new_position = otherCamera.position.clone();
    var t = [0,1];
    var f = [this.position.clone(), this.new_position];
    var fp = [L3D.Tools.diff(this.target, this.position), L3D.Tools.diff(this.new_target, this.new_position)];
    this.hermite = new L3D.Hermite.Polynom(t,f,fp);
    this.t = 0;

    if (toSave) {
        if (this.changed) {
            this.save();
            this.changed = false;
        }
        this.history.addState({position: otherCamera.position.clone(), target: otherCamera.target.clone()});
    }
};

/**
 * Creates a hermite motion to another camera
 * @param {Camera} camera Camera to move to
 * @param {Boolean} [toSave=true] true if you want to save the current state of the camera
 */
L3D.PointerCamera.prototype.moveHermite = function(otherCamera, toSave) {
    if (toSave === undefined)
        toSave = true;

    this.movingHermite = true;
    this.t = 0;

    this.hermitePosition = new L3D.Hermite.special.Polynom(
        this.position.clone(),
        otherCamera.position.clone(),
        L3D.Tools.mul(L3D.Tools.diff(otherCamera.target, otherCamera.position).normalize(),4)
    );

    this.hermiteAngles = new L3D.Hermite.special.Polynom(
        L3D.Tools.diff(this.target, this.position),
        L3D.Tools.diff(otherCamera.target, otherCamera.position),
        new THREE.Vector3()
    );

    if (toSave) {
        if (this.changed) {
            this.save();
            this.changed = false;
        }
        this.history.addState({position: otherCamera.position.clone(), target: otherCamera.target.clone()});
    }
};

/**
 * Checks the collisions between the collidables objects and the camera
 * @param {THREE.Vector3} direction the direction of the camera
 * @returns {Boolean} true if there is a collision, false otherwise
 */
L3D.PointerCamera.prototype.isColliding = function(direction) {
    this.raycaster.set(this.position, direction.clone().normalize());
    var intersects = this.raycaster.intersectObjects(this.collidableObjects, true);

    for (var i in intersects) {
        if (intersects[i].distance < L3D.Tools.norm(direction) + this.speed * 300 &&
            intersects[i].object.raycastable) {
            return true;
        }
    }

    return false;
};

/**
 * Look method. Equivalent to gluLookAt for the current camera
 */
L3D.PointerCamera.prototype.look = function() {
    this.lookAt(this.target);
};

/**
 * Adds the camera to the scene
 */
L3D.PointerCamera.prototype.addToScene = function(scene) {
    scene.add(this);
};

/**
 * Manages keyboard events
 * @param {event} event the event that happened
 * @param {Booelean} toSet true if the key was pressed, false if released
 */
L3D.PointerCamera.prototype.onKeyEvent = function(event, toSet) {
    // Create copy of state
    var motionJsonCopy = JSON.stringify(this.motion);

    switch ( event.keyCode ) {
        // Azerty keyboards
        case 38: case 90:  this.motion.moveForward   = toSet; break; // up / z
        case 37: case 81:  this.motion.moveLeft      = toSet; break; // left / q
        case 40: case 83:  this.motion.moveBackward  = toSet; break; // down / s
        case 39: case 68:  this.motion.moveRight     = toSet; break; // right / d
        case 32:           this.motion.boost         = toSet; break;

        // Qwerty keyboards
        case 38: case 87:  this.motion.moveForward   = toSet; break; // up / w
        case 37: case 65:  this.motion.moveLeft      = toSet; break; // left / a
        case 40: case 83:  this.motion.moveBackward  = toSet; break; // down / s
        case 39: case 68:  this.motion.moveRight     = toSet; break; // right / d

        case 73: case 104: this.motion.increasePhi   = toSet; break; // 8 Up for angle
        case 75: case 98:  this.motion.decreasePhi   = toSet; break; // 2 Down for angle
        case 74: case 100: this.motion.increaseTheta = toSet; break; // 4 Left for angle
        case 76: case 102: this.motion.decreaseTheta = toSet; break; // 6 Right for angle

        case 13: if (toSet) this.log(); break;
    }
    if (motionJsonCopy != JSON.stringify(this.motion)) {
        // Log any change
        var e = new L3D.BD.Event.KeyboardEvent();
        e.camera = this;
        e.send();
    }
};

/**
 * Manages the key pressed events
 * @param {event} event the event to manage
 */
L3D.PointerCamera.prototype.onKeyDown = function(event) {
    this.onKeyEvent(event, true);
};

/**
 * Manages the key released events
 * @param {event} event the event to manage
 */
L3D.PointerCamera.prototype.onKeyUp = function(event) {
    this.onKeyEvent(event, false);
};

/**
 * Manages the mouse down events. Start drag'n'dropping if the options are set to drag'n'drop
 * @param {event} event the event to manage
 */
L3D.PointerCamera.prototype.onMouseDown = function(event) {

    if (!this.shouldLock) {

        this.mouse.x = ( ( event.clientX - this.renderer.domElement.offsetLeft ) / this.renderer.domElement.width ) * 2 - 1;
        this.mouse.y = - ( ( event.clientY - this.renderer.domElement.offsetTop ) / this.renderer.domElement.height ) * 2 + 1;

        this.dragging = true;
        this.mouseMoved = false;
    }
};

/**
 * Manages the mouse move events. Modifies the target of the camera according to the drag'n'drop motion
 * @param {event} event the event to manage
 */
L3D.PointerCamera.prototype.onMouseMove = function(event) {

    if (!this.shouldLock && this.dragging) {
        var mouse = {x: this.mouse.x, y: this.mouse.y};
        this.mouse.x = ( ( event.clientX - this.renderer.domElement.offsetLeft ) / this.renderer.domElement.width ) * 2 - 1;
        this.mouse.y = - ( ( event.clientY - this.renderer.domElement.offsetTop ) / this.renderer.domElement.height ) * 2 + 1;

        this.mouseMove.x = this.mouse.x - mouse.x;
        this.mouseMove.y = this.mouse.y - mouse.y;

        this.mouseMoved = true;
    }
};

/**
 * Manages the mouse move envent in case of pointer lock
 * @param {event} event the event to manage
 */
L3D.PointerCamera.prototype.onMouseMovePointer = function(e) {

    if (this.isLocked()) {

        // Backup theta and phi
        this.previousTheta = this.theta;
        this.previousPhi = this.phi;

        this.mouseMove.x = e.movementX || e.mozMovementX || e.webkitMovementX || 0;
        this.mouseMove.y = e.movementY || e.mozMovementY || e.webkitMovementY || 0;

        this.mouseMove.x *= -(this.sensitivity/5);
        this.mouseMove.y *=  (this.sensitivity/5);

        this.mouseMoved = true;

    }

};

/**
 * Manages the mouse up event. Stops the dragging
 * @param {event} event the event to manage
 */
L3D.PointerCamera.prototype.onMouseUp = function(event) {
    this.onMouseMove(event);

    // Send log to DB
    if (this.dragging && this.mouseMoved && !this.moving && !this.movingHermite) {
        var e = new L3D.BD.Event.KeyboardEvent();
        e.camera = this;
        e.send();
    }

    this.dragging = false;
};

/**
 * Logs the camera to the terminal (pratical to create recommended views)
 */
L3D.PointerCamera.prototype.log = function() {
    console.log("createCamera(\nnew THREE.Vector3(" + this.position.x + "," +  this.position.y + ',' + this.position.z + '),\n' +
                "new THREE.Vector3(" + this.target.x + "," +  this.target.y + ',' + this.target.z + ')\n)');
};

/**
 * Save the current state of the camera in the history
 */
L3D.PointerCamera.prototype.save = function() {
    var backup = {};
    backup.position = this.position.clone();
    backup.target = this.target.clone();
    this.history.addState(backup);
};

/**
 * Undo last motion according to the history
 */
L3D.PointerCamera.prototype.undo = function() {
    var move = this.history.undo();
    if (move !== undefined) {
        var event = new L3D.BD.Event.PreviousNextClicked();
        event.previous = true;
        event.camera = move;
        event.send();

        this.move(move, false);
    }
};

/**
 * Redo last motion according to the history
 */
L3D.PointerCamera.prototype.redo = function() {
    var move = this.history.redo();
    if (move !== undefined) {
        var event = new L3D.BD.Event.PreviousNextClicked();
        event.previous = false;
        event.camera = move;
        event.send();

        this.move(move, false);
    }
};

/**
 * Checks if there is a undo possibility in the history
 * @returns {Boolean} true if undo is possible, false otherwise
 */
L3D.PointerCamera.prototype.undoable = function() {
    return this.history.undoable();
};

/**
 * Checks if there is a redo possibility in the history
 * @returns {Boolean} true if redo is possible, false otherwise
 */
L3D.PointerCamera.prototype.redoable = function() {
    return this.history.redoable();
};

L3D.PointerCamera.prototype.toList = function() {
    this.updateMatrix();
    this.updateMatrixWorld();

    var frustum = new THREE.Frustum();
    var projScreenMatrix = new THREE.Matrix4();
    projScreenMatrix.multiplyMatrices(this.projectionMatrix, this.matrixWorldInverse);

    frustum.setFromMatrix(new THREE.Matrix4().multiplyMatrices(this.projectionMatrix, this.matrixWorldInverse));

    var ret =
        [[this.position.x, this.position.y, this.position.z],
         [this.target.x,   this.target.y,   this.target.z]];

    for (var i = 0; i < frustum.planes.length; i++) {

        var p = frustum.planes[i];

        ret.push([
            p.normal.x, p.normal.y, p.normal.z, p.constant
        ]);

    }

    return ret;
};
