import * as THREE from 'three';
import * as mth from 'mth';

import { MouseCursor } from '../cameras/PointerCamera';
import { Camera } from '../cameras/Camera';
import { BaseCamera } from '../cameras/BaseCamera';

module l3d {

    /**
     * Displays a small preview of a camera
     */
    export class Previewer {

        /** The document element to add on top of the renderer */
        domElement = document.createElement('canvas');

        /** The context of domElement */
        ctx : CanvasRenderingContext2D;

        /** The renderer to use  */
        renderer : THREE.WebGLRenderer;

        /** The scene to render */
        scene : THREE.Scene;

        /**
         * true if the preview should be stuck at the bottom left of the container,
         * false if it should appear near the mouse
         */
        fixed : boolean;

        /** true if the rendering as already been done  */
        private drawn : boolean;

        /** true if the rendering was done before */
        private drawnBefore : boolean;

        /** position of the mouse */
        mouse : MouseCursor;

        /** Camera to use for the preview */
        camera : BaseCamera;

        /** Previous camera used */
        prevCamera : BaseCamera;

        /** Indicates wether the canvas needs to be cleared or not */
        clearNeeded : boolean;

        /**
         * Creates the previewer
         * @param renderer The webgl renderer to draw on
         * @param scene the scene
         */
        constructor(renderer : THREE.WebGLRenderer, scene : THREE.Scene) {
            this.domElement = document.createElement('canvas');
            this.ctx = this.domElement.getContext('2d');
            this.renderer = renderer;
            this.scene = scene;
            this.fixed = false;
            this.drawn = false;
            this.drawnBefore = false;
            this.mouse = {x: null, y: null};
        };

        /**
         * Renders the preview
         * @param containerWidth width of the container
         * @param containerHeight height of the container
         */
        render(containerWidth : number, containerHeight : number) {
            var width : number, height : number, left : number, bottom : number;

            if (this.camera) {
                width  = Math.floor(containerWidth / 5);
                height = Math.floor(containerHeight / 5);
                if (!this.fixed) {
                    left = Math.floor(this.mouse.x - width/2);
                    bottom = Math.floor(this.renderer.domElement.height - this.mouse.y + height/5);

                    // Translate box if too high
                    if (bottom + height > this.renderer.domElement.height) {
                        bottom -= 7 * height / 5;
                    }

                    // Translate box if too on the side
                    left = mth.clamp(left, width / 5, this.renderer.domElement.width - 6 * width / 5);

                } else {
                    left = 20;
                    bottom = 20;
                }

                // Draw border
                var canBottom = containerHeight - bottom - height ;
                this.ctx.strokeStyle = "#ffffff";
                this.ctx.beginPath();
                this.ctx.moveTo(left-1, canBottom);
                this.ctx.lineTo(left-1, canBottom + height);
                this.ctx.lineTo(left + width-1, canBottom + height);
                this.ctx.lineTo(left + width-1, canBottom);
                this.ctx.closePath();
                this.ctx.stroke();

                this.ctx.strokeStyle = "#000000";
                this.ctx.beginPath();
                this.ctx.moveTo(left, canBottom + 1);
                this.ctx.lineTo(left, canBottom + height - 1);
                this.ctx.lineTo(left + width - 2 , canBottom + height-1);
                this.ctx.lineTo(left + width - 2, canBottom+1);
                this.ctx.closePath();
                this.ctx.stroke();

                // Do render in previsualization
                this.camera.look();
                this.renderer.setScissor(left, bottom, width, height);
                this.renderer.enableScissorTest(true);
                this.renderer.setViewport(left, bottom, width, height);
                this.renderer.render(this.scene, this.camera);

                this.update(true);

                if (this.prevCamera !== this.camera) {
                    this.clearNeeded = true;
                }

                this.prevCamera = this.camera;

            } else {
                this.update(false);
            }

            if (this.drawnBefore && !this.drawn) {
                this.clearNeeded = true;
            }

        }

        /**
         * Clears the borders of the preview
         */
        clear() {
            if (this.clearNeeded) {
                this.domElement.width = this.domElement.width;
                this.clearNeeded = false;
            }
        }

        /**
         * Setter for the fixed preview
         * @param bool true if you want to fix the preview, false otherwise
         */
        fixedRecommendation(bool : boolean) {
            this.fixed = bool;
        };

        /**
         * Update flags
         * @param arg if the update drew something
         */
        private update(arg : boolean) {
            this.drawnBefore = this.drawn;
            this.drawn = arg;
        };

        /**
         * Changes the camera used for the preview
         * @param camera the new camera for preview
         */
        setCamera(camera : BaseCamera) {
            this.camera = camera;
        }

        /**
         * Sets the position of the preview (automatically moves the
         * preview if the mouse is in the border of the canvas)
         * @param x x coordinate of the mouse
         * @param y y coordinate of the mouse
         */
        setPosition(x : number, y : number) {

            if (!this.drawn) {
                this.mouse.x = x;
                this.mouse.y = y;
            }

        }

        /**
         * Resets the size of the canvas and clears it
         * @param width the new width
         * @param height the new height
         */
        setSize(width : number, height : number) {
            this.domElement.width = width;
            this.domElement.height = height;
        }

    }

}

export = l3d;
