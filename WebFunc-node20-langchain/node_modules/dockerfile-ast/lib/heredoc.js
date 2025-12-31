"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Heredoc = void 0;
/**
 * Heredoc represents a here-document that has been embedded in a
 * Dockerfile.
 *
 * This API is experimental and subject to change.
 */
class Heredoc {
    constructor(startRange, name, nameRange, contentRange, endRange) {
        this.startRange = startRange;
        this.name = name;
        this.nameRange = nameRange;
        this.contentRange = contentRange;
        this.endRange = endRange;
    }
    /**
     * Returns the name of the here-document.
     *
     * This API is experimental and subject to change.
     */
    getName() {
        return this.name;
    }
    /**
     * Returns the range of the start operator and the name. If the
     * here-document is initialized with <<EOT then the start range would
     * encompass all five characters.
     *
     * This API is experimental and subject to change.
     */
    getStartRange() {
        return this.startRange;
    }
    /**
     * Returns the range of this here-document's name that is declared at
     * the beginning of the here-document with the operator. If the
     * here-document is initialized with <<EOT then the name range would
     * encompass the latter three "EOT" characters.
     *
     * This API is experimental and subject to change.
     */
    getNameRange() {
        return this.nameRange;
    }
    /**
     * Returns the range of the content of this here-document. This may
     * be null if the here-document has no content because:
     * - the start range is the only thing that was declared
     * - the end range was declared immediately and there is no content
     *
     * This API is experimental and subject to change.
     */
    getContentRange() {
        return this.contentRange;
    }
    /**
     * Returns the range of the here-document's name on a line that
     * represents the end of the here-document.
     *
     * This API is experimental and subject to change.
     */
    getDelimiterRange() {
        return this.endRange;
    }
}
exports.Heredoc = Heredoc;
