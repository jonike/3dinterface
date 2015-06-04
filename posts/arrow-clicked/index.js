var pg = require('pg');
var secret = require('../../private');

module.exports.index = function(req, res) {

    pg.connect(secret.url, function(err, client, release) {
        client.query(
            "INSERT INTO arrowclicked(exp_id, arrow_id, time) VALUES($1,$2, to_timestamp($3));",
            [req.session.exp_id, req.body.arrow_id, req.body.time],
            function(err, result) {
                release();
            }
        );
    });

    res.setHeader('Content-Type', 'text/html');
}
