import pg = require('pg');

import pgc = require('../../private');
import Log = require('../../lib/log');

module DBReq {

    /**
     * Class that gives access to the last not finished experiment
     */
    export class LastExpGetter {

        userId : number;
        finishAction : (expId : number, coinCombinationId : number, sceneId : number, recommendationStyle : string, coins : number[]) => void;
        finalResult : any;

        client : pg.Client;
        release : () => void;

        /**
         * @param id id of the user of who you want the last experiment
         * @param finishAction callback that has as parameters
         * <ol>
         *  <li>the id of the experiment</li>
         *  <li>the id of the coin combination</li>
         *  <li>the id of the scene</li>
         *  <li>the recommendation style</li>
         *  <li>the coins</li>
         * </ol>
         * @private
         */
        constructor(userId : number, finishAction : (expId : number, coinCombinationId : number, sceneId : number, recommendationStyle : string, coins : number[]) => void) {

            this.userId = userId;
            this.finishAction = finishAction;
            this.finalResult = {}

            if (this.userId === undefined) {
                return;
            }

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
                'SELECT scene_id AS "sceneId", \n' +
                    '       coin_1, \n' +
                    '       coin_2, \n' +
                    '       coin_3, \n' +
                    '       coin_4, \n' +
                    '       coin_5, \n' +
                    '       coin_6, \n' +
                    '       coin_7, \n' +
                    '       coin_8, \n' +
                    '       Experiment.recommendation_style AS "recommendationStyle", \n' +
                    '       Experiment.id AS "expId", \n' +
                    '       CoinCombination.id as "coinCombinationId" \n' +
                    'FROM Experiment, CoinCombination \n' +
                    'WHERE Experiment.coin_combination_id = CoinCombination.id \n' +
                    '      AND Experiment.user_id = $1 \n' +
                    '      AND NOT Experiment.finished \n' +
                    'ORDER BY Experiment.id DESC \n' +
                    'LIMIT 1;',
                [this.userId],
                (err, result) => {

                    if (err !== null) {
                        Log.dberror(err + ' in LastExpGetter (DBReq)');
                    }

                    if (result.rows.length === 0) {
                        Log.debug('Timeout', true);
                        setTimeout(function() {
                            this.execute();
                        }, 1000);
                        return;
                    }

                    this.client.query(
                        'UPDATE Experiment SET finished = true WHERE id = $1',
                        [result.rows[0].expId],
                        () => {
                            this.finalResult.sceneId = result.rows[0].sceneId;
                            this.finalResult.recommendationStyle = result.rows[0].recommendationStyle;
                            this.finalResult.coins = [
                                result.rows[0].coin_1,
                                result.rows[0].coin_2,
                                result.rows[0].coin_3,
                                result.rows[0].coin_4,
                                result.rows[0].coin_5,
                                result.rows[0].coin_6,
                                result.rows[0].coin_7,
                                result.rows[0].coin_8
                            ];
                            this.finalResult.coinCombinationId = result.rows[0].coinCombinationId;
                            this.finalResult.expId = result.rows[0].expId;
                            this.finish();

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
            this.client = null;
            this.release = null;

            this.finishAction(
                this.finalResult.expId,
                this.finalResult.sceneId,
                this.finalResult.coinCombinationId,
                this.finalResult.recommendationStyle,
                this.finalResult.coins
            );
        }
    }

}

export = DBReq;
