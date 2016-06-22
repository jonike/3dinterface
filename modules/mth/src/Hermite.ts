import * as THREE from 'three';
import * as Tools from './Tools';

module mth {

    export interface Curve<T> {

       eval(t : number) : T;

    }

    export class Line<T> {

        p1 : T;
        p2 : T;

        constructor(p1 : T, p2 : T) {
            this.p1 = p1;
            this.p2 = p2;
        }

        eval(t : number) : T {
            return sum(mul(this.p1, t), mul(this.p2, 1-t));
        }

    }

    function sum<T> (a:T, b:T) : T;
    function sum(a : number, b : number) : number;
    function sum(a:Tools.Vector3, b:Tools.Vector3) : Tools.Vector3;
    function sum(a : any, b : any) : any {
        if (typeof a === 'number') {
            return a + b;
        } else {
            return Tools.sum(a,b);
        }
    }


    function diff<T> (a:T, b:T) : T;
    function diff(a:Tools.Vector3, b:Tools.Vector3) : Tools.Vector3;
    function diff(a:number, b:number) : number;
    function diff(a : any, b : any) : any {
        if (typeof a === 'number') {
            return a - b;
        } else {
            return Tools.diff(a,b);
        }
    }

    function mul<T> (a:T, b:number) : T;
    function mul(a:number, b:number) : number;
    function mul(a:Tools.Vector3, b:number) : Tools.Vector3;
    function mul(a : any, b : any) : any {
        if (typeof a === 'number') {
            return a * b;
        } else {
            return Tools.mul(a,b);
        }
    }

    function clone<T>(a:T) : T;
    function clone(a:number) : number;
    function clone(v:Tools.Vector3) : Tools.Vector3;
    function clone(a : any) : any {
        if (typeof a === 'number') {
            return a;
        } else {
            return Tools.copy(a);
        }
    }

    /**
     * Contains eveything linked to hermite polynoms
     */
    export module Hermite {

        /**
         * Creates a hermite polynom
         */
        export class Polynom<T> implements Curve<T> {

            /**
             * time indices of the interpolation
             */
            times : number[];

            /**
             *n values of the polynom at each time
             */
            evals : T[];

            /**
             * values of the derivatives of the polynom at each time
             */
            primes : T[];

            /**
             * array of the base functions to evaluate the poylnom
             */
            baseFunctions : BaseFunction[];

            /**
             * @param t time indices of the interpolation
             * @param f values of the polynom at each time
             * @param fp values of the derivative of the polynom at each time
             */
            constructor(t : number[], f : T[], fp : T[]) {
                this.times = t;
                this.evals = f;
                this.primes = fp;
                this.baseFunctions = [];

                for (var i = 0; i < this.times.length; i++) {
                    this.baseFunctions.push(new BaseFunction(this.times[i], this.times));
                }

                // Let's do something at least a little reusable
                /**
                 * @type {Object}
                 * @description an object containing
                 * <ul>
                 *  <li><code>whatType</code> : a string being <code>THREE.Vector3</code> or <code>Number</code></li>
                 *  <li><code>tools</code> : an object containg sum and mul, functions of the correct type</li>
                 * </ul>
                 */
                // this.tools = {};
                // if (f[0] instanceof THREE.Vector3) {
                //     this.tools.whatType = 'THREE.Vector3';
                //     this.tools.sum  = l3d.sum;
                //     this.tools.prod = l3d.mul;
                // } else {
                //     this.tools.whatType = 'Number';
                //     this.tools.sum  = function(a, b) { return a + b;  };
                //     this.tools.prod = function(a, b) { return a * b;  };
                // }
            }

            /**
             * Evaluates the polynom at a certain time
             * @param t time at which you want to evaluate the polynom
             * @return the evaluation of the polynom at the given time
             */
            eval(t : number) : T {
                var ret : T;

                // if (this.tools.whatType === 'THREE.Vector3') {
                //     ret = new THREE.Vector3();
                // } else {
                //     ret = 0;
                // }

                for (var i in this.times) {
                    var ti = this.times[i];
                    var qi_t = this.baseFunctions[i].eval(t);
                    // var qi_ti = this.baseFunctions[i].eval(ti);

                    var qip_ti = this.baseFunctions[i].prime(ti);
                    var f_ti = this.evals[i];
                    var fp_ti = this.primes[i];

                    // This is the wikipedia formula
                    // ret += (qi_t / qi_ti) * ((1 - (t - ti) * (qip_ti / qi_ti)) * f_ti + (t - ti) * fp_ti);
                    // Let's not forget that qi_ti = 1

                    // This is the final formula
                    // ret += (qi_t) * ((1 - (t - ti) * (qip_ti)) * f_ti + (t - ti) * fp_ti);

                    // This is the implementation working with THREE.Vector3
                    // In terms of disgusting code, we're quite good there
                    ret =
                        sum(
                            ret,
                            mul(
                                sum(
                                    mul(f_ti, 1 - (t - ti) * (qip_ti)),
                                    mul(fp_ti, t - ti)
                                ),
                                qi_t
                            )
                    );
                }

                return ret;
            }

            /**
             * Evaluates the derivate of the polynom at a certain time
             * @param t time at which you want to evaluate the derivative of the polynom
             * @return the evaluation of the derivative of the polynom at the given time
             */
            prime(t : number) : T {
                var ret : T;

                // if (this.tools.whatType === 'THREE.Vector3') {
                //     ret = new THREE.Vector3();
                // } else {
                //     ret = 0;
                // }

                for (var i in this.times) {
                    var ti = this.times[i];
                    var qi_t = this.baseFunctions[i].eval(t);
                    // var qi_ti = this.baseFunctions[i].eval(ti);

                    var qip_t  = this.baseFunctions[i].prime(t );
                    var qip_ti = this.baseFunctions[i].prime(ti);
                    var f_ti = this.evals[i];
                    var fp_ti = this.primes[i];

                    // The return of the disgusting code...
                    // First part is the same that the eval function, but changing qi_t by qip_t
                    // (first part of the derivative)
                    ret =
                        sum(
                            ret,
                            mul(
                                sum(
                                    mul(f_ti, 1 - (t - ti) * (qip_ti)),
                                    mul(fp_ti, t - ti)
                                ),
                                qip_t
                            )
                    );

                    // Here, we just add
                    // ret += qi_t * (-qip_t * f_ti + fp_ti);
                    ret =
                        sum(
                            ret,
                            mul(
                                sum(
                                    mul(
                                        f_ti,
                                        -qip_t
                                    ),
                                    fp_ti
                                ),
                                qi_t
                            )
                    );

                    // Now the following code is the same as the precedent affectation
                    // However it doesn't work, and I can't see the difference between
                    // this and the previous one... so I keep it here, to find the
                    // mistate later
                    // ret =
                    //     this.tools.sum(
                    //         ret,
                    //         this.tools.prod(
                    //             this.tools.sum(
                    //                 fp_ti,
                    //                 this.tools.prod(
                    //                     f_ti,
                    //                     -qip_ti
                    //                 )
                    //             ),
                    //             qi_t
                    //         )
                    //     );
                }

                return ret;
            }

        }

        /**
         * Represents a base function for evaluation of hermite polynoms
         */
        export class BaseFunction implements Curve<number> {

            /**
             * the index of the base function
             */
            index : number;

            /**
             * the times for polynom interpolation
             */
            times : number[];


            /**
             * @param index the index of the base function
             * @param times the times for polynom interpolation
             */
            constructor(index : number, times : number[]) {
                this.index = index;
                this.times = times;
            }

            /**
             * Returns the evaluation of the base function
             * @param t time at which you want to evaluate the base function
             * @returns the evaluation of the base function at the given time
             */
            eval(t : number) : number {
                var ret = 1;

                for (var index = 0; index < this.times.length; index++) {
                    let i = this.times[index];
                    if (i !== this.index) {
                        ret *= (t - this.times[i]) / (this.times[this.index] - this.times[i]);
                    }
                }

                return ret * ret;
            }

            /**
             * Returns the evaluation of the derivative of the base function
             * @param t time at which you want to evaluate the derivative of the base function
             * @returns the evaluation of the derivative of the base function at the given time
             */
            prime(t : number) : number {
                var ret = 0;

                for (var index = 0; index < this.times.length; index++) {
                    let i = this.times[index];
                    if (i !== this.index) {
                        ret += 2 / (t - this.times[i]);
                    }
                }

                return this.eval(t) * ret;
            }

        }

        /**
         * Contains a special type of hermite polynoms, particularly useful for us
         */
        export module special {

            /**
             * Represents a simple hermite polynom where the times are [0, 1], and where
             * the position is known at 0, 1 and where the derivative is only known at 1
             * @param P0 polynom at instant 0
             * @param P1 polynom at instant 1
             * @param PP1 derivative of the polynom at instant 1
             */
            export class Polynom<T> implements Curve<T> {

                /** @description c of ax²+bx+c */
                a : T;

                /** @description c of ax²+bx+c */
                b : T;

                /** @description c of ax²+bx+c */
                c : T;

                constructor(P0 : T, P1 : T, PP1 : T) {

                    this.c = clone(P0);
                    this.a = sum(PP1, diff(P0, P1));
                    this.b = diff(mul(diff(P1,P0), 2), PP1);

                }

                /**
                 * Returns the evaluation of the polynom
                 * @param t time at which you want to evaluate the polynom
                 * @returns the evaluation of the polynom at the given time
                 */
                eval(t : number) : T {
                    return sum(mul(this.a, t*t), sum(mul(this.b, t), this.c));
                }

                /**
                 * Returns the evaluation of the derivative of the polynom
                 * @param t time at which you want to evaluate the derivative of the polynom
                 * @returns the evaluation of the derivative of the polynom at the given time
                 */
                prime(t : number) {
                    return sum(mul(this.a,2*t), this.b);
                }

            }

        }

    }
}

export = mth;
