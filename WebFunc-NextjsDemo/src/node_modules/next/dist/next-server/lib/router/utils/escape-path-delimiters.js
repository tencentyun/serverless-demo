"use strict";exports.__esModule=true;exports.default=escapePathDelimiters;// escape delimiters used by path-to-regexp
function escapePathDelimiters(segment){return segment.replace(/[/#?]/g,char=>encodeURIComponent(char));}
//# sourceMappingURL=escape-path-delimiters.js.map