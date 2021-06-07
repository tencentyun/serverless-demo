import ErrorOptions from './error_options';
import EggBaseError from './base_error';
declare class EggError extends EggBaseError<ErrorOptions> {
    constructor(message?: string);
}
export default EggError;
