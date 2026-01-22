"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Env = void 0;
const propertyInstruction_1 = require("../propertyInstruction");
class Env extends propertyInstruction_1.PropertyInstruction {
    constructor(document, range, dockerfile, escapeChar, instruction, instructionRange) {
        super(document, range, dockerfile, escapeChar, instruction, instructionRange);
    }
    getProperties() {
        return super.getProperties();
    }
}
exports.Env = Env;
