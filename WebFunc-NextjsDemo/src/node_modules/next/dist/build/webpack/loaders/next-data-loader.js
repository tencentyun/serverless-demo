"use strict";exports.__esModule=true;exports.default=void 0;var _stringHash=_interopRequireDefault(require("next/dist/compiled/string-hash"));var _path=require("path");function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}const nextDataLoader=function(){const filename=this.resourcePath;return`
  import {createHook} from 'next/data'

  export default createHook(undefined, {key: ${JSON.stringify((0,_path.basename)(filename)+'-'+(0,_stringHash.default)(filename))}})
  `;};var _default=nextDataLoader;exports.default=_default;
//# sourceMappingURL=next-data-loader.js.map