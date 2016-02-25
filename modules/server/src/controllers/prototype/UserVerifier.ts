import pg = require('pg');

import pgc = require('../../private');
import Log = require('../../lib/log');

import async = require('async');

module DBReq {

    /**
     * Class that verifies that a user has correctly done all the experiments
     */
    export class UserVerifier {

        userId : number;
        finishAction : (a : boolean) => void;
        client : pg.Client;
        release : () => void;

        /**
         * @param userId {Number} id of the user to verify
         * @param finishAction {function} callback that has as parameter a boolean
         * which is true is the verification was a success
         * @private
         */
        constructor(userId : number, finishAction : (a : boolean) => void) {
            this.userId = userId;
            this.finishAction = finishAction;

            pg.connect(pgc.url, (err, client, release) => {
                this.client = client;
                this.release = release;

                this.execute();
            });
        }

        /**
         * Executes the SQL request and calls the callback
         */
        execute() {

            this.client.query(
                "SELECT id as \"expId\" FROM Experiment WHERE user_id = $1",
                [this.userId],
                (err, result) => {
                    if (result.rows.length !== 4) {
                        this.finish(false);
                    }

                    async.map(
                        result.rows,
                        (elt : any, callback : (a : any, b : boolean) => void ) => {
                            this.client.query(
                                "SELECT count(*) > 5 AS ok FROM CoinClicked WHERE exp_id = $1",
                                [elt.expId],
                                (err : Error, result : pg.QueryResult) => {
                                    callback(null, result.rows[0].ok === true);
                                }
                            );
                        },
                        (err : Error, result : any[]) => {
                            var ok = result.reduce(function(prev, next) { return prev && next; });
                            this.client.query(
                                "UPDATE Users SET valid = $1 WHERE id = $2",
                                [ok, this.userId],
                                (err : Error, result : pg.QueryResult) => {
                                    this.finish(ok);
                                }
                            );
                        }
                    );
                }
            );

        }

        /**
         * Release the DB connection and call the callback
         */
        finish(finalResult : any) {
            this.release();

            this.client = null;
            this.release = null;
            this.finishAction(finalResult);
        }

    }

}

export = DBReq;
