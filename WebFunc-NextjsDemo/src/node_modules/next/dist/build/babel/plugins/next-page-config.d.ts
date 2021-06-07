import { PluginObj, types as BabelTypes } from '@babel/core';
export default function nextPageConfig({ types: t, }: {
    types: typeof BabelTypes;
}): PluginObj;
