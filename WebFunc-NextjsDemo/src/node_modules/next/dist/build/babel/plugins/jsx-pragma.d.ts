import { PluginObj, types as BabelTypes } from '@babel/core';
export default function ({ types: t, }: {
    types: typeof BabelTypes;
}): PluginObj<any>;
