import HttpError from './http_error';
declare class NetworkAuthenticationRequiredError extends HttpError {
    constructor(message?: string);
}
export default NetworkAuthenticationRequiredError;
