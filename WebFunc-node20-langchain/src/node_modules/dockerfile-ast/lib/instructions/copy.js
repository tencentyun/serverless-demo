"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Copy = void 0;
const jsonInstruction_1 = require("../jsonInstruction");
class Copy extends jsonInstruction_1.JSONInstruction {
    constructor(document, range, dockerfile, escapeChar, instruction, instructionRange) {
        super(document, range, dockerfile, escapeChar, instruction, instructionRange);
    }
    stopSearchingForFlags(argument) {
        return argument.indexOf("--") === -1;
    }
    getFromFlag() {
        let flags = super.getFlags();
        return flags.length === 1 && flags[0].getName() === "from" ? flags[0] : null;
    }
    /**
     * Returns there here-documents that are defined in this RUN
     * instruction.
     *
     * This API is experimental and subject to change.
     */
    getHeredocs() {
        return super.getHeredocs();
    }
}
exports.Copy = Copy;
