// Copyright 2021-2024 The Connect Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
/**
 * Connect represents categories of errors as codes, and each code maps to a
 * specific HTTP status code. The codes and their semantics were chosen to
 * match gRPC. Only the codes below are valid — there are no user-defined
 * codes.
 *
 * See the specification at https://connectrpc.com/docs/protocol#error-codes
 * for details.
 */
export var Code;
(function (Code) {
    /**
     * Canceled, usually be the user
     */
    Code[Code["Canceled"] = 1] = "Canceled";
    /**
     * Unknown error
     */
    Code[Code["Unknown"] = 2] = "Unknown";
    /**
     * Argument invalid regardless of system state
     */
    Code[Code["InvalidArgument"] = 3] = "InvalidArgument";
    /**
     * Operation expired, may or may not have completed.
     */
    Code[Code["DeadlineExceeded"] = 4] = "DeadlineExceeded";
    /**
     * Entity not found.
     */
    Code[Code["NotFound"] = 5] = "NotFound";
    /**
     * Entity already exists.
     */
    Code[Code["AlreadyExists"] = 6] = "AlreadyExists";
    /**
     * Operation not authorized.
     */
    Code[Code["PermissionDenied"] = 7] = "PermissionDenied";
    /**
     * Quota exhausted.
     */
    Code[Code["ResourceExhausted"] = 8] = "ResourceExhausted";
    /**
     * Argument invalid in current system state.
     */
    Code[Code["FailedPrecondition"] = 9] = "FailedPrecondition";
    /**
     * Operation aborted.
     */
    Code[Code["Aborted"] = 10] = "Aborted";
    /**
     * Out of bounds, use instead of FailedPrecondition.
     */
    Code[Code["OutOfRange"] = 11] = "OutOfRange";
    /**
     * Operation not implemented or disabled.
     */
    Code[Code["Unimplemented"] = 12] = "Unimplemented";
    /**
     * Internal error, reserved for "serious errors".
     */
    Code[Code["Internal"] = 13] = "Internal";
    /**
     * Unavailable, client should back off and retry.
     */
    Code[Code["Unavailable"] = 14] = "Unavailable";
    /**
     * Unrecoverable data loss or corruption.
     */
    Code[Code["DataLoss"] = 15] = "DataLoss";
    /**
     * Request isn't authenticated.
     */
    Code[Code["Unauthenticated"] = 16] = "Unauthenticated";
})(Code || (Code = {}));
