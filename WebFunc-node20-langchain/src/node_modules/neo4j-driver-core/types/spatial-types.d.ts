import { NumberOrInteger } from './graph-types';
import Integer from './integer';
/**
 * Represents a single two or three-dimensional point in a particular coordinate reference system.
 * Created `Point` objects are frozen with `Object.freeze()` in constructor and thus immutable.
 */
export declare class Point<T extends NumberOrInteger = Integer> {
    readonly srid: T;
    readonly x: number;
    readonly y: number;
    readonly z: number | undefined;
    /**
     * @constructor
     * @param {T} srid - The coordinate reference system identifier.
     * @param {number} x - The `x` coordinate of the point.
     * @param {number} y - The `y` coordinate of the point.
     * @param {number} [z=undefined] - The `z` coordinate of the point or `undefined` if point has 2 dimensions.
     */
    constructor(srid: T, x: number, y: number, z?: number);
    /**
     * @ignore
     */
    toString(): string;
}
/**
 * Test if given object is an instance of {@link Point} class.
 * @param {Object} obj the object to test.
 * @return {boolean} `true` if given object is a {@link Point}, `false` otherwise.
 */
export declare function isPoint<T extends NumberOrInteger = Integer>(obj: unknown): obj is Point<T>;
