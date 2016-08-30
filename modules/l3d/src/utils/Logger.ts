import * as mth from 'mth';

import { PointerCamera } from '../cameras/PointerCamera';

module l3d {

    /**
     * Can be aassimilated to a camera with its position and target
     */
    export interface CameraItf {

        /** Center of the camera */
        position : mth.Vector3;
        /** Point where the camera is looking at */
        target : mth.Vector3;

    }

    export module DB {

        /**
         * If false, only forced requests will be sent
         */
        export var DB_DISABLED = typeof module === 'object';

        var enabled = typeof DB_DISABLED === 'undefined' ? true : !DB_DISABLED;

        /**
         * Sends an object to an url (use JSON)
         * @param url the url to send the request
         * @param data the data to send to the url
         * @param force if the DB is disabled, the message will only be sent if force is true
         */
        function sendData(url : string, data : any, force ? : boolean) {
            if (enabled || force) {
                // Append time to data
                data.time = Date.now() / 1000;

                var xhr = new XMLHttpRequest();
                xhr.open("POST", url, true);
                xhr.setRequestHeader("Content-type", "application/json;charset=UTF-8");

                // xhr.onreadystatechange = function() {
                //     if(xhr.readyState == 4 && xhr.status == 200) {
                //         console.log("Done : " + xhr.responseText);
                //     }
                // }

                xhr.send(JSON.stringify(data));
            }
        }

        /**
         * Enables the requests
         */
        export function enable() {
            enabled = true;
        }

        /**
         * Disables the requests
         */
        export function disable() {
            enabled = false;
        }

        /**
         * Check wether the logger is enabled
         * @returns true if the logger is enabled, false otherwise
         */
        export function isEnabled() : boolean {
            return enabled;
        }

        /**
         * Compacts a camera
         * @param camera a camera with a position and a target
         * @return an object containing a position and a target
         */
        function compactCamera(camera : CameraItf) : any {
            return {
                position: {
                    x: camera.position.x,
                    y: camera.position.y,
                    z: camera.position.z
                },
                target: {
                    x: camera.target.x,
                    y: camera.target.y,
                    z: camera.target.z
                }
            };
        }

        /**
         * Contains all the classes to log events into the DB. You must set the
         * attribute of the instance, and then call the <code>send</code> method
         * on them to send them.
         */
        export module Event {

            /**
             * An event when an arrow is clicked
             * @constructor
             */
            export class ArrowClicked {

                /**
                 * Id of the arrow
                 */
                arrowId : number;

                constructor() {}

                /**
                 * Sends the event to the correct url
                 */
                send() {
                    var url = "/posts/arrow-clicked";
                    var data = {arrowId: this.arrowId};
                    sendData(url, data);
                }

            }

            /**
             * An event when a coin is taken
             */
            export class CoinClicked {

                /**
                 * Id of the coin taken
                 */
                coinId : number;

                constructor() {}


                /**
                 * Sends the event to the correct url
                 */
                send() {
                    var url = "/posts/coin-clicked";
                    var data = {coinId: this.coinId};
                    sendData(url, data);
                };

            }

            /**
             * An event when the keyboard is touched
             */
            export class KeyboardEvent {

                /**
                 * A reference to the camera
                 */
                camera : PointerCamera;

                /**
                 * Indicates wether the key was pressed or released
                 */
                keypressed : boolean;

                /**
                 * The code of the key that was pressed (-1 represents mouse event)
                 */
                keycode : number;

                constructor() {}

                /**
                 * Sends the event to the correct url
                 */
                send() {
                    var url = "/posts/keyboard-event";

                    var data = {
                        camera: compactCamera(this.camera),
                        keycode: this.keycode, // -1 represents mouse event
                        keypressed: this.keypressed // mousepressed if keycode === -1
                    };

                    sendData(url, data);
                }

            }


            /**
             * An event when the reset button is clicked
             */
            export class ResetClicked {

                constructor() {}

                /**
                 * Sends the event to the correct url
                 */
                send() {
                    var url = "/posts/reset-clicked";
                    var data = {};
                    sendData(url, data);
                }

            }

            /**
             * An event when previous or next buttons are clicked
             */

            export class PreviousNextClicked {

                /**
                 * A reference to the camera
                 */
                camera : CameraItf;

                /**
                 * Indicates wether previous or next was clicked
                 */
                previous : boolean;

                constructor() {}

                /**
                 * Sends the event to the correct url
                 */
                send() {
                    var url = "/posts/previous-next-clicked";
                    var data = {
                        // casts previous to boolean
                        previous: this.previous,
                        camera: compactCamera(this.camera)
                    };

                    sendData(url, data);
                }

            }

            /**
             * An event when a recommendation is hovered
             * @constructor
             */
            export class Hovered {

                /**
                 * The id of the arrow hovered
                 */
                arrowId : number;

                /**
                 * true if the hover starts, false if finishes
                 */
                start : boolean;

                constructor() {}

                /**
                 * Sends the event to the correct url
                 */
                send() {
                    var url = "/posts/hovered";
                    var data = {
                        start: this.start,
                        arrowId: this.arrowId
                    };

                    sendData(url, data);
                }

            }

            /**
             * An event with the framerate of the client
             */
            export class Fps {

                /**
                 * the frame rate
                 */
                fps : number;

                /**
                 * Sends the event to the correct url
                 */
                send() {

                    var url = "/posts/fps";
                    var data = {
                        fps: this.fps
                    };

                    sendData(url, data);

                }

            }

            /**
             * An event when the pointer is locked
             */
            export class PointerLocked {

                /**
                 * True if the pointer is locked, false otherwise
                 */
                locked : boolean;


                /**
                 * Sends the event to the correct url
                 */
                send() {
                    var url = "/posts/pointer-locked";
                    var data = {
                        locked: this.locked
                    };

                    sendData(url, data);
                }

            }

            /**
             * An event when the pointer lock option is changed
             */
            export class SwitchedLockOption {

                /**
                 * True if the lock option is enabled, false otherwise
                 */
                locked : boolean;

                /**
                 * Sends the event to the correct url
                 */
                send() {
                    var url = "/posts/switched-lock-option";

                    var data = {
                        locked: this.locked
                    };

                    sendData(url, data);
                }

            }

        }

    }

}

export = l3d;
