import HttpError from './http_error';
declare class BadGatewayError extends HttpError {
    constructor(message?: string);
}
export default BadGatewayError;
