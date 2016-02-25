import pg = require('pg');

import pgc = require('../../private');
import Log = require('../../lib/log');

module DBReq {

    /**
     * Class that checks if a workerId exists
     */
    export class UserNameChecker {

        name : string;
        finishAction : (a : any) => void;
        client : pg.Client;
        release : () => void;
        finalResult : any;

        /**
         * @param id workerId of to test
         * @param finishAction callback that has as a parameter which is a
         * boolean indicating wether the user id exists or not
         * @private
         */
        constructor(name : string, finishAction = (a : any) => {}) {
            this.name = name;
            this.finishAction = finishAction;
            pg.connect(pgc.url, function(err, client, release) {
                if (err) {
                    Log.dberror(err + ' in UserNameChecker connection');
                    return;
                }
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
                "SELECT count(id) > 0 AS answer FROM users WHERE worker_id = $1",
                [this.name],
                (err : Error, result : pg.QueryResult) => {
                    if (err !== null) {
                        Log.dberror(err + ' in UserNameChecker');
                        return;
                    }
                    this.finalResult = result.rows[0].answer;
                    this.finish();
                }
            );

        }

        /**
         * Release the DB connection and call the callback
         */
        finish() {
            this.release();
            this.client = null;
            this.release = null;

            this.finishAction(this.finalResult);
        }

    }

}

export = DBReq;
