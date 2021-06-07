/// <reference types="node" />
import { IncomingMessage, ServerResponse } from 'http';
export declare function sendPayload(req: IncomingMessage, res: ServerResponse, payload: any, type: 'html' | 'json', { generateEtags, poweredByHeader, }: {
    generateEtags: boolean;
    poweredByHeader: boolean;
}, options?: {
    private: true;
} | {
    private: boolean;
    stateful: true;
} | {
    private: boolean;
    stateful: false;
    revalidate: number | false;
}): void;
