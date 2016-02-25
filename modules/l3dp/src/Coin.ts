import * as THREE from 'three';
import * as l3d from 'l3d';
import * as mth from 'mth';

module l3dp {

    export class Coin extends THREE.Object3D {

        rotating : boolean;
        callback : Function;
        got : boolean;
        child : THREE.Mesh;

        static toAdd : Coin[] = [];
        static BasicMesh : THREE.Mesh;
        static Sounds : any[];

        constructor(position : mth.Vector3, scale : number, visible = true, callback = ()=>{}) {

            super();

            this.got = false;
            this.raycastable = true;
            this.rotating = true;
            this.callback = callback;
            this.scale.set(scale, scale, scale);
            this.visible = visible;

            this.child = this.addChild();
        }

        addChild() : THREE.Mesh {

            if (Coin.BasicMesh instanceof THREE.Mesh) {

                // If the mesh is ready, clone it
                var mesh = Coin.BasicMesh.clone();
                mesh.material = Coin.BasicMesh.material.clone();
                this.add(mesh);
                return mesh;

            } else {

                // Do it later
                Coin.toAdd.push(this);

            }

        }

        update(time = 20) {

            if (this.rotating)
                this.rotation.y += 0.1;

            if (this.got) {

                if (this.child.material.opacity > 0.02) {

                    this.position.y += 0.05;
                    this.child.material.opacity -= 0.05;

                } else {

                    this.visible = false;
                    this.raycastable = false;

                }

            }

        }

        get() {

            if (this.got)
                return;

            this.got = true;

            this.callback();

            this.child.material.transparent = true;
            this.child.material.opacity = 1;

        }

        raycast(raycaster : THREE.Raycaster, intersects : any[]) {

            if (this.child !== undefined) {

                var intersectsThis : any[] = [];
                this.child.raycast(raycaster, intersectsThis);

                // Add closest object
                if (intersectsThis[0] !== undefined) {

                    intersectsThis[0].object = this;
                    intersects.push(intersectsThis[0]);

                }

            }

        }

        static addEarlyArrivers() {

            var mesh : THREE.Mesh;

            for (var i = 0; i < Coin.toAdd.length; i++) {

                var coin = Coin.toAdd[i];
                mesh = Coin.BasicMesh.clone();
                mesh.material = mesh.material.clone();
                coin.add(mesh);
                coin.child = mesh;

            }

        }

    }

}

export = l3dp;
