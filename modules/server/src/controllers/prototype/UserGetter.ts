import pg = require('pg');

import pgc = require('../../private');

module DBReq {

    /**
     * Class that gets the "valid" attribute of a user in the databse
     */
    export class UserGetter {

        userId : number;
        finishAction : (workerId : string, valid : boolean) => void;
        client : pg.Client;
        release : () => void;

        /**
         * @param userId {Number} id of the user
         * @param finishAction {function} callback that has as parameters :
         * <ol>
         *  <li>the workerId of the user (string)</li>
         *  <li>the "valid" attribute of the database (boolean)</li>
         * </ol>
         * @private
         */
        constructor(userId : number, finishAction : (workerId : string, valid : boolean) => void) {
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
                'SELECT worker_id AS "workerId", valid FROM Users WHERE id = $1',
                [this.userId],
                (err, result) => {
                    this.finish(result.rows[0].workerId, result.rows[0].valid);
                }
            );
        }

        /**
         * Release the DB connection and call the callback
         */
        finish(workerId : string, valid : boolean) {

            this.release();
            this.release = null;
            this.client = null;

            this.finishAction(workerId, valid);

        }

    }

}

export = DBReq;
