import pg = require('pg');

import pgc = require('../../private');

module DBReq {

    /**
     * Class that checks if an experiment exists
     */
    export class ExpIdChecker {

        id : number;
        finishAction : (a : any) => void;

        client : pg.Client;
        release : () => void;
        finalResult : any;

        /**
         * @param id id of the experiment to check
         * @param finishAction callback that has as a parameter which is the
         * id of the scene if the experiment exists, or null otherwise
         * @private
         */
        constructor(id : number, finishAction = (a : any) => {}) {
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
                "SELECT scene_id AS \"sceneId\" FROM experiment, CoinCombination WHERE CoinCombination.id = Experiment.coin_combination_id AND Experiment.id = $1;",
                [this.id],
                (err : Error, result : pg.QueryResult) => {
                    if (result === undefined || result.rows.length === 0) {
                        this.finalResult = null;
                    } else {
                        this.finalResult = result.rows[0].sceneId;
                    }
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
