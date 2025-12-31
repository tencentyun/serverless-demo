import { BoltAgent } from '../../../types';
interface SystemInfo {
    hostArch: string;
    nodeVersion: string;
    v8Version: string;
    platform: string;
    release: string;
}
/**
 * Constructs a BoltAgent structure from a given product version.
 *
 * @param {string} version The product version
 * @param {function():SystemInfo} getSystemInfo Parameter used of inject system information and mock calls to the APIs.
 * @returns {BoltAgent} The bolt agent
 */
export declare function fromVersion(version: string, getSystemInfo?: () => SystemInfo): BoltAgent;
export type { SystemInfo };
