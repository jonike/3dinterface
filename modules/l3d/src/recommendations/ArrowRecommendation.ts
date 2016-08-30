import * as THREE from 'three';
import * as mth from 'mth';

import { FixedCamera } from '../cameras/FixedCamera';
import { BaseRecommendation } from './BaseRecommendation';

module l3d {

    /**
     * Recommendation that is represented by an arrow
     */
    export class ArrowRecommendation extends BaseRecommendation {

        /**
         * Center of the square at the base of the arrow
         */
        center : THREE.Vector3;

        /**
         * Body of the arrow
         */
        arrow : THREE.Mesh;

        /**
         * Size of the meshes
         */
        size : number;

        /**
         * A container for the displayable objects in the Recommendation
         */
        object3D : THREE.Object3D;

        /**
         * Extremity of the arrow
         */
        mesh : THREE.Mesh;

        /**
         * Display the full arrow or only the last half
         */
        fullArrow : boolean;

        constructor(arg1:number, arg2:number, arg3:number, arg4:number, position:mth.Vector3, target:mth.Vector3) {

            super(arg1, arg2, arg3, arg4, position, target);

            this.camera = new FixedCamera(arg1, arg2, arg3, arg4, position, target);
            this.add(this.camera);

            var direction = mth.copy(target);
            direction.sub(this.camera.position);
            direction.normalize();

            this.center = this.camera.position.clone();
            this.center.sub(direction);

            this.arrow = new THREE.Mesh(new THREE.Geometry(), new THREE.MeshLambertMaterial({color: 0x0000ff, side:THREE.BackSide}));
            this.add(this.arrow);

            this.size = 0.4;

            this.object3D = new THREE.Object3D();

            var tmp = this.initExtremity();

            if (tmp !== undefined)
                this.object3D.add(tmp);

            this.object3D.add(this.arrow);

            this.add(this.object3D);

            this.fullArrow = false;

        }

        /**
         * Computes the intersections with its mesh
         * @param raycaster the raycaster considered
         * @param intersects collisions in which we will append the stuff
         */
        raycast(raycaster : THREE.Raycaster, intersects : any[]) : void {

            var intersectsThis : any[] = [];
            this.object3D.traverse((elt : THREE.Object3D) : void => { elt.raycast(raycaster, intersectsThis); });

            // Add closest object
            if (intersectsThis[0] !== undefined) {

                intersectsThis[0].object = this;
                intersects.push(intersectsThis[0]);

            }

        }

        /**
         * Changes the color of the meshes like a HTML link
         */
        check() {
            this.traverse((obj : THREE.Object3D) => {
                if (obj instanceof THREE.Mesh)
                    (<THREE.MeshBasicMaterial>(obj.material)).color.setHex(0x663366);
            });
        }

        /**
         * Initialize the extremity of the arrow
         * @returns the extremity of the arrow
         */
        initExtremity() {

            var geometry = new THREE.Geometry();

            var direction = this.camera.target.clone();
            direction.sub(this.camera.position);
            direction.normalize();

            var left  = mth.cross(direction, this.up);
            var other = mth.cross(direction, left);


            left.normalize();
            other.normalize();
            left  = mth.mul(left, this.size);
            other = mth.mul(other, this.size);

            geometry.vertices.push(
                mth.sum (mth.sum( this.camera.position, left),  other),
                mth.diff(mth.sum( this.camera.position, other), left),
                mth.diff(mth.diff(this.camera.position, left),  other),
                mth.sum (mth.diff(this.camera.position, other), left),
                mth.sum(this.camera.position, direction)
            );

            geometry.faces.push(
                new THREE.Face3(0,2,1),
                new THREE.Face3(0,3,2),
                new THREE.Face3(4,1,2),
                new THREE.Face3(4,0,1),
                new THREE.Face3(4,3,0),
                new THREE.Face3(4,2,3)
            );

            geometry.computeFaceNormals();

            var material = new THREE.MeshLambertMaterial({
                color : 0x0000ff,
                transparent : true,
                opacity : 0.5,
                side: THREE.FrontSide
            });

            this.mesh = new THREE.Mesh(geometry, material);
            return this.mesh;
        }

        /**
         * Updates the extremity of the arrow
         */
        updateExtremity() {

            var direction = this.camera.target.clone();
            direction.sub(this.camera.position.clone());
            direction.normalize();

            var left  = mth.cross(direction, this.up);
            var other = mth.cross(direction, left);

            left.normalize();
            other.normalize();
            left  = mth.mul(left, this.size);
            other = mth.mul(other, this.size);

            var geometry = <THREE.Geometry>(this.mesh.geometry);

            geometry.vertices[0] = mth.sum (mth.sum( this.camera.position, left),  other);
            geometry.vertices[1] = mth.diff(mth.sum( this.camera.position, other), left);
            geometry.vertices[2] = mth.diff(mth.diff(this.camera.position, left),  other);
            geometry.vertices[3] = mth.sum (mth.diff(this.camera.position, other), left);
            geometry.vertices[4] = mth.sum(this.camera.position, direction);

            geometry.computeFaceNormals();
            geometry.verticesNeedUpdate = true;
            geometry.normalsNeedUpdate = true;

        }

        /**
         * Changes the size of the element
         * @param size {Number} new size
         * @deprecated this function doesn't work since there are lots of things to
         * keep in mind (length of the arrow, width, size of the body, size of the
         * extremity...)
         */
        setSize(size : number) {
            this.size = size;
            this.updateExtremity();
        }

        /**
         * Updates the arrow. The arrow is moving according to the position of the camera
         * @param mainCamera the user's camera
         */
        update(mainCamera : THREE.Camera) {
            // Compute distance between center of camera and position
            var dist = mth.norm2(mth.diff(mainCamera.position, this.center));

            var lowBound = 1;
            var highBound = 5;
            var newValue : number;

            if (dist < lowBound) {
                newValue = 0;
            } else if (dist > highBound) {
                newValue = 1;
            } else {
                newValue = (dist - lowBound)/(highBound - lowBound);
            }

            // Update opacity
            var self = this;
            this.object3D.traverse(function(elt) {
                if (elt instanceof THREE.Mesh) {
                    elt.material.transparent =   newValue < 0.9;
                    elt.material.opacity = newValue;

                    if (newValue < 0.1)
                        self.raycastable = elt.raycastable = elt.material.transparent = elt.visible = false;
                }
            });

            this.regenerateArrow(mainCamera);
        }

        /**
         * Regenerates the arrow according to the position of the camera
         * @param mainCamera the user's camera
         */
        regenerateArrow(mainCamera : THREE.Camera) {
            var i : number;
            var vertices : THREE.Vector3[] = [];

            // First point of curve
            var f0 = mainCamera.position.clone();
            f0.add(mth.mul(mth.sum(new THREE.Vector3(0,-0.5,0), mth.diff(this.camera.target, this.camera.position).normalize()),2));

            // Last point of curve
            var f1 = this.camera.position.clone();

            // Last derivative of curve
            var fp1 = mth.diff(this.camera.target, this.camera.position);
            fp1.normalize();
            fp1.multiplyScalar(2);

            // Camera direction
            var dir = mth.diff(this.camera.position, mainCamera.position);
            dir.normalize();

            if (fp1.dot(dir) < -0.5) {
                // Regen polynom with better stuff
                if (mainCamera.position.y > this.camera.position.y) {
                    f0.add(new THREE.Vector3(0,2,0));
                } else {
                    f0.add(new THREE.Vector3(0,-2,0));
                }

            }

            fp1.multiplyScalar(4);

            var hermite = new mth.Hermite.special.Polynom(f0, f1, fp1);

            var up = this.up.clone();
            var point : THREE.Vector3;
            var deriv : THREE.Vector3;
            var limit = this.fullArrow ? 0.1 : 0.3;

            for (i = 1; i > limit; i -= 0.1) {

                point = hermite.eval(i);
                deriv = hermite.prime(i);

                up.cross(deriv);
                up.cross(deriv);
                up.multiplyScalar(-1);
                up.normalize();

                var coeff = this.size / 2;
                var left  = mth.cross(up, deriv);     left.normalize(); left.multiplyScalar(coeff);
                var other = mth.cross(deriv, left);  other.normalize(); other.multiplyScalar(coeff);

                vertices.push(
                    mth.sum (mth.sum(point, left), other),
                    mth.sum (mth.diff(point, left), other),
                    mth.diff(point, mth.sum(other,left)),
                    mth.sum (mth.diff(point, other), left)
                );
            }

            var geometry = <THREE.Geometry>(this.arrow.geometry);
            geometry.vertices = vertices;

            if (geometry.faces.length === 0) {
                var faces : THREE.Face3[] = [];

                for (i = 0; i < vertices.length - 4; i+= 4) {
                    faces.push(new THREE.Face3(i,i+1,i+5),  new THREE.Face3(i,i+5,i+4),
                               new THREE.Face3(i+1,i+2,i+6),new THREE.Face3(i+1,i+6,i+5),
                               new THREE.Face3(i+2,i+3,i+7),new THREE.Face3(i+2,i+7,i+6),
                               new THREE.Face3(i,i+7,i+3),  new THREE.Face3(i,i+4,i+7));
                }

                var len = vertices.length;
                faces.push(new THREE.Face3(len-4,len-3,len-2), new THREE.Face3(len-4,len-2,len-1));

                // Faces changed, update them
                geometry.faces = faces;
                geometry.groupsNeedUpdate = true;
                geometry.elementsNeedUpdate = true;
            }

            geometry.computeFaceNormals();
            geometry.computeBoundingSphere();

            // Vertices and normals changed, update them
            geometry.verticesNeedUpdate = true;
            geometry.normalsNeedUpdate = true;

        }

        /**
         * Look at function. Just like OpenGL gluLookAt (from position to target)
         */
        look() {
            this.camera.look();
        }

        /**
         * Add the camera and its mesh representation to the scene
         * @param scene scene to add the camera to
         */
        addToScene(scene : THREE.Scene) {
            scene.add(this);
        }

    }

}

export = l3d;
