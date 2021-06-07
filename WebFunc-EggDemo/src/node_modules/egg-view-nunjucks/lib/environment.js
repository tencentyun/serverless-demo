'use strict';

const path = require('path');
const nunjucks = require('nunjucks');
const FileLoader = require('./file_loader');
const createHelper = require('./helper');
const LOAD_FILTER = Symbol('NunjucksEnvironment#loadFilter');

/**
 * Extend nunjucks environment, see {@link https://mozilla.github.io/nunjucks/api.html#environment}
 */
class NunjucksEnvironment extends nunjucks.Environment {

  constructor(app) {
    const fileLoader = new FileLoader(app);
    super(fileLoader, app.config.nunjucks);

    this.app = app;

    this[LOAD_FILTER]();

    // monkey patch `escape` with `app.helper.escape` provided by `egg-security` for better performance
    nunjucks.lib.escape = app.Helper.prototype.escape;

    // http://disse.cting.org/2016/08/02/2016-08-02-sandbox-break-out-nunjucks-template-engine
    const originMemberLookup = nunjucks.runtime.memberLookup;
    nunjucks.runtime.memberLookup = function(...args) {
      const val = args[1];
      if (val === 'prototype' || val === 'constructor') return null;
      return originMemberLookup(...args);
    };

    this.ViewHelper = createHelper(app, this.filters);
  }

  /**
   * clean template cache
   * @param {String} [name] - full path
   * @return {Number} clean count
   */
  cleanCache(name) {
    let count = 0;
    for (const loader of this.loaders) {
      if (name) {
        // support full path && tpl name
        /* istanbul ignore else */
        if (loader.cache[name]) {
          count++;
          loader.cache[name] = null;
        }
      } else {
        for (const name in loader.cache) {
          count++;
          loader.cache[name] = null;
        }
      }
    }
    return count;
  }

  // load `app/extend/filter.js` from app/framework/plugin into nunjucks
  [LOAD_FILTER]() {
    for (const unit of this.app.loader.getLoadUnits()) {
      const filterPath = resolveModule(path.join(unit.path, 'app/extend/filter'));
      if (!filterPath) continue;
      const filters = this.app.loader.loadFile(filterPath) || {};
      for (const key of Object.keys(filters)) {
        this.addFilter(key, filters[key]);
      }
    }
  }
}

function resolveModule(filepath) {
  try {
    return require.resolve(filepath);
  } catch (e) {
    return undefined;
  }
}

module.exports = NunjucksEnvironment;
