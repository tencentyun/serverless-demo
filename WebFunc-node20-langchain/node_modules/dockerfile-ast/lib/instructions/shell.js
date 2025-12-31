"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Shell = void 0;
const jsonInstruction_1 = require("../jsonInstruction");
class Shell extends jsonInstruction_1.JSONInstruction {
    constructor(document, range, dockerfile, escapeChar, instruction, instructionRange) {
        super(document, range, dockerfile, escapeChar, instruction, instructionRange);
    }
}
exports.Shell = Shell;
