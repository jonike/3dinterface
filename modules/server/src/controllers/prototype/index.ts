import express = require('express');
import pg = require('pg');
import pgc = require('../../private');
import db = require('./DBReq');

import { filterInt } from 'mth';
import * as config from 'config';

export function index(req : express.Request, res : express.Response) {
    res.setHeader('Content-Type', 'text/html');

    res.render('index.jade', res.locals, function(err, result) {
        res.send(result);
    });
};

function sceneToFunction(scene : number) : string {
    switch (scene) {
        case 2:
            return 'BobombScene';
        case 3:
            return 'MountainScene';
        case 4:
            return 'WhompScene';
        default:
            return 'PeachScene';
    }
};

export function game(req : express.Request, res : express.Response) {

    req.session.experiments = req.session.experiments || [];
    req.session.save();

    db.checkUserId(req.session.userId, function(ok : boolean) {

        if (ok) {

            db.createExp(
                req.session.userId,
                req.session.experiments,
                function() {

                    // if (expId === undefined) {

                    //     req.session.finished = true;
                    //     req.session.save();
                    //     return;

                    // }

                    // req.session.expId = expId;
                    // req.session.save();

                    // res.locals.scene = sceneToFunction(sceneId);
                    // res.locals.recommendationStyle = recommendationStyle;
                    // res.locals.coins = coins;

                    // res.setHeader('Content-Type','text/html');
                    // res.send("Ok");

                });

        } else {


        }

    });
};

export function play(req : express.Request, res : express.Response) {

    req.session.counter = req.session.counter === undefined ? 0 : req.session.counter + 1;
    req.session.save();

    if (req.session.counter > 2) {

        res.redirect('/feedback');
        return;

    }

    req.session.experiments = req.session.experiments || [];

    db.getLastExp(req.session.userId, function(expId, sceneId, coinId, recoStyle, coins) {

        // if (coinId === undefined) {
        //     console.log("=== ERROR : COIN_ID IS UNDEFINED ===");
        //     process.exit(-1)
        // }

        res.locals.scene = sceneToFunction(sceneId);
        res.locals.recommendationStyle = recoStyle;
        res.locals.coins = coins;

        // var elt = req.session.experiments.find(function(elt) {
        //     return elt.coinCombinationId === coinId;
        // });

        // if (elt !== undefined) {
        //     console.log("=== ERROR DETECTED === user " + req.session.userId);
        //     console.log(req.session.experiments);
        //     console.log(coinId);
        //     process.exit(-1)
        // }

        req.session.experiments.push({
            sceneId: sceneId,
            recommendationStyle: recoStyle,
            coinCombinationId : coinId
        });

        req.session.expId = expId;
        req.session.save();

        res.locals.lowRes = true;

        // Prepare next experiment
        module.exports.game(req, null);

        res.setHeader('Content-Type', 'text/html');
        res.render('prototype_recommendation.jade', res.locals, function(err, result) {
            res.send(result);
        });
    });

};

export function sponza(req : express.Request, res : express.Response) {
    res.setHeader('Content-Type', 'text/html');

    res.render('sponza.jade', res.locals, function(err, result) {
        res.send(result);
    });
};

export function replayInfo(req : express.Request, res : express.Response) {
    res.setHeader('Content-Type', 'text/plain');

    // Parse id
    var id = filterInt(req.params.id);

    db.getInfo(id, function(results) {
        res.send(JSON.stringify(results));
    });
};

export function replay(req : express.Request, res : express.Response, render : Function, next:Function) {
    // Get id parameter
    res.locals.id = filterInt(req.params.id);

    if (res.locals.id <= 0) {
        var err = new Error("This replay does not exist");
        err.status = 404;
        next(err);
        return;
    }

    db.checkExpId(res.locals.id, function(sceneId) {

        if (sceneId === null) {

            var err = new Error("This replay does not exist");
            err.status = 404;
            next(err);

        } else {

            let scene : config.Scene;
            let recommendationStyle : config.RecommendationStyle;
            let coinConfig : config.CoinConfig = { type : config.ConfigType.None };

            switch (sceneId) {
                case 1: scene = config.Scene.PeachCastle;       break;
                case 2: scene = config.Scene.BobombBattlefield; break;
                case 3: scene = config.Scene.CoolCoolMountain;  break;
                case 4: scene = config.Scene.WhompFortress;     break;
                case 5: scene = config.Scene.Sponza;            break;
            }

            recommendationStyle = config.RecommendationStyle.BaseRecommendation;

            let conf : config.ExpConfig = {
                scene : scene,
                coinConfig : coinConfig,
                recommendationStyle : recommendationStyle
            };

            let loadingConf : config.LoadingConfig = {
                lowRes : true,
                prefetchingPolicy : config.PrefetchingPolicy.NV_PN
            };

            res.locals.config = JSON.stringify(conf);
            res.locals.loadingConf = JSON.stringify(loadingConf);

            render('prototype_replays.jade');
        }
    });
};

export function replayIndex(req : express.Request, res : express.Response, render : Function) {
    db.getAllExps(function(result) {
        res.locals.users = result;

        res.setHeader('Content-Type', 'text/html');
        render('replay_index.jade');
    });
};

export function tutorial(req : express.Request, res : express.Response) {

    if (req.session.tutorialDone) {

        res.redirect('/before-begin');
        return;

    }

    db.checkUserId(req.session.userId, function(ok) {

        if (ok) {

            // 1 is the ID of peach scene
            db.createTutorial(req.session.userId, function(id, coins) {

                // Generate next experiment
                module.exports.game(req, null);

                req.session.tutorialDone = true;
                req.session.expId = id;
                res.locals.coins = coins;
                req.session.save();

                res.setHeader('Content-Type', 'text/html');
                res.render('tutorial.jade', res.locals, function(err, result) {
                    res.send(result);
                });
            });

        } else {

            res.redirect('/');

        }

    });

};

function editorHelper(templateName : string) {

    return function(req : express.Request, res : express.Response, next : Function) {

        var scene = req.params.scene;

        switch (scene) {

            case 'peach':            res.locals.scene = "PeachScene";    break;
            case 'coolcoolmountain': res.locals.scene = "MountainScene"; break;
            case 'whomp':            res.locals.scene = "WhompScene";    break;
            case 'bobomb':           res.locals.scene = "BobombScene";   break;
            default:
                // 404
                var err = new Error('Incorrect scene');
                err.status = 404;
                next(err);
                break;

        }

        res.setHeader('Content-Type', 'text/html');
        res.render(templateName, res.locals, function(err, result) {
            res.send(result);
        });

    };

}

module.exports.clicker = editorHelper('prototype_clicker.jade');
module.exports.viewer = editorHelper('prototype_viewer.jade');
module.exports.checker = editorHelper('prototype_checker.jade');

export function userstudy(req : express.Request, res : express.Response) {

    if (req.session.userId !== undefined) {

        res.redirect('/prototype/tutorial');
        return;

    }

    res.locals.identificationFailed = req.session.identificationFailed;
    req.session.identificationFailed = false;
    req.session.save();

    res.locals.workerId = req.session.workerId;

    res.setHeader('Content-Type', 'text/html');
    res.render('user_study.jade', res.locals, function(err, result) {
        res.send(result);
    });

};

export function next(req : express.Request, res : express.Response) {
    res.redirect('/prototype/game');
};
