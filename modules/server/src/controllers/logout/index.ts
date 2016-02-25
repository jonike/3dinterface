import express = require('express');

export function index(req : express.Request, res : express.Response, render : Function) {

    req.session = null;
    res.locals.session = null;
    res.redirect('/');

};
