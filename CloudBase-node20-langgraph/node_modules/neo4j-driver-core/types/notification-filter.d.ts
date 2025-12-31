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
import { NotificationCategory, NotificationClassification, NotificationSeverityLevel } from './notification';
type ExcludeUnknown<T> = Exclude<T, 'UNKNOWN'>;
type OFF = 'OFF';
type EnumRecord<T extends string | symbol> = {
    [key in T]: key;
};
type NotificationFilterMinimumSeverityLevel = ExcludeUnknown<NotificationSeverityLevel> | OFF;
/**
 * @typedef {'WARNING' | 'INFORMATION' | 'OFF'} NotificationFilterMinimumSeverityLevel
 */
/**
 * Constants that represents the minimum Severity level in the {@link NotificationFilter}
 */
declare const notificationFilterMinimumSeverityLevel: EnumRecord<NotificationFilterMinimumSeverityLevel>;
type NotificationFilterDisabledCategory = ExcludeUnknown<NotificationCategory>;
/**
 * @typedef {'HINT' | 'UNRECOGNIZED' | 'UNSUPPORTED' |'PERFORMANCE' | 'TOPOLOGY' | 'SECURITY' | 'DEPRECATION' | 'GENERIC' | 'SCHEMA'} NotificationFilterDisabledCategory
 */
/**
 * Constants that represents the disabled categories in the {@link NotificationFilter}
 */
declare const notificationFilterDisabledCategory: EnumRecord<NotificationFilterDisabledCategory>;
type NotificationFilterDisabledClassification = ExcludeUnknown<NotificationClassification>;
/**
 * @typedef {NotificationFilterDisabledCategory} NotificationFilterDisabledClassification
 * @experimental
 */
/**
 * Constants that represents the disabled classifications in the {@link NotificationFilter}
 *
 * @type {notificationFilterDisabledCategory}
 * @experimental
 */
declare const notificationFilterDisabledClassification: EnumRecord<NotificationFilterDisabledClassification>;
/**
 * The notification filter object which can be configured in
 * the session and driver creation.
 *
 * Values not defined are interpreted as default.
 *
 * @interface
 */
declare class NotificationFilter {
    minimumSeverityLevel?: NotificationFilterMinimumSeverityLevel;
    disabledCategories?: NotificationFilterDisabledCategory[];
    disabledClassifications?: NotificationFilterDisabledClassification[];
    /**
     * @constructor
     * @private
     */
    constructor();
}
export default NotificationFilter;
export { notificationFilterMinimumSeverityLevel, notificationFilterDisabledCategory, notificationFilterDisabledClassification };
export type { NotificationFilterMinimumSeverityLevel, NotificationFilterDisabledCategory, NotificationFilterDisabledClassification };
