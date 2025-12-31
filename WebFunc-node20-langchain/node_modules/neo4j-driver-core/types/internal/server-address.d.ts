export declare class ServerAddress {
    private readonly _host;
    private readonly _resolved;
    private readonly _port;
    private readonly _hostPort;
    private readonly _stringValue;
    constructor(host: string, resolved: string | null | undefined, port: number, hostPort: string);
    host(): string;
    resolvedHost(): string;
    port(): number;
    resolveWith(resolved: string): ServerAddress;
    asHostPort(): string;
    asKey(): string;
    toString(): string;
    static fromUrl(url: string): ServerAddress;
}
