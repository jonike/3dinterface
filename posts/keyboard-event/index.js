var pg = require('pg');
var secret = require('../../private');

module.exports.index = function(req, res) {

    pg.connect(secret.url, function(err, client, release) {
        client.query(
            "INSERT INTO keyboardevent(exp_id, camera, time)" +
            "VALUES($1, ROW(ROW($2,$3,$4),ROW($5,$6,$7)), to_timestamp($8));" ,
            [
                req.session.exp_id,
                req.body.camera.position.x,
                req.body.camera.position.y,
                req.body.camera.position.z,

                req.body.camera.target.x,
                req.body.camera.target.y,
                req.body.camera.target.z,

                req.body.time
            ],
            function(err, result) {
                release();
            }
        );
    });

    res.setHeader('Content-Type', 'text/html');
    res.send("")
}
