var fs = require('fs');
var geo = require('./lib/geo.min.js');

module.exports = function(io) {
    io.on('connection', function(socket) {

        var streamer = new geo.MeshStreamer();

        streamer.start(socket);

    });
}
