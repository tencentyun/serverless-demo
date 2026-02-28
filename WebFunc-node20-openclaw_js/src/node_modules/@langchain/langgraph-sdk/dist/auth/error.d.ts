export declare class HTTPException extends Error {
    status: number;
    headers: HeadersInit;
    constructor(status: number, options?: {
        message?: string;
        headers?: HeadersInit;
        cause?: unknown;
    });
}
