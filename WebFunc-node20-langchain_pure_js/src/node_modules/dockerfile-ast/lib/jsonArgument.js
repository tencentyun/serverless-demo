"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JSONArgument = void 0;
const argument_1 = require("./argument");
class JSONArgument extends argument_1.Argument {
    constructor(value, range, jsonRange) {
        super(value, range);
        this.jsonRange = jsonRange;
    }
    getJSONRange() {
        return this.jsonRange;
    }
    getJSONValue() {
        let value = super.getValue();
        value = value.substring(1, value.length - 1);
        return value;
    }
}
exports.JSONArgument = JSONArgument;
