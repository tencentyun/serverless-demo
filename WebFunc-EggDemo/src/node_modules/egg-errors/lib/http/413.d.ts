import HttpError from './http_error';
declare class PayloadTooLargeError extends HttpError {
    constructor(message?: string);
}
export default PayloadTooLargeError;
