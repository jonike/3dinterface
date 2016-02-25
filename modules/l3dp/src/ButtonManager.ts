import * as THREE from 'three';
import * as l3d from 'l3d';

module l3dp {

    export class ButtonManager {

        camera : l3d.PointerCamera;
        recommendations : l3d.BaseRecommendation[];
        previewer : l3d.Previewer;
        showArrows : boolean;
        beenFullscreen : boolean;

        resetElement : JQuery;
        undoElement :  JQuery;
        redoElement :  JQuery;

        pointerLockElement : JQuery;
        showArrowsElement :  JQuery;


        constructor(camera : l3d.PointerCamera, recommendations : l3d.BaseRecommendation[], previewer : l3d.Previewer) {

            this.camera = camera;
            this.recommendations = recommendations;
            this.previewer = previewer;

            this.showArrows = true;
            this.beenFullscreen = false;

            this.resetElement = $('#reset');
            this.undoElement = $('#undo');
            this.redoElement = $('#redo');

            this.pointerLockElement = $('#lock');
            this.showArrowsElement = $('#showarrows');

            this.undoElement.click(() => {this.camera.undo(); this.updateElements();});
            this.redoElement.click(() => {this.camera.redo(); this.updateElements();});
            this.pointerLockElement.change(() => {
                this.camera.shouldLock = this.pointerLockElement.prop('checked');
                this.camera.onPointerLockChange();

                var bakup = l3d.DB.isEnabled();
                if (!bakup)
                    l3d.DB.enable();

                var event = new l3d.DB.Event.SwitchedLockOption();
                event.locked = this.pointerLockElement.prop('checked');
                event.send();

                if (!bakup)
                    l3d.DB.disable();

            });

            this.showArrowsElement.change(() => {this.showArrows = this.showArrowsElement.prop('checked');});
            this.resetElement.click(() => this.camera.reset());

        }

        updateElements() {
            // Update icon
            if (!this.camera.undoable()) {
                this.undoElement.addClass('btn-default').removeClass('btn-primary');
            } else {
                this.undoElement.removeClass('btn-default').addClass('btn-primary');
            }

            if (!this.camera.redoable()) {
                this.redoElement.addClass('btn-default').removeClass('btn-primary');
            } else {
                this.redoElement.removeClass('btn-default').addClass('btn-primary');
            }

        }

    }

}

export = l3dp;
