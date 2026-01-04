/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.Util = void 0;
class Util {
    static isUTF8BOM(char) {
        const uintArray = Uint8Array.from(Buffer.from(char, "UTF-8"));
        return uintArray[0] === 0xEF && uintArray[1] == 0xBB && uintArray[2] == 0xBF;
    }
    static isWhitespace(char) {
        return char === ' ' || char === '\t' || Util.isNewline(char);
    }
    static isNewline(char) {
        return char === '\r' || char === '\n';
    }
    static findLeadingNonWhitespace(content, escapeChar) {
        whitespaceCheck: for (let i = 0; i < content.length; i++) {
            switch (content.charAt(i)) {
                case ' ':
                case '\t':
                    continue;
                case escapeChar:
                    escapeCheck: for (let j = i + 1; j < content.length; j++) {
                        switch (content.charAt(j)) {
                            case ' ':
                            case '\t':
                                continue;
                            case '\r':
                                // offset one more for \r\n
                                i = j + 1;
                                continue whitespaceCheck;
                            case '\n':
                                i = j;
                                continue whitespaceCheck;
                            default:
                                break escapeCheck;
                        }
                    }
                    // found an escape character and then reached EOF
                    return -1;
                default:
                    return i;
            }
        }
        // only possible if the content is the empty string
        return -1;
    }
    /**
     * Determines if the given position is contained within the given range.
     *
     * @param position the position to check
     * @param range the range to see if the position is inside of
     */
    static isInsideRange(position, range) {
        if (range.start.line === range.end.line) {
            return range.start.line === position.line
                && range.start.character <= position.character
                && position.character <= range.end.character;
        }
        else if (range.start.line === position.line) {
            return range.start.character <= position.character;
        }
        else if (range.end.line === position.line) {
            return position.character <= range.end.character;
        }
        return range.start.line < position.line && position.line < range.end.line;
    }
    static parseHeredocName(value) {
        value = value.substring(2);
        if (value.charAt(0) === '-') {
            value = value.substring(1);
        }
        if (value.charAt(0) === '"') {
            if (value.charAt(value.length - 1) !== '"') {
                return null;
            }
            value = value.substring(1, value.length - 1);
        }
        if (value.charAt(0) === '\'') {
            if (value.charAt(value.length - 1) !== '\'') {
                return null;
            }
            value = value.substring(1, value.length - 1);
        }
        if (value.charAt(0) === "<") {
            return null;
        }
        return value;
    }
}
exports.Util = Util;
