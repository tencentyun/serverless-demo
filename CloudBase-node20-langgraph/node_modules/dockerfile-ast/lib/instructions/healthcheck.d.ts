import { TextDocument } from 'vscode-languageserver-textdocument';
import { Range } from 'vscode-languageserver-types';
import { Dockerfile } from '../dockerfile';
import { Argument } from '../argument';
import { ModifiableInstruction } from '../modifiableInstruction';
export declare class Healthcheck extends ModifiableInstruction {
    constructor(document: TextDocument, range: Range, dockerfile: Dockerfile, escapeChar: string, instruction: string, instructionRange: Range);
    protected stopSearchingForFlags(argument: string): boolean;
    getSubcommand(): Argument | null;
}
