import HttpError from './http_error';
declare class ServiceUnavailableError extends HttpError {
    constructor(message?: string);
}
export default ServiceUnavailableError;
