import pg = require('pg');
import pgc = require('../../private');
import Log = require('../../lib/log');
import async = require('async');

function predicate(line : any) {

    return function(elt : any) {

        return (
            (elt.recommendationStyle !== null && (elt.recommendationStyle.trim() === line.recommendationStyle.trim())) ||
                line.sceneId === elt.sceneId
        );

    }

}

module DBReq {

    /**
     * Class that creates an experiment
     */
    export class ExpCreator {

        /** callback to call on finalResult */
        finishAction : (expId : number, coinCombinationId : number, sceneId : number, recoStyle : string, coins : number[]) => void;

        /** id of the user */
        userId : number;

        /** list of the previous experiments */
        experiments : any[];

        /** final result */
        finalResult : any;

        /** client connectioni to database */
        client : pg.Client;

        /** release function */
        release : () => void;

        /** time at beginning of SQL requests */
        startTime : number;

        /**
         * @param userId {Number} id of the user that does the experiment
         * @param experiments {Object[]} array of objects representing the experiments
         * that the user has already done <code>{sceneId: Number, recommendationStyle: string, coins Number[]}</code>
         * @param finishAction {function} callback that has as parameters
         * <ol>
         *  <li>the id of the experiment (Number)</li>
         *  <li>the id of the coin combination (Number)</li>
         *  <li>the id of the scene (Number)</li>
         *  <li>the recommendation style (string)</li>
         *  <li>the coins (Number[])</li>
         * </ol>
         * @private
         */
        constructor(userId : number, experiments : any[], finishAction = (a:any) => {}) {
            this.finishAction = finishAction;
            this.userId = userId;
            this.experiments = experiments;
            this.finalResult = {}

            // Connect to db
            pg.connect(pgc.url, (err : Error, client : pg.Client, release : () => void) => {

                this.client = client;
                this.release = release;

                this.startTime = Date.now();

                // Start transaction and lock table
                this.client.query("BEGIN; LOCK CoinCombination IN SHARE ROW EXCLUSIVE MODE; LOCK Experiment IN SHARE ROW EXCLUSIVE MODE;", [], () => {
                    this.execute();
                });
            });
        }


        /**
         * Executes the SQL request and calls the callback
         */
        // Abandon all hope ye who enter here
        execute() {
            this.client.query(
                "SELECT DISTINCT \n" +
                    "    RecommendationStyle.name AS \"recommendationStyle\", \n" +
                    "    CoinCombination.scene_id AS \"sceneId\", \n" +
                    "    CoinCombination.id, \n" +
                    "    coin_1 AS coin1, \n" +
                    "    coin_2 AS coin2, \n" +
                    "    coin_3 AS coin3, \n" +
                    "    coin_4 AS coin4, \n" +
                    "    coin_5 AS coin5, \n" +
                    "    coin_6 AS coin6, \n" +
                    "    coin_7 AS coin7, \n" +
                    "    coin_8 AS coin8\n" +
                    "FROM CoinCombination, Experiment, Users U, Users Other, RecommendationStyle, Scene\n" +
                    "WHERE\n" +
                    "    Scene.id = CoinCombination.scene_id AND\n" +
                    "    Scene.name != 'peachcastle' AND\n" +
                    "    CoinCombination.id = Experiment.coin_combination_id AND\n" +
                    "    Other.id = Experiment.user_id AND\n" +
                    "    Experiment.finished = true AND\n" +
                    "    Other.rating = U.rating AND\n" +
                    "    Other.id != U.id AND\n" +
                    "    U.id = $1 \n" +
                    "EXCEPT \n" +
                    "SELECT DISTINCT \n" +
                    "    Experiment.recommendation_style AS \"recommendationStyle\", \n" +
                    "    CoinCombination.scene_id AS \"sceneId\", \n" +
                    "    CoinCombination.id, \n" +
                    "    coin_1 AS coin1, \n" +
                    "    coin_2 AS coin2, \n" +
                    "    coin_3 AS coin3, \n" +
                    "    coin_4 AS coin4, \n" +
                    "    coin_5 AS coin5, \n" +
                    "    coin_6 AS coin6, \n" +
                    "    coin_7 AS coin7, \n" +
                    "    coin_8 AS coin8\n" +
                    "FROM CoinCombination, Experiment\n" +
                    "WHERE\n" +
                    "   CoinCombination.id = Experiment.coin_combination_id;",
                [this.userId],
                (err : Error, result : pg.QueryResult) => {
                    if (err !== null) {
                        Log.dberror(err + ' in ExpCreator first request');
                    }

                    var line : any, found = false;

                    while ((line = result.rows.shift()) !== undefined) {

                        if (line === undefined) {

                            break;

                        }

                        // Look for an experiment impossible
                        var elt = this.experiments.find(predicate(line));

                        // Line is a valid experiment
                        if (elt === undefined) {

                            found = true;
                            break;

                        }

                    }

                    if (found) {
                        // Set the result
                        this.finalResult.coinCombinationId = line.id;
                        this.finalResult.sceneId = line.sceneId;
                        this.finalResult.recommendationStyle = line.recommendationStyle;
                        this.finalResult.coins = [
                            line.coin1,
                            line.coin2,
                            line.coin3,
                            line.coin4,
                            line.coin5,
                            line.coin6,
                            line.coin7,
                            line.coin8
                        ];

                        // There is a suggested experiment : create it
                        this.client.query(
                            "INSERT INTO Experiment(user_id, coin_combination_id, recommendation_style)\n" +
                                "VALUES($1,$2,$3)\n" +
                                "RETURNING id",
                            [this.userId, line.id, line.recommendationStyle],
                            (err : Error, result : pg.QueryResult) => {
                                if (err !== null) {
                                    Log.dberror(err + ' in ExpCreator second request (with suggested experiment)');
                                }
                                this.finalResult.expId = result.rows[0].id;
                                this.finish();
                            }
                        );


                    } else {
                        // Find the scene / recommendation style for the new experiment
                        this.client.query(
                            "SELECT RecommendationStyle.name, Scene.id AS \"sceneId\"\n" +
                                "FROM RecommendationStyle, Scene\n" +
                                "WHERE\n" +
                                "    Scene.name != 'peachcastle' AND \n" +
                                "    RecommendationStyle.name NOT IN(\n" +
                                "        SELECT DISTINCT Experiment.recommendation_style AS name\n" +
                                "        FROM Experiment\n" +
                                "        WHERE Experiment.user_id = $1\n" +
                                "        AND Experiment.recommendation_style != ''\n" +
                                "    ) AND\n" +
                                "    Scene.id NOT IN(\n" +
                                "        SELECT DISTINCT CoinCombination.scene_id AS id\n" +
                                "        FROM Experiment, CoinCombination\n" +
                                "        WHERE\n" +
                                "            Experiment.coin_combination_id = CoinCombination.id AND\n" +
                                "            user_id = $1\n" +
                                "    ) \n" +
                                "\n" +
                                "ORDER BY RANDOM()\n" +
                                "LIMIT 1;",
                            [this.userId],
                            (err : Error, result : pg.QueryResult) => {
                                if (err !== null) {
                                    Log.dberror(err + ' in ExpCreator second request (without suggested experiment');
                                }
                                if (result.rows.length > 0) {
                                    this.finalResult.sceneId = result.rows[0].sceneId;
                                    this.finalResult.recommendationStyle = result.rows[0].name;

                                    // Generate random coins
                                    this.client.query(
                                        "SELECT generate_series AS id\n" +
                                            "FROM Scene, generate_series(0,Scene.coin_number-1)\n" +
                                            "WHERE Scene.id = $1\n" +
                                            "ORDER BY RANDOM()\n" +
                                            "LIMIT 8;",
                                        [this.finalResult.sceneId],
                                        (err : Error, result : pg.QueryResult) => {
                                            if (err !== null) {
                                                Log.dberror(err + ' in ExpCreator third request (without suggested experiment');
                                            }
                                            this.finalResult.coins = [];
                                            for (var i = 0; i < 8; i++) {
                                                this.finalResult.coins.push(result.rows[i].id);
                                            }

                                            // And then, create the CoinCombination
                                            this.client.query(
                                                "INSERT INTO CoinCombination(scene_id, coin_1, coin_2, coin_3, coin_4, coin_5, coin_6, coin_7, coin_8)\n" +
                                                    "VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)\n" +
                                                    "RETURNING id;",
                                                [
                                                    this.finalResult.sceneId,
                                                    this.finalResult.coins[0],
                                                    this.finalResult.coins[1],
                                                    this.finalResult.coins[2],
                                                    this.finalResult.coins[3],
                                                    this.finalResult.coins[4],
                                                    this.finalResult.coins[5],
                                                    this.finalResult.coins[6],
                                                    this.finalResult.coins[7],
                                                ],
                                                (err : Error, result : pg.QueryResult) => {
                                                    if (err !== null) {
                                                        Log.dberror(err + ' in ExpCreator fourth request (without suggested experiment');
                                                    }
                                                    this.finalResult.coinCombinationId = result.rows[0].id;

                                                    // And create the experiment
                                                    this.client.query(
                                                        "INSERT INTO Experiment(user_id, coin_combination_id, recommendation_style)\n" +
                                                            "VALUES($1,$2,$3)\n" +
                                                            "RETURNING id;",
                                                        [this.userId, this.finalResult.coinCombinationId, this.finalResult.recommendationStyle],
                                                        (err, result) => {
                                                            if (err !== null) {
                                                                Log.dberror(err + ' in ExpCreator fifth request (without suggested experiment');
                                                            }
                                                            this.finalResult.expId = result.rows[0].id;
                                                            this.finish();
                                                        }
                                                    );
                                                }
                                            );
                                        }
                                    );
                                } else {
                                    this.finish();
                                }
                            }
                        );
                    }
                }
            );
        }

        /**
         * Release the DB connection and call the callback
         */
        finish() {

            this.finishAction(
                this.finalResult.expId,
                this.finalResult.coinCombinationId,
                this.finalResult.sceneId,
                this.finalResult.recommendationStyle,
                this.finalResult.coins
            );

            // Commit, and then release
            this.client.query("COMMIT;", () => {

                Log.debug('Exp creation took ' + (Date.now() - this.startTime) + ' ms', true);

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
            });
        }

    }

}

export = DBReq;
