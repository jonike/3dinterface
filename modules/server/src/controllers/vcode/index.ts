import express = require('express');
import db = require('../prototype/DBReq');
import vcode = require('../../lib/vcode');

export function index(req : express.Request, res : express.Response, render : Function) {

    // If not micro-worker
    if (req.session.workerId === undefined) {

        res.setHeader('Content-Type', 'text/html');
        res.send(null);
        return;

    }

    // Else, check that exp was correctly done
    db.getUser(req.session.userId, function(workerId : string, ok : boolean) {

        res.setHeader('Content-Type', 'text/html');

        if (ok === true) {

            var code = vcode(req.session.workerId);
            res.send(code);

        } else if (ok === false) {

            res.send('no vcode');

        } else {

            res.send('not ready');

        }

    });

}

