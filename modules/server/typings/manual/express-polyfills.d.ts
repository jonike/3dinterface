interface Array<T> {
    find(predicate: (search: T) => boolean) : T;
}

declare module Express {

    export interface Request {

        session : any;

    }

}

// We use a custom version of Stats
declare interface Stats {

    getFps() : number;

}

interface Error {

    status ?: number;

}
