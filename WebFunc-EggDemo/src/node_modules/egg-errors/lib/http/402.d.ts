import HttpError from './http_error';
declare class PaymentRequiredError extends HttpError {
    constructor(message?: string);
}
export default PaymentRequiredError;
