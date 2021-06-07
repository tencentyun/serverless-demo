"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSymbol = exports.isEmpty = exports.isNil = exports.isConstructor = exports.isString = exports.isFunction = exports.validatePath = exports.addLeadingSlash = exports.isPlainObject = exports.isObject = exports.isUndefined = void 0;
/* eslint-disable @typescript-eslint/no-use-before-define */
const isUndefined = (obj) => typeof obj === 'undefined';
exports.isUndefined = isUndefined;
const isObject = (fn) => !exports.isNil(fn) && typeof fn === 'object';
exports.isObject = isObject;
const isPlainObject = (fn) => {
    if (!exports.isObject(fn)) {
        return false;
    }
    const proto = Object.getPrototypeOf(fn);
    if (proto === null) {
        return true;
    }
    const ctor = Object.prototype.hasOwnProperty.call(proto, 'constructor') &&
        proto.constructor;
    return (typeof ctor === 'function' &&
        ctor instanceof ctor &&
        Function.prototype.toString.call(ctor) ===
            Function.prototype.toString.call(Object));
};
exports.isPlainObject = isPlainObject;
const addLeadingSlash = (path) => path ? (path.charAt(0) !== '/' ? '/' + path : path) : '';
exports.addLeadingSlash = addLeadingSlash;
/**
 * Deprecated. Use the "addLeadingSlash" function instead.
 * @deprecated
 */
exports.validatePath = exports.addLeadingSlash;
const isFunction = (fn) => typeof fn === 'function';
exports.isFunction = isFunction;
const isString = (fn) => typeof fn === 'string';
exports.isString = isString;
const isConstructor = (fn) => fn === 'constructor';
exports.isConstructor = isConstructor;
const isNil = (obj) => exports.isUndefined(obj) || obj === null;
exports.isNil = isNil;
const isEmpty = (array) => !(array && array.length > 0);
exports.isEmpty = isEmpty;
const isSymbol = (fn) => typeof fn === 'symbol';
exports.isSymbol = isSymbol;
