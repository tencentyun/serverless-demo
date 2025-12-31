"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.From = void 0;
const vscode_languageserver_types_1 = require("vscode-languageserver-types");
const modifiableInstruction_1 = require("../modifiableInstruction");
class From extends modifiableInstruction_1.ModifiableInstruction {
    constructor(document, range, dockerfile, escapeChar, instruction, instructionRange) {
        super(document, range, dockerfile, escapeChar, instruction, instructionRange);
    }
    stopSearchingForFlags(argument) {
        return argument.indexOf("--") === -1;
    }
    getImage() {
        const args = this.getArguments();
        return args.length > 0 ? args[0].getValue() : null;
    }
    /**
     * Returns the name of the image that will be used as the base image.
     *
     * @return the base image's name, or null if unspecified
     */
    getImageName() {
        const imageName = this.getRangeContent(this.getImageNameRange());
        if (imageName === null) {
            return null;
        }
        let commented = false;
        let escaped = false;
        let name = "";
        for (let i = 0; i < imageName.length; i++) {
            const ch = imageName.charAt(i);
            switch (ch) {
                case this.escapeChar:
                    escaped = true;
                    break;
                case '\r':
                    continue;
                case '\n':
                    commented = false;
                    break;
                case ' ':
                case '\t':
                    break;
                case '#':
                    if (escaped) {
                        commented = true;
                    }
                    else {
                        name = name + ch;
                        escaped = false;
                    }
                    break;
                default:
                    if (!commented) {
                        name = name + ch;
                        escaped = false;
                    }
                    break;
            }
        }
        return name;
    }
    /**
     * Returns the range that covers the name of the image used by
     * this instruction.
     *
     * @return the range of the name of this instruction's argument,
     *         or null if no image has been specified
     */
    getImageNameRange() {
        let range = this.getImageRange();
        if (range) {
            let registryRange = this.getRegistryRange();
            if (registryRange) {
                range.start = this.document.positionAt(this.document.offsetAt(registryRange.end) + 1);
            }
            let tagRange = this.getImageTagRange();
            let digestRange = this.getImageDigestRange();
            if (tagRange === null) {
                if (digestRange !== null) {
                    range.end = this.document.positionAt(this.document.offsetAt(digestRange.start) - 1);
                }
            }
            else {
                range.end = this.document.positionAt(this.document.offsetAt(tagRange.start) - 1);
            }
            return range;
        }
        return null;
    }
    /**
     * Returns the range that covers the image argument of this
     * instruction. This includes the tag or digest of the image if
     * it has been specified by the instruction.
     *
     * @return the range of the image argument, or null if no image
     *         has been specified
     */
    getImageRange() {
        let args = this.getArguments();
        return args.length !== 0 ? args[0].getRange() : null;
    }
    getImageTag() {
        return this.getRangeContent(this.getImageTagRange());
    }
    /**
     * Returns the range in the document that the tag of the base
     * image encompasses.
     *
     * @return the base image's tag's range in the document, or null
     *         if no tag has been specified
     */
    getImageTagRange() {
        const range = this.getImageRange();
        if (range) {
            const rangeStartOffset = this.document.offsetAt(range.start);
            const content = this.getRangeContent(range);
            const atIndex = this.indexOf(rangeStartOffset, content, '@');
            const slashIndex = content.indexOf('/');
            if (atIndex === -1) {
                const colonIndex = this.lastIndexOf(rangeStartOffset, content, ':');
                if (colonIndex > slashIndex) {
                    return vscode_languageserver_types_1.Range.create(this.document.positionAt(rangeStartOffset + colonIndex + 1), range.end);
                }
            }
            const subcontent = content.substring(0, atIndex);
            const subcolonIndex = subcontent.indexOf(':');
            if (subcolonIndex === -1) {
                return null;
            }
            if (slashIndex === -1) {
                // slash not found suggests no registry and no namespace defined
                return vscode_languageserver_types_1.Range.create(this.document.positionAt(rangeStartOffset + subcolonIndex + 1), this.document.positionAt(rangeStartOffset + atIndex));
            }
            // both colon and slash found, check if it is a port
            if (subcolonIndex < slashIndex) {
                return null;
            }
            return vscode_languageserver_types_1.Range.create(this.document.positionAt(rangeStartOffset + subcolonIndex + 1), this.document.positionAt(rangeStartOffset + subcontent.length));
        }
        return null;
    }
    getImageDigest() {
        return this.getRangeContent(this.getImageDigestRange());
    }
    /**
     * Returns the range in the document that the digest of the base
     * image encompasses.
     *
     * @return the base image's digest's range in the document, or null
     *         if no digest has been specified
     */
    getImageDigestRange() {
        let range = this.getImageRange();
        if (range) {
            let content = this.getRangeContent(range);
            let index = this.lastIndexOf(this.document.offsetAt(range.start), content, '@');
            if (index !== -1) {
                return vscode_languageserver_types_1.Range.create(range.start.line, range.start.character + index + 1, range.end.line, range.end.character);
            }
        }
        return null;
    }
    indexOf(documentOffset, content, searchString) {
        let index = content.indexOf(searchString);
        const variables = this.getVariables();
        for (let i = 0; i < variables.length; i++) {
            const position = documentOffset + index;
            const variableRange = variables[i].getRange();
            if (this.document.offsetAt(variableRange.start) < position && position < this.document.offsetAt(variableRange.end)) {
                const offset = this.document.offsetAt(variableRange.end) - documentOffset;
                const substring = content.substring(offset);
                const subIndex = substring.indexOf(searchString);
                if (subIndex === -1) {
                    return -1;
                }
                index = subIndex + offset;
                i = -1;
                continue;
            }
        }
        return index;
    }
    lastIndexOf(documentOffset, content, searchString) {
        let index = content.lastIndexOf(searchString);
        const variables = this.getVariables();
        for (let i = 0; i < variables.length; i++) {
            const position = documentOffset + index;
            const variableRange = variables[i].getRange();
            if (this.document.offsetAt(variableRange.start) < position && position < this.document.offsetAt(variableRange.end)) {
                index = content.substring(0, index).lastIndexOf(searchString);
                if (index === -1) {
                    return -1;
                }
                i = -1;
                continue;
            }
        }
        return index;
    }
    getRegistry() {
        return this.getRangeContent(this.getRegistryRange());
    }
    getRegistryRange() {
        const range = this.getImageRange();
        if (range) {
            const tagRange = this.getImageTagRange();
            const digestRange = this.getImageDigestRange();
            if (tagRange === null) {
                if (digestRange !== null) {
                    range.end = this.document.positionAt(this.document.offsetAt(digestRange.start) - 1);
                }
            }
            else {
                range.end = this.document.positionAt(this.document.offsetAt(tagRange.start) - 1);
            }
            const content = this.getRangeContent(range);
            const rangeStart = this.document.offsetAt(range.start);
            const startingSlashIndex = this.indexOf(rangeStart, content, '/');
            if (startingSlashIndex === -1) {
                return null;
            }
            const portIndex = this.indexOf(rangeStart, content, ':');
            const dotIndex = this.indexOf(rangeStart, content, '.');
            // hostname detected
            if (portIndex !== -1 || dotIndex !== -1) {
                return vscode_languageserver_types_1.Range.create(range.start, this.document.positionAt(rangeStart + startingSlashIndex));
            }
            const registry = content.substring(0, startingSlashIndex);
            // localhost registry detected
            if (registry === 'localhost') {
                return vscode_languageserver_types_1.Range.create(range.start, this.document.positionAt(rangeStart + startingSlashIndex));
            }
        }
        return null;
    }
    getBuildStage() {
        let range = this.getBuildStageRange();
        return range === null ? null : this.getRangeContent(range);
    }
    getBuildStageRange() {
        let args = this.getArguments();
        if (args.length > 2 && args[1].getValue().toUpperCase() === "AS") {
            return args[2].getRange();
        }
        return null;
    }
    getPlatformFlag() {
        let flags = super.getFlags();
        return flags.length === 1 && flags[0].getName() === "platform" ? flags[0] : null;
    }
}
exports.From = From;
