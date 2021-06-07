import BaseError from './base';
import ErrorOptions from './error_options';
declare class EggBaseError<T extends ErrorOptions> extends BaseError<T> {
    constructor(options?: T);
}
export default EggBaseError;
