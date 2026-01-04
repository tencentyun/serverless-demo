/**
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [https://neo4j.com]
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import Integer from './integer';
type StandardDate = Date;
/**
 * @typedef {number | Integer | bigint} NumberOrInteger
 */
type NumberOrInteger = number | Integer | bigint;
interface Properties {
    [key: string]: any;
}
/**
 * Class for Node Type.
 */
declare class Node<T extends NumberOrInteger = Integer, P extends Properties = Properties, Label extends string = string> {
    identity: T;
    labels: Label[];
    properties: P;
    elementId: string;
    /**
     * @constructor
     * @protected
     * @param {NumberOrInteger} identity - Unique identity
     * @param {Array<string>} labels - Array for all labels
     * @param {Properties} properties - Map with node properties
     * @param {string} elementId - Node element identifier
     */
    constructor(identity: T, labels: Label[], properties: P, elementId?: string);
    /**
     * @ignore
     */
    toString(): string;
}
/**
 * Test if given object is an instance of {@link Node} class.
 * @param {Object} obj the object to test.
 * @return {boolean} `true` if given object is a {@link Node}, `false` otherwise.
 */
declare function isNode<T extends NumberOrInteger = Integer, P extends Properties = Properties, Label extends string = string>(obj: unknown): obj is Node<T, P, Label>;
/**
 * Class for Relationship Type.
 */
declare class Relationship<T extends NumberOrInteger = Integer, P extends Properties = Properties, Type extends string = string> {
    identity: T;
    start: T;
    end: T;
    type: Type;
    properties: P;
    elementId: string;
    startNodeElementId: string;
    endNodeElementId: string;
    /**
     * @constructor
     * @protected
     * @param {NumberOrInteger} identity - Unique identity
     * @param {NumberOrInteger} start - Identity of start Node
     * @param {NumberOrInteger} end - Identity of end Node
     * @param {string} type - Relationship type
     * @param {Properties} properties - Map with relationship properties
     * @param {string} elementId - Relationship element identifier
     * @param {string} startNodeElementId - Start Node element identifier
     * @param {string} endNodeElementId - End Node element identifier
     */
    constructor(identity: T, start: T, end: T, type: Type, properties: P, elementId?: string, startNodeElementId?: string, endNodeElementId?: string);
    /**
     * @ignore
     */
    toString(): string;
}
/**
 * Test if given object is an instance of {@link Relationship} class.
 * @param {Object} obj the object to test.
 * @return {boolean} `true` if given object is a {@link Relationship}, `false` otherwise.
 */
declare function isRelationship<T extends NumberOrInteger = Integer, P extends Properties = Properties, Type extends string = string>(obj: unknown): obj is Relationship<T, P, Type>;
/**
 * Class for UnboundRelationship Type.
 * @access private
 */
declare class UnboundRelationship<T extends NumberOrInteger = Integer, P extends Properties = Properties, Type extends string = string> {
    identity: T;
    type: Type;
    properties: P;
    elementId: string;
    /**
     * @constructor
     * @protected
     * @param {NumberOrInteger} identity - Unique identity
     * @param {string} type - Relationship type
     * @param {Properties} properties - Map with relationship properties
     * @param {string} elementId - Relationship element identifier
     */
    constructor(identity: T, type: Type, properties: any, elementId?: string);
    /**
     * Bind relationship
     *
     * @protected
     * @deprecated use {@link UnboundRelationship#bindTo} instead
     * @param {Integer} start - Identity of start node
     * @param {Integer} end - Identity of end node
     * @return {Relationship} - Created relationship
     */
    bind(start: T, end: T): Relationship<T>;
    /**
     * Bind relationship
     *
     * @protected
     * @param {Node} start - Start Node
     * @param {Node} end - End Node
     * @return {Relationship} - Created relationship
     */
    bindTo(start: Node<T>, end: Node<T>): Relationship<T>;
    /**
     * @ignore
     */
    toString(): string;
}
/**
 * Test if given object is an instance of {@link UnboundRelationship} class.
 * @param {Object} obj the object to test.
 * @return {boolean} `true` if given object is a {@link UnboundRelationship}, `false` otherwise.
 * @access private
 */
declare function isUnboundRelationship<T extends NumberOrInteger = Integer, P extends Properties = Properties, Type extends string = string>(obj: unknown): obj is UnboundRelationship<T, P, Type>;
/**
 * Class for PathSegment Type.
 */
declare class PathSegment<T extends NumberOrInteger = Integer> {
    start: Node<T>;
    relationship: Relationship<T>;
    end: Node<T>;
    /**
     * @constructor
     * @protected
     * @param {Node} start - start node
     * @param {Relationship} rel - relationship that connects start and end node
     * @param {Node} end - end node
     */
    constructor(start: Node<T>, rel: Relationship<T>, end: Node<T>);
}
/**
 * Test if given object is an instance of {@link PathSegment} class.
 * @param {Object} obj the object to test.
 * @return {boolean} `true` if given object is a {@link PathSegment}, `false` otherwise.
 */
declare function isPathSegment<T extends NumberOrInteger = Integer>(obj: unknown): obj is PathSegment<T>;
/**
 * Class for Path Type.
 */
declare class Path<T extends NumberOrInteger = Integer> {
    start: Node<T>;
    end: Node<T>;
    segments: Array<PathSegment<T>>;
    length: number;
    /**
     * @constructor
     * @protected
     * @param {Node} start  - start node
     * @param {Node} end - end node
     * @param {Array<PathSegment>} segments - Array of Segments
     */
    constructor(start: Node<T>, end: Node<T>, segments: Array<PathSegment<T>>);
}
/**
 * Test if given object is an instance of {@link Path} class.
 * @param {Object} obj the object to test.
 * @return {boolean} `true` if given object is a {@link Path}, `false` otherwise.
 */
declare function isPath<T extends NumberOrInteger = Integer>(obj: unknown): obj is Path<T>;
export { Node, isNode, Relationship, isRelationship, UnboundRelationship, isUnboundRelationship, Path, isPath, PathSegment, isPathSegment };
export type { StandardDate, NumberOrInteger };
