import pg = require('pg');

import pgc = require('../../private');
import Log = require('../../lib/log');

module DBReq {

    /**
     * Class that checks if an user id exists
     */
    export class UserIdChecker {

        id : number;
        finishAction : (a : any) => void;
        client : pg.Client;
        finalResult : any;
        release : () => void;

        /**
         * @param id id of the user to check
         * @param finishAction callback that has as a parameter indicating
         * wether the user id exists or not
         */
        constructor(id : number, finishAction : (a : boolean) => void) {
            this.id = id;
            this.finishAction = finishAction;

            pg.connect(pgc.url, (err : Error, client : pg.Client, release : () => void) => {
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
                "SELECT count(id) > 0 AS answer FROM users WHERE id = $1;",
                [this.id],
                (err : Error, result : pg.QueryResult) => {
                    if (err !== null) {
                        Log.dberror(err + ' in UserIdChecker');
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
