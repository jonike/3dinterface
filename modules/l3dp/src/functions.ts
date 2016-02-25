import * as THREE from 'three';
import * as l3d from 'l3d';

module l3dp {

    export function logfps(fps : number) {
        var event = new l3d.DB.Event.Fps();
        event.fps = fps;
        event.send();
    }

    export function appendTo(container : HTMLElement) : Function {

        return function(...args : {domElement : Element}[]) {

            for (var i = 0; i < args.length; i++) {

                container.appendChild(args[i].domElement);

            }

        }

    }

    function setSize(elt : HTMLElement, w : number, h : number) : void;
    function setSize(elt : {setSize(w : number, h : number) : void;}, w : number, h : number) : void;
    function setSize(elt : any, w : number, h : number) : void {

        if (elt == null) {
            return;
        }

        if (elt instanceof HTMLElement) {

            (<HTMLElement>elt).style.width = w + 'px';
            (<HTMLElement>elt).style.height = h + 'px';

        }

        if (elt.domElement) {

            (<{setSize(w : number, h : number) : void;}>elt).setSize(w, h);

        }

    }

    export function resizeElements(...args : (HTMLElement | {setSize(w:number, h:number) : void ;})[]) : void {

        var width = window.containerSize.width(), height = window.containerSize.height();

        for (var i = 0; i < args.length; i++) {

            setSize(<HTMLElement>args[i], width, height);

        }

    }

    function createVisibilityFunction(visible : boolean) : (obj : THREE.Object3D) => void {

        return function (obj : THREE.Object3D) {
            obj.traverse(function(obj : THREE.Object3D) {
                obj.visible = visible;
            });
        };

    }

    export var show = createVisibilityFunction(true);
    export var hide = createVisibilityFunction(false);

    export function resetCameraAspect(camera : THREE.PerspectiveCamera, width : number, height : number) {

            camera.aspect = width / height;
            camera.updateProjectionMatrix();

    }

}

export = l3dp;
