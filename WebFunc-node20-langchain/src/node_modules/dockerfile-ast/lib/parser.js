/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parser = void 0;
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const vscode_languageserver_types_1 = require("vscode-languageserver-types");
const comment_1 = require("./comment");
const parserDirective_1 = require("./parserDirective");
const instruction_1 = require("./instruction");
const add_1 = require("./instructions/add");
const arg_1 = require("./instructions/arg");
const cmd_1 = require("./instructions/cmd");
const copy_1 = require("./instructions/copy");
const env_1 = require("./instructions/env");
const entrypoint_1 = require("./instructions/entrypoint");
const from_1 = require("./instructions/from");
const healthcheck_1 = require("./instructions/healthcheck");
const label_1 = require("./instructions/label");
const onbuild_1 = require("./instructions/onbuild");
const run_1 = require("./instructions/run");
const shell_1 = require("./instructions/shell");
const stopsignal_1 = require("./instructions/stopsignal");
const workdir_1 = require("./instructions/workdir");
const user_1 = require("./instructions/user");
const volume_1 = require("./instructions/volume");
const dockerfile_1 = require("./dockerfile");
const util_1 = require("./util");
const main_1 = require("./main");
class Parser {
    constructor() {
        this.escapeChar = null;
    }
    static createInstruction(document, dockerfile, escapeChar, lineRange, instruction, instructionRange) {
        switch (instruction.toUpperCase()) {
            case "ADD":
                return new add_1.Add(document, lineRange, dockerfile, escapeChar, instruction, instructionRange);
            case "ARG":
                return new arg_1.Arg(document, lineRange, dockerfile, escapeChar, instruction, instructionRange);
            case "CMD":
                return new cmd_1.Cmd(document, lineRange, dockerfile, escapeChar, instruction, instructionRange);
            case "COPY":
                return new copy_1.Copy(document, lineRange, dockerfile, escapeChar, instruction, instructionRange);
            case "ENTRYPOINT":
                return new entrypoint_1.Entrypoint(document, lineRange, dockerfile, escapeChar, instruction, instructionRange);
            case "ENV":
                return new env_1.Env(document, lineRange, dockerfile, escapeChar, instruction, instructionRange);
            case "FROM":
                return new from_1.From(document, lineRange, dockerfile, escapeChar, instruction, instructionRange);
            case "HEALTHCHECK":
                return new healthcheck_1.Healthcheck(document, lineRange, dockerfile, escapeChar, instruction, instructionRange);
            case "LABEL":
                return new label_1.Label(document, lineRange, dockerfile, escapeChar, instruction, instructionRange);
            case "ONBUILD":
                return new onbuild_1.Onbuild(document, lineRange, dockerfile, escapeChar, instruction, instructionRange);
            case "RUN":
                return new run_1.Run(document, lineRange, dockerfile, escapeChar, instruction, instructionRange);
            case "SHELL":
                return new shell_1.Shell(document, lineRange, dockerfile, escapeChar, instruction, instructionRange);
            case "STOPSIGNAL":
                return new stopsignal_1.Stopsignal(document, lineRange, dockerfile, escapeChar, instruction, instructionRange);
            case "WORKDIR":
                return new workdir_1.Workdir(document, lineRange, dockerfile, escapeChar, instruction, instructionRange);
            case "USER":
                return new user_1.User(document, lineRange, dockerfile, escapeChar, instruction, instructionRange);
            case "VOLUME":
                return new volume_1.Volume(document, lineRange, dockerfile, escapeChar, instruction, instructionRange);
        }
        return new instruction_1.Instruction(document, lineRange, dockerfile, escapeChar, instruction, instructionRange);
    }
    getParserDirectives(document, buffer) {
        // reset the escape directive in between runs
        const directives = [];
        this.escapeChar = '';
        const offset = util_1.Util.isUTF8BOM(buffer.substring(0, 1)) ? 1 : 0;
        directiveCheck: for (let i = offset; i < buffer.length; i++) {
            switch (buffer.charAt(i)) {
                case ' ':
                case '\t':
                    break;
                case '\r':
                case '\n':
                    // blank lines stop the parsing of directives immediately
                    break directiveCheck;
                case '#':
                    let directiveStart = -1;
                    let directiveEnd = -1;
                    for (let j = i + 1; j < buffer.length; j++) {
                        let char = buffer.charAt(j);
                        switch (char) {
                            case ' ':
                            case '\t':
                                if (directiveStart !== -1 && directiveEnd === -1) {
                                    directiveEnd = j;
                                }
                                break;
                            case '\r':
                            case '\n':
                                break directiveCheck;
                            case '=':
                                let valueStart = -1;
                                let valueEnd = -1;
                                if (directiveEnd === -1) {
                                    directiveEnd = j;
                                }
                                // assume the line ends with the file
                                let lineEnd = buffer.length;
                                directiveValue: for (let k = j + 1; k < buffer.length; k++) {
                                    char = buffer.charAt(k);
                                    switch (char) {
                                        case '\r':
                                        case '\n':
                                            if (valueStart !== -1 && valueEnd === -1) {
                                                valueEnd = k;
                                            }
                                            // line break found, reset
                                            lineEnd = k;
                                            break directiveValue;
                                        case '\t':
                                        case ' ':
                                            if (valueStart !== -1 && valueEnd === -1) {
                                                valueEnd = k;
                                            }
                                            continue;
                                        default:
                                            if (valueStart === -1) {
                                                valueStart = k;
                                            }
                                            break;
                                    }
                                }
                                if (directiveStart === -1) {
                                    // no directive, it's a regular comment
                                    break directiveCheck;
                                }
                                if (valueStart === -1) {
                                    // no non-whitespace characters found, highlight all the characters then
                                    valueStart = j + 1;
                                    valueEnd = lineEnd;
                                }
                                else if (valueEnd === -1) {
                                    // reached EOF
                                    valueEnd = buffer.length;
                                }
                                const lineRange = vscode_languageserver_types_1.Range.create(document.positionAt(i), document.positionAt(lineEnd));
                                const nameRange = vscode_languageserver_types_1.Range.create(document.positionAt(directiveStart), document.positionAt(directiveEnd));
                                const valueRange = vscode_languageserver_types_1.Range.create(document.positionAt(valueStart), document.positionAt(valueEnd));
                                directives.push(new parserDirective_1.ParserDirective(document, lineRange, nameRange, valueRange));
                                directiveStart = -1;
                                if (buffer.charAt(valueEnd) === '\r') {
                                    // skip over the \r
                                    i = valueEnd + 1;
                                }
                                else {
                                    i = valueEnd;
                                }
                                continue directiveCheck;
                            default:
                                if (directiveStart === -1) {
                                    directiveStart = j;
                                }
                                break;
                        }
                    }
                    break;
                default:
                    break directiveCheck;
            }
        }
        return directives;
    }
    parse(buffer) {
        this.document = vscode_languageserver_textdocument_1.TextDocument.create("", "", 0, buffer);
        this.buffer = buffer;
        let dockerfile = new dockerfile_1.Dockerfile(this.document);
        let directives = this.getParserDirectives(this.document, this.buffer);
        let offset = 0;
        this.escapeChar = '\\';
        if (directives.length > 0) {
            dockerfile.setDirectives(directives);
            this.escapeChar = dockerfile.getEscapeCharacter();
            // start parsing after the directives
            offset = this.document.offsetAt(vscode_languageserver_types_1.Position.create(directives.length, 0));
        }
        else if (util_1.Util.isUTF8BOM(buffer.substring(0, 1))) {
            offset = 1;
        }
        for (let i = offset; i < this.buffer.length; i++) {
            const char = this.buffer.charAt(i);
            switch (char) {
                case ' ':
                case '\t':
                case '\r':
                case '\n':
                    break;
                case '#':
                    i = this.processComment(dockerfile, i);
                    break;
                default:
                    i = this.processInstruction(dockerfile, char, i);
                    break;
            }
        }
        dockerfile.organizeComments();
        return dockerfile;
    }
    processInstruction(dockerfile, char, start) {
        let instruction = char;
        let instructionEnd = -1;
        let escapedInstruction = false;
        instructionCheck: for (let i = start + 1; i < this.buffer.length; i++) {
            char = this.buffer.charAt(i);
            switch (char) {
                case this.escapeChar:
                    escapedInstruction = true;
                    char = this.buffer.charAt(i + 1);
                    if (char === '\r' || char === '\n') {
                        if (instructionEnd === -1) {
                            instructionEnd = i;
                        }
                        i++;
                    }
                    else if (char === ' ' || char === '\t') {
                        for (let j = i + 2; j < this.buffer.length; j++) {
                            switch (this.buffer.charAt(j)) {
                                case ' ':
                                case '\t':
                                    break;
                                case '\r':
                                case '\n':
                                    i = j;
                                    continue instructionCheck;
                                default:
                                    // found an argument, mark end of instruction
                                    instructionEnd = i + 1;
                                    instruction = instruction + this.escapeChar;
                                    i = j - 2;
                                    continue instructionCheck;
                            }
                        }
                        // reached EOF
                        instructionEnd = i + 1;
                        instruction = instruction + this.escapeChar;
                        break instructionCheck;
                    }
                    else {
                        instructionEnd = i + 1;
                        instruction = instruction + this.escapeChar;
                        // reset and consider it as one contiguous word
                        escapedInstruction = false;
                    }
                    break;
                case ' ':
                case '\t':
                    if (escapedInstruction) {
                        // on an escaped newline, need to search for non-whitespace
                        escapeCheck: for (let j = i + 1; j < this.buffer.length; j++) {
                            switch (this.buffer.charAt(j)) {
                                case ' ':
                                case '\t':
                                    break;
                                case '\r':
                                case '\n':
                                    i = j;
                                    continue instructionCheck;
                                default:
                                    break escapeCheck;
                            }
                        }
                        escapedInstruction = false;
                    }
                    if (instructionEnd === -1) {
                        instructionEnd = i;
                    }
                    i = this.processArguments(dockerfile, instruction, instructionEnd, start, i);
                    dockerfile.addInstruction(this.createInstruction(dockerfile, instruction, start, instructionEnd, i));
                    return i;
                case '\r':
                case '\n':
                    if (escapedInstruction) {
                        continue;
                    }
                    if (instructionEnd === -1) {
                        instructionEnd = i;
                    }
                    dockerfile.addInstruction(this.createInstruction(dockerfile, instruction, start, i, i));
                    return i;
                case '#':
                    if (escapedInstruction) {
                        continue;
                    }
                default:
                    instructionEnd = i + 1;
                    instruction = instruction + char;
                    escapedInstruction = false;
                    break;
            }
        }
        // reached EOF
        if (instructionEnd === -1) {
            instructionEnd = this.buffer.length;
        }
        dockerfile.addInstruction(this.createInstruction(dockerfile, instruction, start, instructionEnd, this.buffer.length));
        return this.buffer.length;
    }
    processHeredocs(instruction, offset) {
        let keyword = instruction.getKeyword();
        if (keyword === main_1.Keyword.ONBUILD) {
            instruction = instruction.getTriggerInstruction();
            if (instruction === null) {
                return offset;
            }
            keyword = instruction.getKeyword();
        }
        if (keyword !== main_1.Keyword.ADD && keyword !== main_1.Keyword.COPY && keyword !== main_1.Keyword.RUN) {
            return offset;
        }
        const heredocs = [];
        let tabbed = false;
        for (const arg of instruction.getArguments()) {
            const value = arg.getValue();
            if (value.startsWith("<<") && value.length > 2) {
                if (value.startsWith("<<-")) {
                    tabbed = true;
                }
                const name = util_1.Util.parseHeredocName(value);
                if (name !== null) {
                    heredocs.push(name);
                }
            }
        }
        if (heredocs.length > 0) {
            for (const heredoc of heredocs) {
                offset = this.parseHeredoc(heredoc, offset, tabbed);
            }
        }
        return offset;
    }
    processArguments(dockerfile, instruction, instructionEnd, start, offset) {
        let escaped = false;
        argumentsCheck: for (let i = offset + 1; i < this.buffer.length; i++) {
            switch (this.buffer.charAt(i)) {
                case '\r':
                case '\n':
                    if (escaped) {
                        continue;
                    }
                    return this.processHeredocs(this.createInstruction(dockerfile, instruction, start, instructionEnd, i), i);
                case this.escapeChar:
                    const next = this.buffer.charAt(i + 1);
                    if (next === '\n' || next === '\r') {
                        escaped = true;
                        i++;
                    }
                    else if (next === ' ' || next === '\t') {
                        for (let j = i + 2; j < this.buffer.length; j++) {
                            switch (this.buffer.charAt(j)) {
                                case ' ':
                                case '\t':
                                    break;
                                case '\r':
                                case '\n':
                                    escaped = true;
                                default:
                                    i = j;
                                    continue argumentsCheck;
                            }
                        }
                        // reached EOF
                        return this.buffer.length;
                    }
                    continue;
                case '#':
                    if (escaped) {
                        i = this.processComment(dockerfile, i);
                        continue argumentsCheck;
                    }
                    break;
                case ' ':
                case '\t':
                    break;
                default:
                    if (escaped) {
                        escaped = false;
                    }
                    break;
            }
        }
        return this.buffer.length;
    }
    processComment(dockerfile, start) {
        let end = this.buffer.length;
        commentLoop: for (let i = start + 1; i < this.buffer.length; i++) {
            switch (this.buffer.charAt(i)) {
                case '\r':
                case '\n':
                    end = i;
                    break commentLoop;
            }
        }
        const range = vscode_languageserver_types_1.Range.create(this.document.positionAt(start), this.document.positionAt(end));
        dockerfile.addComment(new comment_1.Comment(this.document, range));
        return end;
    }
    parseHeredoc(heredocName, offset, tabbed) {
        let startWord = -1;
        let lineStart = true;
        for (let i = offset; i < this.buffer.length; i++) {
            switch (this.buffer.charAt(i)) {
                case ' ':
                    lineStart = false;
                    break;
                case '\t':
                    if (!tabbed) {
                        lineStart = false;
                    }
                    break;
                case '\r':
                case '\n':
                    if (startWord !== -1 && heredocName === this.buffer.substring(startWord, i)) {
                        return i;
                    }
                    startWord = -1;
                    lineStart = true;
                    break;
                default:
                    if (lineStart) {
                        startWord = i;
                        lineStart = false;
                    }
                    break;
            }
        }
        return this.buffer.length;
    }
    createInstruction(dockerfile, instruction, start, instructionEnd, end) {
        const startPosition = this.document.positionAt(start);
        const instructionRange = vscode_languageserver_types_1.Range.create(startPosition, this.document.positionAt(instructionEnd));
        const lineRange = vscode_languageserver_types_1.Range.create(startPosition, this.document.positionAt(end));
        return Parser.createInstruction(this.document, dockerfile, this.escapeChar, lineRange, instruction, instructionRange);
    }
}
exports.Parser = Parser;
