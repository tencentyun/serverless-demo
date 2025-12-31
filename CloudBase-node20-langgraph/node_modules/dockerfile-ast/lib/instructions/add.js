"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Add = void 0;
const jsonInstruction_1 = require("../jsonInstruction");
class Add extends jsonInstruction_1.JSONInstruction {
    constructor(document, range, dockerfile, escapeChar, instruction, instructionRange) {
        super(document, range, dockerfile, escapeChar, instruction, instructionRange);
    }
    stopSearchingForFlags(argument) {
        return argument.indexOf("--") === -1;
    }
}
exports.Add = Add;
