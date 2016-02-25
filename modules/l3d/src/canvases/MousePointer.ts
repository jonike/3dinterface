import * as THREE from 'three';
import { PointerCamera } from '../cameras/PointerCamera';
import { CursorChangeEvent } from '../utils/ObjectClicker';

module l3d {

    /**
     * Contains a canvas to place over the renderer for FPS-color pointer
     * It's based on a javascript 2d-canvas : you'll need to render it manually.
     *
     * @example
     * ``` js
     *
     * var container = documeng.getElementById('container');
     * var renderer = new THREE.WebGLRenderer();
     * renderer.setSize(width, height);
     *
     * var pointerCamera = new l3d.PointerCamera(50, width/height, near, fat, renderer, container);
     * var mousePointer = new l3d.MousePointer(pointerCamera);
     * mousePointer.domElement.width = width;
     * mousePointer.domElement.height = height;
     *
     * container.appendChild(mousePointer.domElement);
     * container.appendChild(renderer.domElement);
     *
     * mousePointer.render(l3d.MousePointer.BLACK);
     * ```
     */
    export class MousePointer {

        /**
         * The document element to add on top of the renderer
         */
        domElement : HTMLCanvasElement;

        /**
         * The context of the canvas
         */
        ctx : CanvasRenderingContext2D;

        /**
         * The size of the gun sight
         */
        size : number;

        /**
         * l3d.MousePointer color. The current color of the mouse pointer
         */
        color : Color;

        /**
         * Creates a mouse pointer canvas and bind it to a camera
         * @param camera camera to which the mouse pointer will be bound
         */
        constructor(camera : PointerCamera) {

            this.domElement = document.createElement('canvas');

            this.domElement.style.position = 'absolute';
            this.domElement.style.cssFloat = 'top-left';

            this.ctx = this.domElement.getContext('2d');

            this.size = 10;

            camera.mousePointer = this;

            this.color = Color.NONE;

            document.getElementById('container').addEventListener('cursorchange', (e : CursorChangeEvent) => {
                if (this.color !== Color.NONE) {
                    this.render( e.cursor === 'pointer' ? Color.RED : Color.BLACK);
                }
            });

        }

        /**
         * Re-renders the canvas
         * For performance reasons, the rendering is done only if the color changed.
         * @param color the l3d.MousePointer color you want to render
         * @param force the re-rendering (even if the color did not change)
         */
        render(c = Color.NONE, force = false) {

            if (this.color !== c || force) {

                if (c == Color.NONE) {

                    // Clear canvas
                    this.domElement.width = this.domElement.width;
                    this.color = c;

                } else {


                    this.domElement.width = this.domElement.width;

                    var i = window.containerSize.width() / 2;
                    var imin = i - this.size;
                    var imax = i + this.size;

                    var j = window.containerSize.height() / 2;
                    var jmin = j - this.size;
                    var jmax = j + this.size;

                    this.ctx.beginPath();
                    this.ctx.moveTo(imin, j);
                    this.ctx.lineTo(imax, j);
                    this.ctx.moveTo(i, jmin);
                    this.ctx.lineTo(i, jmax);
                    this.ctx.closePath();


                    this.ctx.lineWidth = 5;
                    this.ctx.strokeStyle = '#ffffff';
                    this.ctx.stroke();

                    this.ctx.lineWidth = 2;
                    this.ctx.strokeStyle = toString(c);
                    this.ctx.stroke();

                    this.color = c;

                }

            }

        }

        /**
         * Clears the canvas
         * @param force force the clearing (even if the color did not change)
         */
        clear(force = false) {

            this.render(Color.NONE, force);

        }


        /**
         * Sets the size of the canvas
         * @param width the new width of the canvas
         * @param height the new height of the canvas
         */

        setSize(width : number, height : number) {

            this.domElement.width = width;
            this.domElement.height = height;

            this.render(this.color, true);

        }

    }

    function toString(c : Color) : string {

        switch(c) {

            case Color.NONE  : return null;
            case Color.BLACK : return '#000000';
            case Color.RED   : return '#ff0000';

        }

    }

    /**
     * The different colors that the mouse pointer can have
     */
    export enum Color {

        /** Empty color : the canvas is fully transparent */
        NONE,

        /** @description Black color : the canvas contains only a white cross in the middle of the screen */
        BLACK,

        /** @description Red color : the canvas contains only a white and red cross in the midlle */
        RED

    }

}

export = l3d;
