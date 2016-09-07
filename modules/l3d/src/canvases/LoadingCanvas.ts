module l3d {

    /**
     * Displays a translucid canvas over the renderer to tell to wait for loading
     */
    export class LoadingCanvas {

        /**
         * The document element to add on top of the renderer
         */
        domElement : HTMLCanvasElement;

        /**
         * The context of the canvas
         */
        ctx : CanvasRenderingContext2D;

        /** true if the canvas is displayed */
        shown : boolean;

        /** current number of dots displayed after 'Loading' text */
        dots : string;

        /**
         * Creates a hidden loading canvas
         */
        constructor() {

            this.domElement = document.createElement('canvas');
            this.domElement.style.position = 'absolute';
            this.domElement.style.cssFloat = 'top-left';

            this.ctx = this.domElement.getContext('2d');
            this.shown = false;
            this.dots = '.';

        }

        /**
         * Shows the canvas with a string in the middle of it (not done if already shown)
         * @param force force the rendering
         */
       render(force = false) {

            if (!this.shown || force) {

                this.ctx.fillStyle = 'white';
                this.ctx.globalAlpha = 1;
                this.ctx.fillRect(0,0,this.domElement.width, this.domElement.height);

                this.ctx.font = '30px Verdana';
                this.ctx.globalAlpha = 1;
                this.ctx.fillStyle = 'black';
                this.ctx.fillText(
                    'Loading ' + this.dots,
                    window.containerSize.width()/2.75,
                    window.containerSize.height()/2-10
                );


                this.shown = true;

                setTimeout(() => {
                    if (this.shown) {
                        this.dots += '.';
                        if (this.dots === '....') {
                            this.dots = '.';
                        }
                        this.render(true);
                    }
                }, 750);

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
