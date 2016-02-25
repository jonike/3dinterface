import _ = require('socket.io');
import * as geo from '../geo/Geo';

import fs = require('fs');
import log = require('./log');

export = function(io : SocketIO.Server) {

    io.on('connection', function(socket : SocketIO.Socket) {

        log.socket.connection(socket);

        socket.on('disconnect', function() {
            log.socket.disconnect(socket);
        });

        var streamer = new geo.MeshStreamer();

        streamer.start(socket);

    });

};
