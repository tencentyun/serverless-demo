import EggError from '../base_error';
import HttpErrorOptions from './http_error_options';
import HttpHeader from './http_header';
declare class HttpError extends EggError<HttpErrorOptions> {
    status: number;
    headers: HttpHeader;
    protected options: HttpErrorOptions;
    constructor(options?: HttpErrorOptions);
}
export default HttpError;
