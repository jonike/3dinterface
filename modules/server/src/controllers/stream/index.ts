import express = require('express');
import { filterInt } from 'mth';

export function index(req : express.Request, res : express.Response, render : Function, next : Function) {

    // Parse get argument res
    res.locals.resolution = req.params.res;

    if (res.locals.resolution === undefined) {
        res.locals.resolution = 5;
    } else {
        res.locals.resolution = filterInt(res.locals.resolution);
    }

    if (isNaN(res.locals.resolution) || res.locals.resolution < 1 || res.locals.resolution > 25) {
        var error = new Error("Resolution was not set properly");
        error.status = 404;
        next(error);
        return;
    }

    res.setHeader('Content-Type', 'text/html');
    render('index.jade');

};
