import express = require('express');
import db = require('../prototype/DBReq');
import vcode = require('../../lib/vcode');

export function index(req : express.Request, res : express.Response, render : Function) {

    // If not micro-worker
    if (req.session.workerId === undefined) {

        res.setHeader('Content-Type', 'text/html');
        render('normal.jade');
        return;

    }

    res.setHeader('Content-Type', 'text/html');
    render('vcode.jade');

}

