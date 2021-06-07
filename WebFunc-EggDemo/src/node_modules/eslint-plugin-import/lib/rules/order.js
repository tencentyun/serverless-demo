'use strict';var _slicedToArray = function () {function sliceIterator(arr, i) {var _arr = [];var _n = true;var _d = false;var _e = undefined;try {for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {_arr.push(_s.value);if (i && _arr.length === i) break;}} catch (err) {_d = true;_e = err;} finally {try {if (!_n && _i["return"]) _i["return"]();} finally {if (_d) throw _e;}}return _arr;}return function (arr, i) {if (Array.isArray(arr)) {return arr;} else if (Symbol.iterator in Object(arr)) {return sliceIterator(arr, i);} else {throw new TypeError("Invalid attempt to destructure non-iterable instance");}};}();

var _minimatch = require('minimatch');var _minimatch2 = _interopRequireDefault(_minimatch);
var _importType = require('../core/importType');var _importType2 = _interopRequireDefault(_importType);
var _staticRequire = require('../core/staticRequire');var _staticRequire2 = _interopRequireDefault(_staticRequire);
var _docsUrl = require('../docsUrl');var _docsUrl2 = _interopRequireDefault(_docsUrl);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const defaultGroups = ['builtin', 'external', 'parent', 'sibling', 'index'];

// REPORTING AND FIXING

function reverse(array) {
  return array.map(function (v) {
    return Object.assign({}, v, { rank: -v.rank });
  }).reverse();
}

function getTokensOrCommentsAfter(sourceCode, node, count) {
  let currentNodeOrToken = node;
  const result = [];
  for (let i = 0; i < count; i++) {
    currentNodeOrToken = sourceCode.getTokenOrCommentAfter(currentNodeOrToken);
    if (currentNodeOrToken == null) {
      break;
    }
    result.push(currentNodeOrToken);
  }
  return result;
}

function getTokensOrCommentsBefore(sourceCode, node, count) {
  let currentNodeOrToken = node;
  const result = [];
  for (let i = 0; i < count; i++) {
    currentNodeOrToken = sourceCode.getTokenOrCommentBefore(currentNodeOrToken);
    if (currentNodeOrToken == null) {
      break;
    }
    result.push(currentNodeOrToken);
  }
  return result.reverse();
}

function takeTokensAfterWhile(sourceCode, node, condition) {
  const tokens = getTokensOrCommentsAfter(sourceCode, node, 100);
  const result = [];
  for (let i = 0; i < tokens.length; i++) {
    if (condition(tokens[i])) {
      result.push(tokens[i]);
    } else
    {
      break;
    }
  }
  return result;
}

function takeTokensBeforeWhile(sourceCode, node, condition) {
  const tokens = getTokensOrCommentsBefore(sourceCode, node, 100);
  const result = [];
  for (let i = tokens.length - 1; i >= 0; i--) {
    if (condition(tokens[i])) {
      result.push(tokens[i]);
    } else
    {
      break;
    }
  }
  return result.reverse();
}

function findOutOfOrder(imported) {
  if (imported.length === 0) {
    return [];
  }
  let maxSeenRankNode = imported[0];
  return imported.filter(function (importedModule) {
    const res = importedModule.rank < maxSeenRankNode.rank;
    if (maxSeenRankNode.rank < importedModule.rank) {
      maxSeenRankNode = importedModule;
    }
    return res;
  });
}

function findRootNode(node) {
  let parent = node;
  while (parent.parent != null && parent.parent.body == null) {
    parent = parent.parent;
  }
  return parent;
}

function findEndOfLineWithComments(sourceCode, node) {
  const tokensToEndOfLine = takeTokensAfterWhile(sourceCode, node, commentOnSameLineAs(node));
  const endOfTokens = tokensToEndOfLine.length > 0 ?
  tokensToEndOfLine[tokensToEndOfLine.length - 1].range[1] :
  node.range[1];
  let result = endOfTokens;
  for (let i = endOfTokens; i < sourceCode.text.length; i++) {
    if (sourceCode.text[i] === '\n') {
      result = i + 1;
      break;
    }
    if (sourceCode.text[i] !== ' ' && sourceCode.text[i] !== '\t' && sourceCode.text[i] !== '\r') {
      break;
    }
    result = i + 1;
  }
  return result;
}

function commentOnSameLineAs(node) {
  return token => (token.type === 'Block' || token.type === 'Line') &&
  token.loc.start.line === token.loc.end.line &&
  token.loc.end.line === node.loc.end.line;
}

function findStartOfLineWithComments(sourceCode, node) {
  const tokensToEndOfLine = takeTokensBeforeWhile(sourceCode, node, commentOnSameLineAs(node));
  const startOfTokens = tokensToEndOfLine.length > 0 ? tokensToEndOfLine[0].range[0] : node.range[0];
  let result = startOfTokens;
  for (let i = startOfTokens - 1; i > 0; i--) {
    if (sourceCode.text[i] !== ' ' && sourceCode.text[i] !== '\t') {
      break;
    }
    result = i;
  }
  return result;
}

function isPlainRequireModule(node) {
  if (node.type !== 'VariableDeclaration') {
    return false;
  }
  if (node.declarations.length !== 1) {
    return false;
  }
  const decl = node.declarations[0];
  const result = decl.id && (
  decl.id.type === 'Identifier' || decl.id.type === 'ObjectPattern') &&
  decl.init != null &&
  decl.init.type === 'CallExpression' &&
  decl.init.callee != null &&
  decl.init.callee.name === 'require' &&
  decl.init.arguments != null &&
  decl.init.arguments.length === 1 &&
  decl.init.arguments[0].type === 'Literal';
  return result;
}

function isPlainImportModule(node) {
  return node.type === 'ImportDeclaration' && node.specifiers != null && node.specifiers.length > 0;
}

function isPlainImportEquals(node) {
  return node.type === 'TSImportEqualsDeclaration' && node.moduleReference.expression;
}

function canCrossNodeWhileReorder(node) {
  return isPlainRequireModule(node) || isPlainImportModule(node) || isPlainImportEquals(node);
}

function canReorderItems(firstNode, secondNode) {
  const parent = firstNode.parent;var _sort =
  [
  parent.body.indexOf(firstNode),
  parent.body.indexOf(secondNode)].
  sort(),_sort2 = _slicedToArray(_sort, 2);const firstIndex = _sort2[0],secondIndex = _sort2[1];
  const nodesBetween = parent.body.slice(firstIndex, secondIndex + 1);
  for (const nodeBetween of nodesBetween) {
    if (!canCrossNodeWhileReorder(nodeBetween)) {
      return false;
    }
  }
  return true;
}

function fixOutOfOrder(context, firstNode, secondNode, order) {
  const sourceCode = context.getSourceCode();

  const firstRoot = findRootNode(firstNode.node);
  const firstRootStart = findStartOfLineWithComments(sourceCode, firstRoot);
  const firstRootEnd = findEndOfLineWithComments(sourceCode, firstRoot);

  const secondRoot = findRootNode(secondNode.node);
  const secondRootStart = findStartOfLineWithComments(sourceCode, secondRoot);
  const secondRootEnd = findEndOfLineWithComments(sourceCode, secondRoot);
  const canFix = canReorderItems(firstRoot, secondRoot);

  let newCode = sourceCode.text.substring(secondRootStart, secondRootEnd);
  if (newCode[newCode.length - 1] !== '\n') {
    newCode = newCode + '\n';
  }

  const message = `\`${secondNode.displayName}\` import should occur ${order} import of \`${firstNode.displayName}\``;

  if (order === 'before') {
    context.report({
      node: secondNode.node,
      message: message,
      fix: canFix && (fixer =>
      fixer.replaceTextRange(
      [firstRootStart, secondRootEnd],
      newCode + sourceCode.text.substring(firstRootStart, secondRootStart))) });


  } else if (order === 'after') {
    context.report({
      node: secondNode.node,
      message: message,
      fix: canFix && (fixer =>
      fixer.replaceTextRange(
      [secondRootStart, firstRootEnd],
      sourceCode.text.substring(secondRootEnd, firstRootEnd) + newCode)) });


  }
}

function reportOutOfOrder(context, imported, outOfOrder, order) {
  outOfOrder.forEach(function (imp) {
    const found = imported.find(function hasHigherRank(importedItem) {
      return importedItem.rank > imp.rank;
    });
    fixOutOfOrder(context, found, imp, order);
  });
}

function makeOutOfOrderReport(context, imported) {
  const outOfOrder = findOutOfOrder(imported);
  if (!outOfOrder.length) {
    return;
  }
  // There are things to report. Try to minimize the number of reported errors.
  const reversedImported = reverse(imported);
  const reversedOrder = findOutOfOrder(reversedImported);
  if (reversedOrder.length < outOfOrder.length) {
    reportOutOfOrder(context, reversedImported, reversedOrder, 'after');
    return;
  }
  reportOutOfOrder(context, imported, outOfOrder, 'before');
}

function getSorter(ascending) {
  const multiplier = ascending ? 1 : -1;

  return function importsSorter(importA, importB) {
    let result;

    if (importA < importB) {
      result = -1;
    } else if (importA > importB) {
      result = 1;
    } else {
      result = 0;
    }

    return result * multiplier;
  };
}

function mutateRanksToAlphabetize(imported, alphabetizeOptions) {
  const groupedByRanks = imported.reduce(function (acc, importedItem) {
    if (!Array.isArray(acc[importedItem.rank])) {
      acc[importedItem.rank] = [];
    }
    acc[importedItem.rank].push(importedItem);
    return acc;
  }, {});

  const groupRanks = Object.keys(groupedByRanks);

  const sorterFn = getSorter(alphabetizeOptions.order === 'asc');
  const comparator = alphabetizeOptions.caseInsensitive ?
  (a, b) => sorterFn(String(a.value).toLowerCase(), String(b.value).toLowerCase()) :
  (a, b) => sorterFn(a.value, b.value);

  // sort imports locally within their group
  groupRanks.forEach(function (groupRank) {
    groupedByRanks[groupRank].sort(comparator);
  });

  // assign globally unique rank to each import
  let newRank = 0;
  const alphabetizedRanks = groupRanks.sort().reduce(function (acc, groupRank) {
    groupedByRanks[groupRank].forEach(function (importedItem) {
      acc[`${importedItem.value}|${importedItem.node.importKind}`] = parseInt(groupRank, 10) + newRank;
      newRank += 1;
    });
    return acc;
  }, {});

  // mutate the original group-rank with alphabetized-rank
  imported.forEach(function (importedItem) {
    importedItem.rank = alphabetizedRanks[`${importedItem.value}|${importedItem.node.importKind}`];
  });
}

// DETECTING

function computePathRank(ranks, pathGroups, path, maxPosition) {
  for (let i = 0, l = pathGroups.length; i < l; i++) {var _pathGroups$i =
    pathGroups[i];const pattern = _pathGroups$i.pattern,patternOptions = _pathGroups$i.patternOptions,group = _pathGroups$i.group;var _pathGroups$i$positio = _pathGroups$i.position;const position = _pathGroups$i$positio === undefined ? 1 : _pathGroups$i$positio;
    if ((0, _minimatch2.default)(path, pattern, patternOptions || { nocomment: true })) {
      return ranks[group] + position / maxPosition;
    }
  }
}

function computeRank(context, ranks, importEntry, excludedImportTypes) {
  let impType;
  let rank;
  if (importEntry.type === 'import:object') {
    impType = 'object';
  } else if (importEntry.node.importKind === 'type') {
    impType = 'type';
  } else {
    impType = (0, _importType2.default)(importEntry.value, context);
  }
  if (!excludedImportTypes.has(impType)) {
    rank = computePathRank(ranks.groups, ranks.pathGroups, importEntry.value, ranks.maxPosition);
  }
  if (typeof rank === 'undefined') {
    rank = ranks.groups[impType];
  }
  if (importEntry.type !== 'import' && !importEntry.type.startsWith('import:')) {
    rank += 100;
  }

  return rank;
}

function registerNode(context, importEntry, ranks, imported, excludedImportTypes) {
  const rank = computeRank(context, ranks, importEntry, excludedImportTypes);
  if (rank !== -1) {
    imported.push(Object.assign({}, importEntry, { rank }));
  }
}

function isModuleLevelRequire(node) {
  let n = node;
  // Handle cases like `const baz = require('foo').bar.baz`
  // and `const foo = require('foo')()`
  while (
  n.parent.type === 'MemberExpression' && n.parent.object === n ||
  n.parent.type === 'CallExpression' && n.parent.callee === n)
  {
    n = n.parent;
  }
  return (
    n.parent.type === 'VariableDeclarator' &&
    n.parent.parent.type === 'VariableDeclaration' &&
    n.parent.parent.parent.type === 'Program');

}

const types = ['builtin', 'external', 'internal', 'unknown', 'parent', 'sibling', 'index', 'object', 'type'];

// Creates an object with type-rank pairs.
// Example: { index: 0, sibling: 1, parent: 1, external: 1, builtin: 2, internal: 2 }
// Will throw an error if it contains a type that does not exist, or has a duplicate
function convertGroupsToRanks(groups) {
  const rankObject = groups.reduce(function (res, group, index) {
    if (typeof group === 'string') {
      group = [group];
    }
    group.forEach(function (groupItem) {
      if (types.indexOf(groupItem) === -1) {
        throw new Error('Incorrect configuration of the rule: Unknown type `' +
        JSON.stringify(groupItem) + '`');
      }
      if (res[groupItem] !== undefined) {
        throw new Error('Incorrect configuration of the rule: `' + groupItem + '` is duplicated');
      }
      res[groupItem] = index;
    });
    return res;
  }, {});

  const omittedTypes = types.filter(function (type) {
    return rankObject[type] === undefined;
  });

  return omittedTypes.reduce(function (res, type) {
    res[type] = groups.length;
    return res;
  }, rankObject);
}

function convertPathGroupsForRanks(pathGroups) {
  const after = {};
  const before = {};

  const transformed = pathGroups.map((pathGroup, index) => {const
    group = pathGroup.group,positionString = pathGroup.position;
    let position = 0;
    if (positionString === 'after') {
      if (!after[group]) {
        after[group] = 1;
      }
      position = after[group]++;
    } else if (positionString === 'before') {
      if (!before[group]) {
        before[group] = [];
      }
      before[group].push(index);
    }

    return Object.assign({}, pathGroup, { position });
  });

  let maxPosition = 1;

  Object.keys(before).forEach(group => {
    const groupLength = before[group].length;
    before[group].forEach((groupIndex, index) => {
      transformed[groupIndex].position = -1 * (groupLength - index);
    });
    maxPosition = Math.max(maxPosition, groupLength);
  });

  Object.keys(after).forEach(key => {
    const groupNextPosition = after[key];
    maxPosition = Math.max(maxPosition, groupNextPosition - 1);
  });

  return {
    pathGroups: transformed,
    maxPosition: maxPosition > 10 ? Math.pow(10, Math.ceil(Math.log10(maxPosition))) : 10 };

}

function fixNewLineAfterImport(context, previousImport) {
  const prevRoot = findRootNode(previousImport.node);
  const tokensToEndOfLine = takeTokensAfterWhile(
  context.getSourceCode(), prevRoot, commentOnSameLineAs(prevRoot));

  let endOfLine = prevRoot.range[1];
  if (tokensToEndOfLine.length > 0) {
    endOfLine = tokensToEndOfLine[tokensToEndOfLine.length - 1].range[1];
  }
  return fixer => fixer.insertTextAfterRange([prevRoot.range[0], endOfLine], '\n');
}

function removeNewLineAfterImport(context, currentImport, previousImport) {
  const sourceCode = context.getSourceCode();
  const prevRoot = findRootNode(previousImport.node);
  const currRoot = findRootNode(currentImport.node);
  const rangeToRemove = [
  findEndOfLineWithComments(sourceCode, prevRoot),
  findStartOfLineWithComments(sourceCode, currRoot)];

  if (/^\s*$/.test(sourceCode.text.substring(rangeToRemove[0], rangeToRemove[1]))) {
    return fixer => fixer.removeRange(rangeToRemove);
  }
  return undefined;
}

function makeNewlinesBetweenReport(context, imported, newlinesBetweenImports) {
  const getNumberOfEmptyLinesBetween = (currentImport, previousImport) => {
    const linesBetweenImports = context.getSourceCode().lines.slice(
    previousImport.node.loc.end.line,
    currentImport.node.loc.start.line - 1);


    return linesBetweenImports.filter(line => !line.trim().length).length;
  };
  let previousImport = imported[0];

  imported.slice(1).forEach(function (currentImport) {
    const emptyLinesBetween = getNumberOfEmptyLinesBetween(currentImport, previousImport);

    if (newlinesBetweenImports === 'always' ||
    newlinesBetweenImports === 'always-and-inside-groups') {
      if (currentImport.rank !== previousImport.rank && emptyLinesBetween === 0) {
        context.report({
          node: previousImport.node,
          message: 'There should be at least one empty line between import groups',
          fix: fixNewLineAfterImport(context, previousImport) });

      } else if (currentImport.rank === previousImport.rank &&
      emptyLinesBetween > 0 &&
      newlinesBetweenImports !== 'always-and-inside-groups') {
        context.report({
          node: previousImport.node,
          message: 'There should be no empty line within import group',
          fix: removeNewLineAfterImport(context, currentImport, previousImport) });

      }
    } else if (emptyLinesBetween > 0) {
      context.report({
        node: previousImport.node,
        message: 'There should be no empty line between import groups',
        fix: removeNewLineAfterImport(context, currentImport, previousImport) });

    }

    previousImport = currentImport;
  });
}

function getAlphabetizeConfig(options) {
  const alphabetize = options.alphabetize || {};
  const order = alphabetize.order || 'ignore';
  const caseInsensitive = alphabetize.caseInsensitive || false;

  return { order, caseInsensitive };
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      url: (0, _docsUrl2.default)('order') },


    fixable: 'code',
    schema: [
    {
      type: 'object',
      properties: {
        groups: {
          type: 'array' },

        pathGroupsExcludedImportTypes: {
          type: 'array' },

        pathGroups: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pattern: {
                type: 'string' },

              patternOptions: {
                type: 'object' },

              group: {
                type: 'string',
                enum: types },

              position: {
                type: 'string',
                enum: ['after', 'before'] } },


            required: ['pattern', 'group'] } },


        'newlines-between': {
          enum: [
          'ignore',
          'always',
          'always-and-inside-groups',
          'never'] },


        alphabetize: {
          type: 'object',
          properties: {
            caseInsensitive: {
              type: 'boolean',
              default: false },

            order: {
              enum: ['ignore', 'asc', 'desc'],
              default: 'ignore' } },


          additionalProperties: false },

        warnOnUnassignedImports: {
          type: 'boolean',
          default: false } },


      additionalProperties: false }] },




  create: function importOrderRule(context) {
    const options = context.options[0] || {};
    const newlinesBetweenImports = options['newlines-between'] || 'ignore';
    const pathGroupsExcludedImportTypes = new Set(options['pathGroupsExcludedImportTypes'] || ['builtin', 'external', 'object']);
    const alphabetize = getAlphabetizeConfig(options);
    let ranks;

    try {var _convertPathGroupsFor =
      convertPathGroupsForRanks(options.pathGroups || []);const pathGroups = _convertPathGroupsFor.pathGroups,maxPosition = _convertPathGroupsFor.maxPosition;
      ranks = {
        groups: convertGroupsToRanks(options.groups || defaultGroups),
        pathGroups,
        maxPosition };

    } catch (error) {
      // Malformed configuration
      return {
        Program: function (node) {
          context.report(node, error.message);
        } };

    }
    let imported = [];

    return {
      ImportDeclaration: function handleImports(node) {
        // Ignoring unassigned imports unless warnOnUnassignedImports is set
        if (node.specifiers.length || options.warnOnUnassignedImports) {
          const name = node.source.value;
          registerNode(
          context,
          {
            node,
            value: name,
            displayName: name,
            type: 'import' },

          ranks,
          imported,
          pathGroupsExcludedImportTypes);

        }
      },
      TSImportEqualsDeclaration: function handleImports(node) {
        let displayName;
        let value;
        let type;
        // skip "export import"s
        if (node.isExport) {
          return;
        }
        if (node.moduleReference.type === 'TSExternalModuleReference') {
          value = node.moduleReference.expression.value;
          displayName = value;
          type = 'import';
        } else {
          value = '';
          displayName = context.getSourceCode().getText(node.moduleReference);
          type = 'import:object';
        }
        registerNode(
        context,
        {
          node,
          value,
          displayName,
          type },

        ranks,
        imported,
        pathGroupsExcludedImportTypes);

      },
      CallExpression: function handleRequires(node) {
        if (!(0, _staticRequire2.default)(node) || !isModuleLevelRequire(node)) {
          return;
        }
        const name = node.arguments[0].value;
        registerNode(
        context,
        {
          node,
          value: name,
          displayName: name,
          type: 'require' },

        ranks,
        imported,
        pathGroupsExcludedImportTypes);

      },
      'Program:exit': function reportAndReset() {
        if (newlinesBetweenImports !== 'ignore') {
          makeNewlinesBetweenReport(context, imported, newlinesBetweenImports);
        }

        if (alphabetize.order !== 'ignore') {
          mutateRanksToAlphabetize(imported, alphabetize);
        }

        makeOutOfOrderReport(context, imported);

        imported = [];
      } };

  } };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydWxlcy9vcmRlci5qcyJdLCJuYW1lcyI6WyJkZWZhdWx0R3JvdXBzIiwicmV2ZXJzZSIsImFycmF5IiwibWFwIiwidiIsIk9iamVjdCIsImFzc2lnbiIsInJhbmsiLCJnZXRUb2tlbnNPckNvbW1lbnRzQWZ0ZXIiLCJzb3VyY2VDb2RlIiwibm9kZSIsImNvdW50IiwiY3VycmVudE5vZGVPclRva2VuIiwicmVzdWx0IiwiaSIsImdldFRva2VuT3JDb21tZW50QWZ0ZXIiLCJwdXNoIiwiZ2V0VG9rZW5zT3JDb21tZW50c0JlZm9yZSIsImdldFRva2VuT3JDb21tZW50QmVmb3JlIiwidGFrZVRva2Vuc0FmdGVyV2hpbGUiLCJjb25kaXRpb24iLCJ0b2tlbnMiLCJsZW5ndGgiLCJ0YWtlVG9rZW5zQmVmb3JlV2hpbGUiLCJmaW5kT3V0T2ZPcmRlciIsImltcG9ydGVkIiwibWF4U2VlblJhbmtOb2RlIiwiZmlsdGVyIiwiaW1wb3J0ZWRNb2R1bGUiLCJyZXMiLCJmaW5kUm9vdE5vZGUiLCJwYXJlbnQiLCJib2R5IiwiZmluZEVuZE9mTGluZVdpdGhDb21tZW50cyIsInRva2Vuc1RvRW5kT2ZMaW5lIiwiY29tbWVudE9uU2FtZUxpbmVBcyIsImVuZE9mVG9rZW5zIiwicmFuZ2UiLCJ0ZXh0IiwidG9rZW4iLCJ0eXBlIiwibG9jIiwic3RhcnQiLCJsaW5lIiwiZW5kIiwiZmluZFN0YXJ0T2ZMaW5lV2l0aENvbW1lbnRzIiwic3RhcnRPZlRva2VucyIsImlzUGxhaW5SZXF1aXJlTW9kdWxlIiwiZGVjbGFyYXRpb25zIiwiZGVjbCIsImlkIiwiaW5pdCIsImNhbGxlZSIsIm5hbWUiLCJhcmd1bWVudHMiLCJpc1BsYWluSW1wb3J0TW9kdWxlIiwic3BlY2lmaWVycyIsImlzUGxhaW5JbXBvcnRFcXVhbHMiLCJtb2R1bGVSZWZlcmVuY2UiLCJleHByZXNzaW9uIiwiY2FuQ3Jvc3NOb2RlV2hpbGVSZW9yZGVyIiwiY2FuUmVvcmRlckl0ZW1zIiwiZmlyc3ROb2RlIiwic2Vjb25kTm9kZSIsImluZGV4T2YiLCJzb3J0IiwiZmlyc3RJbmRleCIsInNlY29uZEluZGV4Iiwibm9kZXNCZXR3ZWVuIiwic2xpY2UiLCJub2RlQmV0d2VlbiIsImZpeE91dE9mT3JkZXIiLCJjb250ZXh0Iiwib3JkZXIiLCJnZXRTb3VyY2VDb2RlIiwiZmlyc3RSb290IiwiZmlyc3RSb290U3RhcnQiLCJmaXJzdFJvb3RFbmQiLCJzZWNvbmRSb290Iiwic2Vjb25kUm9vdFN0YXJ0Iiwic2Vjb25kUm9vdEVuZCIsImNhbkZpeCIsIm5ld0NvZGUiLCJzdWJzdHJpbmciLCJtZXNzYWdlIiwiZGlzcGxheU5hbWUiLCJyZXBvcnQiLCJmaXgiLCJmaXhlciIsInJlcGxhY2VUZXh0UmFuZ2UiLCJyZXBvcnRPdXRPZk9yZGVyIiwib3V0T2ZPcmRlciIsImZvckVhY2giLCJpbXAiLCJmb3VuZCIsImZpbmQiLCJoYXNIaWdoZXJSYW5rIiwiaW1wb3J0ZWRJdGVtIiwibWFrZU91dE9mT3JkZXJSZXBvcnQiLCJyZXZlcnNlZEltcG9ydGVkIiwicmV2ZXJzZWRPcmRlciIsImdldFNvcnRlciIsImFzY2VuZGluZyIsIm11bHRpcGxpZXIiLCJpbXBvcnRzU29ydGVyIiwiaW1wb3J0QSIsImltcG9ydEIiLCJtdXRhdGVSYW5rc1RvQWxwaGFiZXRpemUiLCJhbHBoYWJldGl6ZU9wdGlvbnMiLCJncm91cGVkQnlSYW5rcyIsInJlZHVjZSIsImFjYyIsIkFycmF5IiwiaXNBcnJheSIsImdyb3VwUmFua3MiLCJrZXlzIiwic29ydGVyRm4iLCJjb21wYXJhdG9yIiwiY2FzZUluc2Vuc2l0aXZlIiwiYSIsImIiLCJTdHJpbmciLCJ2YWx1ZSIsInRvTG93ZXJDYXNlIiwiZ3JvdXBSYW5rIiwibmV3UmFuayIsImFscGhhYmV0aXplZFJhbmtzIiwiaW1wb3J0S2luZCIsInBhcnNlSW50IiwiY29tcHV0ZVBhdGhSYW5rIiwicmFua3MiLCJwYXRoR3JvdXBzIiwicGF0aCIsIm1heFBvc2l0aW9uIiwibCIsInBhdHRlcm4iLCJwYXR0ZXJuT3B0aW9ucyIsImdyb3VwIiwicG9zaXRpb24iLCJub2NvbW1lbnQiLCJjb21wdXRlUmFuayIsImltcG9ydEVudHJ5IiwiZXhjbHVkZWRJbXBvcnRUeXBlcyIsImltcFR5cGUiLCJoYXMiLCJncm91cHMiLCJzdGFydHNXaXRoIiwicmVnaXN0ZXJOb2RlIiwiaXNNb2R1bGVMZXZlbFJlcXVpcmUiLCJuIiwib2JqZWN0IiwidHlwZXMiLCJjb252ZXJ0R3JvdXBzVG9SYW5rcyIsInJhbmtPYmplY3QiLCJpbmRleCIsImdyb3VwSXRlbSIsIkVycm9yIiwiSlNPTiIsInN0cmluZ2lmeSIsInVuZGVmaW5lZCIsIm9taXR0ZWRUeXBlcyIsImNvbnZlcnRQYXRoR3JvdXBzRm9yUmFua3MiLCJhZnRlciIsImJlZm9yZSIsInRyYW5zZm9ybWVkIiwicGF0aEdyb3VwIiwicG9zaXRpb25TdHJpbmciLCJncm91cExlbmd0aCIsImdyb3VwSW5kZXgiLCJNYXRoIiwibWF4Iiwia2V5IiwiZ3JvdXBOZXh0UG9zaXRpb24iLCJwb3ciLCJjZWlsIiwibG9nMTAiLCJmaXhOZXdMaW5lQWZ0ZXJJbXBvcnQiLCJwcmV2aW91c0ltcG9ydCIsInByZXZSb290IiwiZW5kT2ZMaW5lIiwiaW5zZXJ0VGV4dEFmdGVyUmFuZ2UiLCJyZW1vdmVOZXdMaW5lQWZ0ZXJJbXBvcnQiLCJjdXJyZW50SW1wb3J0IiwiY3VyclJvb3QiLCJyYW5nZVRvUmVtb3ZlIiwidGVzdCIsInJlbW92ZVJhbmdlIiwibWFrZU5ld2xpbmVzQmV0d2VlblJlcG9ydCIsIm5ld2xpbmVzQmV0d2VlbkltcG9ydHMiLCJnZXROdW1iZXJPZkVtcHR5TGluZXNCZXR3ZWVuIiwibGluZXNCZXR3ZWVuSW1wb3J0cyIsImxpbmVzIiwidHJpbSIsImVtcHR5TGluZXNCZXR3ZWVuIiwiZ2V0QWxwaGFiZXRpemVDb25maWciLCJvcHRpb25zIiwiYWxwaGFiZXRpemUiLCJtb2R1bGUiLCJleHBvcnRzIiwibWV0YSIsImRvY3MiLCJ1cmwiLCJmaXhhYmxlIiwic2NoZW1hIiwicHJvcGVydGllcyIsInBhdGhHcm91cHNFeGNsdWRlZEltcG9ydFR5cGVzIiwiaXRlbXMiLCJlbnVtIiwicmVxdWlyZWQiLCJkZWZhdWx0IiwiYWRkaXRpb25hbFByb3BlcnRpZXMiLCJ3YXJuT25VbmFzc2lnbmVkSW1wb3J0cyIsImNyZWF0ZSIsImltcG9ydE9yZGVyUnVsZSIsIlNldCIsImVycm9yIiwiUHJvZ3JhbSIsIkltcG9ydERlY2xhcmF0aW9uIiwiaGFuZGxlSW1wb3J0cyIsInNvdXJjZSIsIlRTSW1wb3J0RXF1YWxzRGVjbGFyYXRpb24iLCJpc0V4cG9ydCIsImdldFRleHQiLCJDYWxsRXhwcmVzc2lvbiIsImhhbmRsZVJlcXVpcmVzIiwicmVwb3J0QW5kUmVzZXQiXSwibWFwcGluZ3MiOiJBQUFBLGE7O0FBRUEsc0M7QUFDQSxnRDtBQUNBLHNEO0FBQ0EscUM7O0FBRUEsTUFBTUEsZ0JBQWdCLENBQUMsU0FBRCxFQUFZLFVBQVosRUFBd0IsUUFBeEIsRUFBa0MsU0FBbEMsRUFBNkMsT0FBN0MsQ0FBdEI7O0FBRUE7O0FBRUEsU0FBU0MsT0FBVCxDQUFpQkMsS0FBakIsRUFBd0I7QUFDdEIsU0FBT0EsTUFBTUMsR0FBTixDQUFVLFVBQVVDLENBQVYsRUFBYTtBQUM1QixXQUFPQyxPQUFPQyxNQUFQLENBQWMsRUFBZCxFQUFrQkYsQ0FBbEIsRUFBcUIsRUFBRUcsTUFBTSxDQUFDSCxFQUFFRyxJQUFYLEVBQXJCLENBQVA7QUFDRCxHQUZNLEVBRUpOLE9BRkksRUFBUDtBQUdEOztBQUVELFNBQVNPLHdCQUFULENBQWtDQyxVQUFsQyxFQUE4Q0MsSUFBOUMsRUFBb0RDLEtBQXBELEVBQTJEO0FBQ3pELE1BQUlDLHFCQUFxQkYsSUFBekI7QUFDQSxRQUFNRyxTQUFTLEVBQWY7QUFDQSxPQUFLLElBQUlDLElBQUksQ0FBYixFQUFnQkEsSUFBSUgsS0FBcEIsRUFBMkJHLEdBQTNCLEVBQWdDO0FBQzlCRix5QkFBcUJILFdBQVdNLHNCQUFYLENBQWtDSCxrQkFBbEMsQ0FBckI7QUFD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SCxLQUFaLEtBQXNCLFFBQTFCLEVBQW9DO0FBQ2xDa0MsbUNBQXlCbEYsUUFBekIsRUFBbUMySyxXQUFuQztBQUNEOztBQUVEbEcsNkJBQXFCMUIsT0FBckIsRUFBOEIvQyxRQUE5Qjs7QUFFQUEsbUJBQVcsRUFBWDtBQUNELE9BL0VJLEVBQVA7O0FBaUZELEdBbExjLEVBQWpCIiwiZmlsZSI6Im9yZGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgbWluaW1hdGNoIGZyb20gJ21pbmltYXRjaCc7XG5pbXBvcnQgaW1wb3J0VHlwZSBmcm9tICcuLi9jb3JlL2ltcG9ydFR5cGUnO1xuaW1wb3J0IGlzU3RhdGljUmVxdWlyZSBmcm9tICcuLi9jb3JlL3N0YXRpY1JlcXVpcmUnO1xuaW1wb3J0IGRvY3NVcmwgZnJvbSAnLi4vZG9jc1VybCc7XG5cbmNvbnN0IGRlZmF1bHRHcm91cHMgPSBbJ2J1aWx0aW4nLCAnZXh0ZXJuYWwnLCAncGFyZW50JywgJ3NpYmxpbmcnLCAnaW5kZXgnXTtcblxuLy8gUkVQT1JUSU5HIEFORCBGSVhJTkdcblxuZnVuY3Rpb24gcmV2ZXJzZShhcnJheSkge1xuICByZXR1cm4gYXJyYXkubWFwKGZ1bmN0aW9uICh2KSB7XG4gICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIHYsIHsgcmFuazogLXYucmFuayB9KTtcbiAgfSkucmV2ZXJzZSgpO1xufVxuXG5mdW5jdGlvbiBnZXRUb2tlbnNPckNvbW1lbnRzQWZ0ZXIoc291cmNlQ29kZSwgbm9kZSwgY291bnQpIHtcbiAgbGV0IGN1cnJlbnROb2RlT3JUb2tlbiA9IG5vZGU7XG4gIGNvbnN0IHJlc3VsdCA9IFtdO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcbiAgICBjdXJyZW50Tm9kZU9yVG9rZW4gPSBzb3VyY2VDb2RlLmdldFRva2VuT3JDb21tZW50QWZ0ZXIoY3VycmVudE5vZGVPclRva2VuKTtcbiAgICBpZiAoY3VycmVudE5vZGVPclRva2VuID09IG51bGwpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICByZXN1bHQucHVzaChjdXJyZW50Tm9kZU9yVG9rZW4pO1xuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbmZ1bmN0aW9uIGdldFRva2Vuc09yQ29tbWVudHNCZWZvcmUoc291cmNlQ29kZSwgbm9kZSwgY291bnQpIHtcbiAgbGV0IGN1cnJlbnROb2RlT3JUb2tlbiA9IG5vZGU7XG4gIGNvbnN0IHJlc3VsdCA9IFtdO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcbiAgICBjdXJyZW50Tm9kZU9yVG9rZW4gPSBzb3VyY2VDb2RlLmdldFRva2VuT3JDb21tZW50QmVmb3JlKGN1cnJlbnROb2RlT3JUb2tlbik7XG4gICAgaWYgKGN1cnJlbnROb2RlT3JUb2tlbiA9PSBudWxsKSB7XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgcmVzdWx0LnB1c2goY3VycmVudE5vZGVPclRva2VuKTtcbiAgfVxuICByZXR1cm4gcmVzdWx0LnJldmVyc2UoKTtcbn1cblxuZnVuY3Rpb24gdGFrZVRva2Vuc0FmdGVyV2hpbGUoc291cmNlQ29kZSwgbm9kZSwgY29uZGl0aW9uKSB7XG4gIGNvbnN0IHRva2VucyA9IGdldFRva2Vuc09yQ29tbWVudHNBZnRlcihzb3VyY2VDb2RlLCBub2RlLCAxMDApO1xuICBjb25zdCByZXN1bHQgPSBbXTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0b2tlbnMubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoY29uZGl0aW9uKHRva2Vuc1tpXSkpIHtcbiAgICAgIHJlc3VsdC5wdXNoKHRva2Vuc1tpXSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbmZ1bmN0aW9uIHRha2VUb2tlbnNCZWZvcmVXaGlsZShzb3VyY2VDb2RlLCBub2RlLCBjb25kaXRpb24pIHtcbiAgY29uc3QgdG9rZW5zID0gZ2V0VG9rZW5zT3JDb21tZW50c0JlZm9yZShzb3VyY2VDb2RlLCBub2RlLCAxMDApO1xuICBjb25zdCByZXN1bHQgPSBbXTtcbiAgZm9yIChsZXQgaSA9IHRva2Vucy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIGlmIChjb25kaXRpb24odG9rZW5zW2ldKSkge1xuICAgICAgcmVzdWx0LnB1c2godG9rZW5zW2ldKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdC5yZXZlcnNlKCk7XG59XG5cbmZ1bmN0aW9uIGZpbmRPdXRPZk9yZGVyKGltcG9ydGVkKSB7XG4gIGlmIChpbXBvcnRlZC5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gW107XG4gIH1cbiAgbGV0IG1heFNlZW5SYW5rTm9kZSA9IGltcG9ydGVkWzBdO1xuICByZXR1cm4gaW1wb3J0ZWQuZmlsdGVyKGZ1bmN0aW9uIChpbXBvcnRlZE1vZHVsZSkge1xuICAgIGNvbnN0IHJlcyA9IGltcG9ydGVkTW9kdWxlLnJhbmsgPCBtYXhTZWVuUmFua05vZGUucmFuaztcbiAgICBpZiAobWF4U2VlblJhbmtOb2RlLnJhbmsgPCBpbXBvcnRlZE1vZHVsZS5yYW5rKSB7XG4gICAgICBtYXhTZWVuUmFua05vZGUgPSBpbXBvcnRlZE1vZHVsZTtcbiAgICB9XG4gICAgcmV0dXJuIHJlcztcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGZpbmRSb290Tm9kZShub2RlKSB7XG4gIGxldCBwYXJlbnQgPSBub2RlO1xuICB3aGlsZSAocGFyZW50LnBhcmVudCAhPSBudWxsICYmIHBhcmVudC5wYXJlbnQuYm9keSA9PSBudWxsKSB7XG4gICAgcGFyZW50ID0gcGFyZW50LnBhcmVudDtcbiAgfVxuICByZXR1cm4gcGFyZW50O1xufVxuXG5mdW5jdGlvbiBmaW5kRW5kT2ZMaW5lV2l0aENvbW1lbnRzKHNvdXJjZUNvZGUsIG5vZGUpIHtcbiAgY29uc3QgdG9rZW5zVG9FbmRPZkxpbmUgPSB0YWtlVG9rZW5zQWZ0ZXJXaGlsZShzb3VyY2VDb2RlLCBub2RlLCBjb21tZW50T25TYW1lTGluZUFzKG5vZGUpKTtcbiAgY29uc3QgZW5kT2ZUb2tlbnMgPSB0b2tlbnNUb0VuZE9mTGluZS5sZW5ndGggPiAwXG4gICAgPyB0b2tlbnNUb0VuZE9mTGluZVt0b2tlbnNUb0VuZE9mTGluZS5sZW5ndGggLSAxXS5yYW5nZVsxXVxuICAgIDogbm9kZS5yYW5nZVsxXTtcbiAgbGV0IHJlc3VsdCA9IGVuZE9mVG9rZW5zO1xuICBmb3IgKGxldCBpID0gZW5kT2ZUb2tlbnM7IGkgPCBzb3VyY2VDb2RlLnRleHQubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoc291cmNlQ29kZS50ZXh0W2ldID09PSAnXFxuJykge1xuICAgICAgcmVzdWx0ID0gaSArIDE7XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgaWYgKHNvdXJjZUNvZGUudGV4dFtpXSAhPT0gJyAnICYmIHNvdXJjZUNvZGUudGV4dFtpXSAhPT0gJ1xcdCcgJiYgc291cmNlQ29kZS50ZXh0W2ldICE9PSAnXFxyJykge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIHJlc3VsdCA9IGkgKyAxO1xuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbmZ1bmN0aW9uIGNvbW1lbnRPblNhbWVMaW5lQXMobm9kZSkge1xuICByZXR1cm4gdG9rZW4gPT4gKHRva2VuLnR5cGUgPT09ICdCbG9jaycgfHwgIHRva2VuLnR5cGUgPT09ICdMaW5lJykgJiZcbiAgICAgIHRva2VuLmxvYy5zdGFydC5saW5lID09PSB0b2tlbi5sb2MuZW5kLmxpbmUgJiZcbiAgICAgIHRva2VuLmxvYy5lbmQubGluZSA9PT0gbm9kZS5sb2MuZW5kLmxpbmU7XG59XG5cbmZ1bmN0aW9uIGZpbmRTdGFydE9mTGluZVdpdGhDb21tZW50cyhzb3VyY2VDb2RlLCBub2RlKSB7XG4gIGNvbnN0IHRva2Vuc1RvRW5kT2ZMaW5lID0gdGFrZVRva2Vuc0JlZm9yZVdoaWxlKHNvdXJjZUNvZGUsIG5vZGUsIGNvbW1lbnRPblNhbWVMaW5lQXMobm9kZSkpO1xuICBjb25zdCBzdGFydE9mVG9rZW5zID0gdG9rZW5zVG9FbmRPZkxpbmUubGVuZ3RoID4gMCA/IHRva2Vuc1RvRW5kT2ZMaW5lWzBdLnJhbmdlWzBdIDogbm9kZS5yYW5nZVswXTtcbiAgbGV0IHJlc3VsdCA9IHN0YXJ0T2ZUb2tlbnM7XG4gIGZvciAobGV0IGkgPSBzdGFydE9mVG9rZW5zIC0gMTsgaSA+IDA7IGktLSkge1xuICAgIGlmIChzb3VyY2VDb2RlLnRleHRbaV0gIT09ICcgJyAmJiBzb3VyY2VDb2RlLnRleHRbaV0gIT09ICdcXHQnKSB7XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgcmVzdWx0ID0gaTtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5mdW5jdGlvbiBpc1BsYWluUmVxdWlyZU1vZHVsZShub2RlKSB7XG4gIGlmIChub2RlLnR5cGUgIT09ICdWYXJpYWJsZURlY2xhcmF0aW9uJykge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAobm9kZS5kZWNsYXJhdGlvbnMubGVuZ3RoICE9PSAxKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGNvbnN0IGRlY2wgPSBub2RlLmRlY2xhcmF0aW9uc1swXTtcbiAgY29uc3QgcmVzdWx0ID0gZGVjbC5pZCAmJlxuICAgIChkZWNsLmlkLnR5cGUgPT09ICdJZGVudGlmaWVyJyB8fCBkZWNsLmlkLnR5cGUgPT09ICdPYmplY3RQYXR0ZXJuJykgJiZcbiAgICBkZWNsLmluaXQgIT0gbnVsbCAmJlxuICAgIGRlY2wuaW5pdC50eXBlID09PSAnQ2FsbEV4cHJlc3Npb24nICYmXG4gICAgZGVjbC5pbml0LmNhbGxlZSAhPSBudWxsICYmXG4gICAgZGVjbC5pbml0LmNhbGxlZS5uYW1lID09PSAncmVxdWlyZScgJiZcbiAgICBkZWNsLmluaXQuYXJndW1lbnRzICE9IG51bGwgJiZcbiAgICBkZWNsLmluaXQuYXJndW1lbnRzLmxlbmd0aCA9PT0gMSAmJlxuICAgIGRlY2wuaW5pdC5hcmd1bWVudHNbMF0udHlwZSA9PT0gJ0xpdGVyYWwnO1xuICByZXR1cm4gcmVzdWx0O1xufVxuXG5mdW5jdGlvbiBpc1BsYWluSW1wb3J0TW9kdWxlKG5vZGUpIHtcbiAgcmV0dXJuIG5vZGUudHlwZSA9PT0gJ0ltcG9ydERlY2xhcmF0aW9uJyAmJiBub2RlLnNwZWNpZmllcnMgIT0gbnVsbCAmJiBub2RlLnNwZWNpZmllcnMubGVuZ3RoID4gMDtcbn1cblxuZnVuY3Rpb24gaXNQbGFpbkltcG9ydEVxdWFscyhub2RlKSB7XG4gIHJldHVybiBub2RlLnR5cGUgPT09ICdUU0ltcG9ydEVxdWFsc0RlY2xhcmF0aW9uJyAmJiBub2RlLm1vZHVsZVJlZmVyZW5jZS5leHByZXNzaW9uO1xufVxuXG5mdW5jdGlvbiBjYW5Dcm9zc05vZGVXaGlsZVJlb3JkZXIobm9kZSkge1xuICByZXR1cm4gaXNQbGFpblJlcXVpcmVNb2R1bGUobm9kZSkgfHwgaXNQbGFpbkltcG9ydE1vZHVsZShub2RlKSB8fCBpc1BsYWluSW1wb3J0RXF1YWxzKG5vZGUpO1xufVxuXG5mdW5jdGlvbiBjYW5SZW9yZGVySXRlbXMoZmlyc3ROb2RlLCBzZWNvbmROb2RlKSB7XG4gIGNvbnN0IHBhcmVudCA9IGZpcnN0Tm9kZS5wYXJlbnQ7XG4gIGNvbnN0IFtmaXJzdEluZGV4LCBzZWNvbmRJbmRleF0gPSBbXG4gICAgcGFyZW50LmJvZHkuaW5kZXhPZihmaXJzdE5vZGUpLFxuICAgIHBhcmVudC5ib2R5LmluZGV4T2Yoc2Vjb25kTm9kZSksXG4gIF0uc29ydCgpO1xuICBjb25zdCBub2Rlc0JldHdlZW4gPSBwYXJlbnQuYm9keS5zbGljZShmaXJzdEluZGV4LCBzZWNvbmRJbmRleCArIDEpO1xuICBmb3IgKGNvbnN0IG5vZGVCZXR3ZWVuIG9mIG5vZGVzQmV0d2Vlbikge1xuICAgIGlmICghY2FuQ3Jvc3NOb2RlV2hpbGVSZW9yZGVyKG5vZGVCZXR3ZWVuKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gZml4T3V0T2ZPcmRlcihjb250ZXh0LCBmaXJzdE5vZGUsIHNlY29uZE5vZGUsIG9yZGVyKSB7XG4gIGNvbnN0IHNvdXJjZUNvZGUgPSBjb250ZXh0LmdldFNvdXJjZUNvZGUoKTtcblxuICBjb25zdCBmaXJzdFJvb3QgPSBmaW5kUm9vdE5vZGUoZmlyc3ROb2RlLm5vZGUpO1xuICBjb25zdCBmaXJzdFJvb3RTdGFydCA9IGZpbmRTdGFydE9mTGluZVdpdGhDb21tZW50cyhzb3VyY2VDb2RlLCBmaXJzdFJvb3QpO1xuICBjb25zdCBmaXJzdFJvb3RFbmQgPSBmaW5kRW5kT2ZMaW5lV2l0aENvbW1lbnRzKHNvdXJjZUNvZGUsIGZpcnN0Um9vdCk7XG5cbiAgY29uc3Qgc2Vjb25kUm9vdCA9IGZpbmRSb290Tm9kZShzZWNvbmROb2RlLm5vZGUpO1xuICBjb25zdCBzZWNvbmRSb290U3RhcnQgPSBmaW5kU3RhcnRPZkxpbmVXaXRoQ29tbWVudHMoc291cmNlQ29kZSwgc2Vjb25kUm9vdCk7XG4gIGNvbnN0IHNlY29uZFJvb3RFbmQgPSBmaW5kRW5kT2ZMaW5lV2l0aENvbW1lbnRzKHNvdXJjZUNvZGUsIHNlY29uZFJvb3QpO1xuICBjb25zdCBjYW5GaXggPSBjYW5SZW9yZGVySXRlbXMoZmlyc3RSb290LCBzZWNvbmRSb290KTtcblxuICBsZXQgbmV3Q29kZSA9IHNvdXJjZUNvZGUudGV4dC5zdWJzdHJpbmcoc2Vjb25kUm9vdFN0YXJ0LCBzZWNvbmRSb290RW5kKTtcbiAgaWYgKG5ld0NvZGVbbmV3Q29kZS5sZW5ndGggLSAxXSAhPT0gJ1xcbicpIHtcbiAgICBuZXdDb2RlID0gbmV3Q29kZSArICdcXG4nO1xuICB9XG5cbiAgY29uc3QgbWVzc2FnZSA9IGBcXGAke3NlY29uZE5vZGUuZGlzcGxheU5hbWV9XFxgIGltcG9ydCBzaG91bGQgb2NjdXIgJHtvcmRlcn0gaW1wb3J0IG9mIFxcYCR7Zmlyc3ROb2RlLmRpc3BsYXlOYW1lfVxcYGA7XG5cbiAgaWYgKG9yZGVyID09PSAnYmVmb3JlJykge1xuICAgIGNvbnRleHQucmVwb3J0KHtcbiAgICAgIG5vZGU6IHNlY29uZE5vZGUubm9kZSxcbiAgICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgICBmaXg6IGNhbkZpeCAmJiAoZml4ZXIgPT5cbiAgICAgICAgZml4ZXIucmVwbGFjZVRleHRSYW5nZShcbiAgICAgICAgICBbZmlyc3RSb290U3RhcnQsIHNlY29uZFJvb3RFbmRdLFxuICAgICAgICAgIG5ld0NvZGUgKyBzb3VyY2VDb2RlLnRleHQuc3Vic3RyaW5nKGZpcnN0Um9vdFN0YXJ0LCBzZWNvbmRSb290U3RhcnQpXG4gICAgICAgICkpLFxuICAgIH0pO1xuICB9IGVsc2UgaWYgKG9yZGVyID09PSAnYWZ0ZXInKSB7XG4gICAgY29udGV4dC5yZXBvcnQoe1xuICAgICAgbm9kZTogc2Vjb25kTm9kZS5ub2RlLFxuICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICAgIGZpeDogY2FuRml4ICYmIChmaXhlciA9PlxuICAgICAgICBmaXhlci5yZXBsYWNlVGV4dFJhbmdlKFxuICAgICAgICAgIFtzZWNvbmRSb290U3RhcnQsIGZpcnN0Um9vdEVuZF0sXG4gICAgICAgICAgc291cmNlQ29kZS50ZXh0LnN1YnN0cmluZyhzZWNvbmRSb290RW5kLCBmaXJzdFJvb3RFbmQpICsgbmV3Q29kZVxuICAgICAgICApKSxcbiAgICB9KTtcbiAgfVxufVxuXG5mdW5jdGlvbiByZXBvcnRPdXRPZk9yZGVyKGNvbnRleHQsIGltcG9ydGVkLCBvdXRPZk9yZGVyLCBvcmRlcikge1xuICBvdXRPZk9yZGVyLmZvckVhY2goZnVuY3Rpb24gKGltcCkge1xuICAgIGNvbnN0IGZvdW5kID0gaW1wb3J0ZWQuZmluZChmdW5jdGlvbiBoYXNIaWdoZXJSYW5rKGltcG9ydGVkSXRlbSkge1xuICAgICAgcmV0dXJuIGltcG9ydGVkSXRlbS5yYW5rID4gaW1wLnJhbms7XG4gICAgfSk7XG4gICAgZml4T3V0T2ZPcmRlcihjb250ZXh0LCBmb3VuZCwgaW1wLCBvcmRlcik7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBtYWtlT3V0T2ZPcmRlclJlcG9ydChjb250ZXh0LCBpbXBvcnRlZCkge1xuICBjb25zdCBvdXRPZk9yZGVyID0gZmluZE91dE9mT3JkZXIoaW1wb3J0ZWQpO1xuICBpZiAoIW91dE9mT3JkZXIubGVuZ3RoKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIC8vIFRoZXJlIGFyZSB0aGluZ3MgdG8gcmVwb3J0LiBUcnkgdG8gbWluaW1pemUgdGhlIG51bWJlciBvZiByZXBvcnRlZCBlcnJvcnMuXG4gIGNvbnN0IHJldmVyc2VkSW1wb3J0ZWQgPSByZXZlcnNlKGltcG9ydGVkKTtcbiAgY29uc3QgcmV2ZXJzZWRPcmRlciA9IGZpbmRPdXRPZk9yZGVyKHJldmVyc2VkSW1wb3J0ZWQpO1xuICBpZiAocmV2ZXJzZWRPcmRlci5sZW5ndGggPCBvdXRPZk9yZGVyLmxlbmd0aCkge1xuICAgIHJlcG9ydE91dE9mT3JkZXIoY29udGV4dCwgcmV2ZXJzZWRJbXBvcnRlZCwgcmV2ZXJzZWRPcmRlciwgJ2FmdGVyJyk7XG4gICAgcmV0dXJuO1xuICB9XG4gIHJlcG9ydE91dE9mT3JkZXIoY29udGV4dCwgaW1wb3J0ZWQsIG91dE9mT3JkZXIsICdiZWZvcmUnKTtcbn1cblxuZnVuY3Rpb24gZ2V0U29ydGVyKGFzY2VuZGluZykge1xuICBjb25zdCBtdWx0aXBsaWVyID0gYXNjZW5kaW5nID8gMSA6IC0xO1xuXG4gIHJldHVybiBmdW5jdGlvbiBpbXBvcnRzU29ydGVyKGltcG9ydEEsIGltcG9ydEIpIHtcbiAgICBsZXQgcmVzdWx0O1xuXG4gICAgaWYgKGltcG9ydEEgPCBpbXBvcnRCKSB7XG4gICAgICByZXN1bHQgPSAtMTtcbiAgICB9IGVsc2UgaWYgKGltcG9ydEEgPiBpbXBvcnRCKSB7XG4gICAgICByZXN1bHQgPSAxO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXN1bHQgPSAwO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQgKiBtdWx0aXBsaWVyO1xuICB9O1xufVxuXG5mdW5jdGlvbiBtdXRhdGVSYW5rc1RvQWxwaGFiZXRpemUoaW1wb3J0ZWQsIGFscGhhYmV0aXplT3B0aW9ucykge1xuICBjb25zdCBncm91cGVkQnlSYW5rcyA9IGltcG9ydGVkLnJlZHVjZShmdW5jdGlvbihhY2MsIGltcG9ydGVkSXRlbSkge1xuICAgIGlmICghQXJyYXkuaXNBcnJheShhY2NbaW1wb3J0ZWRJdGVtLnJhbmtdKSkge1xuICAgICAgYWNjW2ltcG9ydGVkSXRlbS5yYW5rXSA9IFtdO1xuICAgIH1cbiAgICBhY2NbaW1wb3J0ZWRJdGVtLnJhbmtdLnB1c2goaW1wb3J0ZWRJdGVtKTtcbiAgICByZXR1cm4gYWNjO1xuICB9LCB7fSk7XG5cbiAgY29uc3QgZ3JvdXBSYW5rcyA9IE9iamVjdC5rZXlzKGdyb3VwZWRCeVJhbmtzKTtcblxuICBjb25zdCBzb3J0ZXJGbiA9IGdldFNvcnRlcihhbHBoYWJldGl6ZU9wdGlvbnMub3JkZXIgPT09ICdhc2MnKTtcbiAgY29uc3QgY29tcGFyYXRvciA9IGFscGhhYmV0aXplT3B0aW9ucy5jYXNlSW5zZW5zaXRpdmVcbiAgICA/IChhLCBiKSA9PiBzb3J0ZXJGbihTdHJpbmcoYS52YWx1ZSkudG9Mb3dlckNhc2UoKSwgU3RyaW5nKGIudmFsdWUpLnRvTG93ZXJDYXNlKCkpXG4gICAgOiAoYSwgYikgPT4gc29ydGVyRm4oYS52YWx1ZSwgYi52YWx1ZSk7XG5cbiAgLy8gc29ydCBpbXBvcnRzIGxvY2FsbHkgd2l0aGluIHRoZWlyIGdyb3VwXG4gIGdyb3VwUmFua3MuZm9yRWFjaChmdW5jdGlvbihncm91cFJhbmspIHtcbiAgICBncm91cGVkQnlSYW5rc1tncm91cFJhbmtdLnNvcnQoY29tcGFyYXRvcik7XG4gIH0pO1xuXG4gIC8vIGFzc2lnbiBnbG9iYWxseSB1bmlxdWUgcmFuayB0byBlYWNoIGltcG9ydFxuICBsZXQgbmV3UmFuayA9IDA7XG4gIGNvbnN0IGFscGhhYmV0aXplZFJhbmtzID0gZ3JvdXBSYW5rcy5zb3J0KCkucmVkdWNlKGZ1bmN0aW9uKGFjYywgZ3JvdXBSYW5rKSB7XG4gICAgZ3JvdXBlZEJ5UmFua3NbZ3JvdXBSYW5rXS5mb3JFYWNoKGZ1bmN0aW9uKGltcG9ydGVkSXRlbSkge1xuICAgICAgYWNjW2Ake2ltcG9ydGVkSXRlbS52YWx1ZX18JHtpbXBvcnRlZEl0ZW0ubm9kZS5pbXBvcnRLaW5kfWBdID0gcGFyc2VJbnQoZ3JvdXBSYW5rLCAxMCkgKyBuZXdSYW5rO1xuICAgICAgbmV3UmFuayArPSAxO1xuICAgIH0pO1xuICAgIHJldHVybiBhY2M7XG4gIH0sIHt9KTtcblxuICAvLyBtdXRhdGUgdGhlIG9yaWdpbmFsIGdyb3VwLXJhbmsgd2l0aCBhbHBoYWJldGl6ZWQtcmFua1xuICBpbXBvcnRlZC5mb3JFYWNoKGZ1bmN0aW9uKGltcG9ydGVkSXRlbSkge1xuICAgIGltcG9ydGVkSXRlbS5yYW5rID0gYWxwaGFiZXRpemVkUmFua3NbYCR7aW1wb3J0ZWRJdGVtLnZhbHVlfXwke2ltcG9ydGVkSXRlbS5ub2RlLmltcG9ydEtpbmR9YF07XG4gIH0pO1xufVxuXG4vLyBERVRFQ1RJTkdcblxuZnVuY3Rpb24gY29tcHV0ZVBhdGhSYW5rKHJhbmtzLCBwYXRoR3JvdXBzLCBwYXRoLCBtYXhQb3NpdGlvbikge1xuICBmb3IgKGxldCBpID0gMCwgbCA9IHBhdGhHcm91cHMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgY29uc3QgeyBwYXR0ZXJuLCBwYXR0ZXJuT3B0aW9ucywgZ3JvdXAsIHBvc2l0aW9uID0gMSB9ID0gcGF0aEdyb3Vwc1tpXTtcbiAgICBpZiAobWluaW1hdGNoKHBhdGgsIHBhdHRlcm4sIHBhdHRlcm5PcHRpb25zIHx8IHsgbm9jb21tZW50OiB0cnVlIH0pKSB7XG4gICAgICByZXR1cm4gcmFua3NbZ3JvdXBdICsgKHBvc2l0aW9uIC8gbWF4UG9zaXRpb24pO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBjb21wdXRlUmFuayhjb250ZXh0LCByYW5rcywgaW1wb3J0RW50cnksIGV4Y2x1ZGVkSW1wb3J0VHlwZXMpIHtcbiAgbGV0IGltcFR5cGU7XG4gIGxldCByYW5rO1xuICBpZiAoaW1wb3J0RW50cnkudHlwZSA9PT0gJ2ltcG9ydDpvYmplY3QnKSB7XG4gICAgaW1wVHlwZSA9ICdvYmplY3QnO1xuICB9IGVsc2UgaWYgKGltcG9ydEVudHJ5Lm5vZGUuaW1wb3J0S2luZCA9PT0gJ3R5cGUnKSB7XG4gICAgaW1wVHlwZSA9ICd0eXBlJztcbiAgfSBlbHNlIHtcbiAgICBpbXBUeXBlID0gaW1wb3J0VHlwZShpbXBvcnRFbnRyeS52YWx1ZSwgY29udGV4dCk7XG4gIH1cbiAgaWYgKCFleGNsdWRlZEltcG9ydFR5cGVzLmhhcyhpbXBUeXBlKSkge1xuICAgIHJhbmsgPSBjb21wdXRlUGF0aFJhbmsocmFua3MuZ3JvdXBzLCByYW5rcy5wYXRoR3JvdXBzLCBpbXBvcnRFbnRyeS52YWx1ZSwgcmFua3MubWF4UG9zaXRpb24pO1xuICB9XG4gIGlmICh0eXBlb2YgcmFuayA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICByYW5rID0gcmFua3MuZ3JvdXBzW2ltcFR5cGVdO1xuICB9XG4gIGlmIChpbXBvcnRFbnRyeS50eXBlICE9PSAnaW1wb3J0JyAmJiAhaW1wb3J0RW50cnkudHlwZS5zdGFydHNXaXRoKCdpbXBvcnQ6JykpIHtcbiAgICByYW5rICs9IDEwMDtcbiAgfVxuXG4gIHJldHVybiByYW5rO1xufVxuXG5mdW5jdGlvbiByZWdpc3Rlck5vZGUoY29udGV4dCwgaW1wb3J0RW50cnksIHJhbmtzLCBpbXBvcnRlZCwgZXhjbHVkZWRJbXBvcnRUeXBlcykge1xuICBjb25zdCByYW5rID0gY29tcHV0ZVJhbmsoY29udGV4dCwgcmFua3MsIGltcG9ydEVudHJ5LCBleGNsdWRlZEltcG9ydFR5cGVzKTtcbiAgaWYgKHJhbmsgIT09IC0xKSB7XG4gICAgaW1wb3J0ZWQucHVzaChPYmplY3QuYXNzaWduKHt9LCBpbXBvcnRFbnRyeSwgeyByYW5rIH0pKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpc01vZHVsZUxldmVsUmVxdWlyZShub2RlKSB7XG4gIGxldCBuID0gbm9kZTtcbiAgLy8gSGFuZGxlIGNhc2VzIGxpa2UgYGNvbnN0IGJheiA9IHJlcXVpcmUoJ2ZvbycpLmJhci5iYXpgXG4gIC8vIGFuZCBgY29uc3QgZm9vID0gcmVxdWlyZSgnZm9vJykoKWBcbiAgd2hpbGUgKFxuICAgIChuLnBhcmVudC50eXBlID09PSAnTWVtYmVyRXhwcmVzc2lvbicgJiYgbi5wYXJlbnQub2JqZWN0ID09PSBuKSB8fFxuICAgIChuLnBhcmVudC50eXBlID09PSAnQ2FsbEV4cHJlc3Npb24nICYmIG4ucGFyZW50LmNhbGxlZSA9PT0gbilcbiAgKSB7XG4gICAgbiA9IG4ucGFyZW50O1xuICB9XG4gIHJldHVybiAoXG4gICAgbi5wYXJlbnQudHlwZSA9PT0gJ1ZhcmlhYmxlRGVjbGFyYXRvcicgJiZcbiAgICBuLnBhcmVudC5wYXJlbnQudHlwZSA9PT0gJ1ZhcmlhYmxlRGVjbGFyYXRpb24nICYmXG4gICAgbi5wYXJlbnQucGFyZW50LnBhcmVudC50eXBlID09PSAnUHJvZ3JhbSdcbiAgKTtcbn1cblxuY29uc3QgdHlwZXMgPSBbJ2J1aWx0aW4nLCAnZXh0ZXJuYWwnLCAnaW50ZXJuYWwnLCAndW5rbm93bicsICdwYXJlbnQnLCAnc2libGluZycsICdpbmRleCcsICdvYmplY3QnLCAndHlwZSddO1xuXG4vLyBDcmVhdGVzIGFuIG9iamVjdCB3aXRoIHR5cGUtcmFuayBwYWlycy5cbi8vIEV4YW1wbGU6IHsgaW5kZXg6IDAsIHNpYmxpbmc6IDEsIHBhcmVudDogMSwgZXh0ZXJuYWw6IDEsIGJ1aWx0aW46IDIsIGludGVybmFsOiAyIH1cbi8vIFdpbGwgdGhyb3cgYW4gZXJyb3IgaWYgaXQgY29udGFpbnMgYSB0eXBlIHRoYXQgZG9lcyBub3QgZXhpc3QsIG9yIGhhcyBhIGR1cGxpY2F0ZVxuZnVuY3Rpb24gY29udmVydEdyb3Vwc1RvUmFua3MoZ3JvdXBzKSB7XG4gIGNvbnN0IHJhbmtPYmplY3QgPSBncm91cHMucmVkdWNlKGZ1bmN0aW9uKHJlcywgZ3JvdXAsIGluZGV4KSB7XG4gICAgaWYgKHR5cGVvZiBncm91cCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGdyb3VwID0gW2dyb3VwXTtcbiAgICB9XG4gICAgZ3JvdXAuZm9yRWFjaChmdW5jdGlvbihncm91cEl0ZW0pIHtcbiAgICAgIGlmICh0eXBlcy5pbmRleE9mKGdyb3VwSXRlbSkgPT09IC0xKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignSW5jb3JyZWN0IGNvbmZpZ3VyYXRpb24gb2YgdGhlIHJ1bGU6IFVua25vd24gdHlwZSBgJyArXG4gICAgICAgICAgSlNPTi5zdHJpbmdpZnkoZ3JvdXBJdGVtKSArICdgJyk7XG4gICAgICB9XG4gICAgICBpZiAocmVzW2dyb3VwSXRlbV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0luY29ycmVjdCBjb25maWd1cmF0aW9uIG9mIHRoZSBydWxlOiBgJyArIGdyb3VwSXRlbSArICdgIGlzIGR1cGxpY2F0ZWQnKTtcbiAgICAgIH1cbiAgICAgIHJlc1tncm91cEl0ZW1dID0gaW5kZXg7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlcztcbiAgfSwge30pO1xuXG4gIGNvbnN0IG9taXR0ZWRUeXBlcyA9IHR5cGVzLmZpbHRlcihmdW5jdGlvbih0eXBlKSB7XG4gICAgcmV0dXJuIHJhbmtPYmplY3RbdHlwZV0gPT09IHVuZGVmaW5lZDtcbiAgfSk7XG5cbiAgcmV0dXJuIG9taXR0ZWRUeXBlcy5yZWR1Y2UoZnVuY3Rpb24ocmVzLCB0eXBlKSB7XG4gICAgcmVzW3R5cGVdID0gZ3JvdXBzLmxlbmd0aDtcbiAgICByZXR1cm4gcmVzO1xuICB9LCByYW5rT2JqZWN0KTtcbn1cblxuZnVuY3Rpb24gY29udmVydFBhdGhHcm91cHNGb3JSYW5rcyhwYXRoR3JvdXBzKSB7XG4gIGNvbnN0IGFmdGVyID0ge307XG4gIGNvbnN0IGJlZm9yZSA9IHt9O1xuXG4gIGNvbnN0IHRyYW5zZm9ybWVkID0gcGF0aEdyb3Vwcy5tYXAoKHBhdGhHcm91cCwgaW5kZXgpID0+IHtcbiAgICBjb25zdCB7IGdyb3VwLCBwb3NpdGlvbjogcG9zaXRpb25TdHJpbmcgfSA9IHBhdGhHcm91cDtcbiAgICBsZXQgcG9zaXRpb24gPSAwO1xuICAgIGlmIChwb3NpdGlvblN0cmluZyA9PT0gJ2FmdGVyJykge1xuICAgICAgaWYgKCFhZnRlcltncm91cF0pIHtcbiAgICAgICAgYWZ0ZXJbZ3JvdXBdID0gMTtcbiAgICAgIH1cbiAgICAgIHBvc2l0aW9uID0gYWZ0ZXJbZ3JvdXBdKys7XG4gICAgfSBlbHNlIGlmIChwb3NpdGlvblN0cmluZyA9PT0gJ2JlZm9yZScpIHtcbiAgICAgIGlmICghYmVmb3JlW2dyb3VwXSkge1xuICAgICAgICBiZWZvcmVbZ3JvdXBdID0gW107XG4gICAgICB9XG4gICAgICBiZWZvcmVbZ3JvdXBdLnB1c2goaW5kZXgpO1xuICAgIH1cblxuICAgIHJldHVybiBPYmplY3QuYXNzaWduKHt9LCBwYXRoR3JvdXAsIHsgcG9zaXRpb24gfSk7XG4gIH0pO1xuXG4gIGxldCBtYXhQb3NpdGlvbiA9IDE7XG5cbiAgT2JqZWN0LmtleXMoYmVmb3JlKS5mb3JFYWNoKChncm91cCkgPT4ge1xuICAgIGNvbnN0IGdyb3VwTGVuZ3RoID0gYmVmb3JlW2dyb3VwXS5sZW5ndGg7XG4gICAgYmVmb3JlW2dyb3VwXS5mb3JFYWNoKChncm91cEluZGV4LCBpbmRleCkgPT4ge1xuICAgICAgdHJhbnNmb3JtZWRbZ3JvdXBJbmRleF0ucG9zaXRpb24gPSAtMSAqIChncm91cExlbmd0aCAtIGluZGV4KTtcbiAgICB9KTtcbiAgICBtYXhQb3NpdGlvbiA9IE1hdGgubWF4KG1heFBvc2l0aW9uLCBncm91cExlbmd0aCk7XG4gIH0pO1xuXG4gIE9iamVjdC5rZXlzKGFmdGVyKS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICBjb25zdCBncm91cE5leHRQb3NpdGlvbiA9IGFmdGVyW2tleV07XG4gICAgbWF4UG9zaXRpb24gPSBNYXRoLm1heChtYXhQb3NpdGlvbiwgZ3JvdXBOZXh0UG9zaXRpb24gLSAxKTtcbiAgfSk7XG5cbiAgcmV0dXJuIHtcbiAgICBwYXRoR3JvdXBzOiB0cmFuc2Zvcm1lZCxcbiAgICBtYXhQb3NpdGlvbjogbWF4UG9zaXRpb24gPiAxMCA/IE1hdGgucG93KDEwLCBNYXRoLmNlaWwoTWF0aC5sb2cxMChtYXhQb3NpdGlvbikpKSA6IDEwLFxuICB9O1xufVxuXG5mdW5jdGlvbiBmaXhOZXdMaW5lQWZ0ZXJJbXBvcnQoY29udGV4dCwgcHJldmlvdXNJbXBvcnQpIHtcbiAgY29uc3QgcHJldlJvb3QgPSBmaW5kUm9vdE5vZGUocHJldmlvdXNJbXBvcnQubm9kZSk7XG4gIGNvbnN0IHRva2Vuc1RvRW5kT2ZMaW5lID0gdGFrZVRva2Vuc0FmdGVyV2hpbGUoXG4gICAgY29udGV4dC5nZXRTb3VyY2VDb2RlKCksIHByZXZSb290LCBjb21tZW50T25TYW1lTGluZUFzKHByZXZSb290KSk7XG5cbiAgbGV0IGVuZE9mTGluZSA9IHByZXZSb290LnJhbmdlWzFdO1xuICBpZiAodG9rZW5zVG9FbmRPZkxpbmUubGVuZ3RoID4gMCkge1xuICAgIGVuZE9mTGluZSA9IHRva2Vuc1RvRW5kT2ZMaW5lW3Rva2Vuc1RvRW5kT2ZMaW5lLmxlbmd0aCAtIDFdLnJhbmdlWzFdO1xuICB9XG4gIHJldHVybiAoZml4ZXIpID0+IGZpeGVyLmluc2VydFRleHRBZnRlclJhbmdlKFtwcmV2Um9vdC5yYW5nZVswXSwgZW5kT2ZMaW5lXSwgJ1xcbicpO1xufVxuXG5mdW5jdGlvbiByZW1vdmVOZXdMaW5lQWZ0ZXJJbXBvcnQoY29udGV4dCwgY3VycmVudEltcG9ydCwgcHJldmlvdXNJbXBvcnQpIHtcbiAgY29uc3Qgc291cmNlQ29kZSA9IGNvbnRleHQuZ2V0U291cmNlQ29kZSgpO1xuICBjb25zdCBwcmV2Um9vdCA9IGZpbmRSb290Tm9kZShwcmV2aW91c0ltcG9ydC5ub2RlKTtcbiAgY29uc3QgY3VyclJvb3QgPSBmaW5kUm9vdE5vZGUoY3VycmVudEltcG9ydC5ub2RlKTtcbiAgY29uc3QgcmFuZ2VUb1JlbW92ZSA9IFtcbiAgICBmaW5kRW5kT2ZMaW5lV2l0aENvbW1lbnRzKHNvdXJjZUNvZGUsIHByZXZSb290KSxcbiAgICBmaW5kU3RhcnRPZkxpbmVXaXRoQ29tbWVudHMoc291cmNlQ29kZSwgY3VyclJvb3QpLFxuICBdO1xuICBpZiAoL15cXHMqJC8udGVzdChzb3VyY2VDb2RlLnRleHQuc3Vic3RyaW5nKHJhbmdlVG9SZW1vdmVbMF0sIHJhbmdlVG9SZW1vdmVbMV0pKSkge1xuICAgIHJldHVybiAoZml4ZXIpID0+IGZpeGVyLnJlbW92ZVJhbmdlKHJhbmdlVG9SZW1vdmUpO1xuICB9XG4gIHJldHVybiB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIG1ha2VOZXdsaW5lc0JldHdlZW5SZXBvcnQgKGNvbnRleHQsIGltcG9ydGVkLCBuZXdsaW5lc0JldHdlZW5JbXBvcnRzKSB7XG4gIGNvbnN0IGdldE51bWJlck9mRW1wdHlMaW5lc0JldHdlZW4gPSAoY3VycmVudEltcG9ydCwgcHJldmlvdXNJbXBvcnQpID0+IHtcbiAgICBjb25zdCBsaW5lc0JldHdlZW5JbXBvcnRzID0gY29udGV4dC5nZXRTb3VyY2VDb2RlKCkubGluZXMuc2xpY2UoXG4gICAgICBwcmV2aW91c0ltcG9ydC5ub2RlLmxvYy5lbmQubGluZSxcbiAgICAgIGN1cnJlbnRJbXBvcnQubm9kZS5sb2Muc3RhcnQubGluZSAtIDFcbiAgICApO1xuXG4gICAgcmV0dXJuIGxpbmVzQmV0d2VlbkltcG9ydHMuZmlsdGVyKChsaW5lKSA9PiAhbGluZS50cmltKCkubGVuZ3RoKS5sZW5ndGg7XG4gIH07XG4gIGxldCBwcmV2aW91c0ltcG9ydCA9IGltcG9ydGVkWzBdO1xuXG4gIGltcG9ydGVkLnNsaWNlKDEpLmZvckVhY2goZnVuY3Rpb24oY3VycmVudEltcG9ydCkge1xuICAgIGNvbnN0IGVtcHR5TGluZXNCZXR3ZWVuID0gZ2V0TnVtYmVyT2ZFbXB0eUxpbmVzQmV0d2VlbihjdXJyZW50SW1wb3J0LCBwcmV2aW91c0ltcG9ydCk7XG5cbiAgICBpZiAobmV3bGluZXNCZXR3ZWVuSW1wb3J0cyA9PT0gJ2Fsd2F5cydcbiAgICAgICAgfHwgbmV3bGluZXNCZXR3ZWVuSW1wb3J0cyA9PT0gJ2Fsd2F5cy1hbmQtaW5zaWRlLWdyb3VwcycpIHtcbiAgICAgIGlmIChjdXJyZW50SW1wb3J0LnJhbmsgIT09IHByZXZpb3VzSW1wb3J0LnJhbmsgJiYgZW1wdHlMaW5lc0JldHdlZW4gPT09IDApIHtcbiAgICAgICAgY29udGV4dC5yZXBvcnQoe1xuICAgICAgICAgIG5vZGU6IHByZXZpb3VzSW1wb3J0Lm5vZGUsXG4gICAgICAgICAgbWVzc2FnZTogJ1RoZXJlIHNob3VsZCBiZSBhdCBsZWFzdCBvbmUgZW1wdHkgbGluZSBiZXR3ZWVuIGltcG9ydCBncm91cHMnLFxuICAgICAgICAgIGZpeDogZml4TmV3TGluZUFmdGVySW1wb3J0KGNvbnRleHQsIHByZXZpb3VzSW1wb3J0KSxcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2UgaWYgKGN1cnJlbnRJbXBvcnQucmFuayA9PT0gcHJldmlvdXNJbXBvcnQucmFua1xuICAgICAgICAmJiBlbXB0eUxpbmVzQmV0d2VlbiA+IDBcbiAgICAgICAgJiYgbmV3bGluZXNCZXR3ZWVuSW1wb3J0cyAhPT0gJ2Fsd2F5cy1hbmQtaW5zaWRlLWdyb3VwcycpIHtcbiAgICAgICAgY29udGV4dC5yZXBvcnQoe1xuICAgICAgICAgIG5vZGU6IHByZXZpb3VzSW1wb3J0Lm5vZGUsXG4gICAgICAgICAgbWVzc2FnZTogJ1RoZXJlIHNob3VsZCBiZSBubyBlbXB0eSBsaW5lIHdpdGhpbiBpbXBvcnQgZ3JvdXAnLFxuICAgICAgICAgIGZpeDogcmVtb3ZlTmV3TGluZUFmdGVySW1wb3J0KGNvbnRleHQsIGN1cnJlbnRJbXBvcnQsIHByZXZpb3VzSW1wb3J0KSxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChlbXB0eUxpbmVzQmV0d2VlbiA+IDApIHtcbiAgICAgIGNvbnRleHQucmVwb3J0KHtcbiAgICAgICAgbm9kZTogcHJldmlvdXNJbXBvcnQubm9kZSxcbiAgICAgICAgbWVzc2FnZTogJ1RoZXJlIHNob3VsZCBiZSBubyBlbXB0eSBsaW5lIGJldHdlZW4gaW1wb3J0IGdyb3VwcycsXG4gICAgICAgIGZpeDogcmVtb3ZlTmV3TGluZUFmdGVySW1wb3J0KGNvbnRleHQsIGN1cnJlbnRJbXBvcnQsIHByZXZpb3VzSW1wb3J0KSxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHByZXZpb3VzSW1wb3J0ID0gY3VycmVudEltcG9ydDtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGdldEFscGhhYmV0aXplQ29uZmlnKG9wdGlvbnMpIHtcbiAgY29uc3QgYWxwaGFiZXRpemUgPSBvcHRpb25zLmFscGhhYmV0aXplIHx8IHt9O1xuICBjb25zdCBvcmRlciA9IGFscGhhYmV0aXplLm9yZGVyIHx8ICdpZ25vcmUnO1xuICBjb25zdCBjYXNlSW5zZW5zaXRpdmUgPSBhbHBoYWJldGl6ZS5jYXNlSW5zZW5zaXRpdmUgfHwgZmFsc2U7XG5cbiAgcmV0dXJuIHsgb3JkZXIsIGNhc2VJbnNlbnNpdGl2ZSB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgbWV0YToge1xuICAgIHR5cGU6ICdzdWdnZXN0aW9uJyxcbiAgICBkb2NzOiB7XG4gICAgICB1cmw6IGRvY3NVcmwoJ29yZGVyJyksXG4gICAgfSxcblxuICAgIGZpeGFibGU6ICdjb2RlJyxcbiAgICBzY2hlbWE6IFtcbiAgICAgIHtcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICBncm91cHM6IHtcbiAgICAgICAgICAgIHR5cGU6ICdhcnJheScsXG4gICAgICAgICAgfSxcbiAgICAgICAgICBwYXRoR3JvdXBzRXhjbHVkZWRJbXBvcnRUeXBlczoge1xuICAgICAgICAgICAgdHlwZTogJ2FycmF5JyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHBhdGhHcm91cHM6IHtcbiAgICAgICAgICAgIHR5cGU6ICdhcnJheScsXG4gICAgICAgICAgICBpdGVtczoge1xuICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgIHBhdHRlcm46IHtcbiAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgcGF0dGVybk9wdGlvbnM6IHtcbiAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZ3JvdXA6IHtcbiAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgZW51bTogdHlwZXMsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjoge1xuICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICBlbnVtOiBbJ2FmdGVyJywgJ2JlZm9yZSddLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHJlcXVpcmVkOiBbJ3BhdHRlcm4nLCAnZ3JvdXAnXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICAnbmV3bGluZXMtYmV0d2Vlbic6IHtcbiAgICAgICAgICAgIGVudW06IFtcbiAgICAgICAgICAgICAgJ2lnbm9yZScsXG4gICAgICAgICAgICAgICdhbHdheXMnLFxuICAgICAgICAgICAgICAnYWx3YXlzLWFuZC1pbnNpZGUtZ3JvdXBzJyxcbiAgICAgICAgICAgICAgJ25ldmVyJyxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICBhbHBoYWJldGl6ZToge1xuICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgIGNhc2VJbnNlbnNpdGl2ZToge1xuICAgICAgICAgICAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgb3JkZXI6IHtcbiAgICAgICAgICAgICAgICBlbnVtOiBbJ2lnbm9yZScsICdhc2MnLCAnZGVzYyddLFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6ICdpZ25vcmUnLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGFkZGl0aW9uYWxQcm9wZXJ0aWVzOiBmYWxzZSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHdhcm5PblVuYXNzaWduZWRJbXBvcnRzOiB7XG4gICAgICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgICAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBhZGRpdGlvbmFsUHJvcGVydGllczogZmFsc2UsXG4gICAgICB9LFxuICAgIF0sXG4gIH0sXG5cbiAgY3JlYXRlOiBmdW5jdGlvbiBpbXBvcnRPcmRlclJ1bGUgKGNvbnRleHQpIHtcbiAgICBjb25zdCBvcHRpb25zID0gY29udGV4dC5vcHRpb25zWzBdIHx8IHt9O1xuICAgIGNvbnN0IG5ld2xpbmVzQmV0d2VlbkltcG9ydHMgPSBvcHRpb25zWyduZXdsaW5lcy1iZXR3ZWVuJ10gfHwgJ2lnbm9yZSc7XG4gICAgY29uc3QgcGF0aEdyb3Vwc0V4Y2x1ZGVkSW1wb3J0VHlwZXMgPSBuZXcgU2V0KG9wdGlvbnNbJ3BhdGhHcm91cHNFeGNsdWRlZEltcG9ydFR5cGVzJ10gfHwgWydidWlsdGluJywgJ2V4dGVybmFsJywgJ29iamVjdCddKTtcbiAgICBjb25zdCBhbHBoYWJldGl6ZSA9IGdldEFscGhhYmV0aXplQ29uZmlnKG9wdGlvbnMpO1xuICAgIGxldCByYW5rcztcblxuICAgIHRyeSB7XG4gICAgICBjb25zdCB7IHBhdGhHcm91cHMsIG1heFBvc2l0aW9uIH0gPSBjb252ZXJ0UGF0aEdyb3Vwc0ZvclJhbmtzKG9wdGlvbnMucGF0aEdyb3VwcyB8fCBbXSk7XG4gICAgICByYW5rcyA9IHtcbiAgICAgICAgZ3JvdXBzOiBjb252ZXJ0R3JvdXBzVG9SYW5rcyhvcHRpb25zLmdyb3VwcyB8fCBkZWZhdWx0R3JvdXBzKSxcbiAgICAgICAgcGF0aEdyb3VwcyxcbiAgICAgICAgbWF4UG9zaXRpb24sXG4gICAgICB9O1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAvLyBNYWxmb3JtZWQgY29uZmlndXJhdGlvblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgUHJvZ3JhbTogZnVuY3Rpb24obm9kZSkge1xuICAgICAgICAgIGNvbnRleHQucmVwb3J0KG5vZGUsIGVycm9yLm1lc3NhZ2UpO1xuICAgICAgICB9LFxuICAgICAgfTtcbiAgICB9XG4gICAgbGV0IGltcG9ydGVkID0gW107XG5cbiAgICByZXR1cm4ge1xuICAgICAgSW1wb3J0RGVjbGFyYXRpb246IGZ1bmN0aW9uIGhhbmRsZUltcG9ydHMobm9kZSkge1xuICAgICAgICAvLyBJZ25vcmluZyB1bmFzc2lnbmVkIGltcG9ydHMgdW5sZXNzIHdhcm5PblVuYXNzaWduZWRJbXBvcnRzIGlzIHNldFxuICAgICAgICBpZiAobm9kZS5zcGVjaWZpZXJzLmxlbmd0aCB8fCBvcHRpb25zLndhcm5PblVuYXNzaWduZWRJbXBvcnRzKSB7XG4gICAgICAgICAgY29uc3QgbmFtZSA9IG5vZGUuc291cmNlLnZhbHVlO1xuICAgICAgICAgIHJlZ2lzdGVyTm9kZShcbiAgICAgICAgICAgIGNvbnRleHQsXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIG5vZGUsXG4gICAgICAgICAgICAgIHZhbHVlOiBuYW1lLFxuICAgICAgICAgICAgICBkaXNwbGF5TmFtZTogbmFtZSxcbiAgICAgICAgICAgICAgdHlwZTogJ2ltcG9ydCcsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmFua3MsXG4gICAgICAgICAgICBpbXBvcnRlZCxcbiAgICAgICAgICAgIHBhdGhHcm91cHNFeGNsdWRlZEltcG9ydFR5cGVzXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIFRTSW1wb3J0RXF1YWxzRGVjbGFyYXRpb246IGZ1bmN0aW9uIGhhbmRsZUltcG9ydHMobm9kZSkge1xuICAgICAgICBsZXQgZGlzcGxheU5hbWU7XG4gICAgICAgIGxldCB2YWx1ZTtcbiAgICAgICAgbGV0IHR5cGU7XG4gICAgICAgIC8vIHNraXAgXCJleHBvcnQgaW1wb3J0XCJzXG4gICAgICAgIGlmIChub2RlLmlzRXhwb3J0KSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChub2RlLm1vZHVsZVJlZmVyZW5jZS50eXBlID09PSAnVFNFeHRlcm5hbE1vZHVsZVJlZmVyZW5jZScpIHtcbiAgICAgICAgICB2YWx1ZSA9IG5vZGUubW9kdWxlUmVmZXJlbmNlLmV4cHJlc3Npb24udmFsdWU7XG4gICAgICAgICAgZGlzcGxheU5hbWUgPSB2YWx1ZTtcbiAgICAgICAgICB0eXBlID0gJ2ltcG9ydCc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFsdWUgPSAnJztcbiAgICAgICAgICBkaXNwbGF5TmFtZSA9IGNvbnRleHQuZ2V0U291cmNlQ29kZSgpLmdldFRleHQobm9kZS5tb2R1bGVSZWZlcmVuY2UpO1xuICAgICAgICAgIHR5cGUgPSAnaW1wb3J0Om9iamVjdCc7XG4gICAgICAgIH1cbiAgICAgICAgcmVnaXN0ZXJOb2RlKFxuICAgICAgICAgIGNvbnRleHQsXG4gICAgICAgICAge1xuICAgICAgICAgICAgbm9kZSxcbiAgICAgICAgICAgIHZhbHVlLFxuICAgICAgICAgICAgZGlzcGxheU5hbWUsXG4gICAgICAgICAgICB0eXBlLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgcmFua3MsXG4gICAgICAgICAgaW1wb3J0ZWQsXG4gICAgICAgICAgcGF0aEdyb3Vwc0V4Y2x1ZGVkSW1wb3J0VHlwZXNcbiAgICAgICAgKTtcbiAgICAgIH0sXG4gICAgICBDYWxsRXhwcmVzc2lvbjogZnVuY3Rpb24gaGFuZGxlUmVxdWlyZXMobm9kZSkge1xuICAgICAgICBpZiAoIWlzU3RhdGljUmVxdWlyZShub2RlKSB8fCAhaXNNb2R1bGVMZXZlbFJlcXVpcmUobm9kZSkpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbmFtZSA9IG5vZGUuYXJndW1lbnRzWzBdLnZhbHVlO1xuICAgICAgICByZWdpc3Rlck5vZGUoXG4gICAgICAgICAgY29udGV4dCxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBub2RlLFxuICAgICAgICAgICAgdmFsdWU6IG5hbWUsXG4gICAgICAgICAgICBkaXNwbGF5TmFtZTogbmFtZSxcbiAgICAgICAgICAgIHR5cGU6ICdyZXF1aXJlJyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHJhbmtzLFxuICAgICAgICAgIGltcG9ydGVkLFxuICAgICAgICAgIHBhdGhHcm91cHNFeGNsdWRlZEltcG9ydFR5cGVzXG4gICAgICAgICk7XG4gICAgICB9LFxuICAgICAgJ1Byb2dyYW06ZXhpdCc6IGZ1bmN0aW9uIHJlcG9ydEFuZFJlc2V0KCkge1xuICAgICAgICBpZiAobmV3bGluZXNCZXR3ZWVuSW1wb3J0cyAhPT0gJ2lnbm9yZScpIHtcbiAgICAgICAgICBtYWtlTmV3bGluZXNCZXR3ZWVuUmVwb3J0KGNvbnRleHQsIGltcG9ydGVkLCBuZXdsaW5lc0JldHdlZW5JbXBvcnRzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChhbHBoYWJldGl6ZS5vcmRlciAhPT0gJ2lnbm9yZScpIHtcbiAgICAgICAgICBtdXRhdGVSYW5rc1RvQWxwaGFiZXRpemUoaW1wb3J0ZWQsIGFscGhhYmV0aXplKTtcbiAgICAgICAgfVxuXG4gICAgICAgIG1ha2VPdXRPZk9yZGVyUmVwb3J0KGNvbnRleHQsIGltcG9ydGVkKTtcblxuICAgICAgICBpbXBvcnRlZCA9IFtdO1xuICAgICAgfSxcbiAgICB9O1xuICB9LFxufTtcbiJdfQ==