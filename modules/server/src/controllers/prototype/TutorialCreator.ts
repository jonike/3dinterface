import pg = require('pg');

import pgc = require('../../private');

module DBReq {

    /**
     * Class that creates a tutorial
     */
    export class TutorialCreator {

        id : number;
        finishAction : (expId : number, coins : number[]) => void;
        client : pg.Client;
        release : () => void;
        finalResult : {expId : number, coins : number[]};

        /**
         * @param id id of the user doing the tutorial
         * @param finishAction  callback that has as parameters
         * <ol>
         *  <li>the id of the experiment</li>
         *  <li>the id of the generated coins</li>
         * </ol>
         * @private
         */
        constructor(id : number, finishAction : (expId : number, coins : number[]) => void) {
            this.id = id;
            this.finishAction = finishAction;
            this.finalResult = {expId : null, coins : []}

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
                // Generate random coins
                "SELECT Scene.id AS \"sceneId\", generate_series AS id\n" +
                    "FROM Scene, generate_series(0,Scene.coin_number-1)\n" +
                    "WHERE Scene.name = 'peachcastle'\n" +
                    "ORDER BY RANDOM()\n" +
                    "LIMIT 8;",
                [],
                (err, result) => {
                    for (var i = 0; i < 8; i++) {
                        this.finalResult.coins.push(result.rows[i].id);
                    }
                    // Create CoinCombination
                    this.client.query(
                        "INSERT INTO CoinCombination(scene_id, coin_1, coin_2, coin_3, coin_4, coin_5, coin_6, coin_7, coin_8)\n" +
                            "VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)\n" +
                            "RETURNING id;",
                        [
                            result.rows[0].sceneId,
                            result.rows[0].id,
                            result.rows[1].id,
                            result.rows[2].id,
                            result.rows[3].id,
                            result.rows[4].id,
                            result.rows[5].id,
                            result.rows[6].id,
                            result.rows[7].id
                        ],
                        (err, result) => {
                            // Create experiment
                            this.client.query(
                                "INSERT INTO Experiment(user_id, coin_combination_id, finished)\n" +
                                    "VALUES($1,$2, true)\n" +
                                    "RETURNING id;",
                                [this.id, result.rows[0].id],
                                function(err, result) {
                                    this.finalResult.expId = result.rows[0].id;
                                    this.finish();
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
        finish() {
            this.release();
            this.release = null;
            this.client = null;

            this.finishAction(this.finalResult.expId, this.finalResult.coins);
        }

    }

}

export = DBReq;
