import express = require('express');

export function index(req : express.Request, res : express.Response, render : Function) {

    res.setHeader('Content-Type', 'text/html');
    render('index.jade');

}

