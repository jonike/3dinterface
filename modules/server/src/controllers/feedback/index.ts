import express = require('express');
import db = require('../prototype/DBReq');

export function index(req : express.Request, res : express.Response, render : Function) {

    db.verifyUser(req.session.userId, function() {});

    res.setHeader('Content-Type', 'text/html');
    render('index.pug');

}

