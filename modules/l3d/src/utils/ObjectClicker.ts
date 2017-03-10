import * as THREE from 'three';
import { PointerCamera } from '../cameras/PointerCamera';

module l3d {

    /**
     * I don't remember what this is... I'm sorry :'(
     */
    export interface CursorChangeEvent extends Event {

        cursor ?: string;

    }

    export class ObjectClicker {

        /**
         * Objects on which the collision is possible
         */
        objects : THREE.Object3D[];

        /**
         * Camera used for ray casting
         */
        camera : THREE.Camera;

        /**
         * Position of the mouse
         */
        mouse : { x : number, y : number };

        /**
         * Element on which we will listen
         */
        domElement : HTMLElement;

        /**
         * Element currently hovered
         */
        hoveredElement : THREE.Object3D;

        /**
         * Raycaster used for finding the objects
         */
        private raycaster : THREE.Raycaster;

        /**
         * Currently pointed object
         */
        currentPointedObject : THREE.Intersection;

        /**
         * Previously pointed object
         */
        previousPointedObject : THREE.Intersection;

        /**
         * Creates an ObjectClicker
         * @param domElement the dom element to which the ObjectClicker is bound
         */
        constructor(domElement ?: HTMLElement) {

            this.mouse = {x:0, y:0};

            this.domElement = domElement || document.body;

            this.raycaster = new THREE.Raycaster();

            this.objects = [];

            // Add event listeners
            this.domElement.addEventListener('mousemove', (event : any) => { this.update(event); });

            if (navigator.userAgent.indexOf("Firefox") > 0) {
                // If firefox
                this.domElement.addEventListener('mousedown', (event : any) => { this.click(event); });
            } else {
                // If chrome
                this.domElement.addEventListener('click', (event : any) => { this.click(event); });
                this.domElement.addEventListener('contextmenu', (event : any) => { event.button = 2; this.click(event); });
            }

            this.domElement.addEventListener('cursorchange', (event : CursorChangeEvent) => {

                this.domElement.style.cursor = event.cursor;

            });

        }


        /**
         * Get the object that is currently points
         * @returns the object
         */
        getPointedObject() {

            // Compute x and y for unprojection
            var x = ( this.mouse.x / window.containerSize.width() ) * 2 - 1;
            var y = - (this.mouse.y / window.containerSize.height()) * 2 + 1;

            if (this.pointerCheck()) {

                x = 0;
                y = 0;

            }

            var vector = new THREE.Vector3(x,y,0.5);
            vector.unproject(this.camera);

            // Set raycaster
            this.raycaster.set(this.camera.position, vector.sub(this.camera.position).normalize());

            // Compute intersections
            var intersects = this.raycaster.intersectObjects(this.objects, false);

            // Avoid non-raycastable objects
            for (var i = 0; i < intersects.length && !intersects[i].object.raycastable; i++){}

            // Objects are sorted by distance in intersects, the best is the first
            return intersects[i];

        }

        /**
         * Update the object clicker according to a certain event
         * @param event the event that was sent to the dom element
         */
        update(event ?: any) {

            if (event !== undefined) {
                this.mouse.x = event.offsetX || event.layerX;
                this.mouse.y = event.offsetY || event.layerY;
            }

            // Update current pointed object
            this.previousPointedObject = this.currentPointedObject;
            this.currentPointedObject = this.getPointedObject();

            // If those two objects are different, call onHover
            if (this.previousPointedObject !== this.currentPointedObject) {

                var p = this.pointerCheck();

                if (this.previousPointedObject !== undefined) {
                    if (this.previousPointedObject.object !== undefined) {
                        var e : CursorChangeEvent = new Event('cursorchange');
                        e.cursor = '';
                        this.domElement.dispatchEvent(e);
                        if (typeof this.previousPointedObject.object.onMouseLeave === 'function') {
                            this.previousPointedObject.object.onMouseLeave();
                        }
                    }
                }

                if (this.currentPointedObject !== undefined) {
                    if (this.currentPointedObject.object !== undefined) {
                        if (typeof this.currentPointedObject.object.onMouseEnter === 'function') {
                            if (
                                this.currentPointedObject.object.onMouseEnter({
                                    x : p ? window.containerSize.width()  / 2 : this.mouse.x,
                                    y : p ? window.containerSize.height() / 2 : this.mouse.y
                                })
                            ) {

                                var e : CursorChangeEvent = new Event('cursorchange');
                                e.cursor = 'pointer';
                                this.domElement.dispatchEvent(e);

                            }
                        }
                    }
                }
            }

        }

        /**
         * Calls the click function on the currently pointed object
         * @param event
         */
        click(event ?: any) {

            if (this.currentPointedObject !== undefined)
                if (this.currentPointedObject.object !== undefined)
                    if (typeof this.currentPointedObject.object.onClick === 'function')
                        this.currentPointedObject.object.onClick();


        }

        /**
         * Check if the camera is a PointerCamera and if its pointer locked
         */
        private pointerCheck() : boolean {
            return this.camera instanceof PointerCamera && (<PointerCamera>this.camera).pointerLocked;
        }


    }

}

export = l3d;
