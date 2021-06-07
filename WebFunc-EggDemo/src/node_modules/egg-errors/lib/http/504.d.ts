import HttpError from './http_error';
declare class GatewayTimeoutError extends HttpError {
    constructor(message?: string);
}
export default GatewayTimeoutError;
