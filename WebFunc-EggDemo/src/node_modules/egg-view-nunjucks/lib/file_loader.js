'use strict';

const FileSystemLoader = require('nunjucks').FileSystemLoader;

/**
 * exnted nunjucks FileSystemLoader, will auto inject csrf && nonce
 */
class NunjucksFileLoader extends FileSystemLoader {

  /**
   * @constructor
   * @param {Application} app - application instance
   */
  constructor(app) {
    super(app.config.view.root, { noCache: app.config.nunjucks.noCache });
    this.app = app;
  }

  /**
   * Override getSource {@link https://mozilla.github.io/nunjucks/api.html#writing-a-loader},
   * inject csrfTag and nonce
   * @param {String} name - the name of the template
   * @return {String} html
   */
  getSource(name) {
    const result = super.getSource(name);
    /* istanbul ignore else */
    if (result) {
      const config = this.app.config.security;
      // auto inject `_csrf` attr to form field, rely on `app.injectCsrf` provided by `security` plugin
      if (!(config.csrf === false || config.csrf.enable === false)) {
        result.src = this.app.injectCsrf(result.src);
      }
      // auto inject `nonce` attr to script tag, rely on `app.injectNonce` provided by `security` plugin
      if (!(config.csp === false || config.csp.enable === false)) {
        result.src = this.app.injectNonce(result.src);
      }
    }
    return result;
  }
}

module.exports = NunjucksFileLoader;
