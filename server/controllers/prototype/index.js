var tools = require('../../lib/filterInt');
var pg = require('pg');
var pgc = require('../../private');
var db = require('./dbrequests');

module.exports.index = function(req, res) {
    res.setHeader('Content-Type', 'text/html');

    res.render('index.jade', res.locals, function(err, result) {
        res.send(result);
    });
};

var sceneToFunction = function(scene) {
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

module.exports.game = function(req, res) {

    req.session.experiments = req.session.experiments || [];
    req.session.save();

    db.checkUserId(req.session.userId, function(ok) {

        if (ok) {

            db.createExp(
                req.session.userId,
                req.session.experiments,
                function(expId, sceneId, coinCombinationId, recommendationStyle, coins) {

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

module.exports.play = function(req, res) {

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

module.exports.sponza = function(req, res) {
    res.setHeader('Content-Type', 'text/html');

    res.render('sponza.jade', res.locals, function(err, result) {
        res.send(result);
    });
};

module.exports.replayInfo = function(req, res) {
    res.setHeader('Content-Type', 'text/plain');

    // Parse id
    var id = tools.filterInt(req.params.id);

    db.getInfo(id, function(results) {
        res.send(JSON.stringify(results));
    });
};

module.exports.replay = function(req, res, next) {
    // Get id parameter
    res.locals.id = tools.filterInt(req.params.id);

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
            res.locals.initjs = sceneToFunction(sceneId);
            res.setHeader('Content-Type', 'text/html');
            res.render('prototype_replays.jade', res.locals, function(err, result) {
                res.send(result);
            });
        }
    });
};

module.exports.replayIndex = function(req, res, next) {
    db.getAllExps(function(result) {
        res.locals.users = result;

        res.setHeader('Content-Type', 'text/html');
        res.render("replay_index.jade", res.locals, function(err, result) {
            res.send(result);
        });
    });
};

module.exports.tutorial = function(req, res) {

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

function editorHelper(templateName) {

    return function(req, res, next) {

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

module.exports.userstudy = function(req, res) {

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

module.exports.next = function(req, res) {
    res.redirect('/prototype/game');
};
