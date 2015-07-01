// class camera extends THREE.PerspectiveCamera
var ReplayCamera = function() {
    THREE.PerspectiveCamera.apply(this, arguments);

    this.coins = arguments[4];

    this.started = false;
    this.counter = 0;

    this.position = new THREE.Vector3();
    this.target = new THREE.Vector3();
    this.new_position = new THREE.Vector3();
    this.new_target = new THREE.Vector3();

    var id = params.get.id;

    var xhr = new XMLHttpRequest();
    xhr.open("GET", "/prototype/replay_info/" + id, true);

    var self = this;
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            self.path = JSON.parse(xhr.responseText);
            self.started = true;
            self.nextEvent();
        }
    };
    xhr.send();

    // Set Position
    this.theta = Math.PI;
    this.phi = Math.PI;

    this.resetElements = resetBobombElements();

};
ReplayCamera.prototype = Object.create(THREE.PerspectiveCamera.prototype);
ReplayCamera.prototype.constructor = ReplayCamera;

ReplayCamera.prototype.look = function() {
    this.lookAt(this.target);
};

// Update function
ReplayCamera.prototype.update = function(time) {
    if (this.started) {
        if (this.event.type == 'camera') {
            this.cameraMotion(time);
        } else if (this.event.type == 'previousnext') {
            this.linearMotion(time / 5);
        } else if (this.event.type == 'arrow') {
            this.hermiteMotion(time);
        }
        // } else if (this.event.type == 'coin') {
        //     // Nothing to do
        // } else if (this.event.type == 'reset') {
        //     // Nothing to do
        // }
    }
};

ReplayCamera.prototype.linearMotion = function(time) {
    var tmp = Tools.sum(Tools.mul(this.old_position, 1-this.t), Tools.mul(this.new_position, this.t));
    this.position.x = tmp.x;
    this.position.y = tmp.y;
    this.position.z = tmp.z;
    this.t += 0.1 * time / 20;

    if (this.t > 1) {
        this.nextEvent();
    }
};

ReplayCamera.prototype.cameraMotion = function(time) {

    var tmp = Tools.sum(Tools.mul(this.old_position, 1-this.t), Tools.mul(this.new_position, this.t));
    this.position.x = tmp.x;
    this.position.y = tmp.y;
    this.position.z = tmp.z;
    this.target = Tools.sum(Tools.mul(this.old_target, 1-this.t), Tools.mul(this.new_target, this.t));
    this.t += 1 / (((new Date(this.path[this.counter].time)).getTime() - (new Date(this.path[this.counter-1].time)).getTime()) / 20);

    if (this.t > 1) {
        this.nextEvent();
    }
};

ReplayCamera.prototype.hermiteMotion = function(time) {
    var e = this.hermitePosition.eval(this.t);
    this.position.x = e.x;
    this.position.y = e.y;
    this.position.z = e.z;

    this.target = Tools.sum(this.position, this.hermiteAngles.eval(this.t));

    this.t += 0.01 * time / 20;

    if (this.t > 1) {
        this.nextEvent();
    }
};

ReplayCamera.prototype.nextEvent = function() {
    this.counter++;

    // Finished
    if (this.counter >= this.path.length) {
        this.started = false;
        return;
    }

    this.event = this.path[this.counter];

    if (this.event.type == 'camera') {
        this.move(this.event);
    } else if (this.event.type == 'coin') {
        this.coins[this.event.id].get();
        // Wait a little before launching nextEvent
        (function(self) {
            setTimeout(function() {
                self.nextEvent();
            },500);
        })(this);
    } else if (this.event.type == 'arrow') {
        this.moveHermite(this.cameras.cameras[this.event.id]);
    } else if (this.event.type == 'reset') {
        this.reset();
        (function (self) {
            setTimeout(function() {
                self.nextEvent();
            },500);
        })(this);
    } else if (this.event.type == 'previousnext') {
        this.move(this.event);
    } else if (this.event.type == 'hovered') {
        this.nextEvent();
    }
};

ReplayCamera.prototype.reset = function() {
    this.resetPosition();
    this.moving = false;
    this.movingHermite = false;
};

ReplayCamera.prototype.resetPosition = function() {
    this.position.copy(this.resetElements.position);
    this.target.copy(this.resetElements.target);
    this.anglesFromVectors();
};

ReplayCamera.prototype.vectorsFromAngles = function() {
    // Update direction
    this.forward.y = Math.sin(this.phi);

    var cos = Math.cos(this.phi);
    this.forward.z = cos * Math.cos(this.theta);
    this.forward.x = cos * Math.sin(this.theta);
    this.forward.normalize();

};

ReplayCamera.prototype.anglesFromVectors = function() {
    // Update phi and theta so that return to reality does not hurt
    var forward = Tools.diff(this.target, this.position);
    forward.normalize();

    this.phi = Math.asin(forward.y);

    // Don't know why this line works... But thanks Thierry-san and
    // Bastien because it seems to work...
    this.theta = Math.atan2(forward.x, forward.z);
};

ReplayCamera.prototype.move = function(otherCamera) {
    this.moving = true;
    this.old_target =   this.target.clone();
    this.old_position = this.position.clone();
    this.new_target =   new THREE.Vector3(otherCamera.target.x, otherCamera.target.y, otherCamera.target.z);
    this.new_position = new THREE.Vector3(otherCamera.position.x, otherCamera.position.y, otherCamera.position.z);
    this.t = 0;

};

ReplayCamera.prototype.moveHermite = function(otherCamera) {
    this.movingHermite = true;
    this.t = 0;

    this.hermitePosition = new Hermite.special.Polynom(
        this.position.clone(),
        otherCamera.position.clone(),
        Tools.mul(Tools.diff(otherCamera.target, otherCamera.position).normalize(),4)
    );

    this.hermiteAngles = new Hermite.special.Polynom(
        Tools.diff(this.target, this.position),
        Tools.diff(otherCamera.target, otherCamera.position),
        new THREE.Vector3()
    );
};

ReplayCamera.prototype.save = function() {};
