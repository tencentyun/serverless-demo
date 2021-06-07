import ErrorOptions from './error_options';
import EggBaseException from './base_exception';
declare class EggException extends EggBaseException<ErrorOptions> {
    constructor(message?: string);
}
export default EggException;
