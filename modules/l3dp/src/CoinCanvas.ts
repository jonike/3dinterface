import * as THREE from 'three';
import * as l3d from 'l3d';
import * as mth from 'mth';

module l3dp {

    function instantToColor(instant : number) {

        var r = Math.floor(255 * instant);
        var g = Math.floor(255 * (1-instant));

        return 'rgb(' + r + ',' + g + ',0)';

    }

    export class CoinCanvas {

        domElement : HTMLCanvasElement;
        ctx : CanvasRenderingContext2D;

        level : number;
        blinking : boolean;
        blinkingToRed : boolean;
        colorInstant : number;

        width : number;
        height : number;


        constructor() {

            this.domElement = document.createElement('canvas');
            this.ctx = this.domElement.getContext('2d');

            this.level = 0;
            this.blinking = false;
            this.blinkingToRed = true;
            this.colorInstant = 0;

            this.width = 10;
            this.height = 100;

        }

        setSize(w : number, h : number) {

            this.domElement.width = w;
            this.domElement.height = h;
            this.update();

        }

        update() {

            if (this.blinking) {

                this.colorInstant += this.blinkingToRed ? 0.025 : -0.025;

                if (this.colorInstant < 0 || this.colorInstant > 1) {

                    this.colorInstant = mth.clamp(this.colorInstant, 0, 1);
                    this.blinkingToRed = !this.blinkingToRed;

                }

            } else {

                this.colorInstant = 0;
                this.blinkingToRed = true;

            }

            // Some uggly stuff
            if (document.getElementById('next') !== null)
                document.getElementById('next').style.background = instantToColor(this.colorInstant);

        }

        render() {

            var x = this.domElement.width * 4.75 / 5;

            this.ctx.save();
            this.ctx.clearRect(x-70,20,this.width+71,this.height);

            this.ctx.fillStyle = instantToColor(this.colorInstant);
            this.ctx.fillRect(x,20 + (1-this.level)*this.height,10,(this.level*this.height));

            this.ctx.beginPath();
            this.ctx.moveTo(x,20);
            this.ctx.lineTo(x,120);
            this.ctx.lineTo(x+this.width,120);
            this.ctx.lineTo(x+this.width,20);
            this.ctx.stroke();

            this.ctx.fillStyle = 'black';
            this.ctx.font="20px Arial";
            this.ctx.fillText('Score', x - 60, 25);

            this.ctx.restore();

        }

        setLevel(newLevel : number) {

            this.level += 0.01 * Math.sign(newLevel - this.level);

            if (Math.abs(this.level - newLevel) > 0.005) {

                var self = this;
                setTimeout(function() { self.setLevel(newLevel); }, 50);

            }

        }

        blink(param ?: boolean) {

            this.blinking = param === undefined ? true : !!param;

        }

    }

}

export = l3dp;
