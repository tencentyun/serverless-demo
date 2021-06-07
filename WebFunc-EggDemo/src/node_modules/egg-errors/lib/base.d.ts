import ErrorOptions from './error_options';
declare class BaseError<T extends ErrorOptions> extends Error {
    [key: string]: any;
    static getType(err: Error): string;
    static from<S extends new (...args: any) => InstanceType<typeof BaseError>, P extends ConstructorParameters<S>>(this: S, err: Error, ...args: P | undefined[]): InstanceType<S>;
    code: string;
    protected options?: T;
    constructor(options?: T);
}
export default BaseError;
