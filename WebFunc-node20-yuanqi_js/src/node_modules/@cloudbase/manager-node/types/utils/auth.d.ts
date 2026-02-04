export declare function getAuth(options: {
    secretId: string;
    secretKey: string;
    method: string;
    pathname?: string;
    params?: Record<string, any>;
    headers?: Record<string, any>;
}): string;
