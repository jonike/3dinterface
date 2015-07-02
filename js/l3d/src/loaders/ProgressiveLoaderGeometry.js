/**
 * Parse a list as it is sent by the server and gives a slightly more comprehensible result
 * @private
 */
L3D._parseList2 = function(arr) {

    var ret = {};
    ret.index = arr[1];

    if (arr[0] === 'v') {
        ret.type = 'vertex';
        ret.x = arr[2];
        ret.y = arr[3];
        ret.z = arr[4];
    } else if (arr[0] === 'vt') {
        ret.type = 'texCoord';
        ret.x = arr[2];
        ret.y = arr[3];
    } else if (arr[0] === 'f') {
        ret.type = 'face';
        ret.mesh = arr[2];

        // Only Face3 are allowed
        vertexIndices  = arr[3];
        textureIndices = arr[4];
        normalIndices  = arr[5];

        // Vertex indices
        ret.a = vertexIndices[0];
        ret.b = vertexIndices[1];
        ret.c = vertexIndices[2];

        // Texutre indices (if they exist)
        if (textureIndices.length > 0) {
            ret.aTexture = textureIndices[0];
            ret.bTexture = textureIndices[1];
            ret.cTexture = textureIndices[2];
        }

        // Normal indices (if they exist)
        if (normalIndices.length > 0) {
            ret.aNormal = normalIndices[0];
            ret.bNormal = normalIndices[1];
            ret.cNormal = normalIndices[2];
        }

    } else if (arr[0] === 'vn') {

        // Normal
        ret.type = "normal";
        ret.x = arr[2];
        ret.y = arr[3];
        ret.z = arr[4];

    } else if (arr[0] === 'u') {

        // usemtl
        ret.index = -1;
        ret.type = 'usemtl';
        ret.materialName = arr[1];
        ret.vLength = arr[2];
        ret.fLength = arr[3];
        ret.texCoordsExist = arr[4];
        ret.normalsExist = arr[5];

    }

    return ret;
};

/**
 * Loads a mesh from socket.io
 * @param {string} path path to the .obj file
 * @param {THREE.Scene} scene to add the object
 * @param {PointerCamera} camera the camera that will be sent to server for smart
 * streaming (can be null, then the server will stream the mesh in the .obj
 * order)
 * @param {function} callback callback to call on the objects when they're created
 * @constructor
 * @memberOf L3D
 */
L3D.ProgressiveLoaderGeometry = function(path, scene, camera, callback) {

    /**
     * Path to the .obj file
     * @type {string}
     */
    this.objPath = path;

    /**
     * Path to the folder where the textures are
     * @type {string}
     */
    this.texturesPath = path.substring(0, path.lastIndexOf('/')) + '/';

    /**
     * Path to the .mtl file
     * @type {string}
     */
    this.mtlPath = path.replace('.obj', '.mtl');

    /**
     * Reference to the scene in which the object should be added
     */
    this.scene = scene;

    /**
     * Callback to call on the object when they're created
     */
    this.callback = callback;

    /**
     * Counter (not used)
     * @private
     */
    this.counter = 0;

    /**
     * Group where the sub-objects will be added
     * @type {THREE.Object3D}
     */
    this.obj = new THREE.Object3D();

    scene.add(this.obj);

    /**
     * Array of the vertices of the mesh
     * @type {THREE.Vector3[]}
     */
    this.vertices = [];

    /**
     * Array of the texture coordinates of the mesh
     * @type {THREE.Vector2[]}
     */
    this.texCoords = [];

    /**
     * Array of the normal of the mesh
     * @type {THREE.Vector3[]}
     */
    this.normals = [];

    /**
     * Array of the UV mapping
     * @description Each element is an array of 3 elements that are the indices
     * of the element in <code>this.texCoords</code> that should be
     * used as texture coordinates for the current vertex of the face
     * @type {Number[][]}
     */
    this.uvs = [];

    /**
     * Array of all the meshes that will be added to the main object
     * @type {THREE.Mesh[]}
     */
    this.meshes = [];

    /**
     * Loader for the material file
     * @type {THREE.MTLLoader}
     */
    this.loader = new THREE.MTLLoader(this.texturesPath);

    /**
     * Socket to connect to get the mesh
     * @type {socket}
     */
    this.socket = io();

    this.initIOCallbacks();

    /**
     * Reference to the camera
     * @type {PointerCamera}
     */
    this.camera = camera;

};

/**
 * Starts the loading of the mesh
 */
L3D.ProgressiveLoaderGeometry.prototype.load = function() {

    var self = this;

    this.loader.load(self.mtlPath, function(materialCreator) {

        self.materialCreator = materialCreator;

        materialCreator.preload();

        self.start();

    });
};

/**
 * Will return a list representation of the camera (to be sent to the server)
 */
L3D.ProgressiveLoaderGeometry.prototype.getCamera = function() {
    if (this.camera === null)
        return null;

    return this.toList();
};

/**
 * Initializes the socket.io functions so that it can discuss with the server
 */
L3D.ProgressiveLoaderGeometry.prototype.initIOCallbacks = function() {

    var self = this;

    this.socket.on('ok', function() {
        console.log('ok');
        self.socket.emit('materials');
    });

    this.socket.on('elements', function(arr) {

        if (arr.length === 0) {

            console.log("Empty array");

        } else {

            console.log("Stuff received");

        }


        // console.log("Received elements for the " + (++self.counter) + "th time !");
        for (var i = 0; i < arr.length; i++) {

            var elt = L3D._parseList2(arr[i]);

            // console.log(elts);
            if (elt.type === 'vertex') {

                // New vertex arrived

                // Fill the array of vertices with null vector (to avoid undefined)
                while (elt.index > self.vertices.length) {

                    self.vertices.push(new THREE.Vector3());

                }

                self.vertices[elt.index] = new THREE.Vector3(elt.x, elt.y, elt.z);
                self.currentMesh.geometry.verticesNeedUpdate = true;

            } else if (elt.type === 'texCoord') {

                // New texCoord arrived
                self.texCoords[elt.index] = new THREE.Vector2(elt.x, elt.y);
                self.currentMesh.geometry.uvsNeedUpdate = true;

            } else if (elt.type === 'normal') {

                // New normal arrived
                self.normals[elt.index] = new THREE.Vector3(elt.x, elt.y, elt.z);

            } else if (elt.type === 'usemtl') {

                if (self.currentMesh !== undefined) {

                    // if (self.currentMesh.geometry.attributes.normal === undefined) {

                    //     self.currentMesh.geometry.computeVertexNormals();

                    // }

                }

                // Must create new mesh
                // console.log("New mesh arrived : " + elt.materialName);

                // Create mesh material
                var material;

                if (elt.materialName === null) {

                    // If no material, create a default material
                    material = new THREE.MeshLambertMaterial({color: 'red'});

                } else {

                    // If material name exists, load if from material, and do a couple of settings
                    material = self.materialCreator.materials[elt.materialName.trim()];

                    material.side = THREE.DoubleSide;

                    if (material.map)
                        material.map.wrapS = material.map.wrapT = THREE.RepeatWrapping;
                }

                // Create mesh geometry
                self.uvs = [];
                var geometry = new THREE.Geometry();
                geometry.vertices = self.vertices;
                geometry.faces = [];

                // If texture coords, init faceVertexUvs attribute
                if (elt.texCoordsExist) {
                    geometry.faceVertexUvs = [self.uvs];
                }

                geometry.dynamic = true;

                // Create mesh
                var mesh = new THREE.Mesh(geometry, material);
                mesh.faceNumber = elt.fLength;
                self.meshes.push(mesh);

                self.currentMesh = mesh;

                if (typeof self.callback === 'function') {
                    self.callback(mesh);
                }

            } else if (elt.type === 'face') {

                if (!self.meshes[elt.mesh].added) {

                    self.meshes[elt.mesh].added = true;
                    self.obj.add(self.meshes[elt.mesh]);

                }

                if (elt.aNormal !== undefined) {
                    self.meshes[elt.mesh].geometry.faces.push(new THREE.Face3(elt.a, elt.b, elt.c, [self.normals[elt.aNormal], self.normals[elt.bNormal], self.normals[elt.cNormal]]));
                } else {
                    self.meshes[elt.mesh].geometry.faces.push(new THREE.Face3(elt.a, elt.b, elt.c));
                    self.meshes[elt.mesh].geometry.computeFaceNormals();
                    self.meshes[elt.mesh].geometry.computeVertexNormals();
                }

                if (elt.aTexture !== undefined) {

                    self.meshes[elt.mesh].geometry.faceVertexUvs[0].push([self.texCoords[elt.aTexture], self.texCoords[elt.bTexture], self.texCoords[elt.cTexture]]);

                }

                self.meshes[elt.mesh].geometry.verticesNeedUpdate = true;
                self.meshes[elt.mesh].geometry.uvsNeedUpdate = true;
                self.meshes[elt.mesh].geometry.normalsNeedUpdate = true;
                self.meshes[elt.mesh].geometry.groupsNeedUpdate = true;

                if (self.meshes[elt.mesh].faceNumber === self.meshes[elt.mesh].geometry.faces.length) {

                    self.meshes[elt.mesh].geometry.computeBoundingSphere();

                }


            }

        }

        // Ask for next elements
        self.socket.emit('next', self.getCamera());
    });

    this.socket.on('disconnect', function() {
        console.log('Finished !');
        self.finished = true;
    });
};

/**
 * Starts the communication with the server
 */
L3D.ProgressiveLoaderGeometry.prototype.start = function() {
    this.socket.emit('request', this.objPath);
};
