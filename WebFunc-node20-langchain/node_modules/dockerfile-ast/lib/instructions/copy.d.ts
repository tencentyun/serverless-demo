import { TextDocument } from 'vscode-languageserver-textdocument';
import { Range } from 'vscode-languageserver-types';
import { Dockerfile } from '../dockerfile';
import { Flag } from '../flag';
import { Heredoc } from '../heredoc';
import { JSONInstruction } from '../jsonInstruction';
export declare class Copy extends JSONInstruction {
    constructor(document: TextDocument, range: Range, dockerfile: Dockerfile, escapeChar: string, instruction: string, instructionRange: Range);
    stopSearchingForFlags(argument: string): boolean;
    getFromFlag(): Flag | null;
    /**
     * Returns there here-documents that are defined in this RUN
     * instruction.
     *
     * This API is experimental and subject to change.
     */
    getHeredocs(): Heredoc[];
}
