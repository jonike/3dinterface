L3D.ProgressiveLoader = (function() {

if (typeof process === 'undefined') {
    process = {
        stderr : {
            write: function(str) {
                console.log(str);
            }
        }
    };
}

/**
 * Parse a list as it is sent by the server and gives a slightly more comprehensible result
 * @param Array array corresponding to the line of the mesh file
 * @private
 */
var _parseList = function(arr) {

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

    } else if (arr[0] === 'g') {

        ret.type = "global";
        ret.index = null;
        ret.numberOfFaces = arr[1];

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
var ProgressiveLoader = function(path, scene, camera, callback, log, laggy, prefetch) {

    var self = this;

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
     * Boolean indicate that we want extra lag for testing purposes
     */
    this.laggy = laggy;

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
    this.loader = typeof THREE.MTLLoader === 'function' ? new THREE.MTLLoader(this.texturesPath) : null;

    /**
     * Socket to connect to get the mesh
     * @type {socket}
     */
    this.socket = typeof io === 'function' ? io() : require('socket.io-client').connect('http://localhost:4000', {multiplex: false});

    this.initIOCallbacks();

    /**
     * Reference to the camera
     * @type {PointerCamera}
     */
    this.camera = camera;

    if (this.camera instanceof L3D.ReplayCamera) {
        this.camera._moveReco = this.camera.moveReco;

        this.camera.moveReco = function(param) {
            self.socket.emit('reco', param);
            self.camera._moveReco.apply(self.camera, arguments);
        };
    } else if (this.camera instanceof L3D.PointerCamera) {
        // Only good for sponza model
        this.camera._moveHermite = this.camera.moveHermite;

        this.camera.moveHermite = function() {
            console.log(arguments);
            self.socket.emit('reco', arguments[2]);
            self.camera._moveHermite.apply(self.camera, arguments);
        };

    }

    /**
     * Number of total elements for loading
     * @type {Number}
     */
    this.numberOfFaces = -1;

    /**
     * Number of elements received
     * @type {Number}
     */
    this.numberOfFacesReceived = 0;

    /**
     * Modulus indicator (not to log too often)
     * @type {Number}
     */
    this.modulus = 150;

    /**
     * Log function : called each time with the number of elements currently
     * received and the number of elements in total as parameter
     * @type {function}
     */
    this.log = log;

    this.mapFace = {};

    this.prefetch = prefetch;

};

ProgressiveLoader.prototype.hasFace = function(face) {

    return this.mapFace[(face.a) + '-' + (face.b) + '-' + (face.c)] === true;

};

/**
 * Starts the loading of the mesh
 */
ProgressiveLoader.prototype.load = function(callback) {

    var self = this;
    this._callback = callback;

    if (this.loader !== null) {
        this.loader.load(self.mtlPath, function(materialCreator) {

            self.materialCreator = materialCreator;

            materialCreator.preload();

            self.start();

        });

    } else {

        self.start();

    }
};

/**
 * Will return a list representation of the camera (to be sent to the server)
 */
ProgressiveLoader.prototype.getCamera = function() {
    if (this.camera === null)
        return null;

    return this.camera.toList();
};

/**
 * Initializes the socket.io functions so that it can discuss with the server
 */
ProgressiveLoader.prototype.initIOCallbacks = function() {

    var self = this;

    this.socket.on('ok', function() {
        self.socket.emit('materials');
    });

    this.socket.on('elements', function(arr) {

        // process.stderr.write('Received ' + arr.length + '\n');

        for (var i = 0; i < arr.length; i++) {

            if (typeof self.log === 'function' && self.numberOfFacesReceived % self.modulus === 0) {
                self.log(self.numberOfFacesReceived, self.numberOfFaces);
            }

            var elt = _parseList(arr[i]);

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

                // Create mesh material
                var material;

                if (elt.materialName === null || self.materialCreator === undefined) {

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

                self.numberOfFacesReceived++;

                self.mapFace[elt.a + '-' + elt.b + '-' + elt.c] = true;

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

                if (self.meshes[elt.mesh].faceNumber === self.meshes[elt.mesh].geometry.faces.length || typeof module === 'object') {

                    self.meshes[elt.mesh].geometry.computeBoundingSphere();

                }



            } else if (elt.type === 'global') {

                self.numberOfFaces = elt.numberOfFaces;
                self.modulus = Math.floor(self.numberOfFaces / 200);

            }

        }

        var param;
        if (typeof self.onBeforeEmit === 'function') {

            param = self.onBeforeEmit();
            self.socket.emit('next', self.getCamera(), param);

        } else {

            // Ask for next elements
            if (!self.laggy) {
                self.socket.emit('next', self.getCamera(), param);
            } else {
                setTimeout(function() { self.socket.emit('next', self.getCamera());}, 100);
            }
        }
    });

    this.socket.on('disconnect', function() {
        if (typeof self.log === 'function')
            self.log(self.numberOfFaces, self.numberOfFaces);
        self.finished = true;

        if (typeof L3D.ProgressiveLoader.onFinished === 'function') {
            L3D.ProgressiveLoader.onFinished();
        }

        if (typeof self._callback === 'function') {
            self._callback();
        }

    });
};

ProgressiveLoader.prototype.computeBoundingSphere = function() {
    for (var m of this.meshes) {
        m.geometry.computeBoundingSphere();
    }

};

/**
 * Starts the communication with the server
 */
ProgressiveLoader.prototype.start = function() {
    this.socket.emit('request', this.objPath, this.laggy, this.prefetch);
};

return ProgressiveLoader;

})();
