import pg = require('pg');

// var pg = require('pg');
import pgc = require('../../private');
import Log = require('../../lib/log');
import async = require('async');

module DBReq {

    /**
     * Class that creates a user
     */
    export class UserCreator {

        /**
         * Callback to call on the id when the user is created
         */
        finishAction : (a : any) => void;

        /** Microworker's id of the worker */
        workerId : string;

        /** Age range (e.g. '20-25') */
        age : string;

        /** true if the user is a male, false otherwise */
        male : boolean;

        /** how the user rates its 3D navigation level (between 1 and 5) */
        rating : number;

        /** when is the last time the user played a 3D videogame */
        lastTime : number;

        /** client connection to pg database */
        client : pg.Client;

        /** release database function */
        release : () => void;

        /** the result on which the callback will be called */
        finalResult : any;

        /**
         * @param workerId the name of the person doing the experiment
         * @param age a string representing an age range
         * @param male indicates if the user is a man or a woman
         * @param rating between 1 and 5, describes the level of the user
         * @param lastTime between 0 and 3 such that
         * <ol start="0">
         *  <li>never played</li>
         *  <li>this year</li>
         *  <li>this month</li>
         *  <li>this week</li>
         * </ol>
         * @param finishAction callback that has as a parameter the id of
         * the new user
         * @private
         */
        constructor(workerId : string, age : string, male : boolean, rating : number, lastTime : number, finishAction = (a:any)=>{}) {

            this.finishAction = finishAction;

            this.workerId = workerId;
            this.age = age;
            this.male = male;
            this.rating = rating;
            this.lastTime = lastTime;

            // Connect to db
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
            this.client.query("BEGIN; LOCK Users IN SHARE ROW EXCLUSIVE MODE;", [], () => {
                this.client.query(
                    "INSERT INTO users(worker_id, age, male, rating, lasttime)  VALUES($1, $2, $3, $4, $5);",
                    [
                        this.workerId,
                        this.age,
                        this.male,
                        this.rating,
                        this.lastTime
                    ],
                    (err : Error, result : pg.QueryResult) => {
                        if (err !== null) {
                            Log.dberror(err + ' in UserCreator INSERT INTO');
                        }
                        this.client.query(
                            "SELECT max(id) FROM Users;",
                            [],
                            (err : Error, result : pg.QueryResult) => {
                                this.finalResult = result.rows[0].max;
                                this.finish();
                            }
                        );
                    }
                );
            });
        }

        /**
         * Release the DB connection and call the callback
         */
        finish() {

            this.client.query("COMMIT;", [], () =>  {

                this.release();
                this.client = null;
                this.release = null;

                this.finishAction(this.finalResult);

            });
        }

    }

}

export = DBReq;
