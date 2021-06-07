export declare class FrameworkErrorFormater {
    protected static faqPrefix: string;
    private static faqPrefixEnv;
    static format(err: Error): string;
    static formatError<T extends Error>(err: T): T;
}
