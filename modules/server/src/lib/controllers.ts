/**
 * Module dependencies.
 */

import express = require('express');
import fs = require('fs');

import log = require('./log');

function main(app : express.Application) : void {

    log.debug("Loading controllers :");

    fs.readdirSync(__dirname + '/../controllers').forEach(function(name){

        // index.js in controller, with function as pages (views.py for django)
        var obj = require('./../controllers/' + name + '/index');

        // urls.js, just like django urls.py
        var urls = require('./../controllers/' + name + '/urls');
        name = obj.name || name;

        // allow specifying the view engine
        if (obj.engine) app.set('view engine', obj.engine);
        // app.set('views', __dirname + '/../controllers/' + name + '/views');

        // generate routes based
        // on the exported methods

        log.debug('   ' + name + ':');

        for (let key in urls) {

            app.get(key, ((key : string) => function(req : express.Request, res : express.Response, next : Function) {

                var path = obj[urls[key]](req, res, function(view : string) {
                    res.render(
                        __dirname +
                        '/../controllers/' +
                        name + '/views/' +
                        view,
                        res.locals,
                        function(err : Error, out : string) {
                            if (err !== null) {
                                log.jadeerror(err);
                            }
                            res.send(out);
                        }
                    );

                }, next);

            })(key));

            log.debug('      ' + key + ' -> ' + name + '.' + urls[key]);
        }

        log.debug();

        // mount the app
        // parent.use(app);

    });

}

export = main;
