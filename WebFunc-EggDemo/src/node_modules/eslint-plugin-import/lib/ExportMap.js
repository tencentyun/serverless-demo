'use strict';Object.defineProperty(exports, "__esModule", { value: true });exports.

























































































































































































































































































































































































































































































































































































































































































recursivePatternCapture = recursivePatternCapture;var _fs = require('fs');var _fs2 = _interopRequireDefault(_fs);var _doctrine = require('doctrine');var _doctrine2 = _interopRequireDefault(_doctrine);var _debug = require('debug');var _debug2 = _interopRequireDefault(_debug);var _eslint = require('eslint');var _parse = require('eslint-module-utils/parse');var _parse2 = _interopRequireDefault(_parse);var _resolve = require('eslint-module-utils/resolve');var _resolve2 = _interopRequireDefault(_resolve);var _ignore = require('eslint-module-utils/ignore');var _ignore2 = _interopRequireDefault(_ignore);var _hash = require('eslint-module-utils/hash');var _unambiguous = require('eslint-module-utils/unambiguous');var unambiguous = _interopRequireWildcard(_unambiguous);var _tsconfigLoader = require('tsconfig-paths/lib/tsconfig-loader');var _arrayIncludes = require('array-includes');var _arrayIncludes2 = _interopRequireDefault(_arrayIncludes);function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}let parseConfigFileTextToJson;const log = (0, _debug2.default)('eslint-plugin-import:ExportMap');const exportCache = new Map();const tsConfigCache = new Map();class ExportMap {constructor(path) {this.path = path;this.namespace = new Map(); // todo: restructure to key on path, value is resolver + map of names
    this.reexports = new Map(); /**
                                 * star-exports
                                 * @type {Set} of () => ExportMap
                                 */this.dependencies = new Set(); /**
                                                                   * dependencies of this module that are not explicitly re-exported
                                                                   * @type {Map} from path = () => ExportMap
                                                                   */this.imports = new Map();this.errors = [];}get hasDefault() {return this.get('default') != null;} // stronger than this.has
  get size() {let size = this.namespace.size + this.reexports.size;this.dependencies.forEach(dep => {const d = dep(); // CJS / ignored dependencies won't exist (#717)
      if (d == null) return;size += d.size;});return size;} /**
                                                             * Note that this does not check explicitly re-exported names for existence
                                                             * in the base namespace, but it will expand all `export * from '...'` exports
                                                             * if not found in the explicit namespace.
                                                             * @param  {string}  name
                                                             * @return {Boolean} true if `name` is exported by this module.
                                                             */has(name) {if (this.namespace.has(name)) return true;if (this.reexports.has(name)) return true; // default exports must be explicitly re-exported (#328)
    if (name !== 'default') {for (const dep of this.dependencies) {const innerMap = dep(); // todo: report as unresolved?
        if (!innerMap) continue;if (innerMap.has(name)) return true;}}return false;} /**
                                                                                      * ensure that imported name fully resolves.
                                                                                      * @param  {string} name
                                                                                      * @return {{ found: boolean, path: ExportMap[] }}
                                                                                      */hasDeep(name) {if (this.namespace.has(name)) return { found: true, path: [this] };if (this.reexports.has(name)) {const reexports = this.reexports.get(name);const imported = reexports.getImport(); // if import is ignored, return explicit 'null'
      if (imported == null) return { found: true, path: [this] }; // safeguard against cycles, only if name matches
      if (imported.path === this.path && reexports.local === name) {return { found: false, path: [this] };}const deep = imported.hasDeep(reexports.local);deep.path.unshift(this);return deep;} // default exports must be explicitly re-exported (#328)
    if (name !== 'default') {for (const dep of this.dependencies) {const innerMap = dep();if (innerMap == null) return { found: true, path: [this] }; // todo: report as unresolved?
        if (!innerMap) continue; // safeguard against cycles
        if (innerMap.path === this.path) continue;const innerValue = innerMap.hasDeep(name);if (innerValue.found) {innerValue.path.unshift(this);return innerValue;}}}return { found: false, path: [this] };}get(name) {if (this.namespace.has(name)) return this.namespace.get(name);if (this.reexports.has(name)) {const reexports = this.reexports.get(name);const imported = reexports.getImport(); // if import is ignored, return explicit 'null'
      if (imported == null) return null; // safeguard against cycles, only if name matches
      if (imported.path === this.path && reexports.local === name) return undefined;return imported.get(reexports.local);} // default exports must be explicitly re-exported (#328)
    if (name !== 'default') {for (const dep of this.dependencies) {const innerMap = dep(); // todo: report as unresolved?
        if (!innerMap) continue; // safeguard against cycles
        if (innerMap.path === this.path) continue;const innerValue = innerMap.get(name);if (innerValue !== undefined) return innerValue;}}return undefined;}forEach(callback, thisArg) {this.namespace.forEach((v, n) => callback.call(thisArg, v, n, this));this.reexports.forEach((reexports, name) => {const reexported = reexports.getImport(); // can't look up meta for ignored re-exports (#348)
      callback.call(thisArg, reexported && reexported.get(reexports.local), name, this);});this.dependencies.forEach(dep => {const d = dep(); // CJS / ignored dependencies won't exist (#717)
      if (d == null) return;d.forEach((v, n) => n !== 'default' && callback.call(thisArg, v, n, this));});} // todo: keys, values, entries?
  reportErrors(context, declaration) {context.report({ node: declaration.source, message: `Parse errors in imported module '${declaration.source.value}': ` + `${this.errors.map(e => `${e.message} (${e.lineNumber}:${e.column})`).join(', ')}` });}}exports.default = ExportMap; /**
                                                                                                                                                                                                                                                                                    * parse docs from the first node that has leading comments
                                                                                                                                                                                                                                                                                    */function captureDoc(source, docStyleParsers) {const metadata = {}; // 'some' short-circuits on first 'true'
  for (var _len = arguments.length, nodes = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {nodes[_key - 2] = arguments[_key];}nodes.some(n => {try {let leadingComments; // n.leadingComments is legacy `attachComments` behavior
      if ('leadingComments' in n) {leadingComments = n.leadingComments;} else if (n.range) {leadingComments = source.getCommentsBefore(n);}if (!leadingComments || leadingComments.length === 0) return false;for (const name in docStyleParsers) {const doc = docStyleParsers[name](leadingComments);if (doc) {metadata.doc = doc;}}return true;} catch (err) {return false;}});return metadata;}const availableDocStyleParsers = { jsdoc: captureJsDoc, tomdoc: captureTomDoc }; /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    * parse JSDoc from leading comments
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    * @param {object[]} comments
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    * @return {{ doc: object }}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    */function captureJsDoc(comments) {let doc; // capture XSDoc
  comments.forEach(comment => {// skip non-block comments
    if (comment.type !== 'Block') return;try {doc = _doctrine2.default.parse(comment.value, { unwrap: true });} catch (err) {/* don't care, for now? maybe add to `errors?` */}});return doc;} /**
                                                                                                                                                                                                 * parse TomDoc section from comments
                                                                                                                                                                                                 */function captureTomDoc(comments) {// collect lines up to first paragraph break
  const lines = [];for (let i = 0; i < comments.length; i++) {const comment = comments[i];if (comment.value.match(/^\s*$/)) break;lines.push(comment.value.trim());} // return doctrine-like object
  const statusMatch = lines.join(' ').match(/^(Public|Internal|Deprecated):\s*(.+)/);if (statusMatch) {return { description: statusMatch[2], tags: [{ title: statusMatch[1].toLowerCase(), description: statusMatch[2] }] };}}const supportedImportTypes = new Set(['ImportDefaultSpecifier', 'ImportNamespaceSpecifier']);ExportMap.get = function (source, context) {const path = (0, _resolve2.default)(source, context);if (path == null) return null;return ExportMap.for(childContext(path, context));};ExportMap.for = function (context) {const path = context.path;const cacheKey = (0, _hash.hashObject)(context).digest('hex');let exportMap = exportCache.get(cacheKey); // return cached ignore
  if (exportMap === null) return null;const stats = _fs2.default.statSync(path);if (exportMap != null) {// date equality check
    if (exportMap.mtime - stats.mtime === 0) {return exportMap;} // future: check content equality?
  } // check valid extensions first
  if (!(0, _ignore.hasValidExtension)(path, context)) {exportCache.set(cacheKey, null);return null;} // check for and cache ignore
  if ((0, _ignore2.default)(path, context)) {log('ignored path due to ignore settings:', path);exportCache.set(cacheKey, null);return null;}const content = _fs2.default.readFileSync(path, { encoding: 'utf8' }); // check for and cache unambiguous modules
  if (!unambiguous.test(content)) {log('ignored path due to unambiguous regex:', path);exportCache.set(cacheKey, null);return null;}log('cache miss', cacheKey, 'for path', path);exportMap = ExportMap.parse(path, content, context); // ambiguous modules return null
  if (exportMap == null) return null;exportMap.mtime = stats.mtime;exportCache.set(cacheKey, exportMap);return exportMap;};ExportMap.parse = function (path, content, context) {const m = new ExportMap(path);let ast;try {ast = (0, _parse2.default)(path, content, context);} catch (err) {log('parse error:', path, err);m.errors.push(err);return m; // can't continue
  }if (!unambiguous.isModule(ast)) return null;const docstyle = context.settings && context.settings['import/docstyle'] || ['jsdoc'];const docStyleParsers = {};docstyle.forEach(style => {docStyleParsers[style] = availableDocStyleParsers[style];}); // attempt to collect module doc
  if (ast.comments) {ast.comments.some(c => {if (c.type !== 'Block') return false;try {const doc = _doctrine2.default.parse(c.value, { unwrap: true });if (doc.tags.some(t => t.title === 'module')) {m.doc = doc;return true;}} catch (err) {/* ignore */}return false;});}const namespaces = new Map();function remotePath(value) {return _resolve2.default.relative(value, path, context.settings);}function resolveImport(value) {const rp = remotePath(value);if (rp == null) return null;return ExportMap.for(childContext(rp, context));}function getNamespace(identifier) {if (!namespaces.has(identifier.name)) return;return function () {return resolveImport(namespaces.get(identifier.name));};}function addNamespace(object, identifier) {const nsfn = getNamespace(identifier);if (nsfn) {Object.defineProperty(object, 'namespace', { get: nsfn });}return object;}function captureDependency(_ref, isOnlyImportingTypes) {let source = _ref.source;let importedSpecifiers = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : new Set();if (source == null) return null;const p = remotePath(source.value);if (p == null) return null;const declarationMetadata = { // capturing actual node reference holds full AST in memory!
      source: { value: source.value, loc: source.loc }, isOnlyImportingTypes, importedSpecifiers };const existing = m.imports.get(p);if (existing != null) {existing.declarations.add(declarationMetadata);return existing.getter;}const getter = thunkFor(p, context);m.imports.set(p, { getter, declarations: new Set([declarationMetadata]) });return getter;}const source = makeSourceCode(content, ast);function readTsConfig() {const tsConfigInfo = (0, _tsconfigLoader.tsConfigLoader)({ cwd: context.parserOptions && context.parserOptions.tsconfigRootDir || process.cwd(), getEnv: key => process.env[key] });try {if (tsConfigInfo.tsConfigPath !== undefined) {const jsonText = _fs2.default.readFileSync(tsConfigInfo.tsConfigPath).toString();if (!parseConfigFileTextToJson) {var _require = require('typescript'); // this is because projects not using TypeScript won't have typescript installed
          parseConfigFileTextToJson = _require.parseConfigFileTextToJson;}return parseConfigFileTextToJson(tsConfigInfo.tsConfigPath, jsonText).config;}} catch (e) {// Catch any errors
    }return null;}function isEsModuleInterop() {const cacheKey = (0, _hash.hashObject)({ tsconfigRootDir: context.parserOptions && context.parserOptions.tsconfigRootDir }).digest('hex');let tsConfig = tsConfigCache.get(cacheKey);if (typeof tsConfig === 'undefined') {tsConfig = readTsConfig();tsConfigCache.set(cacheKey, tsConfig);}return tsConfig && tsConfig.compilerOptions ? tsConfig.compilerOptions.esModuleInterop : false;}ast.body.forEach(function (n) {if (n.type === 'ExportDefaultDeclaration') {const exportMeta = captureDoc(source, docStyleParsers, n);if (n.declaration.type === 'Identifier') {addNamespace(exportMeta, n.declaration);}m.namespace.set('default', exportMeta);return;}if (n.type === 'ExportAllDeclaration') {const getter = captureDependency(n, n.exportKind === 'type');if (getter) m.dependencies.add(getter);return;} // capture namespaces in case of later export
    if (n.type === 'ImportDeclaration') {// import type { Foo } (TS and Flow)
      const declarationIsType = n.importKind === 'type';let isOnlyImportingTypes = declarationIsType;const importedSpecifiers = new Set();n.specifiers.forEach(specifier => {if (supportedImportTypes.has(specifier.type)) {importedSpecifiers.add(specifier.type);}if (specifier.type === 'ImportSpecifier') {importedSpecifiers.add(specifier.imported.name);} // import { type Foo } (Flow)
        if (!declarationIsType) {isOnlyImportingTypes = specifier.importKind === 'type';}});captureDependency(n, isOnlyImportingTypes, importedSpecifiers);const ns = n.specifiers.find(s => s.type === 'ImportNamespaceSpecifier');if (ns) {namespaces.set(ns.local.name, n.source.value);}return;}if (n.type === 'ExportNamedDeclaration') {// capture declaration
      if (n.declaration != null) {switch (n.declaration.type) {case 'FunctionDeclaration':case 'ClassDeclaration':case 'TypeAlias': // flowtype with babel-eslint parser
          case 'InterfaceDeclaration':case 'DeclareFunction':case 'TSDeclareFunction':case 'TSEnumDeclaration':case 'TSTypeAliasDeclaration':case 'TSInterfaceDeclaration':case 'TSAbstractClassDeclaration':case 'TSModuleDeclaration':m.namespace.set(n.declaration.id.name, captureDoc(source, docStyleParsers, n));break;case 'VariableDeclaration':n.declaration.declarations.forEach(d => recursivePatternCapture(d.id, id => m.namespace.set(id.name, captureDoc(source, docStyleParsers, d, n))));break;}}const nsource = n.source && n.source.value;n.specifiers.forEach(s => {const exportMeta = {};let local;switch (s.type) {case 'ExportDefaultSpecifier':if (!n.source) return;local = 'default';break;case 'ExportNamespaceSpecifier':m.namespace.set(s.exported.name, Object.defineProperty(exportMeta, 'namespace', { get() {return resolveImport(nsource);} }));return;case 'ExportSpecifier':if (!n.source) {m.namespace.set(s.exported.name, addNamespace(exportMeta, s.local));return;} // else falls through
          default:local = s.local.name;break;} // todo: JSDoc
        m.reexports.set(s.exported.name, { local, getImport: () => resolveImport(nsource) });});}const isEsModuleInteropTrue = isEsModuleInterop();const exports = ['TSExportAssignment'];if (isEsModuleInteropTrue) {exports.push('TSNamespaceExportDeclaration');} // This doesn't declare anything, but changes what's being exported.
    if ((0, _arrayIncludes2.default)(exports, n.type)) {const exportedName = n.type === 'TSNamespaceExportDeclaration' ? n.id.name : n.expression && n.expression.name || n.expression.id && n.expression.id.name || null;const declTypes = ['VariableDeclaration', 'ClassDeclaration', 'TSDeclareFunction', 'TSEnumDeclaration', 'TSTypeAliasDeclaration', 'TSInterfaceDeclaration', 'TSAbstractClassDeclaration', 'TSModuleDeclaration'];const exportedDecls = ast.body.filter((_ref2) => {let type = _ref2.type,id = _ref2.id,declarations = _ref2.declarations;return (0, _arrayIncludes2.default)(declTypes, type) && (id && id.name === exportedName || declarations && declarations.find(d => d.id.name === exportedName));});if (exportedDecls.length === 0) {// Export is not referencing any local declaration, must be re-exporting
        m.namespace.set('default', captureDoc(source, docStyleParsers, n));return;}if (isEsModuleInteropTrue) {m.namespace.set('default', {});}exportedDecls.forEach(decl => {if (decl.type === 'TSModuleDeclaration') {if (decl.body && decl.body.type === 'TSModuleDeclaration') {m.namespace.set(decl.body.id.name, captureDoc(source, docStyleParsers, decl.body));} else if (decl.body && decl.body.body) {decl.body.body.forEach(moduleBlockNode => {// Export-assignment exports all members in the namespace,
              // explicitly exported or not.
              const namespaceDecl = moduleBlockNode.type === 'ExportNamedDeclaration' ? moduleBlockNode.declaration : moduleBlockNode;if (!namespaceDecl) {// TypeScript can check this for us; we needn't
              } else if (namespaceDecl.type === 'VariableDeclaration') {namespaceDecl.declarations.forEach(d => recursivePatternCapture(d.id, id => m.namespace.set(id.name, captureDoc(source, docStyleParsers, decl, namespaceDecl, moduleBlockNode))));} else {m.namespace.set(namespaceDecl.id.name, captureDoc(source, docStyleParsers, moduleBlockNode));}});}} else {// Export as default
          m.namespace.set('default', captureDoc(source, docStyleParsers, decl));}});}});return m;}; /**
                                                                                                     * The creation of this closure is isolated from other scopes
                                                                                                     * to avoid over-retention of unrelated variables, which has
                                                                                                     * caused memory leaks. See #1266.
                                                                                                     */function thunkFor(p, context) {return () => ExportMap.for(childContext(p, context));} /**
                                                                                                                                                                                              * Traverse a pattern/identifier node, calling 'callback'
                                                                                                                                                                                              * for each leaf identifier.
                                                                                                                                                                                              * @param  {node}   pattern
                                                                                                                                                                                              * @param  {Function} callback
                                                                                                                                                                                              * @return {void}
                                                                                                                                                                                              */function recursivePatternCapture(pattern, callback) {switch (pattern.type) {case 'Identifier': // base case
      callback(pattern);break;case 'ObjectPattern':pattern.properties.forEach(p => {if (p.type === 'ExperimentalRestProperty' || p.type === 'RestElement') {callback(p.argument);return;}recursivePatternCapture(p.value, callback);});break;case 'ArrayPattern':pattern.elements.forEach(element => {if (element == null) return;if (element.type === 'ExperimentalRestProperty' || element.type === 'RestElement') {callback(element.argument);return;}recursivePatternCapture(element, callback);});break;case 'AssignmentPattern':callback(pattern.left);break;}} /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       * don't hold full context object in memory, just grab what we need.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       */function childContext(path, context) {const settings = context.settings,parserOptions = context.parserOptions,parserPath = context.parserPath;return { settings, parserOptions, parserPath, path };} /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               * sometimes legacy support isn't _that_ hard... right?
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               */function makeSourceCode(text, ast) {if (_eslint.SourceCode.length > 1) {// ESLint 3
    return new _eslint.SourceCode(text, ast);} else {// ESLint 4, 5
    return new _eslint.SourceCode({ text, ast });}}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9FeHBvcnRNYXAuanMiXSwibmFtZXMiOlsicmVjdXJzaXZlUGF0dGVybkNhcHR1cmUiLCJ1bmFtYmlndW91cyIsInBhcnNlQ29uZmlnRmlsZVRleHRUb0pzb24iLCJsb2ciLCJleHBvcnRDYWNoZSIsIk1hcCIsInRzQ29uZmlnQ2FjaGUiLCJFeHBvcnRNYXAiLCJjb25zdHJ1Y3RvciIsInBhdGgiLCJuYW1lc3BhY2UiLCJyZWV4cG9ydHMiLCJkZXBlbmRlbmNpZXMiLCJTZXQiLCJpbXBvcnRzIiwiZXJyb3JzIiwiaGFzRGVmYXVsdCIsImdldCIsInNpemUiLCJmb3JFYWNoIiwiZGVwIiwiZCIsImhhcyIsIm5hbWUiLCJpbm5lck1hcCIsImhhc0RlZXAiLCJmb3VuZCIsImltcG9ydGVkIiwiZ2V0SW1wb3J0IiwibG9jYWwiLCJkZWVwIiwidW5zaGlmdCIsImlubmVyVmFsdWUiLCJ1bmRlZmluZWQiLCJjYWxsYmFjayIsInRoaXNBcmciLCJ2IiwibiIsImNhbGwiLCJyZWV4cG9ydGVkIiwicmVwb3J0RXJyb3JzIiwiY29udGV4dCIsImRlY2xhcmF0aW9uIiwicmVwb3J0Iiwibm9kZSIsInNvdXJjZSIsIm1lc3NhZ2UiLCJ2YWx1ZSIsIm1hcCIsImUiLCJsaW5lTnVtYmVyIiwiY29sdW1uIiwiam9pbiIsImNhcHR1cmVEb2MiLCJkb2NTdHlsZVBhcnNlcnMiLCJtZXRhZGF0YSIsIm5vZGVzIiwic29tZSIsImxlYWRpbmdDb21tZW50cyIsInJhbmdlIiwiZ2V0Q29tbWVudHNCZWZvcmUiLCJsZW5ndGgiLCJkb2MiLCJlcnIiLCJhdmFpbGFibGVEb2NTdHlsZVBhcnNlcnMiLCJqc2RvYyIsImNhcHR1cmVKc0RvYyIsInRvbWRvYyIsImNhcHR1cmVUb21Eb2MiLCJjb21tZW50cyIsImNvbW1lbnQiLCJ0eXBlIiwiZG9jdHJpbmUiLCJwYXJzZSIsInVud3JhcCIsImxpbmVzIiwiaSIsIm1hdGNoIiwicHVzaCIsInRyaW0iLCJzdGF0dXNNYXRjaCIsImRlc2NyaXB0aW9uIiwidGFncyIsInRpdGxlIiwidG9Mb3dlckNhc2UiLCJzdXBwb3J0ZWRJbXBvcnRUeXBlcyIsImZvciIsImNoaWxkQ29udGV4dCIsImNhY2hlS2V5IiwiZGlnZXN0IiwiZXhwb3J0TWFwIiwic3RhdHMiLCJmcyIsInN0YXRTeW5jIiwibXRpbWUiLCJzZXQiLCJjb250ZW50IiwicmVhZEZpbGVTeW5jIiwiZW5jb2RpbmciLCJ0ZXN0IiwibSIsImFzdCIsImlzTW9kdWxlIiwiZG9jc3R5bGUiLCJzZXR0aW5ncyIsInN0eWxlIiwiYyIsInQiLCJuYW1lc3BhY2VzIiwicmVtb3RlUGF0aCIsInJlc29sdmUiLCJyZWxhdGl2ZSIsInJlc29sdmVJbXBvcnQiLCJycCIsImdldE5hbWVzcGFjZSIsImlkZW50aWZpZXIiLCJhZGROYW1lc3BhY2UiLCJvYmplY3QiLCJuc2ZuIiwiT2JqZWN0IiwiZGVmaW5lUHJvcGVydHkiLCJjYXB0dXJlRGVwZW5kZW5jeSIsImlzT25seUltcG9ydGluZ1R5cGVzIiwiaW1wb3J0ZWRTcGVjaWZpZXJzIiwicCIsImRlY2xhcmF0aW9uTWV0YWRhdGEiLCJsb2MiLCJleGlzdGluZyIsImRlY2xhcmF0aW9ucyIsImFkZCIsImdldHRlciIsInRodW5rRm9yIiwibWFrZVNvdXJjZUNvZGUiLCJyZWFkVHNDb25maWciLCJ0c0NvbmZpZ0luZm8iLCJjd2QiLCJwYXJzZXJPcHRpb25zIiwidHNjb25maWdSb290RGlyIiwicHJvY2VzcyIsImdldEVudiIsImtleSIsImVudiIsInRzQ29uZmlnUGF0aCIsImpzb25UZXh0IiwidG9TdHJpbmciLCJyZXF1aXJlIiwiY29uZmlnIiwiaXNFc01vZHVsZUludGVyb3AiLCJ0c0NvbmZpZyIsImNvbXBpbGVyT3B0aW9ucyIsImVzTW9kdWxlSW50ZXJvcCIsImJvZHkiLCJleHBvcnRNZXRhIiwiZXhwb3J0S2luZCIsImRlY2xhcmF0aW9uSXNUeXBlIiwiaW1wb3J0S2luZCIsInNwZWNpZmllcnMiLCJzcGVjaWZpZXIiLCJucyIsImZpbmQiLCJzIiwiaWQiLCJuc291cmNlIiwiZXhwb3J0ZWQiLCJpc0VzTW9kdWxlSW50ZXJvcFRydWUiLCJleHBvcnRzIiwiZXhwb3J0ZWROYW1lIiwiZXhwcmVzc2lvbiIsImRlY2xUeXBlcyIsImV4cG9ydGVkRGVjbHMiLCJmaWx0ZXIiLCJkZWNsIiwibW9kdWxlQmxvY2tOb2RlIiwibmFtZXNwYWNlRGVjbCIsInBhdHRlcm4iLCJwcm9wZXJ0aWVzIiwiYXJndW1lbnQiLCJlbGVtZW50cyIsImVsZW1lbnQiLCJsZWZ0IiwicGFyc2VyUGF0aCIsInRleHQiLCJTb3VyY2VDb2RlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7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QUVELElBQUYsRUFBUWhGLEdBQVIsRUFBZixDQUFQLENBQ0QsQ0FDRiIsImZpbGUiOiJFeHBvcnRNYXAuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZnMgZnJvbSAnZnMnO1xuXG5pbXBvcnQgZG9jdHJpbmUgZnJvbSAnZG9jdHJpbmUnO1xuXG5pbXBvcnQgZGVidWcgZnJvbSAnZGVidWcnO1xuXG5pbXBvcnQgeyBTb3VyY2VDb2RlIH0gZnJvbSAnZXNsaW50JztcblxuaW1wb3J0IHBhcnNlIGZyb20gJ2VzbGludC1tb2R1bGUtdXRpbHMvcGFyc2UnO1xuaW1wb3J0IHJlc29sdmUgZnJvbSAnZXNsaW50LW1vZHVsZS11dGlscy9yZXNvbHZlJztcbmltcG9ydCBpc0lnbm9yZWQsIHsgaGFzVmFsaWRFeHRlbnNpb24gfSBmcm9tICdlc2xpbnQtbW9kdWxlLXV0aWxzL2lnbm9yZSc7XG5cbmltcG9ydCB7IGhhc2hPYmplY3QgfSBmcm9tICdlc2xpbnQtbW9kdWxlLXV0aWxzL2hhc2gnO1xuaW1wb3J0ICogYXMgdW5hbWJpZ3VvdXMgZnJvbSAnZXNsaW50LW1vZHVsZS11dGlscy91bmFtYmlndW91cyc7XG5cbmltcG9ydCB7IHRzQ29uZmlnTG9hZGVyIH0gZnJvbSAndHNjb25maWctcGF0aHMvbGliL3RzY29uZmlnLWxvYWRlcic7XG5cbmltcG9ydCBpbmNsdWRlcyBmcm9tICdhcnJheS1pbmNsdWRlcyc7XG5cbmxldCBwYXJzZUNvbmZpZ0ZpbGVUZXh0VG9Kc29uO1xuXG5jb25zdCBsb2cgPSBkZWJ1ZygnZXNsaW50LXBsdWdpbi1pbXBvcnQ6RXhwb3J0TWFwJyk7XG5cbmNvbnN0IGV4cG9ydENhY2hlID0gbmV3IE1hcCgpO1xuY29uc3QgdHNDb25maWdDYWNoZSA9IG5ldyBNYXAoKTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRXhwb3J0TWFwIHtcbiAgY29uc3RydWN0b3IocGF0aCkge1xuICAgIHRoaXMucGF0aCA9IHBhdGg7XG4gICAgdGhpcy5uYW1lc3BhY2UgPSBuZXcgTWFwKCk7XG4gICAgLy8gdG9kbzogcmVzdHJ1Y3R1cmUgdG8ga2V5IG9uIHBhdGgsIHZhbHVlIGlzIHJlc29sdmVyICsgbWFwIG9mIG5hbWVzXG4gICAgdGhpcy5yZWV4cG9ydHMgPSBuZXcgTWFwKCk7XG4gICAgLyoqXG4gICAgICogc3Rhci1leHBvcnRzXG4gICAgICogQHR5cGUge1NldH0gb2YgKCkgPT4gRXhwb3J0TWFwXG4gICAgICovXG4gICAgdGhpcy5kZXBlbmRlbmNpZXMgPSBuZXcgU2V0KCk7XG4gICAgLyoqXG4gICAgICogZGVwZW5kZW5jaWVzIG9mIHRoaXMgbW9kdWxlIHRoYXQgYXJlIG5vdCBleHBsaWNpdGx5IHJlLWV4cG9ydGVkXG4gICAgICogQHR5cGUge01hcH0gZnJvbSBwYXRoID0gKCkgPT4gRXhwb3J0TWFwXG4gICAgICovXG4gICAgdGhpcy5pbXBvcnRzID0gbmV3IE1hcCgpO1xuICAgIHRoaXMuZXJyb3JzID0gW107XG4gIH1cblxuICBnZXQgaGFzRGVmYXVsdCgpIHsgcmV0dXJuIHRoaXMuZ2V0KCdkZWZhdWx0JykgIT0gbnVsbDsgfSAvLyBzdHJvbmdlciB0aGFuIHRoaXMuaGFzXG5cbiAgZ2V0IHNpemUoKSB7XG4gICAgbGV0IHNpemUgPSB0aGlzLm5hbWVzcGFjZS5zaXplICsgdGhpcy5yZWV4cG9ydHMuc2l6ZTtcbiAgICB0aGlzLmRlcGVuZGVuY2llcy5mb3JFYWNoKGRlcCA9PiB7XG4gICAgICBjb25zdCBkID0gZGVwKCk7XG4gICAgICAvLyBDSlMgLyBpZ25vcmVkIGRlcGVuZGVuY2llcyB3b24ndCBleGlzdCAoIzcxNylcbiAgICAgIGlmIChkID09IG51bGwpIHJldHVybjtcbiAgICAgIHNpemUgKz0gZC5zaXplO1xuICAgIH0pO1xuICAgIHJldHVybiBzaXplO1xuICB9XG5cbiAgLyoqXG4gICAqIE5vdGUgdGhhdCB0aGlzIGRvZXMgbm90IGNoZWNrIGV4cGxpY2l0bHkgcmUtZXhwb3J0ZWQgbmFtZXMgZm9yIGV4aXN0ZW5jZVxuICAgKiBpbiB0aGUgYmFzZSBuYW1lc3BhY2UsIGJ1dCBpdCB3aWxsIGV4cGFuZCBhbGwgYGV4cG9ydCAqIGZyb20gJy4uLidgIGV4cG9ydHNcbiAgICogaWYgbm90IGZvdW5kIGluIHRoZSBleHBsaWNpdCBuYW1lc3BhY2UuXG4gICAqIEBwYXJhbSAge3N0cmluZ30gIG5hbWVcbiAgICogQHJldHVybiB7Qm9vbGVhbn0gdHJ1ZSBpZiBgbmFtZWAgaXMgZXhwb3J0ZWQgYnkgdGhpcyBtb2R1bGUuXG4gICAqL1xuICBoYXMobmFtZSkge1xuICAgIGlmICh0aGlzLm5hbWVzcGFjZS5oYXMobmFtZSkpIHJldHVybiB0cnVlO1xuICAgIGlmICh0aGlzLnJlZXhwb3J0cy5oYXMobmFtZSkpIHJldHVybiB0cnVlO1xuXG4gICAgLy8gZGVmYXVsdCBleHBvcnRzIG11c3QgYmUgZXhwbGljaXRseSByZS1leHBvcnRlZCAoIzMyOClcbiAgICBpZiAobmFtZSAhPT0gJ2RlZmF1bHQnKSB7XG4gICAgICBmb3IgKGNvbnN0IGRlcCBvZiB0aGlzLmRlcGVuZGVuY2llcykge1xuICAgICAgICBjb25zdCBpbm5lck1hcCA9IGRlcCgpO1xuXG4gICAgICAgIC8vIHRvZG86IHJlcG9ydCBhcyB1bnJlc29sdmVkP1xuICAgICAgICBpZiAoIWlubmVyTWFwKSBjb250aW51ZTtcblxuICAgICAgICBpZiAoaW5uZXJNYXAuaGFzKG5hbWUpKSByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogZW5zdXJlIHRoYXQgaW1wb3J0ZWQgbmFtZSBmdWxseSByZXNvbHZlcy5cbiAgICogQHBhcmFtICB7c3RyaW5nfSBuYW1lXG4gICAqIEByZXR1cm4ge3sgZm91bmQ6IGJvb2xlYW4sIHBhdGg6IEV4cG9ydE1hcFtdIH19XG4gICAqL1xuICBoYXNEZWVwKG5hbWUpIHtcbiAgICBpZiAodGhpcy5uYW1lc3BhY2UuaGFzKG5hbWUpKSByZXR1cm4geyBmb3VuZDogdHJ1ZSwgcGF0aDogW3RoaXNdIH07XG5cbiAgICBpZiAodGhpcy5yZWV4cG9ydHMuaGFzKG5hbWUpKSB7XG4gICAgICBjb25zdCByZWV4cG9ydHMgPSB0aGlzLnJlZXhwb3J0cy5nZXQobmFtZSk7XG4gICAgICBjb25zdCBpbXBvcnRlZCA9IHJlZXhwb3J0cy5nZXRJbXBvcnQoKTtcblxuICAgICAgLy8gaWYgaW1wb3J0IGlzIGlnbm9yZWQsIHJldHVybiBleHBsaWNpdCAnbnVsbCdcbiAgICAgIGlmIChpbXBvcnRlZCA9PSBudWxsKSByZXR1cm4geyBmb3VuZDogdHJ1ZSwgcGF0aDogW3RoaXNdIH07XG5cbiAgICAgIC8vIHNhZmVndWFyZCBhZ2FpbnN0IGN5Y2xlcywgb25seSBpZiBuYW1lIG1hdGNoZXNcbiAgICAgIGlmIChpbXBvcnRlZC5wYXRoID09PSB0aGlzLnBhdGggJiYgcmVleHBvcnRzLmxvY2FsID09PSBuYW1lKSB7XG4gICAgICAgIHJldHVybiB7IGZvdW5kOiBmYWxzZSwgcGF0aDogW3RoaXNdIH07XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGRlZXAgPSBpbXBvcnRlZC5oYXNEZWVwKHJlZXhwb3J0cy5sb2NhbCk7XG4gICAgICBkZWVwLnBhdGgudW5zaGlmdCh0aGlzKTtcblxuICAgICAgcmV0dXJuIGRlZXA7XG4gICAgfVxuXG5cbiAgICAvLyBkZWZhdWx0IGV4cG9ydHMgbXVzdCBiZSBleHBsaWNpdGx5IHJlLWV4cG9ydGVkICgjMzI4KVxuICAgIGlmIChuYW1lICE9PSAnZGVmYXVsdCcpIHtcbiAgICAgIGZvciAoY29uc3QgZGVwIG9mIHRoaXMuZGVwZW5kZW5jaWVzKSB7XG4gICAgICAgIGNvbnN0IGlubmVyTWFwID0gZGVwKCk7XG4gICAgICAgIGlmIChpbm5lck1hcCA9PSBudWxsKSByZXR1cm4geyBmb3VuZDogdHJ1ZSwgcGF0aDogW3RoaXNdIH07XG4gICAgICAgIC8vIHRvZG86IHJlcG9ydCBhcyB1bnJlc29sdmVkP1xuICAgICAgICBpZiAoIWlubmVyTWFwKSBjb250aW51ZTtcblxuICAgICAgICAvLyBzYWZlZ3VhcmQgYWdhaW5zdCBjeWNsZXNcbiAgICAgICAgaWYgKGlubmVyTWFwLnBhdGggPT09IHRoaXMucGF0aCkgY29udGludWU7XG5cbiAgICAgICAgY29uc3QgaW5uZXJWYWx1ZSA9IGlubmVyTWFwLmhhc0RlZXAobmFtZSk7XG4gICAgICAgIGlmIChpbm5lclZhbHVlLmZvdW5kKSB7XG4gICAgICAgICAgaW5uZXJWYWx1ZS5wYXRoLnVuc2hpZnQodGhpcyk7XG4gICAgICAgICAgcmV0dXJuIGlubmVyVmFsdWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4geyBmb3VuZDogZmFsc2UsIHBhdGg6IFt0aGlzXSB9O1xuICB9XG5cbiAgZ2V0KG5hbWUpIHtcbiAgICBpZiAodGhpcy5uYW1lc3BhY2UuaGFzKG5hbWUpKSByZXR1cm4gdGhpcy5uYW1lc3BhY2UuZ2V0KG5hbWUpO1xuXG4gICAgaWYgKHRoaXMucmVleHBvcnRzLmhhcyhuYW1lKSkge1xuICAgICAgY29uc3QgcmVleHBvcnRzID0gdGhpcy5yZWV4cG9ydHMuZ2V0KG5hbWUpO1xuICAgICAgY29uc3QgaW1wb3J0ZWQgPSByZWV4cG9ydHMuZ2V0SW1wb3J0KCk7XG5cbiAgICAgIC8vIGlmIGltcG9ydCBpcyBpZ25vcmVkLCByZXR1cm4gZXhwbGljaXQgJ251bGwnXG4gICAgICBpZiAoaW1wb3J0ZWQgPT0gbnVsbCkgcmV0dXJuIG51bGw7XG5cbiAgICAgIC8vIHNhZmVndWFyZCBhZ2FpbnN0IGN5Y2xlcywgb25seSBpZiBuYW1lIG1hdGNoZXNcbiAgICAgIGlmIChpbXBvcnRlZC5wYXRoID09PSB0aGlzLnBhdGggJiYgcmVleHBvcnRzLmxvY2FsID09PSBuYW1lKSByZXR1cm4gdW5kZWZpbmVkO1xuXG4gICAgICByZXR1cm4gaW1wb3J0ZWQuZ2V0KHJlZXhwb3J0cy5sb2NhbCk7XG4gICAgfVxuXG4gICAgLy8gZGVmYXVsdCBleHBvcnRzIG11c3QgYmUgZXhwbGljaXRseSByZS1leHBvcnRlZCAoIzMyOClcbiAgICBpZiAobmFtZSAhPT0gJ2RlZmF1bHQnKSB7XG4gICAgICBmb3IgKGNvbnN0IGRlcCBvZiB0aGlzLmRlcGVuZGVuY2llcykge1xuICAgICAgICBjb25zdCBpbm5lck1hcCA9IGRlcCgpO1xuICAgICAgICAvLyB0b2RvOiByZXBvcnQgYXMgdW5yZXNvbHZlZD9cbiAgICAgICAgaWYgKCFpbm5lck1hcCkgY29udGludWU7XG5cbiAgICAgICAgLy8gc2FmZWd1YXJkIGFnYWluc3QgY3ljbGVzXG4gICAgICAgIGlmIChpbm5lck1hcC5wYXRoID09PSB0aGlzLnBhdGgpIGNvbnRpbnVlO1xuXG4gICAgICAgIGNvbnN0IGlubmVyVmFsdWUgPSBpbm5lck1hcC5nZXQobmFtZSk7XG4gICAgICAgIGlmIChpbm5lclZhbHVlICE9PSB1bmRlZmluZWQpIHJldHVybiBpbm5lclZhbHVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICBmb3JFYWNoKGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gICAgdGhpcy5uYW1lc3BhY2UuZm9yRWFjaCgodiwgbikgPT5cbiAgICAgIGNhbGxiYWNrLmNhbGwodGhpc0FyZywgdiwgbiwgdGhpcykpO1xuXG4gICAgdGhpcy5yZWV4cG9ydHMuZm9yRWFjaCgocmVleHBvcnRzLCBuYW1lKSA9PiB7XG4gICAgICBjb25zdCByZWV4cG9ydGVkID0gcmVleHBvcnRzLmdldEltcG9ydCgpO1xuICAgICAgLy8gY2FuJ3QgbG9vayB1cCBtZXRhIGZvciBpZ25vcmVkIHJlLWV4cG9ydHMgKCMzNDgpXG4gICAgICBjYWxsYmFjay5jYWxsKHRoaXNBcmcsIHJlZXhwb3J0ZWQgJiYgcmVleHBvcnRlZC5nZXQocmVleHBvcnRzLmxvY2FsKSwgbmFtZSwgdGhpcyk7XG4gICAgfSk7XG5cbiAgICB0aGlzLmRlcGVuZGVuY2llcy5mb3JFYWNoKGRlcCA9PiB7XG4gICAgICBjb25zdCBkID0gZGVwKCk7XG4gICAgICAvLyBDSlMgLyBpZ25vcmVkIGRlcGVuZGVuY2llcyB3b24ndCBleGlzdCAoIzcxNylcbiAgICAgIGlmIChkID09IG51bGwpIHJldHVybjtcblxuICAgICAgZC5mb3JFYWNoKCh2LCBuKSA9PlxuICAgICAgICBuICE9PSAnZGVmYXVsdCcgJiYgY2FsbGJhY2suY2FsbCh0aGlzQXJnLCB2LCBuLCB0aGlzKSk7XG4gICAgfSk7XG4gIH1cblxuICAvLyB0b2RvOiBrZXlzLCB2YWx1ZXMsIGVudHJpZXM/XG5cbiAgcmVwb3J0RXJyb3JzKGNvbnRleHQsIGRlY2xhcmF0aW9uKSB7XG4gICAgY29udGV4dC5yZXBvcnQoe1xuICAgICAgbm9kZTogZGVjbGFyYXRpb24uc291cmNlLFxuICAgICAgbWVzc2FnZTogYFBhcnNlIGVycm9ycyBpbiBpbXBvcnRlZCBtb2R1bGUgJyR7ZGVjbGFyYXRpb24uc291cmNlLnZhbHVlfSc6IGAgK1xuICAgICAgICAgICAgICAgICAgYCR7dGhpcy5lcnJvcnNcbiAgICAgICAgICAgICAgICAgICAgLm1hcChlID0+IGAke2UubWVzc2FnZX0gKCR7ZS5saW5lTnVtYmVyfToke2UuY29sdW1ufSlgKVxuICAgICAgICAgICAgICAgICAgICAuam9pbignLCAnKX1gLFxuICAgIH0pO1xuICB9XG59XG5cbi8qKlxuICogcGFyc2UgZG9jcyBmcm9tIHRoZSBmaXJzdCBub2RlIHRoYXQgaGFzIGxlYWRpbmcgY29tbWVudHNcbiAqL1xuZnVuY3Rpb24gY2FwdHVyZURvYyhzb3VyY2UsIGRvY1N0eWxlUGFyc2VycywgLi4ubm9kZXMpIHtcbiAgY29uc3QgbWV0YWRhdGEgPSB7fTtcblxuICAvLyAnc29tZScgc2hvcnQtY2lyY3VpdHMgb24gZmlyc3QgJ3RydWUnXG4gIG5vZGVzLnNvbWUobiA9PiB7XG4gICAgdHJ5IHtcblxuICAgICAgbGV0IGxlYWRpbmdDb21tZW50cztcblxuICAgICAgLy8gbi5sZWFkaW5nQ29tbWVudHMgaXMgbGVnYWN5IGBhdHRhY2hDb21tZW50c2AgYmVoYXZpb3JcbiAgICAgIGlmICgnbGVhZGluZ0NvbW1lbnRzJyBpbiBuKSB7XG4gICAgICAgIGxlYWRpbmdDb21tZW50cyA9IG4ubGVhZGluZ0NvbW1lbnRzO1xuICAgICAgfSBlbHNlIGlmIChuLnJhbmdlKSB7XG4gICAgICAgIGxlYWRpbmdDb21tZW50cyA9IHNvdXJjZS5nZXRDb21tZW50c0JlZm9yZShuKTtcbiAgICAgIH1cblxuICAgICAgaWYgKCFsZWFkaW5nQ29tbWVudHMgfHwgbGVhZGluZ0NvbW1lbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIGZhbHNlO1xuXG4gICAgICBmb3IgKGNvbnN0IG5hbWUgaW4gZG9jU3R5bGVQYXJzZXJzKSB7XG4gICAgICAgIGNvbnN0IGRvYyA9IGRvY1N0eWxlUGFyc2Vyc1tuYW1lXShsZWFkaW5nQ29tbWVudHMpO1xuICAgICAgICBpZiAoZG9jKSB7XG4gICAgICAgICAgbWV0YWRhdGEuZG9jID0gZG9jO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIG1ldGFkYXRhO1xufVxuXG5jb25zdCBhdmFpbGFibGVEb2NTdHlsZVBhcnNlcnMgPSB7XG4gIGpzZG9jOiBjYXB0dXJlSnNEb2MsXG4gIHRvbWRvYzogY2FwdHVyZVRvbURvYyxcbn07XG5cbi8qKlxuICogcGFyc2UgSlNEb2MgZnJvbSBsZWFkaW5nIGNvbW1lbnRzXG4gKiBAcGFyYW0ge29iamVjdFtdfSBjb21tZW50c1xuICogQHJldHVybiB7eyBkb2M6IG9iamVjdCB9fVxuICovXG5mdW5jdGlvbiBjYXB0dXJlSnNEb2MoY29tbWVudHMpIHtcbiAgbGV0IGRvYztcblxuICAvLyBjYXB0dXJlIFhTRG9jXG4gIGNvbW1lbnRzLmZvckVhY2goY29tbWVudCA9PiB7XG4gICAgLy8gc2tpcCBub24tYmxvY2sgY29tbWVudHNcbiAgICBpZiAoY29tbWVudC50eXBlICE9PSAnQmxvY2snKSByZXR1cm47XG4gICAgdHJ5IHtcbiAgICAgIGRvYyA9IGRvY3RyaW5lLnBhcnNlKGNvbW1lbnQudmFsdWUsIHsgdW53cmFwOiB0cnVlIH0pO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgLyogZG9uJ3QgY2FyZSwgZm9yIG5vdz8gbWF5YmUgYWRkIHRvIGBlcnJvcnM/YCAqL1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIGRvYztcbn1cblxuLyoqXG4gICogcGFyc2UgVG9tRG9jIHNlY3Rpb24gZnJvbSBjb21tZW50c1xuICAqL1xuZnVuY3Rpb24gY2FwdHVyZVRvbURvYyhjb21tZW50cykge1xuICAvLyBjb2xsZWN0IGxpbmVzIHVwIHRvIGZpcnN0IHBhcmFncmFwaCBicmVha1xuICBjb25zdCBsaW5lcyA9IFtdO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgY29tbWVudCA9IGNvbW1lbnRzW2ldO1xuICAgIGlmIChjb21tZW50LnZhbHVlLm1hdGNoKC9eXFxzKiQvKSkgYnJlYWs7XG4gICAgbGluZXMucHVzaChjb21tZW50LnZhbHVlLnRyaW0oKSk7XG4gIH1cblxuICAvLyByZXR1cm4gZG9jdHJpbmUtbGlrZSBvYmplY3RcbiAgY29uc3Qgc3RhdHVzTWF0Y2ggPSBsaW5lcy5qb2luKCcgJykubWF0Y2goL14oUHVibGljfEludGVybmFsfERlcHJlY2F0ZWQpOlxccyooLispLyk7XG4gIGlmIChzdGF0dXNNYXRjaCkge1xuICAgIHJldHVybiB7XG4gICAgICBkZXNjcmlwdGlvbjogc3RhdHVzTWF0Y2hbMl0sXG4gICAgICB0YWdzOiBbe1xuICAgICAgICB0aXRsZTogc3RhdHVzTWF0Y2hbMV0udG9Mb3dlckNhc2UoKSxcbiAgICAgICAgZGVzY3JpcHRpb246IHN0YXR1c01hdGNoWzJdLFxuICAgICAgfV0sXG4gICAgfTtcbiAgfVxufVxuXG5jb25zdCBzdXBwb3J0ZWRJbXBvcnRUeXBlcyA9IG5ldyBTZXQoWydJbXBvcnREZWZhdWx0U3BlY2lmaWVyJywgJ0ltcG9ydE5hbWVzcGFjZVNwZWNpZmllciddKTtcblxuRXhwb3J0TWFwLmdldCA9IGZ1bmN0aW9uIChzb3VyY2UsIGNvbnRleHQpIHtcbiAgY29uc3QgcGF0aCA9IHJlc29sdmUoc291cmNlLCBjb250ZXh0KTtcbiAgaWYgKHBhdGggPT0gbnVsbCkgcmV0dXJuIG51bGw7XG5cbiAgcmV0dXJuIEV4cG9ydE1hcC5mb3IoY2hpbGRDb250ZXh0KHBhdGgsIGNvbnRleHQpKTtcbn07XG5cbkV4cG9ydE1hcC5mb3IgPSBmdW5jdGlvbiAoY29udGV4dCkge1xuICBjb25zdCB7IHBhdGggfSA9IGNvbnRleHQ7XG5cbiAgY29uc3QgY2FjaGVLZXkgPSBoYXNoT2JqZWN0KGNvbnRleHQpLmRpZ2VzdCgnaGV4Jyk7XG4gIGxldCBleHBvcnRNYXAgPSBleHBvcnRDYWNoZS5nZXQoY2FjaGVLZXkpO1xuXG4gIC8vIHJldHVybiBjYWNoZWQgaWdub3JlXG4gIGlmIChleHBvcnRNYXAgPT09IG51bGwpIHJldHVybiBudWxsO1xuXG4gIGNvbnN0IHN0YXRzID0gZnMuc3RhdFN5bmMocGF0aCk7XG4gIGlmIChleHBvcnRNYXAgIT0gbnVsbCkge1xuICAgIC8vIGRhdGUgZXF1YWxpdHkgY2hlY2tcbiAgICBpZiAoZXhwb3J0TWFwLm10aW1lIC0gc3RhdHMubXRpbWUgPT09IDApIHtcbiAgICAgIHJldHVybiBleHBvcnRNYXA7XG4gICAgfVxuICAgIC8vIGZ1dHVyZTogY2hlY2sgY29udGVudCBlcXVhbGl0eT9cbiAgfVxuXG4gIC8vIGNoZWNrIHZhbGlkIGV4dGVuc2lvbnMgZmlyc3RcbiAgaWYgKCFoYXNWYWxpZEV4dGVuc2lvbihwYXRoLCBjb250ZXh0KSkge1xuICAgIGV4cG9ydENhY2hlLnNldChjYWNoZUtleSwgbnVsbCk7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICAvLyBjaGVjayBmb3IgYW5kIGNhY2hlIGlnbm9yZVxuICBpZiAoaXNJZ25vcmVkKHBhdGgsIGNvbnRleHQpKSB7XG4gICAgbG9nKCdpZ25vcmVkIHBhdGggZHVlIHRvIGlnbm9yZSBzZXR0aW5nczonLCBwYXRoKTtcbiAgICBleHBvcnRDYWNoZS5zZXQoY2FjaGVLZXksIG51bGwpO1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgY29uc3QgY29udGVudCA9IGZzLnJlYWRGaWxlU3luYyhwYXRoLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XG5cbiAgLy8gY2hlY2sgZm9yIGFuZCBjYWNoZSB1bmFtYmlndW91cyBtb2R1bGVzXG4gIGlmICghdW5hbWJpZ3VvdXMudGVzdChjb250ZW50KSkge1xuICAgIGxvZygnaWdub3JlZCBwYXRoIGR1ZSB0byB1bmFtYmlndW91cyByZWdleDonLCBwYXRoKTtcbiAgICBleHBvcnRDYWNoZS5zZXQoY2FjaGVLZXksIG51bGwpO1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgbG9nKCdjYWNoZSBtaXNzJywgY2FjaGVLZXksICdmb3IgcGF0aCcsIHBhdGgpO1xuICBleHBvcnRNYXAgPSBFeHBvcnRNYXAucGFyc2UocGF0aCwgY29udGVudCwgY29udGV4dCk7XG5cbiAgLy8gYW1iaWd1b3VzIG1vZHVsZXMgcmV0dXJuIG51bGxcbiAgaWYgKGV4cG9ydE1hcCA9PSBudWxsKSByZXR1cm4gbnVsbDtcblxuICBleHBvcnRNYXAubXRpbWUgPSBzdGF0cy5tdGltZTtcblxuICBleHBvcnRDYWNoZS5zZXQoY2FjaGVLZXksIGV4cG9ydE1hcCk7XG4gIHJldHVybiBleHBvcnRNYXA7XG59O1xuXG5cbkV4cG9ydE1hcC5wYXJzZSA9IGZ1bmN0aW9uIChwYXRoLCBjb250ZW50LCBjb250ZXh0KSB7XG4gIGNvbnN0IG0gPSBuZXcgRXhwb3J0TWFwKHBhdGgpO1xuXG4gIGxldCBhc3Q7XG4gIHRyeSB7XG4gICAgYXN0ID0gcGFyc2UocGF0aCwgY29udGVudCwgY29udGV4dCk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGxvZygncGFyc2UgZXJyb3I6JywgcGF0aCwgZXJyKTtcbiAgICBtLmVycm9ycy5wdXNoKGVycik7XG4gICAgcmV0dXJuIG07IC8vIGNhbid0IGNvbnRpbnVlXG4gIH1cblxuICBpZiAoIXVuYW1iaWd1b3VzLmlzTW9kdWxlKGFzdCkpIHJldHVybiBudWxsO1xuXG4gIGNvbnN0IGRvY3N0eWxlID0gKGNvbnRleHQuc2V0dGluZ3MgJiYgY29udGV4dC5zZXR0aW5nc1snaW1wb3J0L2RvY3N0eWxlJ10pIHx8IFsnanNkb2MnXTtcbiAgY29uc3QgZG9jU3R5bGVQYXJzZXJzID0ge307XG4gIGRvY3N0eWxlLmZvckVhY2goc3R5bGUgPT4ge1xuICAgIGRvY1N0eWxlUGFyc2Vyc1tzdHlsZV0gPSBhdmFpbGFibGVEb2NTdHlsZVBhcnNlcnNbc3R5bGVdO1xuICB9KTtcblxuICAvLyBhdHRlbXB0IHRvIGNvbGxlY3QgbW9kdWxlIGRvY1xuICBpZiAoYXN0LmNvbW1lbnRzKSB7XG4gICAgYXN0LmNvbW1lbnRzLnNvbWUoYyA9PiB7XG4gICAgICBpZiAoYy50eXBlICE9PSAnQmxvY2snKSByZXR1cm4gZmFsc2U7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBkb2MgPSBkb2N0cmluZS5wYXJzZShjLnZhbHVlLCB7IHVud3JhcDogdHJ1ZSB9KTtcbiAgICAgICAgaWYgKGRvYy50YWdzLnNvbWUodCA9PiB0LnRpdGxlID09PSAnbW9kdWxlJykpIHtcbiAgICAgICAgICBtLmRvYyA9IGRvYztcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZXJyKSB7IC8qIGlnbm9yZSAqLyB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSk7XG4gIH1cblxuICBjb25zdCBuYW1lc3BhY2VzID0gbmV3IE1hcCgpO1xuXG4gIGZ1bmN0aW9uIHJlbW90ZVBhdGgodmFsdWUpIHtcbiAgICByZXR1cm4gcmVzb2x2ZS5yZWxhdGl2ZSh2YWx1ZSwgcGF0aCwgY29udGV4dC5zZXR0aW5ncyk7XG4gIH1cblxuICBmdW5jdGlvbiByZXNvbHZlSW1wb3J0KHZhbHVlKSB7XG4gICAgY29uc3QgcnAgPSByZW1vdGVQYXRoKHZhbHVlKTtcbiAgICBpZiAocnAgPT0gbnVsbCkgcmV0dXJuIG51bGw7XG4gICAgcmV0dXJuIEV4cG9ydE1hcC5mb3IoY2hpbGRDb250ZXh0KHJwLCBjb250ZXh0KSk7XG4gIH1cblxuICBmdW5jdGlvbiBnZXROYW1lc3BhY2UoaWRlbnRpZmllcikge1xuICAgIGlmICghbmFtZXNwYWNlcy5oYXMoaWRlbnRpZmllci5uYW1lKSkgcmV0dXJuO1xuXG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiByZXNvbHZlSW1wb3J0KG5hbWVzcGFjZXMuZ2V0KGlkZW50aWZpZXIubmFtZSkpO1xuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBhZGROYW1lc3BhY2Uob2JqZWN0LCBpZGVudGlmaWVyKSB7XG4gICAgY29uc3QgbnNmbiA9IGdldE5hbWVzcGFjZShpZGVudGlmaWVyKTtcbiAgICBpZiAobnNmbikge1xuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iamVjdCwgJ25hbWVzcGFjZScsIHsgZ2V0OiBuc2ZuIH0pO1xuICAgIH1cblxuICAgIHJldHVybiBvYmplY3Q7XG4gIH1cblxuICBmdW5jdGlvbiBjYXB0dXJlRGVwZW5kZW5jeSh7IHNvdXJjZSB9LCBpc09ubHlJbXBvcnRpbmdUeXBlcywgaW1wb3J0ZWRTcGVjaWZpZXJzID0gbmV3IFNldCgpKSB7XG4gICAgaWYgKHNvdXJjZSA9PSBudWxsKSByZXR1cm4gbnVsbDtcblxuICAgIGNvbnN0IHAgPSByZW1vdGVQYXRoKHNvdXJjZS52YWx1ZSk7XG4gICAgaWYgKHAgPT0gbnVsbCkgcmV0dXJuIG51bGw7XG5cbiAgICBjb25zdCBkZWNsYXJhdGlvbk1ldGFkYXRhID0ge1xuICAgICAgLy8gY2FwdHVyaW5nIGFjdHVhbCBub2RlIHJlZmVyZW5jZSBob2xkcyBmdWxsIEFTVCBpbiBtZW1vcnkhXG4gICAgICBzb3VyY2U6IHsgdmFsdWU6IHNvdXJjZS52YWx1ZSwgbG9jOiBzb3VyY2UubG9jIH0sXG4gICAgICBpc09ubHlJbXBvcnRpbmdUeXBlcyxcbiAgICAgIGltcG9ydGVkU3BlY2lmaWVycyxcbiAgICB9O1xuXG4gICAgY29uc3QgZXhpc3RpbmcgPSBtLmltcG9ydHMuZ2V0KHApO1xuICAgIGlmIChleGlzdGluZyAhPSBudWxsKSB7XG4gICAgICBleGlzdGluZy5kZWNsYXJhdGlvbnMuYWRkKGRlY2xhcmF0aW9uTWV0YWRhdGEpO1xuICAgICAgcmV0dXJuIGV4aXN0aW5nLmdldHRlcjtcbiAgICB9XG5cbiAgICBjb25zdCBnZXR0ZXIgPSB0aHVua0ZvcihwLCBjb250ZXh0KTtcbiAgICBtLmltcG9ydHMuc2V0KHAsIHsgZ2V0dGVyLCBkZWNsYXJhdGlvbnM6IG5ldyBTZXQoW2RlY2xhcmF0aW9uTWV0YWRhdGFdKSB9KTtcbiAgICByZXR1cm4gZ2V0dGVyO1xuICB9XG5cbiAgY29uc3Qgc291cmNlID0gbWFrZVNvdXJjZUNvZGUoY29udGVudCwgYXN0KTtcblxuICBmdW5jdGlvbiByZWFkVHNDb25maWcoKSB7XG4gICAgY29uc3QgdHNDb25maWdJbmZvID0gdHNDb25maWdMb2FkZXIoe1xuICAgICAgY3dkOlxuICAgICAgICAoY29udGV4dC5wYXJzZXJPcHRpb25zICYmIGNvbnRleHQucGFyc2VyT3B0aW9ucy50c2NvbmZpZ1Jvb3REaXIpIHx8XG4gICAgICAgIHByb2Nlc3MuY3dkKCksXG4gICAgICBnZXRFbnY6IChrZXkpID0+IHByb2Nlc3MuZW52W2tleV0sXG4gICAgfSk7XG4gICAgdHJ5IHtcbiAgICAgIGlmICh0c0NvbmZpZ0luZm8udHNDb25maWdQYXRoICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY29uc3QganNvblRleHQgPSBmcy5yZWFkRmlsZVN5bmModHNDb25maWdJbmZvLnRzQ29uZmlnUGF0aCkudG9TdHJpbmcoKTtcbiAgICAgICAgaWYgKCFwYXJzZUNvbmZpZ0ZpbGVUZXh0VG9Kc29uKSB7XG4gICAgICAgICAgLy8gdGhpcyBpcyBiZWNhdXNlIHByb2plY3RzIG5vdCB1c2luZyBUeXBlU2NyaXB0IHdvbid0IGhhdmUgdHlwZXNjcmlwdCBpbnN0YWxsZWRcbiAgICAgICAgICAoeyBwYXJzZUNvbmZpZ0ZpbGVUZXh0VG9Kc29uIH0gPSByZXF1aXJlKCd0eXBlc2NyaXB0JykpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwYXJzZUNvbmZpZ0ZpbGVUZXh0VG9Kc29uKHRzQ29uZmlnSW5mby50c0NvbmZpZ1BhdGgsIGpzb25UZXh0KS5jb25maWc7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgLy8gQ2F0Y2ggYW55IGVycm9yc1xuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgZnVuY3Rpb24gaXNFc01vZHVsZUludGVyb3AoKSB7XG4gICAgY29uc3QgY2FjaGVLZXkgPSBoYXNoT2JqZWN0KHtcbiAgICAgIHRzY29uZmlnUm9vdERpcjogY29udGV4dC5wYXJzZXJPcHRpb25zICYmIGNvbnRleHQucGFyc2VyT3B0aW9ucy50c2NvbmZpZ1Jvb3REaXIsXG4gICAgfSkuZGlnZXN0KCdoZXgnKTtcbiAgICBsZXQgdHNDb25maWcgPSB0c0NvbmZpZ0NhY2hlLmdldChjYWNoZUtleSk7XG4gICAgaWYgKHR5cGVvZiB0c0NvbmZpZyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHRzQ29uZmlnID0gcmVhZFRzQ29uZmlnKCk7XG4gICAgICB0c0NvbmZpZ0NhY2hlLnNldChjYWNoZUtleSwgdHNDb25maWcpO1xuICAgIH1cblxuICAgIHJldHVybiB0c0NvbmZpZyAmJiB0c0NvbmZpZy5jb21waWxlck9wdGlvbnMgPyB0c0NvbmZpZy5jb21waWxlck9wdGlvbnMuZXNNb2R1bGVJbnRlcm9wIDogZmFsc2U7XG4gIH1cblxuICBhc3QuYm9keS5mb3JFYWNoKGZ1bmN0aW9uIChuKSB7XG4gICAgaWYgKG4udHlwZSA9PT0gJ0V4cG9ydERlZmF1bHREZWNsYXJhdGlvbicpIHtcbiAgICAgIGNvbnN0IGV4cG9ydE1ldGEgPSBjYXB0dXJlRG9jKHNvdXJjZSwgZG9jU3R5bGVQYXJzZXJzLCBuKTtcbiAgICAgIGlmIChuLmRlY2xhcmF0aW9uLnR5cGUgPT09ICdJZGVudGlmaWVyJykge1xuICAgICAgICBhZGROYW1lc3BhY2UoZXhwb3J0TWV0YSwgbi5kZWNsYXJhdGlvbik7XG4gICAgICB9XG4gICAgICBtLm5hbWVzcGFjZS5zZXQoJ2RlZmF1bHQnLCBleHBvcnRNZXRhKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAobi50eXBlID09PSAnRXhwb3J0QWxsRGVjbGFyYXRpb24nKSB7XG4gICAgICBjb25zdCBnZXR0ZXIgPSBjYXB0dXJlRGVwZW5kZW5jeShuLCBuLmV4cG9ydEtpbmQgPT09ICd0eXBlJyk7XG4gICAgICBpZiAoZ2V0dGVyKSBtLmRlcGVuZGVuY2llcy5hZGQoZ2V0dGVyKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBjYXB0dXJlIG5hbWVzcGFjZXMgaW4gY2FzZSBvZiBsYXRlciBleHBvcnRcbiAgICBpZiAobi50eXBlID09PSAnSW1wb3J0RGVjbGFyYXRpb24nKSB7XG4gICAgICAvLyBpbXBvcnQgdHlwZSB7IEZvbyB9IChUUyBhbmQgRmxvdylcbiAgICAgIGNvbnN0IGRlY2xhcmF0aW9uSXNUeXBlID0gbi5pbXBvcnRLaW5kID09PSAndHlwZSc7XG4gICAgICBsZXQgaXNPbmx5SW1wb3J0aW5nVHlwZXMgPSBkZWNsYXJhdGlvbklzVHlwZTtcbiAgICAgIGNvbnN0IGltcG9ydGVkU3BlY2lmaWVycyA9IG5ldyBTZXQoKTtcbiAgICAgIG4uc3BlY2lmaWVycy5mb3JFYWNoKHNwZWNpZmllciA9PiB7XG4gICAgICAgIGlmIChzdXBwb3J0ZWRJbXBvcnRUeXBlcy5oYXMoc3BlY2lmaWVyLnR5cGUpKSB7XG4gICAgICAgICAgaW1wb3J0ZWRTcGVjaWZpZXJzLmFkZChzcGVjaWZpZXIudHlwZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNwZWNpZmllci50eXBlID09PSAnSW1wb3J0U3BlY2lmaWVyJykge1xuICAgICAgICAgIGltcG9ydGVkU3BlY2lmaWVycy5hZGQoc3BlY2lmaWVyLmltcG9ydGVkLm5hbWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gaW1wb3J0IHsgdHlwZSBGb28gfSAoRmxvdylcbiAgICAgICAgaWYgKCFkZWNsYXJhdGlvbklzVHlwZSkge1xuICAgICAgICAgIGlzT25seUltcG9ydGluZ1R5cGVzID0gc3BlY2lmaWVyLmltcG9ydEtpbmQgPT09ICd0eXBlJztcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBjYXB0dXJlRGVwZW5kZW5jeShuLCBpc09ubHlJbXBvcnRpbmdUeXBlcywgaW1wb3J0ZWRTcGVjaWZpZXJzKTtcblxuICAgICAgY29uc3QgbnMgPSBuLnNwZWNpZmllcnMuZmluZChzID0+IHMudHlwZSA9PT0gJ0ltcG9ydE5hbWVzcGFjZVNwZWNpZmllcicpO1xuICAgICAgaWYgKG5zKSB7XG4gICAgICAgIG5hbWVzcGFjZXMuc2V0KG5zLmxvY2FsLm5hbWUsIG4uc291cmNlLnZhbHVlKTtcbiAgICAgIH1cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAobi50eXBlID09PSAnRXhwb3J0TmFtZWREZWNsYXJhdGlvbicpIHtcbiAgICAgIC8vIGNhcHR1cmUgZGVjbGFyYXRpb25cbiAgICAgIGlmIChuLmRlY2xhcmF0aW9uICE9IG51bGwpIHtcbiAgICAgICAgc3dpdGNoIChuLmRlY2xhcmF0aW9uLnR5cGUpIHtcbiAgICAgICAgY2FzZSAnRnVuY3Rpb25EZWNsYXJhdGlvbic6XG4gICAgICAgIGNhc2UgJ0NsYXNzRGVjbGFyYXRpb24nOlxuICAgICAgICBjYXNlICdUeXBlQWxpYXMnOiAvLyBmbG93dHlwZSB3aXRoIGJhYmVsLWVzbGludCBwYXJzZXJcbiAgICAgICAgY2FzZSAnSW50ZXJmYWNlRGVjbGFyYXRpb24nOlxuICAgICAgICBjYXNlICdEZWNsYXJlRnVuY3Rpb24nOlxuICAgICAgICBjYXNlICdUU0RlY2xhcmVGdW5jdGlvbic6XG4gICAgICAgIGNhc2UgJ1RTRW51bURlY2xhcmF0aW9uJzpcbiAgICAgICAgY2FzZSAnVFNUeXBlQWxpYXNEZWNsYXJhdGlvbic6XG4gICAgICAgIGNhc2UgJ1RTSW50ZXJmYWNlRGVjbGFyYXRpb24nOlxuICAgICAgICBjYXNlICdUU0Fic3RyYWN0Q2xhc3NEZWNsYXJhdGlvbic6XG4gICAgICAgIGNhc2UgJ1RTTW9kdWxlRGVjbGFyYXRpb24nOlxuICAgICAgICAgIG0ubmFtZXNwYWNlLnNldChuLmRlY2xhcmF0aW9uLmlkLm5hbWUsIGNhcHR1cmVEb2Moc291cmNlLCBkb2NTdHlsZVBhcnNlcnMsIG4pKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnVmFyaWFibGVEZWNsYXJhdGlvbic6XG4gICAgICAgICAgbi5kZWNsYXJhdGlvbi5kZWNsYXJhdGlvbnMuZm9yRWFjaCgoZCkgPT5cbiAgICAgICAgICAgIHJlY3Vyc2l2ZVBhdHRlcm5DYXB0dXJlKGQuaWQsXG4gICAgICAgICAgICAgIGlkID0+IG0ubmFtZXNwYWNlLnNldChpZC5uYW1lLCBjYXB0dXJlRG9jKHNvdXJjZSwgZG9jU3R5bGVQYXJzZXJzLCBkLCBuKSkpKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBjb25zdCBuc291cmNlID0gbi5zb3VyY2UgJiYgbi5zb3VyY2UudmFsdWU7XG4gICAgICBuLnNwZWNpZmllcnMuZm9yRWFjaCgocykgPT4ge1xuICAgICAgICBjb25zdCBleHBvcnRNZXRhID0ge307XG4gICAgICAgIGxldCBsb2NhbDtcblxuICAgICAgICBzd2l0Y2ggKHMudHlwZSkge1xuICAgICAgICBjYXNlICdFeHBvcnREZWZhdWx0U3BlY2lmaWVyJzpcbiAgICAgICAgICBpZiAoIW4uc291cmNlKSByZXR1cm47XG4gICAgICAgICAgbG9jYWwgPSAnZGVmYXVsdCc7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ0V4cG9ydE5hbWVzcGFjZVNwZWNpZmllcic6XG4gICAgICAgICAgbS5uYW1lc3BhY2Uuc2V0KHMuZXhwb3J0ZWQubmFtZSwgT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydE1ldGEsICduYW1lc3BhY2UnLCB7XG4gICAgICAgICAgICBnZXQoKSB7IHJldHVybiByZXNvbHZlSW1wb3J0KG5zb3VyY2UpOyB9LFxuICAgICAgICAgIH0pKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNhc2UgJ0V4cG9ydFNwZWNpZmllcic6XG4gICAgICAgICAgaWYgKCFuLnNvdXJjZSkge1xuICAgICAgICAgICAgbS5uYW1lc3BhY2Uuc2V0KHMuZXhwb3J0ZWQubmFtZSwgYWRkTmFtZXNwYWNlKGV4cG9ydE1ldGEsIHMubG9jYWwpKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gZWxzZSBmYWxscyB0aHJvdWdoXG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgbG9jYWwgPSBzLmxvY2FsLm5hbWU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICAvLyB0b2RvOiBKU0RvY1xuICAgICAgICBtLnJlZXhwb3J0cy5zZXQocy5leHBvcnRlZC5uYW1lLCB7IGxvY2FsLCBnZXRJbXBvcnQ6ICgpID0+IHJlc29sdmVJbXBvcnQobnNvdXJjZSkgfSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBjb25zdCBpc0VzTW9kdWxlSW50ZXJvcFRydWUgPSBpc0VzTW9kdWxlSW50ZXJvcCgpO1xuXG4gICAgY29uc3QgZXhwb3J0cyA9IFsnVFNFeHBvcnRBc3NpZ25tZW50J107XG4gICAgaWYgKGlzRXNNb2R1bGVJbnRlcm9wVHJ1ZSkge1xuICAgICAgZXhwb3J0cy5wdXNoKCdUU05hbWVzcGFjZUV4cG9ydERlY2xhcmF0aW9uJyk7XG4gICAgfVxuXG4gICAgLy8gVGhpcyBkb2Vzbid0IGRlY2xhcmUgYW55dGhpbmcsIGJ1dCBjaGFuZ2VzIHdoYXQncyBiZWluZyBleHBvcnRlZC5cbiAgICBpZiAoaW5jbHVkZXMoZXhwb3J0cywgbi50eXBlKSkge1xuICAgICAgY29uc3QgZXhwb3J0ZWROYW1lID0gbi50eXBlID09PSAnVFNOYW1lc3BhY2VFeHBvcnREZWNsYXJhdGlvbidcbiAgICAgICAgPyBuLmlkLm5hbWVcbiAgICAgICAgOiAobi5leHByZXNzaW9uICYmIG4uZXhwcmVzc2lvbi5uYW1lIHx8IChuLmV4cHJlc3Npb24uaWQgJiYgbi5leHByZXNzaW9uLmlkLm5hbWUpIHx8IG51bGwpO1xuICAgICAgY29uc3QgZGVjbFR5cGVzID0gW1xuICAgICAgICAnVmFyaWFibGVEZWNsYXJhdGlvbicsXG4gICAgICAgICdDbGFzc0RlY2xhcmF0aW9uJyxcbiAgICAgICAgJ1RTRGVjbGFyZUZ1bmN0aW9uJyxcbiAgICAgICAgJ1RTRW51bURlY2xhcmF0aW9uJyxcbiAgICAgICAgJ1RTVHlwZUFsaWFzRGVjbGFyYXRpb24nLFxuICAgICAgICAnVFNJbnRlcmZhY2VEZWNsYXJhdGlvbicsXG4gICAgICAgICdUU0Fic3RyYWN0Q2xhc3NEZWNsYXJhdGlvbicsXG4gICAgICAgICdUU01vZHVsZURlY2xhcmF0aW9uJyxcbiAgICAgIF07XG4gICAgICBjb25zdCBleHBvcnRlZERlY2xzID0gYXN0LmJvZHkuZmlsdGVyKCh7IHR5cGUsIGlkLCBkZWNsYXJhdGlvbnMgfSkgPT4gaW5jbHVkZXMoZGVjbFR5cGVzLCB0eXBlKSAmJiAoXG4gICAgICAgIChpZCAmJiBpZC5uYW1lID09PSBleHBvcnRlZE5hbWUpIHx8IChkZWNsYXJhdGlvbnMgJiYgZGVjbGFyYXRpb25zLmZpbmQoKGQpID0+IGQuaWQubmFtZSA9PT0gZXhwb3J0ZWROYW1lKSlcbiAgICAgICkpO1xuICAgICAgaWYgKGV4cG9ydGVkRGVjbHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIC8vIEV4cG9ydCBpcyBub3QgcmVmZXJlbmNpbmcgYW55IGxvY2FsIGRlY2xhcmF0aW9uLCBtdXN0IGJlIHJlLWV4cG9ydGluZ1xuICAgICAgICBtLm5hbWVzcGFjZS5zZXQoJ2RlZmF1bHQnLCBjYXB0dXJlRG9jKHNvdXJjZSwgZG9jU3R5bGVQYXJzZXJzLCBuKSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmIChpc0VzTW9kdWxlSW50ZXJvcFRydWUpIHtcbiAgICAgICAgbS5uYW1lc3BhY2Uuc2V0KCdkZWZhdWx0Jywge30pO1xuICAgICAgfVxuICAgICAgZXhwb3J0ZWREZWNscy5mb3JFYWNoKChkZWNsKSA9PiB7XG4gICAgICAgIGlmIChkZWNsLnR5cGUgPT09ICdUU01vZHVsZURlY2xhcmF0aW9uJykge1xuICAgICAgICAgIGlmIChkZWNsLmJvZHkgJiYgZGVjbC5ib2R5LnR5cGUgPT09ICdUU01vZHVsZURlY2xhcmF0aW9uJykge1xuICAgICAgICAgICAgbS5uYW1lc3BhY2Uuc2V0KGRlY2wuYm9keS5pZC5uYW1lLCBjYXB0dXJlRG9jKHNvdXJjZSwgZG9jU3R5bGVQYXJzZXJzLCBkZWNsLmJvZHkpKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKGRlY2wuYm9keSAmJiBkZWNsLmJvZHkuYm9keSkge1xuICAgICAgICAgICAgZGVjbC5ib2R5LmJvZHkuZm9yRWFjaCgobW9kdWxlQmxvY2tOb2RlKSA9PiB7XG4gICAgICAgICAgICAgIC8vIEV4cG9ydC1hc3NpZ25tZW50IGV4cG9ydHMgYWxsIG1lbWJlcnMgaW4gdGhlIG5hbWVzcGFjZSxcbiAgICAgICAgICAgICAgLy8gZXhwbGljaXRseSBleHBvcnRlZCBvciBub3QuXG4gICAgICAgICAgICAgIGNvbnN0IG5hbWVzcGFjZURlY2wgPSBtb2R1bGVCbG9ja05vZGUudHlwZSA9PT0gJ0V4cG9ydE5hbWVkRGVjbGFyYXRpb24nID9cbiAgICAgICAgICAgICAgICBtb2R1bGVCbG9ja05vZGUuZGVjbGFyYXRpb24gOlxuICAgICAgICAgICAgICAgIG1vZHVsZUJsb2NrTm9kZTtcblxuICAgICAgICAgICAgICBpZiAoIW5hbWVzcGFjZURlY2wpIHtcbiAgICAgICAgICAgICAgICAvLyBUeXBlU2NyaXB0IGNhbiBjaGVjayB0aGlzIGZvciB1czsgd2UgbmVlZG4ndFxuICAgICAgICAgICAgICB9IGVsc2UgaWYgKG5hbWVzcGFjZURlY2wudHlwZSA9PT0gJ1ZhcmlhYmxlRGVjbGFyYXRpb24nKSB7XG4gICAgICAgICAgICAgICAgbmFtZXNwYWNlRGVjbC5kZWNsYXJhdGlvbnMuZm9yRWFjaCgoZCkgPT5cbiAgICAgICAgICAgICAgICAgIHJlY3Vyc2l2ZVBhdHRlcm5DYXB0dXJlKGQuaWQsIChpZCkgPT4gbS5uYW1lc3BhY2Uuc2V0KFxuICAgICAgICAgICAgICAgICAgICBpZC5uYW1lLFxuICAgICAgICAgICAgICAgICAgICBjYXB0dXJlRG9jKHNvdXJjZSwgZG9jU3R5bGVQYXJzZXJzLCBkZWNsLCBuYW1lc3BhY2VEZWNsLCBtb2R1bGVCbG9ja05vZGUpXG4gICAgICAgICAgICAgICAgICApKVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbS5uYW1lc3BhY2Uuc2V0KFxuICAgICAgICAgICAgICAgICAgbmFtZXNwYWNlRGVjbC5pZC5uYW1lLFxuICAgICAgICAgICAgICAgICAgY2FwdHVyZURvYyhzb3VyY2UsIGRvY1N0eWxlUGFyc2VycywgbW9kdWxlQmxvY2tOb2RlKSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBFeHBvcnQgYXMgZGVmYXVsdFxuICAgICAgICAgIG0ubmFtZXNwYWNlLnNldCgnZGVmYXVsdCcsIGNhcHR1cmVEb2Moc291cmNlLCBkb2NTdHlsZVBhcnNlcnMsIGRlY2wpKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gbTtcbn07XG5cbi8qKlxuICogVGhlIGNyZWF0aW9uIG9mIHRoaXMgY2xvc3VyZSBpcyBpc29sYXRlZCBmcm9tIG90aGVyIHNjb3Blc1xuICogdG8gYXZvaWQgb3Zlci1yZXRlbnRpb24gb2YgdW5yZWxhdGVkIHZhcmlhYmxlcywgd2hpY2ggaGFzXG4gKiBjYXVzZWQgbWVtb3J5IGxlYWtzLiBTZWUgIzEyNjYuXG4gKi9cbmZ1bmN0aW9uIHRodW5rRm9yKHAsIGNvbnRleHQpIHtcbiAgcmV0dXJuICgpID0+IEV4cG9ydE1hcC5mb3IoY2hpbGRDb250ZXh0KHAsIGNvbnRleHQpKTtcbn1cblxuXG4vKipcbiAqIFRyYXZlcnNlIGEgcGF0dGVybi9pZGVudGlmaWVyIG5vZGUsIGNhbGxpbmcgJ2NhbGxiYWNrJ1xuICogZm9yIGVhY2ggbGVhZiBpZGVudGlmaWVyLlxuICogQHBhcmFtICB7bm9kZX0gICBwYXR0ZXJuXG4gKiBAcGFyYW0gIHtGdW5jdGlvbn0gY2FsbGJhY2tcbiAqIEByZXR1cm4ge3ZvaWR9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWN1cnNpdmVQYXR0ZXJuQ2FwdHVyZShwYXR0ZXJuLCBjYWxsYmFjaykge1xuICBzd2l0Y2ggKHBhdHRlcm4udHlwZSkge1xuICBjYXNlICdJZGVudGlmaWVyJzogLy8gYmFzZSBjYXNlXG4gICAgY2FsbGJhY2socGF0dGVybik7XG4gICAgYnJlYWs7XG5cbiAgY2FzZSAnT2JqZWN0UGF0dGVybic6XG4gICAgcGF0dGVybi5wcm9wZXJ0aWVzLmZvckVhY2gocCA9PiB7XG4gICAgICBpZiAocC50eXBlID09PSAnRXhwZXJpbWVudGFsUmVzdFByb3BlcnR5JyB8fCBwLnR5cGUgPT09ICdSZXN0RWxlbWVudCcpIHtcbiAgICAgICAgY2FsbGJhY2socC5hcmd1bWVudCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHJlY3Vyc2l2ZVBhdHRlcm5DYXB0dXJlKHAudmFsdWUsIGNhbGxiYWNrKTtcbiAgICB9KTtcbiAgICBicmVhaztcblxuICBjYXNlICdBcnJheVBhdHRlcm4nOlxuICAgIHBhdHRlcm4uZWxlbWVudHMuZm9yRWFjaCgoZWxlbWVudCkgPT4ge1xuICAgICAgaWYgKGVsZW1lbnQgPT0gbnVsbCkgcmV0dXJuO1xuICAgICAgaWYgKGVsZW1lbnQudHlwZSA9PT0gJ0V4cGVyaW1lbnRhbFJlc3RQcm9wZXJ0eScgfHwgZWxlbWVudC50eXBlID09PSAnUmVzdEVsZW1lbnQnKSB7XG4gICAgICAgIGNhbGxiYWNrKGVsZW1lbnQuYXJndW1lbnQpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICByZWN1cnNpdmVQYXR0ZXJuQ2FwdHVyZShlbGVtZW50LCBjYWxsYmFjayk7XG4gICAgfSk7XG4gICAgYnJlYWs7XG5cbiAgY2FzZSAnQXNzaWdubWVudFBhdHRlcm4nOlxuICAgIGNhbGxiYWNrKHBhdHRlcm4ubGVmdCk7XG4gICAgYnJlYWs7XG4gIH1cbn1cblxuLyoqXG4gKiBkb24ndCBob2xkIGZ1bGwgY29udGV4dCBvYmplY3QgaW4gbWVtb3J5LCBqdXN0IGdyYWIgd2hhdCB3ZSBuZWVkLlxuICovXG5mdW5jdGlvbiBjaGlsZENvbnRleHQocGF0aCwgY29udGV4dCkge1xuICBjb25zdCB7IHNldHRpbmdzLCBwYXJzZXJPcHRpb25zLCBwYXJzZXJQYXRoIH0gPSBjb250ZXh0O1xuICByZXR1cm4ge1xuICAgIHNldHRpbmdzLFxuICAgIHBhcnNlck9wdGlvbnMsXG4gICAgcGFyc2VyUGF0aCxcbiAgICBwYXRoLFxuICB9O1xufVxuXG5cbi8qKlxuICogc29tZXRpbWVzIGxlZ2FjeSBzdXBwb3J0IGlzbid0IF90aGF0XyBoYXJkLi4uIHJpZ2h0P1xuICovXG5mdW5jdGlvbiBtYWtlU291cmNlQ29kZSh0ZXh0LCBhc3QpIHtcbiAgaWYgKFNvdXJjZUNvZGUubGVuZ3RoID4gMSkge1xuICAgIC8vIEVTTGludCAzXG4gICAgcmV0dXJuIG5ldyBTb3VyY2VDb2RlKHRleHQsIGFzdCk7XG4gIH0gZWxzZSB7XG4gICAgLy8gRVNMaW50IDQsIDVcbiAgICByZXR1cm4gbmV3IFNvdXJjZUNvZGUoeyB0ZXh0LCBhc3QgfSk7XG4gIH1cbn1cbiJdfQ==