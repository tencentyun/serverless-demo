import { Range } from 'vscode-languageserver-types';
/**
 * Heredoc represents a here-document that has been embedded in a
 * Dockerfile.
 *
 * This API is experimental and subject to change.
 */
export declare class Heredoc {
    private readonly startRange;
    private readonly name;
    private readonly nameRange;
    private readonly contentRange;
    private readonly endRange;
    constructor(startRange: Range, name: string, nameRange: Range, contentRange: Range, endRange: Range);
    /**
     * Returns the name of the here-document.
     *
     * This API is experimental and subject to change.
     */
    getName(): string;
    /**
     * Returns the range of the start operator and the name. If the
     * here-document is initialized with <<EOT then the start range would
     * encompass all five characters.
     *
     * This API is experimental and subject to change.
     */
    getStartRange(): Range;
    /**
     * Returns the range of this here-document's name that is declared at
     * the beginning of the here-document with the operator. If the
     * here-document is initialized with <<EOT then the name range would
     * encompass the latter three "EOT" characters.
     *
     * This API is experimental and subject to change.
     */
    getNameRange(): Range;
    /**
     * Returns the range of the content of this here-document. This may
     * be null if the here-document has no content because:
     * - the start range is the only thing that was declared
     * - the end range was declared immediately and there is no content
     *
     * This API is experimental and subject to change.
     */
    getContentRange(): Range | null;
    /**
     * Returns the range of the here-document's name on a line that
     * represents the end of the here-document.
     *
     * This API is experimental and subject to change.
     */
    getDelimiterRange(): Range | null;
}
