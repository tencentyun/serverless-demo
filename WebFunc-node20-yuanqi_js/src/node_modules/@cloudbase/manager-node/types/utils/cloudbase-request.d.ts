export declare function cloudBaseRequest(options: {
    config: {
        envId: string;
        secretId: string;
        secretKey: string;
        token?: string;
        timeout?: number;
        proxy: string;
        region: string;
    };
    params: Record<string, any>;
    method?: string;
    headers?: Record<string, any>;
}): Promise<any>;
