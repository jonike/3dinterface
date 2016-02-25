module geo {

    export interface Vector {

        x : number;
        y : number;
        z : number;

    }


    /**
     * Reprensents anything that is sendable via {@link MeshStreamer}
     */
    export interface Sendable {

        /** Indicates wether the elements has already been sent or not **/
        sent : boolean;

        /** Converts the element to a list to stream */
        toList() : any[];

    }

    /**
     * Anything that can be considered as a camera
     */
    export interface CameraItf {

        /** The optical center of the camera */
        position : Vector;

        /** The point that the camera is facing*/
        target : Vector;
    }

    /** Represents the frustum of a camera */
    export interface Frustum extends CameraItf {

        /** Center of the frustum */
        position : Vector;

        /** Vector that the frustum is facing */
        target : Vector;

        /** Planes that delimitates the frustum */
        planes : Plane[];
    }

    /**
     * Represents the data that will be sent to the client
     */
    export interface Data {

        /** Raw data, array of the result of {@link Sendable.toString} */
        data : any[];

        /** Indicates wether the data is the last packet to send */
        finished: boolean;

        /** Sizes of the config */
        configSizes? : number[];

        /** Size of the data */
        size : number;
    }

    /**
     * A plane in space
     */
    export interface Plane  {
        /** A vector representing the normal of the plane*/
        normal : Vector;

        /** The d in ax + by + cz + d = 0 */
        constant : number;

    }

}

export = geo;
