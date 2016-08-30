import { PointerCamera } from '../cameras/PointerCamera';

module l3d {

    /**
     * Displays a translucid canvas over the renderer to enable interaction to lock pointer
     */
    export class StartCanvas {

        /** The document element to add on top of the renderer */
        domElement : HTMLCanvasElement;

         /** The context of the canvas */
        ctx : CanvasRenderingContext2D;

        /** true if the canvas is displayed */
        shown : boolean;

        /**
         * Creates a starting canvas and binds it to a camera
         * @param camera the camera bound to this StartCanvas
         */
        constructor(camera : PointerCamera) {

            this.domElement = document.createElement('canvas');
            this.domElement.style.position = 'absolute';
            this.domElement.style.cssFloat = 'top-left';

            this.ctx = this.domElement.getContext('2d');
            this.shown = false;

            camera.startCanvas = this;

        }

        /**
         * Shows the canvas with a string in the middle of it (not done if already shown)
         * @param force force the rendering
         */
        render(force = false) {

            if (!this.shown || force) {

                this.ctx.fillStyle = 'white';
                this.ctx.globalAlpha = 0.7;
                this.ctx.fillRect(0,0,this.domElement.width, this.domElement.height);

                this.ctx.font = '30px Verdana';
                this.ctx.globalAlpha = 1;
                this.ctx.fillStyle = 'black';
                this.ctx.fillText(
                    'Click here to lock the pointer !',
                    window.containerSize.width()/3.25,
                    window.containerSize.height()/2-10
                );


                this.shown = true;

            }

        }

        /**
         * Hide canvas
         */
        clear() {

            if (this.shown) {

                // Clear canvas
                this.domElement.width = this.domElement.width;
                this.shown = false;

            }

        };

        /**
         * Sets the size of the canvas
         * @param width new width of the canvas
         * @param height new height of the canvas
         */
        setSize(width : number, height : number) {

            this.domElement.width = width;
            this.domElement.height = height;

            // If the canvas was shown, redraw it
            if (this.shown)
                this.render(true);

        };

    }

}

export = l3d;
