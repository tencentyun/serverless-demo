/// <reference types="react" />
import { HeadEntry } from '../next-server/lib/utils';
export default function initHeadManager(initialHeadEntries: HeadEntry[]): {
    mountedInstances: Set<unknown>;
    updateHead: (head: JSX.Element[]) => void;
};
