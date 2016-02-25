import pg = require('pg');

import pgc = require('../../private');

/**
 * Class that gets the info from all experiment
 */

module DBReq {

    export class ExpGetter {

        finishAction : (a:any) => void;

        client : pg.Client;
        release : () => void;

        finalResult : any;

        /**
         * @param finishAction callback that has as a parameter which is an
         * array of objects containing the id, the username, the name of the scene and
         * the id of the user.
         */
        constructor(finishAction : (a : any) => void) {
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
                "SELECT  " +
                    "experiment.id AS \"expId\", " +
                    "users.worker_id AS username, " +
                    "scene.name AS scenename, " +
                    "users.id AS \"userId\" " +
                    "FROM experiment, users, scene, CoinCombination " +
                    "WHERE experiment.user_id = users.id and scene.id = CoinCombination.scene_id AND " +
                    "      Experiment.coin_combination_id = CoinCombination.id " +
                    "ORDER BY experiment.id;",
                [],
                (err, result) => {
                    this.finalResult = result.rows;
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
