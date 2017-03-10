import _ = require('socket.io');
import * as geo from '../geo/Geo';

import fs = require('fs');
import log = require('./log');

export = function(io : SocketIO.Server) {

    io.on('connection', function(socket : SocketIO.Socket) {

        let isTest = socket.handshake.query.isTest === "1";

        log.socket.connection(socket, isTest);

        socket.on('disconnect', function() {
            log.socket.disconnect(socket, isTest);
        });

        var streamer = isTest ? new geo.MeshStreamerTest() : new geo.MeshStreamer();

        streamer.start(socket);

    });

};
