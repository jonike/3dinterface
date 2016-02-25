import * as THREE from 'three';
import * as mth from 'mth';

import { History } from '../utils/History';
import { CameraItf } from '../utils/Logger';
import { MousePointer, Color } from '../canvases/MousePointer';
import { DB } from '../utils/Logger';
import { BaseCamera } from './BaseCamera';

module l3d {
    /**
     * Mouse cursor
     */
    export interface MouseCursor {

        x : number;
        y : number;

    };

    export interface TargetMove {

        camera   : mth.Vector3;
        target   : mth.Vector3;

    }

    /**
     * Booleans indicating the type of camera motion
     * undefined will be considered as false
     */
    export interface CameraMotion {

        increasePhi   ? : boolean;
        decreasePhi   ? : boolean;
        increaseTheta ? : boolean;
        decreaseTheta ? : boolean;
        boost         ? : boolean;
        moveForward   ? : boolean;
        moveBackward  ? : boolean;
        moveLeft      ? : boolean;
        moveRight     ? : boolean;

    }

    /**
     * Represents a camera that can be used easily
     */
    export class PointerCamera extends BaseCamera {

        /**
         * A reference to the renderer
         */
        renderer : THREE.Renderer;

        /**
         * Theta angle of the camera
         */
        theta : number;

        /**
         * Phi angle of the camera
         */
        phi : number;

        /**
         * Indicates if the camera is following a linear motion
         */
        moving : boolean;

        /**
         * Indicates if the user is dragging the camera
         */
        dragging : boolean;

        /**
         * Current position of the cursor
         */
        mouse : MouseCursor;

        /**
         * Current movement of the cursor
         */
        mouseMove : MouseCursor;

        /**
         * Current position of the camera (optical center)
         */
        position : THREE.Vector3;

        /**
         * Current direction of the camera
         */
        forward : THREE.Vector3;

        /**
         * Vector pointing to the left of the camera
         */
        left : THREE.Vector3;

        /**
         * Point that the camera is targeting
         */
        target : THREE.Vector3;

        /**
         * Indicates the different motions that the camera should have according to the keyboard events
         */
        motion : CameraMotion;

        /**
         * Sentitivity of the mouse
         */
        sensitivity : number;

        /**
         * Speed of the camera
         */
        speed : number;

        /**
         * Raycaster used to compute collisions
         */
        raycaster : THREE.Raycaster;

        /**
         * History of the moves of the camera
         */
        history : History;

        /**
         * Option to enable or disable the pointer lock
         */
        shouldLock : boolean;

        /**
         * Current state of the pointer (locked or not)
         */
        pointerLocked : boolean;

        /**
         *
         */
        listenerTarget : any;

        /**
         * Id of the recommendation to move to
         */
        movingToRecommendation : number;

        /**
         * Option to enable or disable the collisions
         */
        collisions : boolean;

        /**
         * Is true when we should log the camera angles. It will be set to false
         * once is done, and reset to true after a certain period of time
         */
        shouldLogCameraAngles : boolean;

        /**
         * The camera we will move to when we'll reset the camera
         */
        resetElements : CameraItf;

        /**
         * Id of the recommendation that is currently clicked (null if no recommendation are clicked)
         */
        recommendationClicked : number;

        /**
         *
         */
        newTarget : mth.Vector3;

        newPosition : mth.Vector3;

        mouseMoved : boolean;

        t : number;

        mousePointer : MousePointer;
        startCanvas : any;

        wasLocked : boolean;

        movingHermite : boolean;

        hermitePosition : mth.Hermite.special.Polynom<mth.Vector3>;

        hermiteAngles : mth.Hermite.special.Polynom<mth.Vector3>;

        hermite : mth.Hermite.Polynom<mth.Vector3>;

        collidableObjects : any[];

        changed : boolean;

        constructor(
            arg0 : any, arg1 : any, arg2 : any, arg3 : any,
            arg4 : THREE.Renderer,
            arg5? : any
        ) {

            super(arg0, arg1, arg2, arg3);

            this.collidableObjects = [];

            this.renderer = arguments[4];

            let listenerTarget : any;
            if (arguments[5] === undefined)
                listenerTarget = document;
            else
                listenerTarget = arguments[5];

            this.theta = Math.PI;
            this.phi = Math.PI;
            this.moving = false;
            this.dragging = false;
            this.mouse = {x: 0, y: 0};
            this.mouseMove = {x: 0, y: 0};
            this.forward = new THREE.Vector3();
            this.left = new THREE.Vector3();
            this.target = new THREE.Vector3(0,1,0);
            this.motion = {};
            this.sensitivity = 0.05;
            this.speed = 1;
            this.raycaster = new THREE.Raycaster();
            this.history = new History();
            this.shouldLock = true;
            this.pointerLocked = false;
            this.listenerTarget = listenerTarget;
            this.movingToRecommendation = null;

            // Set events from the document
            var onKeyDown =   (event : any) => {this.onKeyDown(event);};
            var onKeyUp =     (event : any) => {this.onKeyUp(event);};
            var onMouseDown = (event : any) => {if (event.which === 1) this.onMouseDown(event); };
            var onMouseUp =   (event : any) => {if (event.which === 1) this.onMouseUp(event); };
            var onMouseMove = (event : any) => {this.onMouseMove(event); };

            document.addEventListener('keydown', onKeyDown);
            document.addEventListener('keyup', onKeyUp);

            document.addEventListener('pointerlockchange', () => { this.onPointerLockChange(); });
            document.addEventListener('mozpointerlockchange', () => { this.onPointerLockChange(); });
            document.addEventListener('webkitpointerlockchange', () => { this.onPointerLockChange(); });

            document.addEventListener('mousemove', (event : any) => {this.onMouseMovePointer(event);});

            listenerTarget.addEventListener('click', () => { this.lockPointer();});
            listenerTarget.addEventListener('mousedown', onMouseDown);
            listenerTarget.addEventListener('mousemove', onMouseMove);
            listenerTarget.addEventListener('mouseup', onMouseUp);
            listenerTarget.addEventListener('mouseout', onMouseUp);

            this.collisions = false;
            this.shouldLogCameraAngles = true;
            this.resetElements = {position: new THREE.Vector3(0,1,1), target: new THREE.Vector3()};
            this.recommendationClicked = null;

        }

        /**
         * Locks the pointer inside the canvas, and displays a gun sight at the middle of the renderer
         * This method works only if the browser supports requestPointerLock
         */
        lockPointer() {

            if (this.shouldLock) {
                this.renderer.domElement.requestPointerLock =
                    this.renderer.domElement.requestPointerLock ||
                    this.renderer.domElement.mozRequestPointerLock ||
                    this.renderer.domElement.webkitRequestPointerLock;

                if (this.renderer.domElement.requestPointerLock) {

                    this.renderer.domElement.requestPointerLock();

                }

            }

        }

        /**
         * Check that the pointer is locked or not, and updated locked attribute
         * @returns true if the pointer is locked, false otherwise
         */
        isLocked() {
            return (
                document.pointerLockElement === this.renderer.domElement ||
                    document.mozPointerLockElement === this.renderer.domElement ||
                    document.webkitPointerLockElement === this.renderer.domElement
            );

        };

        /**
         * Update the camera when the pointer lock changes state
         */
        onPointerLockChange() {
            var event = new DB.Event.PointerLocked();

            if (this.isLocked()) {

                // The pointer is locked : adapt the state of the camera
                this.pointerLocked = true;
                this.mousePointer.render(Color.BLACK);

                this.mouse.x = this.renderer.domElement.width/2;
                this.mouse.y = this.renderer.domElement.height/2;

                // Remove start canvas
                this.startCanvas.clear();

                // Send event
                event.locked = true;

                if (this.wasLocked !== event.locked)
                    event.send();

                this.wasLocked = true;

            } else {

                this.pointerLocked = false;
                if (this.mousePointer)
                    this.mousePointer.clear();

                this.mouseMove.x = 0;
                this.mouseMove.y = 0;

                // Draw start canvas only if should lock
                if (this.startCanvas) {
                    if (this.shouldLock)
                        this.startCanvas.render();
                    else
                        this.startCanvas.clear();
                }

                event.locked = false;

                if (this.wasLocked !== event.locked)
                    event.send();

                this.wasLocked = false;
            }


        }

        /**
         * Update the position of the camera
         * @param time number of milliseconds between the previous and the next frame
         */
        update(time : number) {

            if (this.moving) {
                this.shouldLogCameraAngles = false;
                this.linearMotion(time);
            } else if (this.movingHermite) {
                this.shouldLogCameraAngles = false;
                this.hermiteMotion(time);
            } else {
                this.normalMotion(time);
            }
        }

        /**
         * Update the camera according to its linear motion
         * @param time number of milliseconds between the previous and the next frame
         */
        linearMotion(time : number) {
            var positionDirection = mth.diff(this.newPosition, this.position);
            var targetDirection = mth.diff(this.newTarget, this.target);

            this.position.add(mth.mul(positionDirection, 0.05 * time / 20));
            this.target.add(mth.mul(targetDirection, 0.05 * time / 20));

            if (mth.norm2(mth.diff(this.position, this.newPosition)) < 0.01 &&
                mth.norm2(mth.diff(this.target, this.newTarget))  < 0.01) {
                this.moving = false;
                this.anglesFromVectors();
            }
        }

        /**
         * Update the camera according to its hermite motion
         * @param time number of milliseconds between the previous and the next frame
         */
        hermiteMotion(time : number) {
            var e = this.hermitePosition.eval(this.t);
            mth.copy(e, this.position);

            this.target = mth.sum(this.position, this.hermiteAngles.eval(this.t));

            this.t += 0.01 * time / 20;

            if (this.t > 1) {
                this.movingHermite = false;
                this.recommendationClicked = null;
                this.anglesFromVectors();
            }
        }

        /**
         * Update the camera according to the user's input
         * @param time number of milliseconds between the previous and the next frame
         */
        normalMotion(time : number) {

            // Update angles
            if (this.motion.increasePhi)   {this.phi   += this.sensitivity * time / 20; this.changed = true; }
            if (this.motion.decreasePhi)   {this.phi   -= this.sensitivity * time / 20; this.changed = true; }
            if (this.motion.increaseTheta) {this.theta += this.sensitivity * time / 20; this.changed = true; }
            if (this.motion.decreaseTheta) {this.theta -= this.sensitivity * time / 20; this.changed = true; }

            if ( this.isLocked() || this.dragging) {

                this.theta += (this.mouseMove.x); //  * Math.sqrt(time) / Math.sqrt(20));
                this.phi   -= (this.mouseMove.y); //  * Math.sqrt(time) / Math.sqrt(20));

                this.mouseMove.x = 0;
                this.mouseMove.y = 0;

                this.vectorsFromAngles();

                this.changed = true;

                if (this.shouldLogCameraAngles) {

                    this.shouldLogCameraAngles = false;

                    var self = this;
                    setTimeout(function() {
                        self.shouldLogCameraAngles = true;
                    }, 500);

                    var event = new DB.Event.KeyboardEvent();
                    event.camera = this;
                    event.send();

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
            if (this.motion.moveForward)  {direction.add(mth.mul(forward, speed)); this.changed = true;}
            if (this.motion.moveBackward) {direction.sub(mth.mul(forward, speed)); this.changed = true;}
            if (this.motion.moveLeft)     {direction.add(mth.mul(left,    speed)); this.changed = true;}
            if (this.motion.moveRight)    {direction.sub(mth.mul(left,    speed)); this.changed = true;}

            if (!this.collisions || !this.isColliding(direction)) {
                this.position.add(direction);
            }

            // Update angle
            this.target = this.position.clone();
            this.target.add(forward);
        }

        /**
         * Reset the camera to its resetElements, and finishes any motion
         */
        reset() {
            this.resetPosition();
            this.moving = false;
            this.movingHermite = false;
            (new DB.Event.ResetClicked()).send();
        }

        /**
         * Reset the position of th camera
         */
        resetPosition() {
            mth.copy(this.resetElements.position, this.position);
            mth.copy(this.resetElements.target, this.target);
            this.anglesFromVectors();
        }

        /**
         * Computes the vectors (forward, left, ...) according to theta and phi
         */
        vectorsFromAngles() {
            // Update direction
            this.forward.y = Math.sin(this.phi);

            var cos = Math.cos(this.phi);
            this.forward.z = cos * Math.cos(this.theta);
            this.forward.x = cos * Math.sin(this.theta);
            this.forward.normalize();

        }

        /**
         * Computes theta and phi according to the vectors (forward, left, ...)
         */
        anglesFromVectors() {
            var forward = mth.diff(this.target, this.position);
            forward.normalize();

            this.phi = Math.asin(forward.y);

            // Don't know why this line works... But thanks Thierry-san and
            // Bastien because it seems to work...
            this.theta = Math.atan2(forward.x, forward.z);
        }

        /**
         * Creates a linear motion to another camera
         * @param recommendation Camera to move to
         * @param true if you want to save the current state of the camera
         */
        move(recommendation : CameraItf, toSave : boolean, recommendationId? : number) : void;
        move(recommendation : TargetMove, toSave : boolean, recommendationId ?: number) : void;
        move(recommendation : any, toSave = true, recommendationId? : number) : void {

            var otherCamera = recommendation.camera || recommendation;

            this.movingHermite = false;
            this.moving = true;

            this.newTarget = otherCamera.target.clone();
            this.newPosition = otherCamera.position.clone();
            var t = [0,1];
            var f = [this.position.clone(), this.newPosition];
            var fp = [mth.diff(this.target, this.position), mth.diff(this.newTarget, this.newPosition)];
            this.hermite = new mth.Hermite.Polynom(t,f,fp);
            this.t = 0;

            if (toSave) {
                if (this.changed) {
                    this.save();
                    this.changed = false;
                }
                this.history.addState({position: otherCamera.position.clone(), target: otherCamera.target.clone()});
            }
        }

        /**
         * Creates a hermite motion to another camera
         * @param recommendation Camera to move to
         * @param toSave if you want to save the current state of the camera
         */
        moveHermite(recommendation : CameraItf, toSave ?: boolean, recommendationId ?: number) : void;
        moveHermite(recommendation : TargetMove, toSave ?: boolean, recommendationId ?: number) : void;
        moveHermite(recommendation : any, toSave = true, recommendationId ?: number) : void {

            this.recommendationClicked = recommendationId;

            var otherCamera = recommendation.camera || recommendation;

            this.moving = false;
            this.movingHermite = true;
            this.t = 0;

            this.hermitePosition = new mth.Hermite.special.Polynom(
                this.position.clone(),
                otherCamera.position.clone(),
                mth.mul(mth.diff(otherCamera.target, otherCamera.position).normalize(),4)
            );

            this.hermiteAngles = new mth.Hermite.special.Polynom(
                mth.diff(this.target, this.position),
                mth.diff(otherCamera.target, otherCamera.position),
                new THREE.Vector3()
            );

            if (toSave) {
                if (this.changed) {
                    this.save();
                    this.changed = false;
                }
                this.history.addState({position: otherCamera.position.clone(), target: otherCamera.target.clone()});
            }

        }

        /**
         * Checks the collisions between the collidables objects and the camera
         * @param direction the direction of the camera
         * @returns true if there is a collision, false otherwise
         */
        isColliding(direction : mth.Vector3) {
            this.raycaster.set(this.position, mth.copy(direction).normalize());
            var intersects = this.raycaster.intersectObjects(this.collidableObjects, true);

            for (var i in intersects) {
                if (intersects[i].distance < mth.norm(direction) + this.speed * 300 &&
                    intersects[i].object.raycastable) {
                    return true;
                }
            }

            return false;
        }

        /**
         * Look method. Equivalent to gluLookAt for the current camera
         */
        look() {
            this.lookAt(this.target);
        }

        /**
         * Adds the camera to the scene
         */
        addToScene(scene : THREE.Scene) {
            scene.add(this);
        }

        /**
         * Manages keyboard events
         * @param event the event that happened
         * @param toSet true if the key was pressed, false if released
         */
        onKeyEvent = function(event : any, toSet : boolean) {
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
                var e = new DB.Event.KeyboardEvent();
                e.camera = this;
                e.keypressed = toSet;
                e.keycode = event.keyCode;
                e.send();
            }
        }

        /**
         * Manages the key pressed events
         * @param event the event to manage
         */
        onKeyDown(event : any) {
            this.onKeyEvent(event, true);
        }

        /**
         * Manages the key released events
         * @param event the event to manage
         */
        onKeyUp(event : any) {
            this.onKeyEvent(event, false);
        }

        /**
         * Manages the mouse down events. Start drag'n'dropping if the options are set to drag'n'drop
         * @param event the event to manage
         */
        onMouseDown(event : any) {

            if (!this.shouldLock) {

                this.mouse.x = ( ( event.clientX - this.renderer.domElement.offsetLeft ) / this.renderer.domElement.width ) * 2 - 1;
                this.mouse.y = - ( ( event.clientY - this.renderer.domElement.offsetTop ) / this.renderer.domElement.height ) * 2 + 1;

                this.dragging = true;
                this.mouseMoved = false;
            }
        }

        /**
         * Manages the mouse move events. Modifies the target of the camera according to the drag'n'drop motion
         * @param event the event to manage
         */
        onMouseMove(event : any) {

            if (!this.shouldLock && this.dragging) {
                var mouse = {x: this.mouse.x, y: this.mouse.y};
                this.mouse.x = ( ( event.clientX - this.renderer.domElement.offsetLeft ) / this.renderer.domElement.width ) * 2 - 1;
                this.mouse.y = - ( ( event.clientY - this.renderer.domElement.offsetTop ) / this.renderer.domElement.height ) * 2 + 1;

                this.mouseMove.x = (this.mouse.x - mouse.x) * 3;
                this.mouseMove.y = (this.mouse.y - mouse.y) * 3;

                this.mouseMoved = true;
            }
        };

        /**
         * Manages the mouse move envent in case of pointer lock
         * @param event the event to manage
         */
        onMouseMovePointer(e : any) {

            if (this.isLocked()) {

                this.mouseMove.x = e.movementX || e.mozMovementX || e.webkitMovementX || 0;
                this.mouseMove.y = e.movementY || e.mozMovementY || e.webkitMovementY || 0;

                this.mouseMove.x *= -(this.sensitivity/10);
                this.mouseMove.y *=  (this.sensitivity/10);

                this.mouseMoved = true;

            }

        }

        /**
         * Manages the mouse up event. Stops the dragging
         * @param event the event to manage
         */
        onMouseUp(event : any) {

            this.onMouseMove(event);

            // Send log to DB
            if (this.dragging && this.mouseMoved && !this.moving && !this.movingHermite) {
                var e = new DB.Event.KeyboardEvent();
                e.camera = this;
                e.keypressed = false;
                e.keycode = -1;
                e.send();
            }

            this.dragging = false;

        }

        /**
         * Logs the camera to the terminal (pratical to create recommended views)
         */
        log() {
            console.log("createRecommendation(\nnew THREE.Vector3(" + this.position.x + "," +  this.position.y + ',' + this.position.z + '),\n' +
                        "new THREE.Vector3(" + this.target.x + "," +  this.target.y + ',' + this.target.z + ')\n)');
        }

        /**
         * Save the current state of the camera in the history
         */
        save() {
            var backup : CameraItf = {position: this.position.clone(), target: this.target.clone()};
            this.history.addState(backup);
        }

        /**
         * Undo last motion according to the history
         */
        undo() {
            var move = this.history.undo();
            if (move !== undefined) {
                var event = new DB.Event.PreviousNextClicked();
                event.previous = true;
                event.camera = move;
                event.send();

                this.move(move, false);
            }
        }

        /**
         * Redo last motion according to the history
         */
        redo() {
            var move = this.history.redo();
            if (move !== undefined) {
                var event = new DB.Event.PreviousNextClicked();
                event.previous = false;
                event.camera = move;
                event.send();

                this.move(move, false);
            }
        }

        /**
         * Checks if there is a undo possibility in the history
         * @returns true if undo is possible, false otherwise
         */
        undoable() : boolean {
            return this.history.undoable();
        }

        /**
         * Checks if there is a redo possibility in the history
         * @returns true if redo is possible, false otherwise
         */
        redoable() : boolean {
            return this.history.redoable();
        }

        /**
         * Creates a list containing all the elements to send to the server to stream visible part
         * @return {Array} A list containing <ol start="0">
         * <li>the position of the camera</li>
         * <li>the target of the camera</li>
         * <li>and planes defining the frustum of the camera (a,b,c, and d from ax+by+cz+d=0)</li>
         * </ol>
         */
        toList() : any[] {

            var camera = this; // (this.recommendationClicked === null ? this : this.cameras[this.recommendationClicked].camera);

            camera.updateMatrix();
            camera.updateMatrixWorld(true);

            camera.matrixWorldInverse.getInverse(camera.matrixWorld);

            var frustum = new THREE.Frustum();

            frustum.setFromMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));

            var ret =
                [[camera.position.x, camera.position.y, camera.position.z],
                    [camera.target.x,   camera.target.y,   camera.target.z],
                    this.recommendationClicked
            ];

            for (var i = 0; i < frustum.planes.length; i++) {

                var p = frustum.planes[i];

                ret.push([
                    p.normal.x, p.normal.y, p.normal.z, p.constant
                ]);

            }

            return ret;

        }

    }

}

export = l3d;
