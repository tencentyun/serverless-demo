'use strict';

const NUNJUCKS = Symbol('app#nunjucks');
const engine = require('../../lib/engine');

module.exports = {

  /**
   * nunjucks environment
   * @member {NunjucksEnvironment} Application#nunjucks
   * @see https://mozilla.github.io/nunjucks/api.html#environment
   */
  get nunjucks() {
    if (!this[NUNJUCKS]) {
      this[NUNJUCKS] = engine(this);
    }
    return this[NUNJUCKS];
  },

};
