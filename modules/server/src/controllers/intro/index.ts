import express = require('express');

export function index(req : express.Request, res : express.Response, render : Function) {

    req.session.workerId = req.params.workerId;
    req.session.save();

    res.setHeader('Content-Type', 'text/html');
    render('index.pug');
};

