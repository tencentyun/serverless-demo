import HttpError from './http_error';
declare class ProxyAuthenticationRequiredError extends HttpError {
    constructor(message?: string);
}
export default ProxyAuthenticationRequiredError;
