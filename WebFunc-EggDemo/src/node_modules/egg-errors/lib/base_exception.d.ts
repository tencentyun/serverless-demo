import BaseError from './base';
import ErrorOptions from './error_options';
declare class EggBaseException<T extends ErrorOptions> extends BaseError<T> {
    constructor(options?: T);
}
export default EggBaseException;
