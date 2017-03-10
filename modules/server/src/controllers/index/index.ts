import express = require('express');

export function index(req : express.Request, res : express.Response, render : (view : string) => void) {

    res.setHeader('Content-Type', 'text/html');
    render('index.pug');

}
