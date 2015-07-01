// Initialization

// class camera extends THREE.PerspectiveCamera
var ReverseCamera = function(arg1, arg2, arg3, arg4, position, target) {
    ArrowCamera.apply(this, arguments);
};
ReverseCamera.prototype = Object.create(ArrowCamera.prototype);
ReverseCamera.prototype.constructor = ReverseCamera;

// Overload init
ReverseCamera.prototype.initExtremity = function() {
    var geometry = new THREE.Geometry();

    var direction = this.target.clone();
    direction.sub(this.position);
    direction.normalize();

    var left = Tools.cross(direction, this.up);
    var other = Tools.cross(direction, left);

    left.normalize();
    other.normalize();
    left = Tools.mul(left, this.size / 2 );
    other  = Tools.mul(other, this.size / 2);

    var pyramidCenter = Tools.diff(this.position, Tools.mul(direction,0.25));
    geometry.vertices.push(
        Tools.sum( Tools.sum( this.position, left),  other),
        Tools.diff(Tools.sum( this.position, other), left),
        Tools.diff(Tools.diff(this.position, left),  other),
        Tools.sum( Tools.diff(this.position, other), left),

        Tools.sum( Tools.sum( this.position, left),  other),
        Tools.diff(Tools.sum( this.position, other), left),
        Tools.diff(Tools.diff(this.position, left),  other),
        Tools.sum( Tools.diff(this.position, other), left)
        // Tools.diff(this.position, direction)
    );

    var lambda = 0.6;
    for (var i = 0; i < 4; i++)
        geometry.vertices[i] = Tools.mul(Tools.diff(geometry.vertices[i], Tools.mul(pyramidCenter,lambda)), 1/(1-lambda));


    geometry.faces.push(new THREE.Face3(2,0,1), // new THREE.Face3(0,2,1),
                        new THREE.Face3(3,0,2),  // new THREE.Face3(0,3,2)

                        new THREE.Face3(1,0,4),
                        new THREE.Face3(1,4,5),

                        new THREE.Face3(2,1,5),
                        new THREE.Face3(2,5,6),

                        new THREE.Face3(7,2,6),
                        new THREE.Face3(7,3,2),

                        new THREE.Face3(3,7,4),
                        new THREE.Face3(3,4,0)

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

};

ReverseCamera.prototype.regenerateArrow = function(mainCamera) {
    var i;
    var vertices = [];

    // First point of curve
    var f0 = mainCamera.position.clone();
    f0.add(Tools.mul(Tools.sum(new THREE.Vector3(0,-0.5,0), Tools.diff(this.target, this.position).normalize()),2));

    // Last point of curve
    var f1 = this.position.clone();

    // Last derivative of curve
    var fp1 = Tools.diff(this.target, this.position);
    fp1.normalize();
    fp1.multiplyScalar(2);

    // Camera direction
    var dir = Tools.diff(this.position, mainCamera.position);
    dir.normalize();

    if (fp1.dot(dir) < -0.5) {
        // Regen polynom with better stuff
        // var new_dir = Tools.cross(Tools.diff(this.position, mainCamera.position).normalize(), mainCamera.up);
        // new_dir.multiplyScalar(new_dir.dot(fp1) < 0 ? 1 : -1);
        // new_dir.add(dir);
        // new_dir.add(dir);
        // new_dir.multiplyScalar(2);
        // f0.add(new_dir);

        if (mainCamera.position.y > this.position.y) {
            f0.add(new THREE.Vector3(0,2,0));
        } else {
            f0.add(new THREE.Vector3(0,-2,0));
        }

    }

    fp1.multiplyScalar(4);

    var hermite = new Hermite.special.Polynom(f0, f1, fp1);

    var up = this.up.clone();
    var point;
    var deriv;
    var limit = this.fullArrow ? 0.1 : 0.3;

    // for (var i = this.fullArrow ? 0 : 0.5; i <= 1.001; i += 0.05) {
    for (i = 1; i > limit; i -= 0.1) {
        point = hermite.eval(i);
        deriv = hermite.prime(i);
        up.cross(deriv);
        up.cross(deriv);
        up.multiplyScalar(-1);
        up.normalize();

        var coeff = i * i * this.size / 2;
        var left = Tools.cross(up, deriv);     left.normalize(); left.multiplyScalar(coeff);
        var other = Tools.cross(deriv, left);  other.normalize(); other.multiplyScalar(coeff);

        vertices.push(
            Tools.sum(Tools.sum(point, left), other),
            Tools.sum(Tools.diff(point, left), other),
            Tools.diff(point, Tools.sum(other,left)),
            Tools.sum(Tools.diff(point, other), left)
        );
    }

    this.arrow.geometry.vertices = vertices;

    if (this.arrow.geometry.faces.length === 0) {
        var faces = [];

        for (i = 0; i < vertices.length - 4; i+= 4) {
            faces.push(new THREE.Face3(i,i+1,i+5),new THREE.Face3(i,i+5,i+4),
                       new THREE.Face3(i+1,i+2,i+6),new THREE.Face3(i+1,i+6,i+5),
                       new THREE.Face3(i+2,i+3,i+7),new THREE.Face3(i+2,i+7,i+6),
                       new THREE.Face3(i,i+7,i+3), new THREE.Face3(i,i+4,i+7));
        }

        var len = vertices.length;
        faces.push(new THREE.Face3(len-4,len-3,len-2), new THREE.Face3(len-4,len-2,len-1));

        var max = 0;
        for (i = 0; i < faces.length; i++) {
            max = Math.max(max, faces[i].a, faces[i].b, faces[i].c);
        }
        console.log(max + '/' + len);


        this.arrow.geometry.faces = faces;
        this.arrow.geometry.facesNeedUpdate = true;
    }

    // this.arrow.geometry.mergeVertices();
    this.arrow.geometry.computeFaceNormals();
    // this.arrow.geometry.computeVertexNormals();
    this.arrow.geometry.computeBoundingSphere();

    // this.arrow.geometry.vertices[0] = new THREE.Vector3(); // mainCamera.position.clone();
    // this.arrow.geometry.vertices[1] = this.position.clone();

    this.arrow.geometry.dynamic = true;
    this.arrow.geometry.verticesNeedUpdate = true;
    this.arrow.geometry.elementsNeedUpdate = true;
    this.arrow.geometry.groupsNeedUpdate = true;
    this.arrow.geometry.normalsNeedUpdate = true;

};
