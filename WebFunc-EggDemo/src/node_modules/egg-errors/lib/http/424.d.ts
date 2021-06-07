import HttpError from './http_error';
declare class FailedDependencyError extends HttpError {
    constructor(message?: string);
}
export default FailedDependencyError;
