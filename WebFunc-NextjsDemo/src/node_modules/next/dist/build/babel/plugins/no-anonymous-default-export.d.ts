import { PluginObj, types as BabelTypes } from '@babel/core';
export default function NoAnonymousDefaultExport({ types: t, ...babel }: {
    types: typeof BabelTypes;
    caller: (callerCallback: (caller: any) => any) => any;
}): PluginObj<any>;
