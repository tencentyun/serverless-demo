export declare class ExceptionsZone {
    private static readonly exceptionHandler;
    static run(callback: () => void, teardown?: (err: any) => void): void;
    static asyncRun(callback: () => Promise<void>, teardown?: (err: any) => void): Promise<void>;
}
