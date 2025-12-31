/**
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [https://neo4j.com]
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import Record from '../record';
import ResultSummary from '../result-summary';
interface StreamObserver {
    /**
     * Will be called on every record that comes in and transform a raw record
     * to an Object. If user-provided observer is present, pass transformed record
     * to its onNext method; otherwise push to record que.
     * @param {Array} rawRecord - An array with the raw record
     */
    onNext?: (rawRecord: any[]) => void;
    /**
     * Will be called on errors.
     * If user-provided observer is present, pass the error
     * to its onError method, otherwise set instance variable _error.
     * @param {Object} error - An error object
     */
    onError: (error: Error) => void;
    onCompleted?: (meta: any) => void;
}
/**
 * Interface to observe updates on the Result which is being produced.
 */
interface ResultObserver {
    /**
     * Receive the keys present on the record whenever this information is available
     *
     * @param {string[]} keys The keys present on the {@link Record}
     */
    onKeys?: (keys: string[]) => void;
    /**
     * Receive each record present on the {@link @Result}
     * @param {Record} record The {@link Record} produced
     */
    onNext?: (record: Record) => void;
    /**
     * Called when the result is fully received
     * @param {ResultSummary| any} summary The result summary
     */
    onCompleted?: (summary: ResultSummary | any) => void;
    /**
     * Called when some error occurs during the result proccess or query execution
     * @param {Error} error The error ocurred
     */
    onError?: (error: Error) => void;
}
/**
 * Raw observer for the stream
 */
export interface ResultStreamObserver extends StreamObserver {
    /**
     * Cancel pending record stream
     */
    cancel: () => void;
    /**
     * Pause the record consuming
     *
     * This function will supend the record consuming. It will not cancel the stream and the already
     * requested records will be sent to the subscriber.
     */
    pause: () => void;
    /**
     * Resume the record consuming
     *
     * This function will resume the record consuming fetching more records from the server.
     */
    resume: () => void;
    /**
     * Stream observer defaults to handling responses for two messages: RUN + PULL_ALL or RUN + DISCARD_ALL.
     * Response for RUN initializes query keys. Response for PULL_ALL / DISCARD_ALL exposes the result stream.
     *
     * However, some operations can be represented as a single message which receives full metadata in a single response.
     * For example, operations to begin, commit and rollback an explicit transaction use two messages in Bolt V1 but a single message in Bolt V3.
     * Messages are `RUN "BEGIN" {}` + `PULL_ALL` in Bolt V1 and `BEGIN` in Bolt V3.
     *
     * This function prepares the observer to only handle a single response message.
     */
    prepareToHandleSingleResponse: () => void;
    /**
     * Mark this observer as if it has completed with no metadata.
     */
    markCompleted: () => void;
    /**
     * Subscribe to events with provided observer.
     * @param {Object} observer - Observer object
     * @param {function(keys: String[])} observer.onKeys - Handle stream header, field keys.
     * @param {function(record: Object)} observer.onNext - Handle records, one by one.
     * @param {function(metadata: Object)} observer.onCompleted - Handle stream tail, the summary.
     * @param {function(error: Object)} observer.onError - Handle errors, should always be provided.
     */
    subscribe: (observer: ResultObserver) => void;
}
export declare class CompletedObserver implements ResultStreamObserver {
    subscribe(observer: ResultObserver): void;
    cancel(): void;
    pause(): void;
    resume(): void;
    prepareToHandleSingleResponse(): void;
    markCompleted(): void;
    onError(error: Error): void;
}
export declare class FailedObserver implements ResultStreamObserver {
    private readonly _error;
    private readonly _beforeError?;
    private readonly _observers;
    constructor({ error, onError }: {
        error: Error;
        onError?: (error: Error) => void | Promise<void>;
    });
    subscribe(observer: ResultObserver): void;
    onError(error: Error): void;
    cancel(): void;
    pause(): void;
    resume(): void;
    markCompleted(): void;
    prepareToHandleSingleResponse(): void;
}
export {};
