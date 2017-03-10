module l3d {

    /**
     * Represents the history of an object
     */
    export class History {

        /**
         * Stores the different states of the object
         */
        states : any[];

        /**
         * Represents the position in the history we're  at
         */
        index : number;

        /**
         * Represents the number of elements in the history
         */
        size : number;

        /**
         * Creates an empty history
         */
        constructor() {
            this.states = [];
            this.index = -1;
            this.size = 0;
        }

        /**
         * Appends a new state at the end of the history
         * @param state the state to append
         */
        addState(state : any) {
            ++this.index;
            this.size = this.index + 1;
            this.states[this.size-1] = state;
        }

        /**
         * Returns the previous state and change the index to the previous state (so you can redo)
         */
        undo() {
            if (this.undoable()) {
                this.index--;
                return this.currentState();
            }
        }

        /**
         * Returns the next state and change the index to the next state (so you can re-undo)
         */
        redo() {
            if (this.redoable()) {
                this.index++;
                return this.currentState();
            }
        }

        /**
         * Checks if there is a undo possibility
         * @returns {Boolean} true if undo is possible, false otherwise
         */
        undoable() {
            return this.index > 0;
        }

        /**
         * Checks if there is a redo possibility
         * @returns {Boolean} true if redo is possible, false otherwise
         */
        redoable() {
            return this.index < this.size - 1;
        }

        /**
         * Returns the current state in the history
         * @returns {Object} the current state in the history
         */
        currentState() {
            return this.states[this.index];
        }

    }

}

export = l3d;
