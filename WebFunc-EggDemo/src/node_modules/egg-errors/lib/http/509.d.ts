import HttpError from './http_error';
declare class BandwidthLimitExceededError extends HttpError {
    constructor(message?: string);
}
export default BandwidthLimitExceededError;
