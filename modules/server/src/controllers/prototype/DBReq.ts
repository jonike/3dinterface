import { ExpCreator      } from './ExpCreator';
import { ExpGetter       } from './ExpGetter';
import { ExpIdChecker    } from './ExpIdChecker';
import { Info            } from './Info';
import { LastExpGetter   } from './LastExpGetter';
import { TutorialCreator } from './TutorialCreator';
import { UserCreator     } from './UserCreator';
import { UserGetter      } from './UserGetter';
import { UserIdChecker   } from './UserIdChecker';
import { UserNameChecker } from './UserNameChecker';
import { UserVerifier    } from './UserVerifier';

module DBReq {

    /**
     * Try to get a user by id, and creates it if it doesn't exists
     * @param id id to test
     * @param callback callback to call on the id
     */
    export function tryUser(id : number, callback : Function) {
        if (id !== undefined && id !== null) {
            new UserIdChecker(id, function(clear : boolean) {
                if (clear) {
                    callback(id);
                } else {
                    throw new Error('Couldn\'t create user');
                }
            });
        } else {
            throw new Error('Invalid parameters');
        }
    }

    /**
     * Loads every information from an experiment
     * (wraps the {@link Info} constructor)
     * @param id id of the experiment to load
     * @param finishAction callback on the result when loading is
     * finished
     */
    export function getInfo(id : number, finishAction : (a:any) => void) {
        new Info(id, finishAction);
    }

    /**
     * Creates an user
     * (wraps the {@link UserCreator} constructor)
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
     */
    export function createUser(workerId : string, age : string, male : boolean, rating : number, lastTime : number, finishAction : (a:any) => void ) {
        new UserCreator(workerId, age, male, rating, lastTime, finishAction);
    }

    /**
     * Creates an experiment
     * (wraps the {@link ExpCreator} constructor)
     * @param userId id of the user that does the experiment
     * @param experiments array of objects representing the experiments
     * that the user has already done <code>{sceneId: Number, recommendationStyle: string, coins Number[]}</code>
     * @param finishAction callback that has as parameters
     * <ol>
     *  <li>the id of the experiment</li>
     *  <li>the id of the coin combination</li>
     *  <li>the id of the scene</li>
     *  <li>the recommendation styleg</li>
     *  <li>the coins</li>
     * </ol>
     */
    export function createExp(userId : number, experiments : any[], finishAction : (a:any) => void) {
        new ExpCreator(userId, experiments, finishAction);
    }

    /**
     * Creates a tutorial
     * (wraps the {@link TurorialCreator} constructor)
     * @param id id of the user doing the tutorial
     * @param finishAction callback that has as parameters
     * <ol>
     *  <li>the id of the experiment</li>
     *  <li>the id of the generated coins (Number[])</li>
     * </ol>
     */
    export function createTutorial(id : number, finishAction : (expId : number, coins : number[]) => void) {
        new TutorialCreator(id, finishAction);
    }

    /**
     * Checks if an user id exists
     * (wraps the {@link UserIdChecker} constructor)
     * @param id id of the user to check
     * @param finishAction callback that has as a parameter which is a
     * boolean indicating wether the user id exists or not
     */
    export function checkUserId(id : number, finishAction : (a:any) => void) {
        new UserIdChecker(id, finishAction);
    }

    /**
     * Checks if a workerId exists
     * (wraps the {@link UserNameChecker} constructor)
     * @param id workerId of to test
     * @param finishAction callback that has as a parameter which is a
     * boolean indicating wether the user id exists or not
     */
    export function checkUserName(name : string, finishAction : (a:any) => void) {
        new UserNameChecker(name, finishAction);
    }

    /**
     * Checks if an experiment exists
     * (wraps the {@link ExpIdChecker} constructor)
     * @param id id of the experiment to check
     * @param finishAction callback that has as a parameter which is the
     * id of the scene if the experiment exists, or null otherwise
     */
    export function checkExpId(id : number, finishAction : (a:any) => void) {
        new ExpIdChecker(id, finishAction);
    }

    /**
     * Gets the info from all experiment
     * (wraps the {@link ExpGetter} constructor)
     * @param finishAction callback that has as a parameter which is an
     * array of objects containing the id, the username, the name of the scene and
     * the id of the user.
     */
    export function getAllExps(finishAction : (a:any) => void) {
        new ExpGetter(finishAction);
    }

    /**
     * Gives access to the last not finished experiment
     * (wraps the {@link LastExpGetter} constructor)
     * @param id id of the user of who you want the last experiment
     * @param finishAction callback that has as parameters
     * <ol>
     *  <li>the id of the experiment</li>
     *  <li>the id of the coin combination</li>
     *  <li>the id of the scene</li>
     *  <li>the recommendation styleg</li>
     *  <li>the coins (Number[])</li>
     * </ol>xperiment exists, or null otherwise
     */
    export function getLastExp(userId : number, finishAction : (expId : number, coinCombinationId : number, sceneId : number, recommendationStyle : string, coins : number[]) => void) {
        new LastExpGetter(userId, finishAction);
    }

    /**
     * Verifies that a user has correctly done all the experiments
     * (wraps the {@link UserVerifier} constructor)
     * @param userId id of the user to verify
     * @param finishAction callback that has as parameter a boolean
     * which is true is the verification was a success
     */
    export function verifyUser(id : number, finishAction : (a:boolean) => void) {
        new UserVerifier(id, finishAction);
    }

    /**
     * Gets the "valid" attribute of a user in the databse
     * (wraps the {@link UserGetter} constructor)
     * @param userId id of the user
     * @param finishAction callback that has as parameters :
     * <ol>
     *  <li>the workerId of the userg</li>
     *  <li>the "valid" attribute of the database</li>
     * </ol>
     */
    export function getUser(userId : number, finishAction : (workerId : string, valid : boolean) => void) {
        new UserGetter(userId, finishAction);
    }

}

export = DBReq;
